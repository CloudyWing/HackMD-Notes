# .NET 技術文檔與命名規範的演變

這篇文章無關技術，只是講兩個很早就發生，但我在前幾個月才發現的事。

## MSDN 平台的消失
過去，.NET 的技術文檔主要集中在 MSDN（Microsoft Developer Network）上，這個平台為開發者提供了 API 參考、教程和範例程式碼。

在我幾個月前的筆記，都還可以看到我使用 MSDN 的來代指 .NET 文件，幾個月前我才注意到，MSDN 的網站已不再使用 `msdn` 字眼，我查詢後發現 MSDN 已經被淘汰，相關內容已經遷移至 Microsoft Docs，並且現在這個平台已被重新命名為 Microsoft Learn。

在「[MSDN 程式碼庫已淘汰](https://learn.microsoft.com/zh-tw/teamblog/msdn-code-gallery-retired)」和「[MSDN 與 TechNet 移轉至 docs.microsoft.com 的更新](https://learn.microsoft.com/zh-tw/teamblog/msdn-technet-migration)」都說明了這一轉變。如果想查找舊版的 .NET 文件，可以在「[.NET 舊版文件](https://learn.microsoft.com/zh-tw/previous-versions/dotnet/)」，中找到，不過由於文件更新策略分為 .NET Framework 4 之前的版本和持續更新的最新版本，部分舊資料可能已不再完整。

## Field 命名規範的變化
大概在 6 月份，公司討論命名規範時，我曾說過，目前沒有一個規範，Field 是使用 `_` 前綴，結果馬上被打臉，目前的微軟文件的「[C# 識別碼命名規則和慣例](https://learn.microsoft.com/zh-tw/dotnet/csharp/fundamentals/coding-style/identifier-names)」，上面這樣寫：
>私人執行個體欄位開頭為底線 (_)，其餘文字為 camelCased。

後來我仔細想想，我發現近兩年的官方範例中，私有 Field 的確開始使用 `_` 開頭前綴。

後續查了一下，不得不說， .NET 早期的文件越來越難找，找很久才找到這篇「[Internal Coding Guidelines](https://learn.microsoft.com/zh-tw/archive/blogs/brada/internal-coding-guidelines)」。
>Do not use a prefix for member variables (_, m_, s_, etc.). If you want to distinguish between local and member variables you should use “this.” in C# and “Me.” in VB.NET.

但現在為什麼會改為都用 `_` 開頭呢？
根據 .NET Core 在 2016 年提出的規範「[.NET CoreFX - C# Coding Style](https://github.com/dotnet/corefx/blob/368fdfd86ee3a3bf1bca2a6c339ee590f3d6505d/Documentation/coding-guidelines/coding-style.md)」
>We use _camelCase for internal and private fields and use readonly where possible. Prefix instance fields with _, static fields with s_ and thread static fields with t_. When used on static fields, readonly should come after static (i.e. static readonly not readonly static).

這與早期 .NET Framework 的命名規範完全相反。當時，私有 Field 是不鼓勵使用前綴的，但 .NET CoreFX 團隊認為這樣的命名方式更便於維護，因此隨著 .NET Core 與 .NET Framework 的合併，.NET 5 統一了這些風格指南，並將私有 Field 使用 `_` 前綴的規範逐漸推廣到所有的範例中。

現在 .NET 的原始碼和許多開源專案都遵循了這一命名規範，我有種跑到平行世界的感覺，畢竟我在今年的認知都還停留在不加前綴的版本 XD。與早期的 .NET Framework 時期，如今的 .NET Core 程式碼風格更加統一。如果你有興趣，可以查看 [Reference Source](https://referencesource.microsoft.com/)，當中的私有 Field，無前綴、`_` 前綴和 `m_` 前綴都有，非常混亂。

###### tags: `.NET`