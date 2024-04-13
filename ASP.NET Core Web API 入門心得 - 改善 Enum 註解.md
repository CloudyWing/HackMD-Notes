# ASP.NET Core Web API 入門心得 - 改善 Enum 註解

[![hackmd-github-sync-badge](https://hackmd.io/9ZHTEF3yT2aGxEOwhzunjA/badge)](https://hackmd.io/9ZHTEF3yT2aGxEOwhzunjA)


在建立 ASP.NET Core Web API 專案時，透過「啟用 OpenAPI 支援」的設定，可自動安裝 `Swashbuckle.AspNetCore` 這套 Swagger 套件，但目前該套件尚不支援 Enum 的註解功能，這導致使用端難以準確理解如何傳遞參數和回傳值的含意，與回傳值含意。即使在具有 Enum 的屬性增加屬性的註解，也依然沒作用。

以下列程式碼作為範例：
```csharp
[ApiController]
[Route("[controller]")]
public class TestEnumController : ControllerBase {
    [HttpPost]
    public Output Post([FromBody] Input input) {
        return new Output {
            Week = input.Week,
        };
    }
}

/// <summary>
/// The input.
/// </summary>
public class Input {
    /// <summary>
    /// Gets or sets the week.
    /// 0: Sunday
    /// 1: Monday
    /// 2: Tuesday
    /// 3: Wednesday
    /// 4: Thursday
    /// 5: Friday
    /// 6: Saturday
    /// </summary>
    public Week Week { get; set; }

    /// <summary>
    /// Gets or sets the name.
    /// </summary>
    public string Name { get; set; }
}

/// <summary>
/// The Output.
/// </summary>
public class Output {
    /// <summary>
    /// Gets or sets the week.
    /// </summary>
    public Week Week { get; set; }
}

/// <summary>
/// 星期
/// </summary>
public enum Week {
    /// <summary>
    /// The sunday
    /// </summary>
    Sunday,
    /// <summary>
    /// The monday
    /// </summary>
    Monday,
    /// <summary>
    /// The tuesday
    /// </summary>
    Tuesday,
    /// <summary>
    /// The wednesday
    /// </summary>
    Wednesday,
    /// <summary>
    /// The thursday
    /// </summary>
    Thursday,
    /// <summary>
    /// The friday
    /// </summary>
    Friday,
    /// <summary>
    /// The saturday
    /// </summary>
    Saturday
}
```
可以看到 `Input` 的 `name` 屬性有註解，但 `week` 屬性卻沒有 Enum 的註解，也沒有屬性的註解。  
![](https://i.imgur.com/O5jTTTj.png)

有些人會選擇用 Enum 名稱 來取代 Enum 值，藉由使用 `JsonStringEnumConverter` 來讓 Enum 支援字串輸入與輸出，將程式碼調整如下：
```csharp
/// <summary>
/// The input.
/// </summary>
public class Input {
    /// <summary>
    /// Gets or sets the week.
    /// 0: Sunday
    /// 1: Monday
    /// 2: Tuesday
    /// 3: Wednesday
    /// 4: Thursday
    /// 5: Friday
    /// 6: Saturday
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public Week Week { get; set; }

    /// <summary>
    /// Gets or sets the name.
    /// </summary>
    public string Name { get; set; }
}

/// <summary>
/// The Output.
/// </summary>
public class Output {
    /// <summary>
    /// Gets or sets the week.
    /// </summary>
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public Week Week { get; set; }
}
```

這樣一來，Enum 的輸入方式從僅支援 Enum 值，擴充為同時支援 Enum 名稱，且回傳值也轉為Enum 名稱。但 Swagger 說明依然沒變。  
![](https://hackmd.io/_uploads/SJMANwgxR.png)

為了改善這個問題，把 DTO 設定的 `JsonStringEnumConverter` 移除，改在使用 `Program` 設定。
```csharp
builder.Services.AddControllers()
    .AddJsonOptions(options => {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    }
 );
```

這樣的調整，輸入和輸出結果與在屬性設定的結果一致，但是 Swagger 說明從 `int` 陣列，變成 `string` 陣列，如下圖所示：  
![](https://i.imgur.com/7sLwwNv.png)

雖然這樣的作法讓輸入增加彈性，變成 Enum 值和 Enum 名稱都支援，但回傳值變成 Enum 名稱有好有壞，好處是至少比數值更容易知道意思，但是字串有增加使用端打錯的可能，至少以我個人想法，更傾向用 Enum 值傳遞，因此還是要想辦法讓 Swagger 說明能顯示 Enum 註解。

後續參考此篇文章 [SwaggerUI not display enum summary description, C# .net core?](https://stackoverflow.com/questions/53282170/swaggerui-not-display-enum-summary-description-c-sharp-net-core) 進行以下調整：
```csharp
/// <summary>
/// Swagger schema filter to modify description of enum types so they
/// show the XML docs attached to each member of the enum.
/// </summary>
public class EnumSchemaFilter : ISchemaFilter {
    private readonly XDocument xmlComments;

    /// <summary>
    /// Initialize schema filter.
    /// </summary>
    /// <param name="xmlComments">Document containing XML docs for enum members.</param>
    public EnumSchemaFilter(XDocument xmlComments) {
        this.xmlComments = xmlComments;
    }

    /// <summary>
    /// Apply this schema filter.
    /// </summary>
    /// <param name="schema">Target schema object.</param>
    /// <param name="context">Schema filter context.</param>
    public void Apply(OpenApiSchema schema, SchemaFilterContext context) {
        Type enumType = context.Type;

        if (!enumType.IsEnum) {
            return;
        }

        StringBuilder sb = new(schema.Description);

        sb.AppendLine("<p>Possible values:</p>");
        sb.AppendLine("<ul>");

        foreach (string enumMemberName in Enum.GetNames(enumType)) {
            string fullEnumMemberName = $"F:{enumType.FullName}.{enumMemberName}";

            string enumMemberDescription = xmlComments.XPathEvaluate(
              $"normalize-space(//member[@name = '{fullEnumMemberName}']/summary/text())"
            ) as string;

            if (string.IsNullOrEmpty(enumMemberDescription)) {
                continue;
            }

            long enumValue = Convert.ToInt64(Enum.Parse(enumType, enumMemberName));

            // 實際要使用 Enum 值還是 Enum 名稱，自行評估
            sb.AppendLine($"<li><b>{enumValue}[{enumMemberName}]</b>: {enumMemberDescription}</li>");
        }

        sb.AppendLine("</ul>");

        schema.Description = sb.ToString();
    }
}

// Program 增加自訂 Swagger Filter 設定
builder.Services.AddSwaggerGen(options => {
    foreach (string xmlFile in Directory.GetFiles(AppContext.BaseDirectory, "*.xml")) {
        // 從單純 IncludeXml，改為是讀 XML，用 Filter 修改
        XDocument xmlDoc = XDocument.Load(xmlFile);
        options.IncludeXmlComments(() => new XPathDocument(xmlDoc.CreateReader()), true);
        options.SchemaFilter<EnumSchemaFilter>(xmlDoc);
    }
});
```

顯示結果如下圖，成功顯示 Enum 的註解。  
![](https://i.imgur.com/YbE5wH3.png)

網路上還有另一篇是在 [替 swagger 加上具有可讀性的 enum 文件](https://dotblogs.azurewebsites.net/AceLee/2023/12/07/170518) `ISchemaFilter` 的 `Apply` 方法裡針對 `schema.Enum` 處理，但這會影響 Swagger 輸入的預設值。此作法結果如下：  
![](https://i.imgur.com/XDHajBT.png)

Swagger Input 的預設值，是顯示 `schema.Enum` 裡的第一個 `OpenApiString`。  
![](https://i.imgur.com/wmbNIbf.png)

## 其他相關文章
* [ASP.NET Core Web API 入門心得](https://hackmd.io/@CloudyWing/HJ-KKurHp)
* [ASP.NET Core Web API 入門心得 - Middleware 順序](https://hackmd.io/@CloudyWing/H19VeBll0)

###### tags: `.NET` `.NET Core & .NET 5+` `Web API` `Swagger`