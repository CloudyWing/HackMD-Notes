---
title: "在 ASP.NET Core 實作 GDPR"
date: 2022-10-27
lastmod: 2022-10-27
description: "介紹 General Data Protection Regulation (GDPR) 對網站的影響，並說明如何在 ASP.NET Core 中實作符合法規的隱私權政策頁面與 Cookie 同意橫幅 (Consent Banner)。"
tags: [".NET","ASP.NET","ASP.NET Core","GDPR"]
---

# 在 ASP.NET Core 實作 GDPR

## General Data Protection Regulation

當你在網頁上瀏覽，如果有看到類似「此網站有使用到 Cookie，請問是否接受？」之類的訊息，這是源於歐盟在 2016 年 4 月 27 日通過的法規「一般資料保護規則 (General Data Protection Regulation，簡稱 GDPR」，並於 2018 年 5 月 25 日起強制執行，目的在於針對歐盟個人的資料及隱私進行規範，完整內容可參考 [Wiki GDPR](https://zh.wikipedia.org/wiki/%E6%AD%90%E7%9B%9F%E4%B8%80%E8%88%AC%E8%B3%87%E6%96%99%E4%BF%9D%E8%AD%B7%E8%A6%8F%E7%AF%84#cite_note-4)。

除了歐盟的 GDPR 以外，美國加州那也有類似的法規 [California Consumer Privacy Act (CCPA)](https://en.wikipedia.org/wiki/California_Consumer_Privacy_Act) 與 [California Online Privacy Protection Act (CalOPPA)](https://en.wikipedia.org/wiki/Online_Privacy_Protection_Act)。

## 實作的方式

* 建立隱私權政策頁面：
如果使用 Visual Studio 建立 .NET Core 2.1 以上的 Web 專案，會發現多了一個「Privacy」頁面，這個是用來顯示該網站的隱私權政策(Privacy Policy)。
隱私權政策的範例可以參考[網站用中文隱私權條款範例](https://lyrasoft.net/en/blog/knowledge/24-chinese-privacy-policy-template.html)，據作者所說，這是以《政府網站版型與內容管理規範》中為基礎的隱私權政策範本調整後的版本，但我沒找到原範本，如果是商業用，最好還是要確認內容是否有符合 GDPR 等法規。

* 網頁上顯示有使用 Cookies 的相關訊息：
  * 提供「隱私權與 Cookie 政策」的頁面連結。
  * 詢問是否同意政策，問法大致分為以下幾種：
    * 不詢問，僅告知繼續使用此網站即表示同意隱私權政策，和提供「關閉」的按鈕。
    * 告知繼續使用此網站即表示同意隱私權政策，提供「同意」與「關閉」兩個按鈕。
    * 不預設使用者繼續瀏覽就是同意，並提供「同意」與「關閉」兩個按鈕。
    * 針對網頁上使用的 Cookies 種類進行劃分，讓使用者可以同意只使用必要性的 Cookies，「[stack overflow](https://stackoverflow.com/)」就是此類，有興趣可以用無痕模式瀏覽，就可以看到它有提供一個「Customize settings」的按鈕，讓你可以調整允許使用的 Cookies 類型。
  * 關閉提示訊息的處理方式：
    * 關閉：僅讓畫面上暫時不顯示，當重新進入此網頁，提示訊息會繼續出現。
    * 同意：在 Cookie 寫入 Flag，當此 Cookie 存在時，不再顯示提示訊息，並後續視情況是否依 Flag 決定寫入其他 Cookies。

* 使用者沒同意就不寫入 Cookies 的方法：
在訊息上告知「繼續使用此網站即表示同意隱私權政策」，部分是不想處理停止 Cookies 寫入的部分，所以預設使用者同意，並在隱私權政策上說明可以調整瀏覽器設定來阻止 Cookies 寫入，當然合理來說應該是在使用者同意前，停止非必要性的 Cookies 寫入。

    實際上在實作這部分也不困難，只要不使用原生框架的 API，而是寫一個 Facade 進行封裝，當有使用者同意的 Cookie 時，才會真正呼叫原生 API 就好。

    以 MVC 來說，最簡單的作法就是寫一個 BasicController，其他 Controller 都繼承它，並使用它的 AddCookie 來加入 Response Cookie，範例如下：

```csharp
public abstract BasicController {
    public void AddCookie(HttpCookie cookie) {
        // Cookie Name 和 Value，請依照實際情況調整
        if (Request.Cookies["UseCookies"] == "yes") {
            Response.Cookies.Add(cookie);
        }
    }
}
```

## 使用 ASP.NET Core 實作

.NET Core 2.1 的專案範本，已包含 GDPR (不包含隱私權政策內容) 的實作，但在後續版本 (具體是哪一版本我沒有測試，MSDN 是 2.2 後都有提供範本) 移除了頁面實作，只保留 API，不過有在 MSDN 上提供 [GDPR 實作範例](https://learn.microsoft.com/zh-tw/aspnet/core/security/gdpr?view=aspnetcore-6.0)，基本上此範例除了需要配合 UI 套件調整 HTML 和依政策內容調整文字外 (不使用 jQuery 也要調整一下，不知為何程式碼都使用原生 DOM 的 API，但是仍然有用 `$.ready()`)，這邊只針對官網的範例進行說明。

以下用「Consent」來表示「允許使用 Cookies 設定」的 Cookie。

### Program.cs

```csharp
builder.Services.Configure<CookiePolicyOptions>(options => {
    // 如果設定為 true 的話，就需要有「Consent」才可以設定非必要 Cookies
    options.CheckConsentNeeded = context => true;

    options.MinimumSameSitePolicy = SameSiteMode.None;
});

// ...其他程式碼...

app.UseCookiePolicy(); // 有關 Cookie 相關的 Middleware 都是在這設定

app.UseRouting();

app.UseAuthorization();

app.MapRazorPages();

app.Run();
```

### _CookieConsentPartial.cshtml

* `ITrackingConsentFeature` 的預設 Injection Instance 型別是 [ResponseCookiesWrapper](https://github.com/dotnet/aspnetcore/blob/main/src/Security/CookiePolicy/src/ResponseCookiesWrapper.cs) (具體 DI 行為是在 `app.UseCookiePolicy()` 這邊進行)。
* `consentFeature?.CanTrack` 的值為 `CookiePolicyOptions.CheckConsentNeeded(HttpContext) == true` 和有「Consent」存在，也就是說，如果 `Programs.cs` 裡設定 `CheckConsentNeeded = context => false` 就不會顯示提醒。
* `consentFeature?.CreateConsentCookie()` 是用來建立「Consent」的文字，內容大致為`.AspNet.Consent=yes; expires={日期}; path=/; secure`，在這邊還不會真正建立 「Consent」，而是在`document.cookie = button.dataset.cookieString;` 時建立。

```html
@using Microsoft.AspNetCore.Http.Features

@{
    var consentFeature = Context.Features.Get<ITrackingConsentFeature>();
    var showBanner = !consentFeature?.CanTrack ?? false;
    var cookieString = consentFeature?.CreateConsentCookie();
}

@if (showBanner) {
    <div id="cookieConsent" class="alert alert-info alert-dismissible fade show" role="alert">
        Use this space to summarize your privacy and cookie use policy. <a asp-page="/Privacy">Learn More</a>.
        <button type="button" class="accept-policy close" data-dismiss="alert" aria-label="Close" data-cookie-string="@cookieString">
            <span aria-hidden="true">Accept</span>
        </button>
    </div>
    <script>
        (function () {
            var button = document.querySelector("#cookieConsent button[data-cookie-string]");
            button.addEventListener("click", function (event) {
                document.cookie = button.dataset.cookieString;
            }, false);
        })();
    </script>
}
```

### 必要性 Cookies

有一些 Cookies 是非必要的，例如像是偏好設定之類最佳化使用者體驗的，但也有一些 Cookies 是會影響到網站正常運作的，如果要使用者沒有同意使用 Cookies 的情況下，仍可正常運作(提示訊息最好要說明此狀況)，此類 Cookies 要設定 `IsEssential = true`。

```csharp
Response.Cookies.Append("name", "value", new CookieOptions { 
   IsEssential = true // 表示此 Cookie 是必要的 
});
```

## 異動歷程

* 2022-10-27 初版文件建立。
