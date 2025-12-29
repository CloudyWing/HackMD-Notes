# EF Core Power Tools 介紹

之前工作忙到沒時間寫筆記，每天不是加班，就是想要加班但心情煩悶導致沒加班，就更沒心情寫筆記了。最近離職，頹廢一陣子，情緒還沒調整過來，不過感覺還是要加減寫點東西，就稍微記錄一下。

## 前言

在過往，Entity Framework 有提供 Database First 的開發方式。但是在 Entity Framework Core 中只剩下 Code First。

雖然可以使用反向工程從資料庫產生 EF 程式碼來模擬 Database First 的效果，但此時會遇到兩個主要問題：

* **指令複雜**：反向工程的指令不同，產生的程式碼會不太一樣，增加因操作錯誤造成程式碼差異的風險。
* **客製化限制**：針對產生的程式碼能進行的客製化很有限。

## EF Core Power Tools

### 工具介紹

[EF Core Power Tools](https://github.com/ErikEJ/EFCorePowerTools) 是官網推薦的 EF Visual Studio 延伸模組之一。

參考連結：[EF Core 工具和擴充功能](https://learn.microsoft.com/zh-tw/ef/core/extensions/)

### 主要功能

* **UI 介面操作**：提供圖形化介面來進行反向工程，降低指令錯誤率。
* **程式碼客製化**：透過「Customize code using templates」設定，可以選擇使用 T4 範本或 Handlebars 等進行更大程度的客製化。
* **設定檔管理**：所有設定都會存到「efpt.config.json」檔案中，讓每個維護專案的人都使用相同的設定。

### DateOnly 和 TimeOnly 支援

在 Entity Framework 8 中，有增加支援 `DateOnly` 和 `TimeOnly` 的對應。而在 EF Core Power Tools 可以在進階設定中勾選「Map DateOnly and TimeOnly」功能，就不會像過往一樣將 SQL Server 的 `date` 和 `time` 都對應到 C# `DateTime`，避免誤用的問題。

### 支援範圍

除了現有的 SQL Server 資料庫外，還可以針對 Visual Studio 的資料庫專案進行反向工程。

具體操作步驟可以參考作者在 GitHub 上的快速教學：[Reverse Engineering Quick Start](https://github.com/ErikEJ/EFCorePowerTools/wiki/Reverse-Engineering-Quick-Start)，我這邊就不多說了。

### 限制

EF Core Power Tools 也不是沒有缺點：

* **版本相依性問題**：
    延伸模組版本與 Entity Framework Core 版本嚴重相依，而 Entity Framework Core 又和 .NET 版本相依。

    不同的專案可能需要使用不同版本的 EF Core Power Tools：

  * EF Core Power Tools 2.5.1429：最後支援 Entity Framework Core 3.1 的版本，且不支援 Entity Framework Core 8。
  * EF Core Power Tools 2.6.698：最後支援 Entity Framework Core 7 的版本。

    因此，如果同時維護橫跨 .NET Core 3.1 到 .NET 8 的多個專案，就可能需要安裝多個版本的 Visual Studio（例如 Visual Studio 正式版和 Visual Studio Preview），以便搭配不同版本的延伸模組。

* **支援資料庫有限**：原本只支援 SQL Server。雖然在新增自訂資料庫連線時有看到「MySQL」和「Snowflake」選項，不過後兩者我沒實際使用過。

## EF Core Power Pack

### 解決方案

為了解決 EF Core Power Tools 只能針對 SQL Server 進行反向工程的限制，作者另外開發了 [EF Core Power Pack](https://marketplace.visualstudio.com/items?itemName=ErikEJ.EFCorePowerPack) 延伸模組來支援 PostgreSQL 和 SQLite。

### 安裝與設定

安裝 EF Core Power Pack 後，系統會額外安裝以下擴充套件：

* VisualStudio.Data.Sqlite
* Npgsql PostgreSQL Integration

### 使用方式

安裝完成後，在「新增資料庫連線」時：

1. 點擊資料連線旁邊的「變更(C)」按鈕。
2. 選擇清單中新增的「PostgreSQL」或「SQLite」資料庫類型。

## 異動歷程

* 2025-07-07 初版文件建立。

---

###### tags: `.NET` `Database` `Visual Studio` `Entity Framework`