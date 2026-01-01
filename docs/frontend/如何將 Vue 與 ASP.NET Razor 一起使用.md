---
title: "如何將 Vue 與 ASP.NET Razor 一起使用"
date: 2022-10-24
lastmod: 2022-10-24
description: "教學如何在 ASP.NET Razor Pages ( .NET 6) 中整合 Vue 2 與 VeeValidate 2。說明在不棄用既有 Model Validation 前提下，如何利用 Vue 取代 jQuery 處理前端互動與 API 請求。"
tags: [".NET","ASP.NET","ASP.NET Core","Razor Pages","Vue.js"]
---

# 如何將 Vue 與 ASP.NET Razor 一起使用

## 使用版本

* .NET 6
* vue@2.7.10
* vee-validate@2.2.15
* axios@0.27.2
* bootstrap@5.2.1
* popper.js@2.11.6

## 前言

使用 Vue 2 來取代 jQuery 的原因請參考 [議 jQuery](%E8%AD%B0%20jQuery.md)，本文章仍然使用 Vue 2，而非最新的 Vue 3，主因在於不捨棄 Model Validation 前端驗證的情況下，目前尚未找到能取代 VeeValidate 2 的套件。

## 架構大致說明

Vue 的語法教學請參考官網 [Vue 2.x 教學](https://v2.vueJS.org/v2/guide/)，這邊就不多提，僅針對架構上會用到的部分進行說明。

### 如何建立 Vue 物件

建立 Vue 物件，大致分為兩個部分：

1. 需要有一個根結點的 DOM 做為 Vue Template，裡面包含需要進行畫面渲染的內容，並提供便於 Vue 可以使用 Selector 搜尋到此 DOM 的屬性，一般會設定 id，因為如果 Vue 找到多個 DOM 元素，也只有第一個會生效。
2. 在 JavaScript 裡建立 Vue object，傳入參數如下：
    * el：用來尋找根結點 DOM 的 selector 字串，例如：`'#app'`，尋找 ID 為 app 的 DOM。
    * data：一般為 object 或回傳 object 的 function，object 的 property 必須包含會使用到的 key，例如：`{ records: [] }` 或 `function() { return { records: [] } }`
    * methods：屬性為 Vue 會使用到 method 的 object，例如：`{ handler: function() { }}`。
    * created：Vue 物件建立完畢後執行的 function，一般會將資料載入寫在這。
    * computed：用 key-function 組合起來的 object，概念上類似 C# 的 getter，例如：`{ recordCount: function() { return records.length } }`

簡易的 Sample 如下：

html 部分

```html
<div id="app">
  <div>
    資料筆數: {{ recordCount }}
  </div>
  <table>
      <tr>
          <th>標題1</th>
          <th>標題2</th>
      </tr>
      <tr v-for="record in records">
          <th>{{ record.col1 }}</th>
          <th>{{ record.col2 }}</th>
          <th>
              <button type="button" v-on:click="handler1(record.col1, record.col2)">按鈕</button>
          </th>
      </tr>
  </table>
  <button type="button" v-on:click="handler2">點擊{{ count }}次</button>
</div>
```

JavaScript 的部分

```javascript
let app = new Vue({
  el: '#app', // 用 selector 找到要渲染的 DOM，這邊是指找 id 為 app 的 DOM
   data: {
      count: 0,
      records: []
   },
   methods:{
        handler1: function(arg1, arg2) {
            console.log(arg1 + ' ' + arg2);
        },
        handler2: function(arg1, arg2) {
            this.count += 1;
        }
    },
    created: function() {
        // $el 尚未建立，但 data 已經讀得到，需要使用 ajax load 頁面資料大多會放在這
        this.records = [
            { col1: 'record1 col1', col2: 'record1 col12' },
            { col1: 'record2 col1', col2: 'record2 col12' }
        ]
    },
    computed: {
        recordCount: function() {
          return this.records.length;
        }
      }
});
```

### [Mixin](https://v2.vueJS.org/v2/guide/mixins.html)

節錄官方說明
> Mixin 是一種為 Vue 組件分發可重用功能的靈活方式。mixin 對象可以包含任何組件選項。當組件使用 mixin 時，mixin 中的所有選項都會“混合”到組件自己的選項中。

### v-cloak

節錄官方說明
> 當使用直接在 DOM 中書寫的模板時，可能會出現一種叫做“未編譯模板閃現”的情況：用戶可能先看到的是還沒編譯完成的雙大括號標籤，直到掛載的組件將它們替換為實際渲染的內容。
>
> v-cloak 會保留在所綁定的元素上，直到相關組件實例被掛載後才移除。配合像 [v-cloak] { display: none } 這樣的 CSS 規則，它可以在組件編譯完畢前隱藏原始模板。

### 架構雛形

一般會將網站的共同內容放置「_Layout.cshtml」裡面，在知道 Mixin 以後，可以把建立 Vue Object 的行為寫在這邊，各個頁面只需要建立自身要用的參數 Object，在建立 Vue Object 時，再用 mixins 參數進行整合，程式碼大致如下：

```html
<div id="vueApp" v-cloak>
    @RenderBody()
</div>

<!-- ... -->

// 宣告 mixins 變數，後續建立 Vue object 時使用
<script>
    let mixins = [];
</script>
// 各個頁面會在 section Scripts 裡建立 pageMixin，並將之加入 mixins 裡面
@await RenderSectionAsync("Scripts", required: false)
// 建立 Vue 物件，此時的 mixins 已經包含了 pageMixin
<script>
    new Vue({
        el: '#vueApp', 
        mixins: mixins
    });
</script>

```

### 完整程式碼

_Layout.cshtml

```html
<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="~/css/site.min.css" asp-append-version="true" />
    @RenderSection("Head", required: false)
</head>
<body>
    <div id="vueApp" class="container" v-cloak>
        @RenderBody()
    </div>
    <script src="~/lib/vue/vue.js"></script>
    <script src="~/js/site.js" asp-append-version="true"></script>
    <script>
        let mixins = [];
    </script>
    
    @await RenderSectionAsync("Scripts", required: false)

    <script>
        new Vue({
            el: '#vueApp',
            mixins: mixins
        });
    </script>
</body>
</html>
```

Views/Pages/{Page}.cshtml

```csharp
@section Scripts {
    <script>
        mixins.push({
            data: function () {
                return {
                    // 頁面會使用的 Vue Data Properties 加在這邊
                };
            }
            methods: {
                // 頁面會使用的 Vue Methods 加在這邊
            },
            created: function() {
                // 載入頁面資料實作在這裡
            }
        });
    </script>
}
```

site.css

```css
[v-cloak] {
    display: none;
}
```

## Vue 和 ASP.NET Razor 整合時需注意事項

1. Vue Template 裡不能包含 Script Tag，所以前面範例在建立 pageMixin 時，是寫在`@section Scripts { }` 裡，以避免引發以下錯誤。

    ```html
    <div id="app">
        <script></script> <!-- 引發錯誤 -->
    <div>
    <sctipt>
        new Vue({ el: '#app'});
    </script>
    @* 錯誤訊息
    [Vue warn]: Error compiling template:
    Templates should only be responsible for mapping the state to the UI. Avoid placing tags with side-effects in your templates, such as \<script\>, as they will not be parsed.
    *@
    ```

2. Vue 的一些語法簡寫會用到「@」，例如「v-on:click」可簡寫成「@click」，但是不建議在 Razor Pages 使用，因為 Tag Helper 裡加「@」可能會無法編譯，所以硬要 Razor Pages 使用 Vue 的 @ 簡寫，會造成一些地方使用簡寫，一些地方使用非簡寫的混用狀況，完整遇到「@」的狀況如下：
    * 「@」同樣為 Razor 語法關鍵字，所以一般正常再增加一個「@」進行跳脫，例如：「@@click」才行。
    * Tag Helper 裡不能在值以外的地方出現「@」，連加「@」跳脫都會錯誤。

    ```html
    <-- 沒有使用 asp-for 為一般 HTML，加 @ 跳脫可以使用 -->
    <input type="text" @@click="handleClick" />
    <-- 使用 asp-for，代表為 TagHelper 所定義，遇到 @ 發生編譯錯誤 -->
    <input type="text" asp-for="Test" @click="handleClick" />
    <-- 使用 asp-for，加 @ 跳脫仍然發生編譯錯誤 -->
    <input type="text" asp-for="Test" @@click="handleClick" />
    <-- 使用 asp-for，@ 只能出現在屬性值的位置 -->
    <input type="text" asp-for="Test" test="@Model.Test" />
    ```

## 如何用 Vue 取代 jQuery

建立一個新的 ASP.NET Core Web 專案時，有一些與 jQuery 相依的功能，以下來說明它們的替代方案：

### Bootstrap

由於 [Bootstrap 5](https://getbootstrap.com/docs/5.2/getting-started/introduction/) 已捨去 jQuery 的引用，所以可以直接升級到 5，只是需注意 Bootstrap 每個大版本間的語法結構還是有差異，需要額外進行調整 HTML。

### Ajax

原先 Vue 有自己的 ajax 套件，但後來作者停止維護，並建議大家改使用 [axios](https://axios-http.com/docs/intro)，。

這邊有個需要注意的地方，原先 MVC Framework，如果要處理 XSRF/CSRF 攻擊，需在 form 裡面寫 `@Html.AntiForgeryToken()` 來產生 Antiforgery 的 hidden，並在 Controller Action 裡增加 `[ValidateAntiForgeryToken]` 的 Attribute 來進行 XSRF/CSRF 攻擊的保護，但在 ASP.NET Core 裡，以下兩種寫法皆為自動添加 Antiforgery 的 hidden，更完整請參考 [防止 ASP.NET Core 中的跨網站偽造要求 (XSRF/CSRF) 攻擊](https://learn.microsoft.com/zh-tw/aspnet/core/security/anti-request-forgery?view=aspnetcore-6.0)。

```html
<form method="post">
    <!-- ... -->
</form>

@using (Html.BeginForm("Index", "Home"))
{
    <!-- ... -->
}
```

另一個需要注意的地方是 ASP.NET Core MVC 仍需要添加 `[ValidateAntiForgeryToken]` 來進行 XSRF/CSRF 的保護，但 Razor Pages 則會自動執行，所以 axios 要增加以下寫法讓 Razor Pages 的 ajax 可以正常呼叫。

site.js

```javascript
// Vue 載入 VeeValidate
const config = {
    locale: 'zh_TW',
    events: 'change|blur'
};
Vue.use(VeeValidate, config);

// ajax 在 headers 增加傳遞 RequestVerificationToken
axios.interceptors.request.use(
    config => {
        let token = document.querySelector('input[name="__RequestVerificationToken"]');
        if (token !== null) {
            config.headers = {
                RequestVerificationToken: token.value
            }
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);
```

### Validation

.NET MVC 和 Razor Pages 有一個方便的 Model Validation 功能，可以藉由將 ViewModel 加上 Validation Attributes，即可做到簡單的前、後端驗證，其中前端驗證是仰賴 jQuery Validation 才可以完成，如果不使用 jQuery ，變成前端驗證需要自行撰寫，無法靠 Validation Attributes 自動添加驗證。

這邊以 [VeeValidate 2](https://vee-validate.logaretm.com/v2/guide/) 來展示替代作法，選擇 VeeValidate 2 而非選擇 VeeValidate 3 的原因是 VeeValidate 3 僅保留 Vue Component 的作法，HTML 變動較為大，VeeValidate 2 比較容易與現有的 Tag Helper 整合。
ASP.NET Core 除了舊有的 Html Helper 外，另外提供了 [Tag Helper](https://learn.microsoft.com/zh-tw/aspnet/core/mvc/views/tag-helpers/intro?view=aspnetcore-3.0&WT.mc_id=DOP-MVP-37580) 寫法，這邊添加兩個 Tag Helper，用來產生 VeeValidate 需要的 HTML Attributes。

```csharp
[HtmlTargetElement("input", Attributes = ForAttributeName)]
public class VeeValidationInputTagHelper : TagHelper {
    private const string ForAttributeName = "asp-for";
    private const string DataValidationAs = "data-vv-as";
    private const string ValidateAttribute = "v-validate";
    private const string RefAttribute = "ref";
    private const string OtherValidateAttribute = "vee-other-validate";

    [HtmlAttributeName(ForAttributeName)]
    public ModelExpression? For { get; set; }

    [HtmlAttributeName(OtherValidateAttribute)]
    public string? OtherValidate { get; set; }

    public override void Process(TagHelperContext context, TagHelperOutput output) {
        if (context is null) {
            throw new ArgumentNullException(nameof(context));
        }

        if (output is null) {
            throw new ArgumentNullException(nameof(output));
        }

        if (For is null) {
            return;
        }

        if (!context.AllAttributes.ContainsName(DataValidationAs)) {
            output.Attributes.Add(DataValidationAs, For.Metadata.GetDisplayName());
        }

        if (!context.AllAttributes.ContainsName(RefAttribute)) {
            output.Attributes.Add(RefAttribute, For.Name);
        }

        if (!context.AllAttributes.ContainsName(ValidateAttribute)) {
            string? validateValues = GetValidateValues();
            if (validateValues != null) {
                output.Attributes.Add(ValidateAttribute, GetValidateValues());
            }
        }
    }

    private string? GetValidateValues() {
        List<string> items = new List<string>();

        if (For is not null) {
            foreach (var validationAttribute in For.Metadata.ValidatorMetadata) {
                switch (validationAttribute) {
                    case CompareAttribute attr:
                        // HACK 不確定能正確抓到
                        string[] forNameParts = For.Name.Split('.');
                        forNameParts[^1] = attr.OtherProperty;
                        items.Add($"confirmed:{string.Join(".", forNameParts)}");
                        break;
                    case CreditCardAttribute _:
                        items.Add("credit_card");
                        break;
                    case EmailAddressAttribute _:
                        items.Add("email");
                        break;
                    case FileExtensionsAttribute attr:
                        items.Add($"ext:{attr.Extensions}");
                        break;
                    case StringLengthAttribute attr:
                        if (attr.MaximumLength > 0) {
                            items.Add($"max:{attr.MaximumLength}");
                        }
                        if (attr.MinimumLength > 0) {
                            items.Add($"min:{attr.MinimumLength}");
                        }
                        break;
                    case MaxLengthAttribute attr:
                        if (attr.Length > 0) {
                            items.Add($"max:{attr.Length}");
                        }
                        break;
                    case MinLengthAttribute attr:
                        if (attr.Length > 0) {
                            items.Add($"min:{attr.Length}");
                        }
                        break;
                    case PhoneAttribute attr:
                        // UNDONE Vee 原生未支援
                        break;
                    case RangeAttribute attr:
                        string key = attr.OperandType == typeof(DateTime)
                            ? "date_between" : "between";
                        items.Add($"{key}:{attr.Minimum},{attr.Maximum}");
                        break;
                    case RegularExpressionAttribute _:
                        // regex 只支援 object expression 的方式，confirmed 只支援 string expressions 的方式
                        // 考量到正規式容易有跳脫問題，所以不在前端驗證正規式
                        break;
                    case RequiredAttribute _:
                        items.Add("required");
                        break;
                    case UrlAttribute _:
                        items.Add("url");
                        break;
                }
            }
        }

        if (!string.IsNullOrWhiteSpace(OtherValidate)) {
            items.AddRange(OtherValidate.Split('|'));
        }

        if (items.Any()) {
            return $"'{string.Join("|", items)}'";
        }

        return null;
    }
}
```

```csharp
[HtmlTargetElement("span", Attributes = ValidationForAttributeName)]
public class VeeValidationMessageTagHelper : TagHelper {
    private const string ValidationForAttributeName = "vee-validation-for";
    private const string VueShow = "v-show";

    [HtmlAttributeName(ValidationForAttributeName)]
    public ModelExpression? For { get; set; }

    public override void Process(TagHelperContext context, TagHelperOutput output) {
        if (context is null) {
            throw new ArgumentNullException(nameof(context));
        }

        if (output is null) {
            throw new ArgumentNullException(nameof(output));
        }

        if (For is null) {
            return;
        }

        output.Attributes.Add(VueShow, $"errors.has('{For.Name}')");
        output.Content.SetHtmlContent($"{{{{ errors.first('{For.Name}') }}}}");
    }
}
```

_ViewImports.cshtml 需增加自定義 Tag Helper 的引用，{專案 Namespace} 請換成實際專案 Namespace，用來表示引用專案 Namespace 底下的全部 Tag Helper。

```text
@addTagHelper *, {專案 Namespace}
```

_Layout.cshtml 在建立 Vue Object 時，增加 validateBeforeSubmit，以及在 created 裡將 ModelState 的錯誤訊息添加至 VeeValidate 的 errors 裡。

```javascript
 new Vue({
    el: '#vueApp',
    mixins: mixins,
    methods: {
        validateBeforeSubmit: function (event) {
            this.$validator.validateAll().then(result => {
                if (!result) {
                    event.preventDefault();
                }
            });
        }
    },
    created: function() {
        @if (ViewContext.ViewData.ModelState.ErrorCount > 0) {
            foreach (var pair in ViewContext.ViewData.ModelState.Where(x => x.Value.Errors.Any())) {
                <text>
                    this.$validator.errors.add({
                        field: '@pair.Key',
                        msg: '@Html.Raw(pair.Value.Errors.First().ErrorMessage)'
                    });
                </text>
            }

        }
    }
});
```

新 Tag Helper 在 {Page}.cshtml 裡寫法，{Model Property Name} 請將轉換成實際要擷取指定之模型屬性的名稱

```html
<form method="post" role="form" v-on:submit="validateBeforeSubmit">
    <input type="text" asp-for="{Model Property Name}" />
    <span vee-validation-for="{Model Property Name}" class="text-danger"></span>
</form>
```

## 作法參考來源

將建立 Vue Object 放在利用「_Layout.cshtml」並用 Mixin 來進行整合，其實參考了這篇文章[Using VueJS with ASP.NET Razor Can be Great!](https://www.giftoasis.com/blog/asp-net-core/vue/using-vue-with-asp-net-razor-can-be-great)，至於變數使用 mixins，而非 mixinArray 是個人命名上的偏好，將 mixins 的宣告放在「_Layout.cshtml」而非 site.js，則是認為將宣告和使用放在同一地方就不需要靠註解才可知道在哪宣告。

## 異動歷程

* 2022-10-24 初版文件建立。
