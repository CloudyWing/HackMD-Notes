---
title: "常用套件整理 - Visual Studio"
date: 2022-11-10
lastmod: 2025-12-31
description: "整理作者常用的 Visual Studio 擴充套件，如 Productivity Power Tools (包含 Double-Click Maximize, Fix Mixed Tabs) 與 Dev Essentials (File Icons, SVG Viewer)，提升開發效率。"
tags: [".NET","NuGet","Visual Studio"]
---

# 常用套件整理 - Visual Studio

年紀大了，記憶不好，每次安裝 Visual Studio 都要花時間查一下之前安裝了哪些套件，及套件功能是什麼，所以寫一篇文章記錄下來。

## Visual Studio 的擴充套件

- [Productivity Power Tools](https://marketplace.visualstudio.com/items?itemName=VisualStudioPlatformTeam.ProductivityPowerPack2022)：下列套件屬於「Productivity Power Tools」 同捆包的一部分。
  - [Double-Click Maximize 2022](https://marketplace.visualstudio.com/items?itemName=VisualStudioPlatformTeam.Double-ClickMaximize2022)：點擊兩下來最大化 Visual Studio 視窗。
  - [Fix Mixed Tabs](https://marketplace.visualstudio.com/items?itemName=VisualStudioPlatformTeam.FixMixedTabs2022)：偵測程式碼是否同時有 Tabs 和空格，並提供轉換為其中之一。
  - [Middle Click Scroll](https://marketplace.visualstudio.com/items?itemName=VisualStudioPlatformTeam.MiddleClickScroll2022)：使用滑鼠滾輪來移動文件。
  - [Solution Error Visualizer](https://marketplace.visualstudio.com/items?itemName=VisualStudioPlatformTeam.SolutionErrorVisualizer2022)：在 Solution Explorer 顯示錯誤提示。
- [Dev Essentials](https://marketplace.visualstudio.com/items?itemName=VisualStudioPlatformTeam.ProductivityPowerPack2022)：下列套件屬於「Dev Essentials」 同捆包的一部分，此套件在 Visual Studio 2019 以前叫 「[Web Essentials](https://marketplace.visualstudio.com/items?itemName=MadsKristensen.WebEssentials2019)」 。
  - [File Icons](https://marketplace.visualstudio.com/items?itemName=MadsKristensen.FileIcons)：美化 Solution Explorer 裡的檔案圖示。
  - [SVG Viewer](https://marketplace.visualstudio.com/items?itemName=MadsKristensen.SvgViewer)：增加 SVG 的預覽，及最佳化編輯器的相關功能。
  - [Editor Enhancements](https://marketplace.visualstudio.com/items?itemName=MadsKristensen.EditorEnhancements64)：強化編輯器功能，如程式碼排序、文字編碼等。
  - [Dummy Text Generator](https://marketplace.visualstudio.com/items?itemName=MadsKristensen.DummyTextGenerator)：在產建畫面 Sample 時，快速產出一些無意義的文字。
  - [Markdown Editor v2](https://marketplace.visualstudio.com/items?itemName=MadsKristensen.MarkdownEditor2)：在編輯器增加 Markdown 相關功能。
  - [Image Optimizer](https://marketplace.visualstudio.com/items?itemName=MadsKristensen.ImageOptimizer)：壓縮圖片大小。
- [ResXManager](https://github.com/dotnet/ResXResourceManager)：多國語言開發必備。提供 Excel 表格式的 UI 來統一管理所有 `.resx` 檔，避免手動切換檔案。
- [Editor Guidelines](https://github.com/pharring/EditorGuidelines)：提供補助線來判斷程式碼過長，我習慣會在加在 80 char、100 char 和 120 char 的位置。
- [VSColorOutput](https://marketplace.visualstudio.com/items?itemName=MikeWard-AnnArbor.VSColorOutput64)：讓 Output 視窗的 Build 訊息有顏色區分（紅字錯誤、綠色成功），大幅縮短掃描 Log 的時間。

::: tip

- **同捆包的演進**：「Productivity Power Tools」和「Web Essentials」早期是單一的大型套件，後來微軟將其拆分為多個獨立套件，並透過安裝「同捆包 (Bundle)」的方式來一次取得推薦的組合。
  - **改用「獨立清單」的原因**：
    早期我也習慣直接安裝同捆包，但後來遇到一些管理上的不便，因此改為維護自己的常用清單：
    1. **內容不透明**：安裝同捆包往往不清楚具體包含了哪些工具，且內容常隨版本變動（例如 Web Compiler 後來被移除需獨立安裝）。
    2. **功能重疊與過時**：隨著 Visual Studio 更新（特別是 2022 轉為 64 位元後），許多同捆包內的舊功能已無法使用，或已被 VS 內建功能取代（如 Zen-Coding）。
    3. **移除不乾淨**：移除同捆包時，通常不會連帶移除當初安裝的子套件，導致環境殘留許多不再需要的工具。
:::

## Visual Studio 設定

- 環境：
  - 一般：
    - 為不同像素密度的螢幕最佳化呈現方式：當遇到操作 Visual Studio 發現滑鼠指標會亂跑，比較常發現在操作 SQL 檔時，關掉此設定可以解決（Visual Studio 2026 已移除設定）。
    - 字型和色彩：字型選擇等寬字體「Cascadia Mono」，大小選 12。
::: tip
- **字型選擇**：之前我習慣使用 Consolas，近期改用 Visual Studio 內建的 `Cascadia Mono`。它專為程式碼設計，在高解析度螢幕上的閱讀體驗比 Consolas 更好。
  - **Cascadia Code vs. Mono**：兩者字型相同，差別在於 `Cascadia Code` 支援「連字 (Ligatures)」，例如輸入 `!=` 會自動顯示為 `≠`。為了避免在寫程式時對符號產生混淆（例如判斷是全形還是連字效果），我選擇不支援連字的 `Cascadia Mono`。
:::
  - 文件索引標籤：
    - 設定索引標籤位置：如果有使用寬螢幕或雙螢幕，建議改為「左」或「右」以增加垂直閱讀空間。
    - 索引標籤著色方式：建議打勾，依專案或檔案類型區分顏色。
    - 顯示「關閉」按鈕：預設勾選「在文件索引標籤上顯示」，方便直接關閉。
  - 擴充功能：
    - 依使用者延伸模組。
      - 如果擴充套件有需要指定特定版本，取消打勾「自動更新延伸模組」，Visual Studio 2026 可以排除特定套件自動更新。
- 文字編輯器：
  - 一般：顯示全部打勾。
- 語言：  
  - C#：
    - 進階：
      - Using 指示詞：.NET Framework 時期，習慣會開啟「排序 Using 時，先放置 'System' 指示詞」，所以如果沒設定 editorconfig 時，最好確認團隊設定是否一致。
      - 大綱：開啟「顯示程序行分隔符號」：這樣方法間和屬性間，只要有空白行，都會有白線分隔。
      - 淡出：啟用設定，提醒是否有多餘的 Using 和 變數。
      - 編輯器說明：「為重新指派的變數加上底線」：方便確認變數是否有被多次指派。

## NuGet 套件

- Microsoft Packages：
  - [Microsoft.AspNetCore.Mvc.Razor.RuntimeCompilation](https://learn.microsoft.com/zh-tw/aspnet/core/mvc/views/view-compilation?view=aspnetcore-7.0&tabs=visual-studio)：動態編譯 ASP.NET Core Razor 檔案。
  - Entity Framework Core：
    - Microsoft.EntityFrameworkCore：EF Core 基本功能。
    - Microsoft.EntityFrameworkCore.SqlServer：SQL Server 資料庫提供者，其它資料庫請參考「[資料庫提供者](https://learn.microsoft.com/zh-tw/ef/core/what-is-new/nuget-packages#database-providers)」：常見的關係資料庫功能。
    - Microsoft.EntityFrameworkCore.Design：Entity Framework 設計工具，執行像是 Migration 之類的功能。
    - Microsoft.EntityFrameworkCore.Relational：常見的關係資料庫功能。
    - Microsoft.EntityFrameworkCore.Tools：主控台工具。

::: tip
非建置 Entity 的專案，正常來說只要安裝以下套件就好：

    - Microsoft.EntityFrameworkCore。
    - Microsoft.EntityFrameworkCore.SqlServer 或其它資料庫提供者。
    - Microsoft.EntityFrameworkCore.Relational。
:::

- [CommunityToolkit.Mvvm](https://github.com/CommunityToolkit/dotnet)：用來簡化 MVVM 架構開發的套件。
- [Dapper](https://github.com/DapperLib/Dapper)：輕量化的 ORM 套件。
- [EF Core Power Tools](https://github.com/ErikEJ/EFCorePowerTools)：提供 Entity Framework Core 反向工程 (Reverse Engineering) 的圖形化介面工具，方便從資料庫生成 Model。
- [FluentValidation](https://docs.fluentvalidation.net/en/latest/)：建構強類型驗證規則。
- [Humanizer](https://github.com/Humanizr/Humanizer)：功能強大的字串轉換工具，可將時間、數字轉換成口語化英文、英文單複數轉換，及各種字串 Format。
- [CsvHelper](https://joshclose.github.io/CsvHelper/)：CSV 套件。
- [NPOI](https://github.com/nissl-lab/npoi)：免費的 Excel 套件。

::: tip

- 原本還有另外一個功能更強大 Excel 套件是 [EPPlus](https://www.epplussoftware.com/)，但是它只有在 EPPlus 4 以前可以免費使用，EPPlus 5 以後，授權改為「[Polyform Noncommercial 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0/)」，無法用於商業環境，但如果只是個人使用則沒問題。
  - NPOI 有支援「XLS」格式，EPPlus 僅支援「XLSX」，但個人經驗，目前 EPPlus 支援功能較為多一點。
:::

- [Serilog.AspNetCore](https://github.com/serilog/serilog-aspnetcore)：現代化結構式日誌 (Structured Logging) 的標準解決方案。

::: tip

- **核心觀念**：傳統 NLog 紀錄的是「字串」(Text)，Serilog 紀錄的是「資料」(Data)。例如 `Log.Info("User {Id}", id)`，Serilog 會將 `Id` 視為可搜尋的欄位，而非單純的文字拼接。
  - **套件組合**：通常開發 Web 專案時，建議安裝 `Serilog.AspNetCore` (整合了核心與 DI)。
  - **Sinks (輸出端)**：Serilog 採用「Sinks」外掛機制來決定 Log 寫去哪。常用的有：
    - `Serilog.Sinks.Console`：開發時看黑窗用。
    - `Serilog.Sinks.File`：寫入地端檔案。
    - `Serilog.Sinks.Seq`：強烈推薦搭配 [Seq](https://datalust.co/seq) 使用，它能將結構化 Log 視覺化，除錯效率遠勝看文字檔。
:::

- [Scrutor](https://github.com/khellang/Scrutor)：針對微軟原生 DI (Microsoft.Extensions.DependencyInjection) 進行功能增強的標準配備。

::: tip
早期在 .NET Framework 常用 Autofac 作為 DI 容器。雖然 .NET Core 已內建 DI，但功能較陽春（例如不支援組件掃描 Assembly Scanning）。Scrutor 的作用就是填補這塊缺口，讓我們能用簡潔的語法實現自動註冊。
:::

- [SSH.NET](https://github.com/sshnet/SSH.NET)：SFTP 套件。
- [FluentFTP](https://github.com/robinrodricks/FluentFTP)：FTP 套件。
- [MQTTnet](https://github.com/dotnet/MQTTnet)：MQTT 套件。
- [YARP (Yet Another Reverse Proxy)](https://github.com/dotnet/yarp)：微軟官方主導開發的反向代理套件。
::: tip
早期微服務閘道器主流是 [Ocelot](https://github.com/ThreeMammals/Ocelot)。目前 YARP 因與 .NET 高度整合且維護活躍，已成為新首選。除非需要透過「設定檔」來處理複雜的請求聚合 (Request Aggregation)，否則 YARP 在核心轉發與負載平衡的效能上表現更好。
:::

- 壓縮相關套件：
  - [SharpZipLib](https://github.com/icsharpcode/SharpZipLib)：支援多種壓縮格式的壓縮套件。
  - [DotNetZip](https://www.nuget.org/packages/DotNetZip/)：操作較為簡單、直覺的 Zip 壓縮套件。

::: tip

- **選擇建議**：只需要 ZIP 壓縮且無其他依賴時，使用 DotNetZip 即可。若專案已有安裝 NPOI，因其依賴 SharpZipLib，則可直接使用 SharpZipLib 避免重複安裝。
  - **安全性提醒**：有些作法會呼叫主機上的 `7z.exe` 進行壓縮，這通常涉及將資料寫入暫存檔。若專案有資料加密或不落地的資安要求，這種作法可能因殘留暫存檔而導致機密外洩（例如壓縮失敗時未刪除原始檔）。使用原生套件在記憶體中處理會相對安全。
  - .NET 內建的 `System.IO.Compression` 也是輕量級的好選擇。
:::

- 單元測試相關套件：
  - [NUnit](https://nunit.org/)：NUnit 框架。
  - [NUnit3TestAdapter](https://www.nuget.org/packages/nunit3testadapter/)：NUnit 與 Visual Studio 的 Adapter。
  - [NSubstitute](https://nsubstitute.github.io/)：單元測試隔離框架。

- [DefaultDocumentation](https://github.com/Doraku/DefaultDocumentation)：將 Visual Studio XML 註解轉為使用 Markdown 語法的 API 文件。
- 專案版本號相關套件：
  - [MinVer](https://github.com/adamralph/minver)：根據 Git Tag 來設定專案版本號。
  - [GitVersion.MsBuild](https://gitversion.net/docs/usage/msbuild)：使用 Git 流程設定專案版本號。

::: tip

- MinVer 相對單純，直接依據 Git Tag 決定版號，適合輕量級專案。
  - GitVersion 功能強大但設定複雜，支援根據分支策略 (GitFlow) 產生版號。
:::


## 異動歷程

- 2022-11-10 初版文件建立。
- 2025-04-06
  - 增加「自動更新延伸模組」設定說明。
  - 移除「Code Cleanup on Save」，Visual Studio 2022 已經內建很久，不用特別列出來。
  - 更新部分套件的說明。
- 2025-12-31
  - 移除過時以及需商用授權的套件。
  - 更新 Visual Studio 設定建議，推薦改用 Cascadia 系列字型。
  - 新增 YARP、Scrutor 與 MQTTnet 等套件。

