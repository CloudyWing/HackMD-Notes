---
title: "如何將 Vue 3 與 ASP.NET Razor 一起使用"
date: 2023-01-30
lastmod: 2024-04-07
description: "教學如何在 ASP.NET Razor Pages ( .NET 6) 中整合 Vue 3 (Options API) 與 VeeValidate 4。比較 Vue 2 升級 Vue 3 的差異，並分享前端套件 (Axios, Bootstrap 5) 的版本搭配經驗。"
tags: [".NET","ASP.NET","ASP.NET Core","Razor Pages","Vue.js"]
---

# 如何將 Vue 3 與 ASP.NET Razor 一起使用

## 使用版本

- .NET 6
- vue@3.2.45
- vee-validate@4.7.3
- vee-validate/rules@4.5.11
- vee-validate/i18n@4.7.3
- axios@1.2.2
- bootstrap@5.2.3
- popper.js@2.11.6

## 前言

Vue 3 有提供「Composition API」和「Options API」兩種寫法，本篇文章還是採用「Options API」處理，原因在於 Vue 官網有提到「Composition API」的許多好處只體現在大型專案中，如果是引用 JS 檔案的輕前端寫法還是建議使用「Options API」，~~絕對不是我看不懂「Composition API」的寫法又不想學~~，以下引用官網文章。

[Which to Choose?](https://vueJS.org/guide/introduction.html#api-styles)
> For production use:
>
> Go with Options API if you are not using build tools, or plan to use Vue primarily in low-complexity scenarios, 靘? progressive enhancement.
>
> Go with Composition API + Single-File Components if you plan to build full applications with Vue.

[Will Options API be deprecated?#](https://vueJS.org/guide/extras/composition-api-faq.html#will-options-api-be-deprecated)
> No, we do not have any plan to do so. Options API is an integral part of Vue and the reason many developers love it. We also realize that many of the benefits of Composition API only manifest in larger-scale projects, and Options API remains a solid choice for many low-to-medium-complexity scenarios.

## 架構大致說明

架構上大致以「[如何將 Vue 與 ASP.NET Razor 一起使用](%E5%A6%82%E4%BD%95%E5%B0%87%20Vue%20%E8%88%87%20ASP.NET%20Razor%20%E4%B8%80%E8%B5%B7%E4%BD%BF%E7%94%A8.md)」這篇文章內容的架構為基礎調整而成，本篇文章僅提供新的程式碼，不再重新說明一次。

## 程式碼

### _Layout.cshtml

在這裡，我們會建立 Vue 物件，並設定其他套件的使用。注意以下幾點：

- Vue 組件的名稱必須與 TagHelper 的 Tag 名稱相同，例如 `VForm` 對應到 `VeeValidateFormTagHelper` 產生的 `<v-form></v-form>`。
- `VeeValidateFormTagHelper` 會產生 Attribute `:initial-errors="initialErrors()"`，這是為了呼叫 `initialErrors` 來初始化錯誤訊息。
- 請將 `{組件名稱}` 替換成實際的 DLL 組件名稱，這會動態產生一個專組件名稱的樣式檔，樣式檔內容為 `_Layout.cshtml.css` 的內容。

```html
<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="~/lib/bootstrap/css/bootstrap.min.css" />
    <link rel="stylesheet" href="~/{組件名稱}.styles.css" asp-append-version="true" />
    <link rel="stylesheet" href="~/css/site.css" asp-append-version="true" />
    @RenderSection("Head", required: false)
</head>
<body>
    <div id="vueApp" class="container" v-cloak>
        @RenderBody()
    </div>
    <script src="~/lib/vue/vue.global.prod.js"></script>
    <script src="~/lib/popper/umd/popper.min.js"></script>
    <script src="~/lib/bootstrap/js/bootstrap.min.js"></script>
    <script src="~/lib/vee-validate/vee-validate.prod.min.js"></script>
    <script src="~/lib/vee-validate/rules/dist/vee-validate-rules.min.js"></script>
    <script src="~/lib/vee-validate/i18n/dist/vee-validate-i18n.min.js"></script>
    <script src="~/lib/axios/axios.min.js"></script>
    <script src="~/js/vee-validate-rules-extension.js"></script>
    <script src="~/js/site.js" asp-append-version="true"></script>
    <script>
        Object.keys(VeeValidateRules).forEach(rule => {
            if (rule !== 'default') {
                VeeValidate.defineRule(rule, VeeValidateRules[rule]);
            }
        });

        VeeValidateI18n.loadLocaleFromURL('@Url.Content("~/lib/vee-validate/i18n/dist/locale/zh_TW.json")');

        VeeValidate.configure({
            generateMessage: VeeValidateI18n.localize('zh_TW'),
        });

        let mixins = [];
    </script>

    @await RenderSectionAsync("Scripts", required: false)

    <script>
        let vueApp = Vue.createApp({
            components: {
                VForm: VeeValidate.Form,
                VField: VeeValidate.Field,
                VMessage: VeeValidate.ErrorMessage,
            },
            methods: {
                initialErrors() {
                    let initialErrors = {};

                    @foreach (var pair in ViewContext.ViewData.ModelState.Where(x => x.Value!.Errors.Any()))
                    {
                        <text>
                            initialErrors['@pair.Key'] = '@Html.Raw(pair.Value.Errors.First().ErrorMessage.Replace("'", "\\'"))';
                        </text>
                    }
                    return initialErrors
                }
            }
        })
        .use(VeeValidate);

        for (let i in mixins) {
            vueApp.mixin(mixins[i]);
        }

        vueApp.mount('#vueApp');
    </script>
</body>
</html>
```

### vee-validate-rules-extension.js

這邊是為了補上 `jquery.validate.js` 有，但 `vee-validate-rules.js` 沒有的驗證。

```javascript
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined'
        ? factory(exports)
        : typeof define === 'function' && define.amd
            ? define(['exports'], factory)
            : (global = typeof globalThis !== 'undefined'
                ? globalThis
                : global || self, factory(global.VeeValidateRules));
})(this, (function (exports) {
    'use strict';

    function isEmpty(value) {
        if (value === null || value === undefined || value === '') {
            return true;
        }
        if (Array.isArray(value) && value.length === 0) {
            return true;
        }
        return false;
    }

    function validateCreditCardRule(value) {
        let sum = 0;
        let digit;
        let tmpNum;
        let shouldDouble;

        let sanitized = value.replace(/[- ]+/g, '');

        for (let i = sanitized.length - 1; i >= 0; i--) {
            digit = sanitized.substring(i, i + 1);
            tmpNum = parseInt(digit, 10);

            if (shouldDouble) {
                tmpNum *= 2;

                if (tmpNum >= 10) {
                    sum += tmpNum % 10 + 1;
                } else {
                    sum += tmpNum;
                }
            } else {
                sum += tmpNum;
            }

            shouldDouble = !shouldDouble;
        }

        return !!(sum % 10 === 0 ? sanitized : false);
    }

    const creditCardValidator = (value) => {
        if (isEmpty(value)) {
            return true;
        }
        const re = /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|(222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)[0-9]{12}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11}|6[27][0-9]{14})$/;
        if (Array.isArray(value)) {
            return value.every(val => re.test(String(val)) && validateCreditCardRule(String(val)));
        }
        return re.test(String(value)) && validateCreditCardRule(String(val));
    };

    const urlValidator = (value) => {
        if (isEmpty(value)) {
            return true;
        }
        const re = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/i;
        if (Array.isArray(value)) {
            return value.every(val => re.test(String(val)));
        }
        return re.test(String(value));
    }

    /* eslint-disable camelcase */
    exports["default"].credit_card = creditCardValidator;
    exports["default"].url = urlValidator;

    exports.credit_card = creditCardValidator;
    exports.url = urlValidator;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
```

### site.css

在組件編譯完畢前隱藏原始模板。

```css
[v-cloak] {
    display: none;
}
```

### site.js

ajax 在 headers 增加傳遞 `RequestVerificationToken`，用來進行`ValidateAntiForgeryToken` 的驗證。

```javascript
axios.interceptors.request.use(
    config => {
        let token = document.querySelector('input[name="__RequestVerificationToken"]');
        if (token !== null) {
            config.headers = {
                RequestVerificationToken: token.value
            }
        }
        return config;
    }
);
```

### VeeValidateFormTagHelper

用來產生 `<v-form></v-form>`。

```csharp
    [HtmlTargetElement("v-form", TagStructure = TagStructure.NormalOrSelfClosing)]
    public class VeeValidateFormTagHelper : FormTagHelper {
        private const string VueSlotAttributeName = "v-slot";

        public VeeValidateFormTagHelper(IHtmlGenerator generator) : base(generator) { }

        public override void Process(TagHelperContext context, TagHelperOutput output) {
            output.Attributes.Add(":initial-errors", "initialErrors()");

            if (!context.AllAttributes.ContainsName(VueSlotAttributeName)) {
                output.Attributes.Add(VueSlotAttributeName, "{ isSubmitting }");
            }

            base.Process(context, output);
        }
    }
```

### VeeValidateInputTagHelper

用來產生 `<v-field></v-field>`，並將 `Required` 之類的 DataAnnotations 輸出成 `rules="required"`，以提供給 `vee-validate-rules.js` 解析，會選用 `vee-validate.js` 作為前端驗證套件，也是因為它有支援解析 Attribute 的方式來進行前端驗證。

```csharp
[HtmlTargetElement("v-field", Attributes = ForAttributeName, TagStructure = TagStructure.NormalOrSelfClosing)]
public class VeeValidateInputTagHelper : InputTagHelper {
    private const string ForAttributeName = "asp-for";
    private const string RulesAttributeName = "rules";
    private const string VueModelAttributeName = "v-model";

    public VeeValidateInputTagHelper(IHtmlGenerator generator) : base(generator) { }

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

        if (!context.AllAttributes.ContainsName(RulesAttributeName)) {
            string? rules = GetRules();
            if (rules != null) {
                output.Attributes.Add(RulesAttributeName, GetRules());
            }
        }

        base.Process(context, output);

        string[] excludeTypes = new string[] { "radio", "checkbox" };

        if (context.AllAttributes.ContainsName(VueModelAttributeName) && !excludeTypes.Contains(context.AllAttributes["type"].Value)) {
            output.Attributes.RemoveAt(output.Attributes.IndexOfName("value"));
        }
    }

    private string? GetRules() {
        List<string> items = new List<string>();

        if (For is not null) {
            foreach (var validationAttribute in For.Metadata.ValidatorMetadata) {
                switch (validationAttribute) {
                    case CompareAttribute attr:
                        // HACK 不確定能正確抓到
                        string[] forNameParts = For.Name.Split('.');
                        forNameParts[^1] = attr.OtherProperty;
                        items.Add($"confirmed:@{string.Join(".", forNameParts)}");
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
                    case RangeAttribute attr:
                        items.Add($"between:{attr.Minimum},{attr.Maximum}");
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

        if (items.Any()) {
            return $"{string.Join("|", items)}";
        }

        return null;
    }
}
```

::: warning
`vee-validate` 在產出 `<select></select>` 也是用 `<v-field></v-field>`，但我還沒做相關測試。
:::

### VeeValidateMessageTagHelper

`text-danger` 是配合 Bootstrap 的樣式，實際上請自行調整。

```csharp
[HtmlTargetElement("v-message", Attributes = ForAttributeName, TagStructure = TagStructure.NormalOrSelfClosing)]
public class VeeValidateMessageTagHelper : TagHelper {
    private const string ForAttributeName = "asp-validation-for";

    [HtmlAttributeName(ForAttributeName)]
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

        output.Attributes.Add("name", For.Name);
        output.AddClass("text-danger", HtmlEncoder.Default);
    }
}
```

### VueInputTagHelper

主要產生 `<input />` 還是原生的 `InputTagHelper`，這裡目的只是當有設定 `v-model` 時，則將 Attribute `value` 給移除掉，避免被 Vue 警告。

```csharp
[HtmlTargetElement("input", Attributes = ForAttributeName, TagStructure = TagStructure.WithoutEndTag)]
public class VueInputTagHelper : TagHelper {
    private const string ForAttributeName = "asp-for";
    private const string VueModelAttributeName = "v-model";

    public override void Process(TagHelperContext context, TagHelperOutput output) {
        string[] excludeTypes = new string[] { "radio", "checkbox" };

        if (context.AllAttributes.ContainsName(VueModelAttributeName) && !excludeTypes.Contains(context.AllAttributes["type"].Value)) {
            output.Attributes.RemoveAt(output.Attributes.IndexOfName("value"));
        }
    }
}
```

### _ViewImports.cshtml

請將 `{ProjectNamespace}` 替換成專案的 Namespace，`{TagHelperNamespace}` 替換成自定義的 TagHelper 的 Namespace，需注意由於自定義 TagHelper 是相依原生地 TagHelper，所以順序不能對調。

```csharp
@namespace {ProjectNamespace}.Pages

@addTagHelper *, Microsoft.AspNetCore.Mvc.TagHelpers
@addTagHelper *, {TagHelperNamespace}
```

### Page.cshtml

- 如果有需要使用前端欄位驗證才需要使用 `<v-form></v-form>` 和 `<v-field></v-field>`，否則使用一般的 `<form></form>` 和 `<input />` 就好。
- `isSubmitting` 定義在 `VeeValidateFormTagHelper` 裡面，目的在當 Submit 後，將按鈕給 Disabled，避免重覆點擊。

```html
<v-form method="post" asp-page="./Test">
    <input asp-for="Test.TestRequired" type="text"></v-field>
    <v-message asp-validation-for="Test.TestRequired"></v-message>
    <button type="submit" :disabled="isSubmitting">Submit</button>
    <button type="button" v-on:click="count++">{{ count }}</button>
</v-form>

@section Scripts {
    <script>
        let pageMixin = {
            data: function () {
                return {
                    count: 0
                };
            }
        }
        mixins.push(pageMixin);
    </script>
}
```

## 結語

其實原本很不想使用 Vue Components，不過實在沒找到其他適合的前端驗證輸入欄位的套件以前，只好將就著使用，目前這個架構還在測試中，如果有其他問題會再上來調整內容。

::: warning
此篇文章於 2023/01/30 撰寫，最近在 2024/04/06 測試專案時發現，`VeeValidateFormTagHelper` 產生的 `<v-form></v-form>` 會導致 `asp-page-handler` 無法正常運作。此外，錯誤訊息無法正確顯示 `DisplayName` 等 Attribute 所設定的欄位名稱。

目前暫時不打算解決這些問題，而是決定放棄這個架構。未來在撰寫 Web 時，可能會繼續選擇使用 Vue 2 搭配 vee-validate 2，或者等待 ASP.NET Core 放棄使用 jQuery 的前端驗證後再考慮使用 Vue 3。或著，也考慮到 Vue 2 已經停止維護，而且我也有點受夠前端框架或套件改版造成不相容的情況，乾脆投入 ASP.NET Core Blazor 的懷抱 =.=a。
:::

## 異動歷程

- 2023-01-30 初版文件建立。
- 2024-04-07 補充了文章架構未處理的問題。
