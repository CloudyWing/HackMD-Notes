# ASP.NET Core Web API 入門心得 - 必填欄位驗證

[![hackmd-github-sync-badge](https://hackmd.io/7OJrUo66RdmzNBnCEV8r8w/badge)](https://hackmd.io/7OJrUo66RdmzNBnCEV8r8w)


## [Required] 與 [BindRequired]
在 ASP.NET Core 中，當進行資料繫結時，如果參數未從資料來源找到符合的值，則參數的值將會是預設值。對於參考型別而言，預設值是 `null`，因此可以通過檢查參數是否為 null 來判斷是否已傳入值。然而，對於結構型別（Struct）而言，預設值就會產生問題，因為它們有自己的預設值，這使得無法清楚地判斷是否已經傳入了有效的值。

舉例來說，`Boolean` 的預設值是 `false`，因此無法單獨通過檢查是否為 `null` 來確定是否已傳入有效值。為了解決這個問題，ASP.NET Framework 時代會使用以下寫法，要求參數為必填，但同時允許傳入 null：

```csharp
public class Input {
    [Required]
    public bool? IsRequired { get; set; }
}
```

這樣當對方傳遞 `{ }` 的資料時，`IsRequired` 沒有找到對應的 Property 時，其值將會是 `null`，並且在進行模型驗證時，`ModelState` 將會包含相應的錯誤訊息 `The IsRequired field is required.`。

在 ASP.NET Core 中新增了 `[BindRequired]` 屬性來解決這種情況，但是有一些限制。根據 MSDN 的說法：
> 請注意，此 [BindRequired] 行為適用於來自已張貼表單資料的模型繫結，不適合要求本文中的 JSON 或 XML 資料。 要求本文資料由輸入格式器處理。

因此，當使用 `[FromBody]` 進行資料繫結時，簡單型別仍然需要使用 `Nullable` 類型並搭配 `Required` 來實現必填欄位驗證。

以下是具體的範例程式碼：
```csharp
// 使用 FromForm BindRequired 生效
public ActionResult Index([FromForm] Input input) {
    return Ok();
}

// 使用 FromBody BindRequired 不會生效
public ActionResult Index([FromBody] Input input) {
    return Ok();
}

public class Input {
    [BindRequired]
    public bool? IsRequired { get; set; }
}
```

## Update 支援部分欄位更新的方法
在有提供 Update API 的情況下，有時會允許部分欄位的更新。這時候，一個解決方案是將所有 Property 型別設定為參考型別或 `Nullable`。當未傳入相應屬性或值為 `null` 時，視為忽略更新該欄位。不過，這樣的前提是存入資料必須為非 `null`，否則會無法辨識對方是想忽略更新還是想更新為 null。

而在同時提供 Create 和 Update API 時，會遇到兩種情況。一種情況是某些欄位在 Update 時不允許更新，因此這些欄位不會提供在 Update 的 Input 裡。另一種情況是 Create 和 Update 的值只差在 Update 多一個 Id 屬性。有時為了方便，會讓 Update 的 Input 繼承 Create 的 Input，並額外提供一個 Id 屬性。但這樣會導致一個問題，即一些在 Create 時標註 [Required] 的屬性，在 Update 時也變為必填，無法藉由選填機制來變為部分更新。

針對這種情況，可以自訂一個 `RequiredAttribute` 來處理，不過可能有人第一個反應是使用 Attribute 的 `Inherited` 來控制，但經實測，Attribute 的 `Inherited` 僅用於 Class 和 Method，並不試用於 Property，以下是一個可能的實現方式：

```csharp
/// <summary>
/// 僅對指定的類型執行必填驗證的屬性
/// </summary>
/// <seealso cref="RequiredAttribute" />
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field | AttributeTargets.Parameter, AllowMultiple = false)]
public class RequiredForTypeAttribute : RequiredAttribute {
    /// <summary>
    /// 初始化
    /// </summary>
    /// <param name="targetTypes">必填驗證應用的目標類型</param>
    public RequiredForTypeAttribute(params Type[] targetTypes) {
        TargetTypes = targetTypes ?? throw new ArgumentNullException(nameof(targetTypes));
    }

    /// <summary>
    /// 必填驗證應用的目標類型
    /// </summary>
    public Type[] TargetTypes { get; set; }

    /// <summary>
    /// 驗證屬性值
    /// </summary>
    /// <param name="value">要驗證的屬性值</param>
    /// <param name="validationContext">表示要驗證的內容的上下文</param>
    /// <returns>驗證結果。</returns>
    protected override ValidationResult IsValid(object value, ValidationContext validationContext) {
        if (!TargetTypes.Contains(validationContext.ObjectType) || IsValid(value)) {
            return ValidationResult.Success;
        }

        string[] memberNames = validationContext.MemberName != null ? new string[] { validationContext.MemberName } : null;
        return new ValidationResult(FormatErrorMessage(validationContext.DisplayName), memberNames);
    }
}
```

這樣 `CreateInput.IsRequired` 會進行 Required 檢核，但`UpdateInput.IsRequired` 則不會。
```csharp
public class CreateInput {
    [RequiredForType(typeof(CreateInput))]
    public bool? IsRequired { get; set; }
}

public class UpdateInput : CreateInput {
}
```

不過，這種方式還存在一些問題。首先，有點反直觀，因為父類別不應該知道其子類別的存在，但如果僅在這邊小範圍應用，還是可以接受。

此外，在 Swagger 中，`[BindRequired]` 和 `[Required]` 的屬性會被標記為必填。因此，需要進一步處理才能確保 Swagger 顯示的必填欄位是正確的。處理
：

* `RequiredForTypeAttribute` 繼承了 `RequiredAttribute`(前面範例作法)：
```csharp
public class RequiredForTypeSchemaFilter : ISchemaFilter {
    public void Apply(OpenApiSchema schema, SchemaFilterContext context) {
        if (schema.Properties is null) {
            return;
        }

        foreach (PropertyInfo prop in context.Type.GetProperties()) {
            RequiredForTypeAttribute attr = prop.GetCustomAttributes<RequiredForTypeAttribute>()
                .FirstOrDefault();

            
            // 因為繼承 RequiredAttribute，所以要把非 TargetTypes 指定 Type 的 Property 移除 Required
            if (attr is not null && !attr.TargetTypes.Contains(context.Type)) {
                foreach (var schemaPropPair in schema.Properties) {
                    if (string.Equals(schemaPropPair.Key, prop.Name, StringComparison.OrdinalIgnoreCase)) {
                        // 因為大小寫關係，所以要用 schemaProp.Key，不能用 prop.Name
                        schema.Required.Remove(schemaPropPair.Key);
                        break;
                    }
                }
            }
        }
    }
}
```

* 如果 `RequiredForTypeAttribute` 沒有繼承 `RequiredAttribute`：
```csharp
public class RequiredForTypeSchemaFilter : ISchemaFilter {
    public void Apply(OpenApiSchema schema, SchemaFilterContext context) {
        if (schema.Properties is null) {
            return;
        }

        foreach (PropertyInfo prop in context.Type.GetProperties()) {
            RequiredForTypeAttribute attr = prop.GetCustomAttributes<RequiredForTypeAttribute>()
                .FirstOrDefault();

            
            // 這邊反過來要把 TargetTypes 指定 Type 的 Property 增加 Required
            if (attr is not null && attr.TargetTypes.Contains(context.Type)) {
                foreach (var schemaPropPair in schema.Properties) {
                    if (string.Equals(schemaPropPair.Key, prop.Name, StringComparison.OrdinalIgnoreCase)) {
                        // 因為大小寫關係，所以要用 schemaProp.Key，不能用 prop.Name
                        schema.Required.Add(schemaPropPair.Key);
                        break;
                    }
                }
            }
        }
    }
}
```

以下是顯示結果：
![](https://i.imgur.com/i2sepLt.png)  

![](https://i.imgur.com/AADV0AC.png)

## 其他相關文章
* [ASP.NET Core Web API 入門心得](https://hackmd.io/@CloudyWing/HJ-KKurHp)
* [ASP.NET Core Web API 入門心得 - Middleware 順序](https://hackmd.io/@CloudyWing/H19VeBll0)
* [ASP.NET Core Web API 入門心得 - 改善 Enum 註解](https://hackmd.io/@CloudyWing/rkUOPLxeC)

###### tags: `.NET` `.NET Core & .NET 5+` `Web API` `Swagger`