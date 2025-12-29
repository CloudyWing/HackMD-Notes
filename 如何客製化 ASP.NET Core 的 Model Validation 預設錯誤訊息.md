# 如何客製化 ASP.NET Core 的 Model Validation 預設錯誤訊息

## 前言

ASP.NET Core 的 Model Validation 目前只提供英文訊息，所以像 RequiredAttribute 在後端所提供的錯誤訊息為 「The {Column Name} field is required.」，如果每個 「Required」 都要自己設定訊息其實有點麻煩，這部份這幾年也一直有人像 ++微軟++ 開發團隊 反映是否能提供多國語言包，但對方始終認為非必要功能，不過這部分 ++微軟++ 本身有提供客製化方法，詳細作法可以參閱此篇[文章](https://learn.microsoft.com/zh-tw/archive/blogs/mvpawardprogram/aspnetcore-mvc-error-message)。

## 實作

Model Validation 的預設驗證有分為兩個部分，一個是 ModelBinding 驗證，主要和資料格式比較有關係；另一個是 ValidationMetadata 的驗證，則是與資料內容有關，這兩個功能要分別實作。

### 建立資源檔(.resx)

資源檔的存取修飾詞選「Internal」或「Public」皆可，看實際狀況調整。

屬性設定如下：

| 名稱           | 值       |
| -------------- | -------- |
| 建置動作       | 內嵌資源 |
| 複製到輸出目錄 | 不要複製 |

ModelBindingMessage 內容如下：

| 名稱                               | 值                       |
| ---------------------------------- | ------------------------ |
| AttemptedValueIsInvalid            | 值 {0} 對 {1} 無效。     |
| MissingBindRequiredValue           | 未提供 {0} 屬性的值。    |
| MissingKeyOrValue                  | 需要一個值。             |
| MissingRequestBodyRequiredValue    | 需要一個非空的請求正文。 |
| NonPropertyAttemptedValueIsInvalid | 值 {0} 無效。            |
| NonPropertyUnknownValueIsInvalid   | 提供的值無效。           |
| NonPropertyValueMustBeANumber      | 該字串必須為數字。       |
| UnknownValueIsInvalid              | 提供的值對於 {0} 無效。  |
| ValueIsInvalid                     | 值 {0} 無效。            |
| ValueMustBeANumber                 | 值 {0} 必需為數字。      |
| ValueMustNotBeNull                 | 值 {0} 必需不為空值。    |

ValidationMetadataMessage 內容如下：

| 名稱                                                  | 值                                             |
| ----------------------------------------------------- | ---------------------------------------------- |
| CompareAttribute_MustMatch                            | {0} 欄位 及 {1} 欄位 的資料不一致。            |
| CreditCardAttribute_Invalid                           | {0} 欄位 不是正確的信用卡卡號格式。            |
| CustomValidationAttribute_ValidationError             | {0} 欄位 的資料不正確。                        |
| EmailAddressAttribute_Invalid                         | {0} 欄位 不是正確的Email格式。                 |
| FileExtensionsAttribute_Invalid                       | {0} 欄位 只接受副檔名為: {1} 的檔案。          |
| MaxLengthAttribute_ValidationError                    | {0} 欄位 字元長度最多為 {1} 個。               |
| MinLengthAttribute_ValidationError                    | {0} 欄位 字元長度最少為 {1} 個。               |
| PhoneAttribute_Invalid                                | {0} 欄位 不是正確的電話號碼格式。              |
| RangeAttribute_ValidationError                        | {0} 欄位 必須介在 {1} 跟 {2} 之間。            |
| RegularExpressionAttribute_ValidationError            | {0} 欄位 不符合正規表示式 '{1}'。                |
| RequiredAttribute_ValidationError                     | {0} 欄位為必填。                               |
| StringLengthAttribute_ValidationError                 | {0} 欄位 字元長度最多為 {1} 個。               |
| StringLengthAttribute_ValidationErrorIncludingMinimum | {0} 欄位 字元長度必須在 {2} 跟 {1} 之間。      |
| UrlAttribute_Invalid                                  | {0} 欄位 不是正確的 HTTP, HTTPS, 或 FTP 網址。 |

## 建立客製化的 ValidationMetadataProvider

目的是為了替換 ValidationAttribute 的錯誤訊息

``` csharp
public class LocalizationValidationMetadataProvider : IValidationMetadataProvider {
    private readonly ResourceManager resourceManager;
    private readonly Type resourceType;

    public LocalizationValidationMetadataProvider(Type type) {
        resourceType = type;
        resourceManager = new ResourceManager(type);
    }

    public void CreateValidationMetadata(ValidationMetadataProviderContext context) {
        foreach (var attribute in context.ValidationMetadata.ValidatorMetadata.OfType<ValidationAttribute>()) {
            if (attribute.ErrorMessageResourceName is null) {
                bool hasErrorMessage = attribute.ErrorMessage != null;

                if (hasErrorMessage) {
                    string? defaultErrorMessage = typeof(ValidationAttribute)
                        .GetField("_defaultErrorMessage", BindingFlags.NonPublic | BindingFlags.Instance)
                        ?.GetValue(attribute) as string;

                    // 部分 ValidationAttribute 的 ErrorMessage 預設不為 Null
                    hasErrorMessage = attribute.ErrorMessage != defaultErrorMessage;
                }

                if (hasErrorMessage) {
                    continue;
                }

                string? name = GetMessageName(attribute);
                if (name != null && resourceManager.GetString(name) != null) {
                    attribute.ErrorMessageResourceType = resourceType;
                    attribute.ErrorMessageResourceName = name;
                    attribute.ErrorMessage = null;
                }
            }
        }
    }

    private string? GetMessageName(ValidationAttribute attr) {
        switch (attr) {
            case CompareAttribute _:
                return "CompareAttribute_MustMatch";
            case StringLengthAttribute vAttr:
                if (vAttr.MinimumLength > 0) {
                    return "StringLengthAttribute_ValidationErrorIncludingMinimum";
                }
                return "StringLengthAttribute_ValidationError";
            case DataTypeAttribute _:
                return $"{attr.GetType().Name}_Invalid";
            case ValidationAttribute _:
                return $"{attr.GetType().Name}_ValidationError";
        }

        return null;
    }
}
```

Program.cs

```csharp
builder.Services.AddRazorPages()
    .AddMvcOptions(options => {
        // 從資源檔設定 ModelBinding 的錯誤訊息
        var provider = options.ModelBindingMessageProvider;
        provider.SetAttemptedValueIsInvalidAccessor((x, y) => string.Format(ModelBindingMessage.AttemptedValueIsInvalid, x, y));
        provider.SetMissingBindRequiredValueAccessor(x => string.Format(ModelBindingMessage.MissingBindRequiredValue, x));
        provider.SetMissingKeyOrValueAccessor(() => ModelBindingMessage.MissingKeyOrValue);
        provider.SetMissingRequestBodyRequiredValueAccessor(() => ModelBindingMessage.MissingRequestBodyRequiredValue);
        provider.SetNonPropertyAttemptedValueIsInvalidAccessor(x => string.Format(ModelBindingMessage.NonPropertyAttemptedValueIsInvalid, x));
        provider.SetNonPropertyUnknownValueIsInvalidAccessor(() => ModelBindingMessage.NonPropertyUnknownValueIsInvalid);
        provider.SetNonPropertyValueMustBeANumberAccessor(() => ModelBindingMessage.NonPropertyValueMustBeANumber);
        provider.SetUnknownValueIsInvalidAccessor(x => string.Format(ModelBindingMessage.UnknownValueIsInvalid, x));
        provider.SetValueIsInvalidAccessor(x => string.Format(ModelBindingMessage.ValueIsInvalid, x));
        provider.SetValueMustBeANumberAccessor(x => string.Format(ModelBindingMessage.NonPropertyValueMustBeANumber, x));
        provider.SetValueMustNotBeNullAccessor(x => string.Format(ModelBindingMessage.ValueMustNotBeNull, x));

        // 從資源檔設定 ValidationMetadata 的錯誤訊息
        options.ModelMetadataDetailsProviders.Add(new LocalizationValidationMetadataProvider(typeof(ValidationMetadataMessage)));
    });
```

## 多國語系

其實如果要客製化 Model Validation 的錯誤訊息不用資源檔也可完成，用資源檔有個好處是如果要使用多國語系的話，可以擴增其他語系的資源檔處理。
由於多國語系要說明，會需要寫一大篇，我自己也沒有做過，所以這邊僅從主題延伸多國語系相關內容。

### 建立多國語系資源檔(.resx)

1. 建立「ModelBindingMessage.{語系}.resx」和「ValidationMetadataMessage.{語系}.resx」。
2. 資源檔的存取修飾詞選「==沒有程式碼產生==」。
3. 屬性設定如下(和預設資源檔一樣)：

| 名稱           | 值       |
| -------------- | -------- |
| 建置動作       | 內嵌資源 |
| 複製到輸出目錄 | 不要複製 |

從「預設資源檔」產出的程式碼，會依照語系去讀「預設資源檔」和「語系資源檔」，所以語系資源檔選「==沒有程式碼產生==」就好。

### 設定使用語系檔

Program.cs

```csharp
WebApplication app = builder.Build();

// 列出你有設定語系檔的語系
string[] supportedCultures = new string[] { "zh-TW", "en-US" }
RequestLocalizationOptions localizationOptions = new RequestLocalizationOptions()
    .SetDefaultCulture(supportedCultures[0])
    .AddSupportedCultures(supportedCultures)
    .AddSupportedUICultures(supportedCultures); // 實際上發揮作用是這邊

// 設定本地化語系設定
// 如果未設定會依照Thread.CurrentThread.CurrentUICulture設定選擇語系
app.UseRequestLocalization(localizationOptions);
```

:::    info
Culture 常見誤解：

1. RequestLocalizationOptions.DefaultRequestCulture Not Working
RequestLocalizationOptions 有一個成員是 RequestCultureProviders，預設有以下三個Providers：

    1. QueryStringRequestCultureProvider。
    2. CookieRequestCultureProvider。
    3. AcceptLanguageHeaderRequestCultureProvider。

    DefaultRequestCulture 可以理解是優先序最後的 Provider，Providers 依序嘗試尋找 UICulture，當找到就不會再往下尋找，而是用找到的 UICulture 去判斷是否在 SupportedUICultures 名單裡，如果有就再去判斷「語系資源檔」是否存在，存在就使用「語系資源檔」，如果 UICulture 不在 SupportedUICultures 名單裡或是「語系資源檔」不存在，則使用「預設資源檔」。

2. 設定錯誤的 Culture 屬性
C# 只要是和 Culture 有關的屬性都會有兩種：

    1. Culture：用來決定語系的日期、數值、貨幣格式，比較和排序。
    2. UICulture：用來決定載入何種語系的資源檔。

    有部分人在使用時，往往沒注意到兩者區別，但大部分抄網路範例使用時，都會兩者一起設定，或是API 本身就設計當使用只有一個參數的 API 時，會同時設定兩者，e.g. `SetDefaultCulture()` 要輸入兩個參數才會分別設定，所以也不太會出錯。
    但 QueryStringRequestCultureProvider 這邊，網路上有些介紹提到 Url 參數是用「culture={語系}」，但正確應該是「ui-culture={語系}」才對。
:::

## 異動歷程

* 2022-10-05 初版文件建立。
* 2024-04-04 修正 `ModelBindingMessage` 的訊息。

---

###### tags: `.NET` `.NET Core & .NET 5+` `ASP.NET` `ASP.NET Core`