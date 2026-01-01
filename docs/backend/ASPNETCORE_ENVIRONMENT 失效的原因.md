---
title: "ASPNETCORE_ENVIRONMENT 失效的原因"
date: 2024-09-19
lastmod: 2024-09-19
description: "深入排查 `ASPNETCORE_ENVIRONMENT` 環境變數設定失效的原因。發現即使在 Windows 全域環境變數設定成功，IIS 仍可能讀取舊值，必須執行 `iisreset` 重新啟動 IIS 服務才能確保環境變數變更生效。"
tags: [".NET","ASP.NET","ASP.NET Core"]
---

# ASPNETCORE_ENVIRONMENT 失效的原因

最近比較懶得寫筆記，這篇就簡單記錄一下。

之前我寫過一篇「[淺談 ASP.NET Core 中的環境名稱設定與應用](%E6%B7%BA%E8%AB%87%20ASP.NET%20Core%20%E4%B8%AD%E7%9A%84%E7%92%B0%E5%A2%83%E5%90%8D%E7%A8%B1%E8%A8%AD%E5%AE%9A%E8%88%87%E6%87%89%E7%94%A8.md)」，但最近遇到一個專案需要透過 Windows 環境變數來設定環境，便參考了微軟的文章「[在 ASP.NET Core 中使用多個環境 - 全域設定環境變數](https://learn.microsoft.com/zh-tw/aspnet/core/fundamentals/environments?view=aspnetcore-8.0#windows---set-environment-variable-globally)」。

結果設定完發現專案仍然只讀取`appsettings.json`，而未讀取 `appsettings.{環境}.json`。無論是重啟網站還是重啟應用程式池都沒有作用。由於這是客戶的環境，且我不熟悉，就沒玩重開治百病的方法。

後來我找到了這篇文章 「[IIS 部署 .NET Core 設定環境變數方法](https://malagege.github.io/blog/posts/IIS-%E4%BD%88%E7%BD%B2-Net-Core-%E8%A8%AD%E5%AE%9A%E7%92%B0%E5%A2%83%E8%AE%8A%E6%95%B8%E6%96%B9%E6%B3%95/)」，才發現需要重新啟動 IIS，環境變數的設定才會生效。執行以下指令後問題就解決了：

```bash
iisreset /restart
```

::: info
執行上述指令時，可能需要系統管理員權限。
:::

## 異動歷程

* 2024-09-19 初版文件建立。
