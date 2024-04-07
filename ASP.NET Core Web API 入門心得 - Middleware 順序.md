# ASP.NET Core Web API 入門心得 - Middleware 順序

[![hackmd-github-sync-badge](https://hackmd.io/kDh1zm72TiOh2p0blwqjZg/badge)](https://hackmd.io/kDh1zm72TiOh2p0blwqjZg)


ASP.NET Core 的中介軟體部分必須依照一定的順序才可以正常運作，之前找不到具體說明順序的文章，但最近發現 MSDN 有相關的文章 [中介軟體](https://learn.microsoft.com/zh-tw/aspnet/core/fundamentals/middleware)，這邊文章只是為了做備份，避免哪天一時找不到文章時，還有自己的筆記可以看，此文章會持續調整。

## Middleware 說明
* 開發人員例外狀況頁面中介軟體 (UseDeveloperExceptionPage)：回報應用程式執行階段錯誤。
* 資料錯誤頁面中介軟體 (UseDatabaseErrorPage)：回報資料庫執行階段錯誤。
* 例外狀況處理常式中介軟體 (UseExceptionHandler)：攔截在下列 Middleware 中擲回的例外狀況。
* HTTP 靜態傳輸安全性通訊協定 (HSTS) 中介軟體 (UseHsts)：新增 `Strict-Transport-Security` 標頭，作用是讓網站宣告自身為安全主機，並通知瀏覽器僅使用 HTTPS 連線。
* HTTPS 重新導向中介軟體 (UseHttpsRedirection)：將 HTTP 要求重新導向到 HTTPS。
:::info
`UseHsts` 和 `UseHttpsRedirection` 都會將 HTTP 請求重定向到 HTTPS，前者是瀏覽器處理，後者是程式處理。
:::
* 靜態檔案中介軟體 (UseStaticFiles)：會在指定的路徑中尋找對應的靜態檔案，並在接收到相應的 HTTP 請求時將它們發送到客戶端。
* Cookie 原則中介軟體 (UseCookiePolicy)：使應用程式符合 GDPR 法規，有關 GDPR 請參閱 [在 ASP.NET Core 實作 GDPR
](https://hackmd.io/@CloudyWing/Hk43fPvEs)。
* 路由中介軟體 (UseRouting)：路由相關處理。
* 驗證中介軟體 (UseAuthentication)：驗證使用者是否已登入。
* 授權中介軟體 (UseAuthorization)：授權使用者存取安全資源。
* 工作階段中介軟體 (UseSession)：Session 相關處理。
* 端點路由中介軟體 (UseEndpoints 與 MapRazorPages 之類和 Endpoint 相關的)：將端點新增至要求管線。

## Middleware 完整順序
根據目前內建的 Middleware，建議的順序如下。實際上，只需使用專案需要的 Middleware 即可，部分 Middleware 的順序可以調整：
```csharp
var app = builder.Build();

if (app.Environment.IsDevelopment()) {
    // UseMigrationsEndPoint 和其他兩個是在不同範例，所以沒具體說明它們順序
    app.UseMigrationsEndPoint();
    app.UseDeveloperExceptionPage();
    app.UseDatabaseErrorPage();
} else {
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
// 最奇妙的 Middleware，範例放在很前面，結果一堆狀況都必須往後放
// 有使用 JavaScript 來擷取跨網站靜態檔案的應用程式時，必須放在 UseCors 後面
// 靜態檔案如果有涉及到文化特性，必須放在 UseRequestLocalization 後面
// 如果要允許快取壓縮的靜態檔案，必須要放在 UseResponseCompression 和 UseResponseCaching 後面
app.UseStaticFiles();
app.UseCookiePolicy();

// 除非 RateLimiter 僅使用全域的 Filter，否則 UseRouting 要放在 UseRateLimiter 前面
app.UseRouting();
app.UseRateLimiter();
// UseRequestLocalization 必須出現在可能檢查要求文化特性的任何中介軟體之前
app.UseRequestLocalization();
// UseCors 要放在 UseRouting 後面 UseEndpoints 前面
// UseCors 要在 UseAuthentication、UseResponseCaching 前面
// 目前 UseCors 放在 UseResponseCaching 後面會有此 bug https://github.com/dotnet/aspnetcore/issues/23218
app.UseCors();

// UseAuthentication 要放在 UseAuthorization 前面
app.UseAuthentication();
app.UseAuthorization();
// 要放在 UseCookiePolicy 後面，Endpoint 相關的中介軟體之前
app.UseSession();
// UseResponseCompression 和 UseResponseCaching 沒一定順序，如果想要快取壓縮的回應來減少 CPU 使用量，可以反過來放
app.UseResponseCompression();
app.UseResponseCaching();

// 這些 Map 開頭、UseMvc 或 UseEndpoints 之類的端點路由中介軟體，要放在最後面
app.MapRazorPages();
app.MapDefaultControllerRoute();

app.Run();
```

## 其他相關文章
* [ASP.NET Core Web API 入門心得](https://hackmd.io/@CloudyWing/HJ-KKurHp)

###### tags: `.NET` `.NET Core & .NET 5+` `Web API`