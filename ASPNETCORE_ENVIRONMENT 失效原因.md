# ASPNETCORE_ENVIRONMENT 失效的原因

[![hackmd-github-sync-badge](https://hackmd.io/vUI0azKySeyBAc0VUHwSAA/badge)](https://hackmd.io/vUI0azKySeyBAc0VUHwSAA)


最近比較懶得寫筆記，這篇就簡單記錄一下。

之前我寫過一篇「[淺談 ASP.NET Core 中的環境名稱設定與應用](/xlmCyJdgT7-EEe83HlT04w)」，但最近遇到一個專案需要透過 Windows 環境變數來設定環境，便參考了微軟的文章「[在 ASP.NET Core 中使用多個環境 - 全域設定環境變數](https://learn.microsoft.com/zh-tw/aspnet/core/fundamentals/environments?view=aspnetcore-8.0#windows---set-environment-variable-globally)」。

結果設定完發現專案仍然只讀取「appsettings.json」，而未讀取「appsettings.{環境}.json」。無論是重啟網站還是重啟應用程式池都沒有作用。由於這是客戶的環境，且我不熟悉，就沒玩重開治百病的方法。

後來我找到了這篇文章 「[IIS 部署 .Net Core 設定環境變數方法](https://malagege.github.io/blog/posts/IIS-%E4%BD%88%E7%BD%B2-Net-Core-%E8%A8%AD%E5%AE%9A%E7%92%B0%E5%A2%83%E8%AE%8A%E6%95%B8%E6%96%B9%E6%B3%95/)」，才發現需要重新啟動 IIS，環境變數的設定才會生效。執行以下指令後問題就解決了：

```bash
iisreset /restart
```

:::info
執行上述指令時，可能需要系統管理員權限。
:::

###### tags: `.NET` `.NET Core & .NET 5+` `ASP.NET Core`