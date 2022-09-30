# 在 ASP.NET 中設定 SameSite Cookies

[![hackmd-github-sync-badge](https://hackmd.io/Cnym-CQkRw6sPhwZCKksPw/badge)](https://hackmd.io/Cnym-CQkRw6sPhwZCKksPw)


## SameSite Cookies
[SameSite Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite) 為 IETF 在 2016 年訂立的草案標準，目的在針對第三方 Cookies 的進行限制，以避免 Web 應用程式遭到跨網站要求偽造 (CSRF) 攻擊，於2019 年進行更新。

在資安上常會聽到另一個相似的東西「[Same-Origin Policy(同源政策)](https://www.w3.org/Security/wiki/Same_Origin_Policy)」，它是用來限制瀏覽器的 Document 和 Resource(e.g. image) 間的互動機制，當兩個 Url 的 Protocol、Host 和 Port 相同時，會被認定是同源網站，而大部分的情況下只允許讀取自身資源，具體的實作內容可參閱 [MDN Same-Origin](https://developer.mozilla.org/zh-TW/docs/Web/Security/Same-origin_policy)。

Same-Site 的定義與 Same-Origin 比，較為寬鬆，由於並未查到官網說明，具體差異可以參閱此篇文章 [Same-Site and Same-Origin](https://sharonwu0505.github.io/docs/2021/same-site-and-same-origin/)。

### Same-Site 值
| 值     | 說明                                                                                    |
| ------ | --------------------------------------------------------------------------------------- |
| None   | Cookie 將在所有情況下的請求發送，曾經的預設值，現今必須搭配 `Secure`。 |
| Lax    | Cookies 只有在第一方上下文或用戶透過(Link)到原網站時的請求發送，現今瀏覽器的預設值。    |
| Strict | Cookie 只會在第一方上下文的請求發送。                                                   |

### Lax 在第三方網站請求(Request)的支援情況
| 請求方式  | 程式碼範例                                 | 能否取得 Cookies |
| --------- | ------------------------------------------ | -------- |
| Link      | `<a href="..."></a>`                       | O        |
| Prerender | `<link ref="prerender" hre="..."></a>`     | O        |
| Form Get  | `<form method="GET" action="..."></form>`  | O        |
| Form Post | `<form method="POST" action="..."></form>` | X        |
| iframe    | `<iframe src="..."></iframe>`              | X        |
| AJAX      | `$.get("...");`                            | X        |
| Image     | `<img src="...">`                          | X        |


### Cookie 種類
| 種類           | 定義                                                             | 常見用途                       |
| -------------- | ---------------------------------------------------------------- | ------------------------------ |
| 第一方 Cookie | 當前網站的域名相匹配的 Cookie 被稱為第一方(First-Party) Cookie。 | 記錄登入資訊或偏好模式等內容。 |
| 第三方 Cookie | 當前網站的域名不匹配的 Cookie 被稱為第三方(Third-Party) Cookie。 | 記錄瀏覽資料供廣告和分析使用。 |

:::info
第二方指個是 Client，所以沒有第二方 Cookie，另有一個類似的名詞為「第二方資料(Second-Party Data)」是不相關的東西。
:::

### 具體流程
1. 當 Server 回應(Response) Client 的請求(Request)時，會使用 Set-Cookie 來傳遞 Response Cookie，此時在內容增加傳遞 Same-Site Value，e.g. `Set-Cookie: {Cookie Name}={Cookie Value}; SameSite={SameSite Value}`，當 Client 儲存這個 Cookie 時，會一併記錄 Same-Site 值，此時的 Server 我們稱為 A 網站，儲存的 Cookie 則稱為 A Cookie。
2. 當後續透過 B 網站的 Link、Image 或 iframe 等向 A 網站發出 Request 時，會依照之前 A Cookie 所記錄的 SameSite 值來決定此 Request 是否要包含 A Cookie。

舉例來說，假設 A Cookie 內容為之前登入 A 網站的登入資訊，Same-Site 為 `Strict`，此時從 B 網站連結連至 A 網站時，因為 `Strict` 不會向第三方網站發送 Cookies，所以無法取得登入資訊，而變成未登入狀態。

:::warning
1. 不論是「Same-Origin Policy」或是「SameSite Cookies」都仰賴瀏覽器的實作，所以在不同版本的瀏覽器的效果可能會不一樣，特別是「SameSite Cookies」。
2. 最一開始的版本 Same-Site 並無 `None` 這個值，而是未設定 Same-Site 作用視同目前 `None`，不過有部分瀏覽器會視同 `Strict`，等到後來有定義 `None` 時，才以此為預設值，到後來又把預設值改為 `Lax`。
:::

參考文章：
* [Samesite cookie 解釋](https://web.dev/samesite-cookies-explained/)
* [Chrome 80 後針對第三方 Cookie 的規則調整 (default SameSite=Lax)](https://ianhung0529.medium.com/chrome-80-%E5%BE%8C%E9%87%9D%E5%B0%8D%E7%AC%AC%E4%B8%89%E6%96%B9-cookie-%E7%9A%84%E8%A6%8F%E5%89%87%E8%AA%BF%E6%95%B4-default-samesite-lax-aaba0bc785a3)
* [再探同源政策，談 SameSite 設定對 Cookie 的影響與注意事項](https://medium.com/%E7%A8%8B%E5%BC%8F%E7%8C%BF%E5%90%83%E9%A6%99%E8%95%89/%E5%86%8D%E6%8E%A2%E5%90%8C%E6%BA%90%E6%94%BF%E7%AD%96-%E8%AB%87-samesite-%E8%A8%AD%E5%AE%9A%E5%B0%8D-cookie-%E7%9A%84%E5%BD%B1%E9%9F%BF%E8%88%87%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A0%85-6195d10d4441)

## 在 ASP.NET Core 設定 SameSite Cookies
### 全域設定
Program.cs
```csharp
var builder = WebApplication.CreateBuilder(args);

// 增加以下程式碼
builder.Services.Configure<CookiePolicyOptions>(options =>
{
    // 設定最低層級 Strict > Lax > None > Unspecified
    // 如果 MinimumSameSitePolicy 設定 Lax，但 CookieOptions.SameSite 設定 None，則最終會使用 Lax
    // 如果 MinimumSameSitePolicy 設定 Lax，但 CookieOptions.SameSite 設定 Strict，則最終會使用 Strict
    options.MinimumSameSitePolicy = SameSiteMode.Unspecified;
    
    // 如果有想要相依舊版瀏覽器才需實作
    options.OnAppendCookie = cookieContext =>
        CheckSameSite(cookieContext.Context, cookieContext.CookieOptions);
    options.OnDeleteCookie = cookieContext =>
        CheckSameSite(cookieContext.Context, cookieContext.CookieOptions);
});

void CheckSameSite(HttpContext httpContext, CookieOptions options)
{
    if (options.SameSite == SameSiteMode.None)
    {
        var userAgent = httpContext.Request.Headers["User-Agent"].ToString();
        if (DisallowsSameSiteNone(userAgent))
        {
            options.SameSite = SameSiteMode.Unspecified;
        }
    }
}

bool DisallowsSameSiteNone(string userAgent)
{
    // 使用 userAgent 辨別瀏覽器版本，將尚未支援 None 的瀏覽器的版本回傳 true
    // 由於涉及瀏覽器版本太多，且官網也未實作完全，所以這邊就不列出具體實作
    return true;
}

// ...其他程式碼...


app.UseCookiePolicy(); // 增加此行，且必須放在 UseAuthorization 前面
app.UseAuthorization();

app.MapRazorPages();

app.Run();
```

### 個別 Cookie 設定
```csharp
// CookieOptions.SameSite 預設值為 Unspecified
Response.Cookies.Append("name", "value", new CookieOptions() { SameSite = SameSiteMode.Lax });
```

:::info
1. 未設定 SameSiteMode 和指定 `Unspecified`，都不會在 Cookie 設定 Same-Site，交由 Client 決定。
2. 有關 Same-Site 在 .NET Core 的內部實作可以參閱 [ResponseCookiesWrapper](https://github.com/dotnet/aspnetcore/blob/main/src/Security/CookiePolicy/src/ResponseCookiesWrapper.cs) 這隻程式。
:::

### MSDN 文件
[在 ASP.NET Core 中使用 SameSite cookie](https://learn.microsoft.com/en-us/aspnet/core/security/samesite?view=aspnetcore-6.0)

## 在 ASP.NET Framework 設定 SameSite Cookies
Framework 4.7.2 以上才有支援相關 API。

### 設定預設值
1. 如果個別 Cookie 未設定 Same-Site，則會以此設定為主。
2. 雖然說 Session 預設會存在 Cookie 裡，但目前測試不受 `<httpCookies sameSite />` 影響，而是以 `<sessionState cookieSameSite />` 的設定為主，若未設定，則為 `Lax`。
:::warning
1. ASP.NET_SessionId 若未設定 `<sessionState cookieSameSite />` 預設會使用 `Lax`，這是 Framework 4.8.1 測試結果，有可能不同 Framework 版本結果不同。
2. 測試 ASP.NET_SessionId 的 Same-Site 值，最好使用無痕模式，否則有可能會受到前面開啟網頁的影響。
:::

Web.config
```xml
<configuration>
  <system.web>
    <!--如果個別 Cookie 未設定 Same-Site，則會以此設定為主-->
    <httpCookies sameSite="Lax"></httpCookies> 
  </system.web>
</configuration>
```

### 個別 Cookie 設定
```csharp
HttpCookie cookie = new HttpCookie("name");
cookie.Value = "value";
cookie.SameSite = SameSite.Lax; // 設定Same-Site
Response.Cookies.Add(cookie);
```
:::info
Cookie Same-Site 會依以下順序取得設定值：
`HttpCookie.SameSite` => `<httpCookies sameSite />` => 未設定。
:::

### 舊瀏覽器相容
Global.asax.cs
```csharp
protected void Application_BeginRequest(object sender, EventArgs e)
{
    FilterSameSiteNoneForIncompatibleUserAgents(sender);
}

public static void FilterSameSiteNoneForIncompatibleUserAgents(object sender)
{
    HttpApplication application = sender as HttpApplication;
    if (application != null)
    {
        var userAgent = application.Context.Request.UserAgent;
        if (DisallowsSameSiteNone(userAgent))
        {
            HttpContext.Current.Response.AddOnSendingHeaders(context =>
            {
                var cookies = context.Response.Cookies;
                for (var i = 0; i < cookies.Count; i++)
                {
                    var cookie = cookies[i];
                    if (cookie.SameSite == SameSiteMode.None)
                    {
                        cookie.SameSite = (SameSiteMode)(-1); // Unspecified
                    }
                }
            });
        }
    }
}

public static bool DisallowsSameSiteNone(string userAgent)
{
    // 使用 userAgent 辨別瀏覽器版本，將尚未支援 None 的瀏覽器的版本回傳 true
    // 由於涉及瀏覽器版本太多，且官網也未實作完全，所以這邊就不列出具體實作
    return true;
}
```

### MSDN 文件
[在 ASP.NET 中使用 SameSite Cookie](https://learn.microsoft.com/zh-tw/aspnet/samesite/system-web-samesite)

###### tags: `.NET` `SameSite Cookies`
