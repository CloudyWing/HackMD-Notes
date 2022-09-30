# 在 ASP.NET Core MVC 使用 HTML5 實現多檔案上傳

[![hackmd-github-sync-badge](https://hackmd.io/dkm8rmnTQ_-st6DhboFJdg/badge)](https://hackmd.io/dkm8rmnTQ_-st6DhboFJdg)


## 使用版本
.NET 6
vue@2.7.10
axios@0.27.2
bootstrap@5.2.1
popper.js@2.11.6

## 實作前需了解內容
### HTML
* [FormData](https://docs.w3cub.com/dom/formdata/using_formdata_objects)
使用 XMLHttpRequest 時，可以用 FormData 設定 Key/Value 的資料傳送. 它主要用於發送表單數據。

* [multipart/form-data](https://www.w3schools.com/tags/att_form_enctype.asp)
表單上傳檔案時 form 的「enctype」屬性或是 ajax headers 裡「Content-Type」必需設置此值，不過如果 ajax 上傳檔案是使用 FormData，瀏覽器會自動添加，所以一般不用也不建議特別設定。

* [HTML <input> multiple Attribute](https://www.w3schools.com/tags/att_input_multiple.asp)
簡單屬性，使用 multiple 屬性可以讓 input file 選擇多個檔案，簡單屬性標準寫法以 multiple 為例，`multiple="multiple"`，但實際寫`multiple`或`multiple="{任意值}"`皆是同樣效果。
```htmlmixed
<input type="file" id="files" name="files" multiple="multiple" />
```

* [Progress Event Handler](https://docs.w3cub.com/dom/xmlhttprequest/progress_event)
XMLHttpRequest 會在接收到更多資料時，定時觸發的事件，其中 Event Args 有兩個[屬性](https://www.w3schools.com/jsref/obj_progressevent.asp)可用於繪製 Progress Bar。
    * loaded：已加載的資料量。
    * tota：需加載的總資料量。

### .NET
* [IFormFile](https://learn.microsoft.com/zh-tw/dotnet/api/microsoft.aspnetcore.http.iformfile?view=aspnetcore-6.0)
過往在 MVC 5 時，檔案上傳一直無法與模型繫結屬性整合在一起，必須在 Action 使用「HttpPostedFileBase」型別的參數，或是使用「Request.Files」來取得上傳檔案資料。
ASP.NET Core 增加了「IFormFile」型別可來做為檔案上傳時的繫結屬性型別，多檔案上傳則使用「IFormFileCollection 」。

## 實際範例
HTML
```htmlmixed
<div id="app">
    <input type="file" multiple="multiple" asp-for="Files" v-on:change="handleFileChange" />
    <div class="progress" v-show="progressBarValue > 0">
        <div class="progress-bar" role="progressbar" :style="{ width: progressBarValue + '%' }" v-bind:aria-valuenow="{progressBarValue}" aria-valuemin="0" aria-valuemax="100">{{ progressBarValue }}%</div>
    </div>
    <button class="btn-primary" type="button" v-on:click="handleSubmit">送出</button>
</div>
```
JavaScript
```javascript
new Vue({
    el: '#app',
    data: {
        formData: new FormData,
            progressBarValue: 0
    },
    methods: {
        handleFileChange(e) {
            this.formData = new FormData();
            for (let i = 0; i < e.target.files.length; i++) {
                this.formData.append(e.target.id, e.target.files[i]);
            }
        },
        handleSubmit() {
            let config = {
                // axios會使用它作為XMLHttpRequest的Progress Event
                onUploadProgress: progressEvent => {
                    this.progressBarValue = (progressEvent.loaded / progressEvent.total * 100 | 0);
                }
            };

            axios.post('@Url.Action("Index3")', this.formData, config).then(response => {
                alert(response.data.message);
            }).catch(thrown => {
                alert(thrown);
            });
        }
    }
});
```

ViewModel
```
public class IndexViewModel
{
    [DisplayName("上傳檔案")]
    [Required]
    public IFormFileCollection Files { get; set; }
}
```

Controller
```csharp
[HttpPost]
public async Task<IActionResult> Index3(IndexViewModel viewModel)
{

    if (!ModelState.IsValid)
    {
        string message = ModelState.First(x => x.Value.Errors.Count > 0)
            .Value?.Errors.FirstOrDefault()?.ErrorMessage;
        return Ok(new { Message = message });
    }

    foreach (var formFile in viewModel.Files)
    {
        if (formFile.Length > 0)
        {
            // 請替換實際存放位置
            var filePath = Path.GetTempFileName();

            using var stream = System.IO.File.Create(filePath);
            await formFile.CopyToAsync(stream);
        }
    }

    return Ok(new { Message = "上傳成功" });
}
```

## 檔案上傳大小限制
因為資安因素，Request 和 Response 等都會有大小限制，而檔案上傳時，會牽涉到的兩個屬性主要為 MultipartBodyLengthLimit 和 MaxRequestBodySize，如果要從程式端調整限制有以下作法：
* Global設定
```csharp
// Program.cs
builder.Services.Configure<FormOptions>(x =>
{
    // multipart body的最大長度限制，預設約128MB
    x.MultipartBodyLengthLimit = long.MaxValue;
});

// 利用Kestrel部署的應用配置Request的大小限制
builder.WebHost.ConfigureKestrel(opt =>
{
    opt.Limits.MaxRequestBodySize = long.MaxValue;

});

// 利用IIS部署的應用配置Request的大小限制
builder.Services.Configure<IISServerOptions>(options =>
{
    options.MaxRequestBodySize = long.MaxValue;
});
```

* 從Attribute限制
```
[HttpPost]
[DisableRequestSizeLimit]
[RequestSizeLimit(long.MinValue)] // 與DisableRequestSizeLimitAttrubute二擇一使用
[RequestFormLimits(MultipartBodyLengthLimit = long.MaxValue)]
public async Task<IActionResult> Index(IndexViewModel viewModel) {
//...
}
```
:::    danger
注意事項
* 設定 `long.MaxValue` 只是舉例用，請依照實際需求設置限制大小。
* 上述設定單位皆為 byte。
* Attribute 優先度會高於 Global 設定。
:::

###### tags: `.NET` `.NET Core & .NET 5+` `ASP.NET Core` `axios`
