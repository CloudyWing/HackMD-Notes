---
title: "使用 MinVer 自動化 .NET 類別庫的版本號管理"
date: 2025-03-29
lastmod: 2025-03-29
description: "介紹使用 MinVer 取代 GitVersion 進行 .NET 套件版本控制。說明 MinVer 基於 Git Tag 的版本推斷機制，以及如何自動生成 AssemblyVersion 與 PackageVersion，簡化 CI/CD 流程。"
tags: [".NET","MinVer"]
---

# 使用 MinVer 自動化 .NET 類別庫的版本號管理

最早期，我是使用 Visual Studio 的 Automatic Versions 功能來管理套件版本號。

後來轉向使用 GitVersion 配合 Git 標籤進行版本號管理，但當 GitVersion.MsBuild 升級到 6.0.0 後，設定機制有所變更，導致原先的設定失效。雖然嘗試過多種方法，但始終無法正確設定，同時我也發現在功能分支上的版本號表現不如預期。

在尋找替代方案時，我想起之前在其他開源套件中見過 MinVer，因此決定改用它來處理版本號。MinVer 比 GitVersion 設定更為簡單直觀，主要依靠 Git 標籤進行版本控制，詳細說明可參考其 [GitHub 頁面](https://github.com/adamralph/minver)。

## MinVer 版本號規則

### 基本運作原理

以下內容來源自 [MinVer GitHub](https://github.com/adamralph/minver)：

* 如果當前 commit 有版本標籤：
  * 版本將直接採用該標籤。
* 如果當前 commit *沒有* 版本標籤：
  * 搜尋 commit 歷史找出最近有版本標籤的 commit。
    * 如果找到有版本標籤的 commit：
      * 如果版本是預發佈版本：
        * 版本將直接採用，並加上 height（距離標籤的 commit 數量）。
      * 如果版本是正式版本（非預發佈）：
        * 修補號（patch number）會自動遞增，但這可以自定義。
        * 增加預設的預發佈識別碼。預設識別碼是 `alpha.0`，但這可以自定義。
        * 例如，如果最新的版本標籤是 `1.0.0`，則當前版本會是 `1.0.1-alpha.0`。
        * 加上 height。
    * 如果找不到有版本標籤的 commit：
      * 使用預設版本 `0.0.0-alpha.0`，並加上 height。

### 屬性值對應

| 屬性 | 值 |
|------|------|
| AssemblyVersion | `{MinVerMajor}.0.0.0` |
| FileVersion | `{MinVerMajor}.{MinVerMinor}.{MinVerPatch}.0` |
| InformationalVersion | `{MinVerVersion}` |
| PackageVersion | `{MinVerMajor}.{MinVerMinor}.{MinVerPatch}` 或 `{MinVerMajor}.{MinVerMinor}.{MinVerPatch}-{MinVerPreRelease}` |
| Version | `{MinVerMajor}.{MinVerMinor}.{MinVerPatch}` 或 `{MinVerMajor}.{MinVerMinor}.{MinVerPatch}-{MinVerPreRelease}` |

### 常用設定範例（在 .csproj 中設定）

設定版本標籤前綴（適用於習慣在 tag 加上 v 前綴的團隊，例如 v1.0.0）：

```xml
<PropertyGroup>
  <MinVerTagPrefix>v</MinVerTagPrefix>
</PropertyGroup>
```

自定義預發佈識別碼（適用於想使用 preview 而非預設 alpha 作為預發佈標識的專案）：

```xml
<PropertyGroup>
  <MinVerDefaultPreReleaseIdentifiers>preview.0</MinVerDefaultPreReleaseIdentifiers>
</PropertyGroup>
```

## 實作範例

### 基本設置與未標記情況

首先建立一個類別庫，並從 NuGet 上安裝 MinVer 套件。如果尚未設定任何版本標籤，MinVer 會使用預設版本：

![minver default version](images/%E4%BD%BF%E7%94%A8%20MinVer%20%E8%87%AA%E5%8B%95%E5%8C%96%20.NET%20%E9%A1%9E%E5%88%A5%E5%BA%AB%E7%9A%84%E7%89%88%E6%9C%AC%E8%99%9F%E7%AE%A1%E7%90%86/minver-default-version.png)

產生的 DLL 資訊如下：

![minver dll info default](images/%E4%BD%BF%E7%94%A8%20MinVer%20%E8%87%AA%E5%8B%95%E5%8C%96%20.NET%20%E9%A1%9E%E5%88%A5%E5%BA%AB%E7%9A%84%E7%89%88%E6%9C%AC%E8%99%9F%E7%AE%A1%E7%90%86/minver-dll-info-default.png)

套件指令產生的檔案為：`MinVerTest.0.0.0-alpha.0.1.nupkg`

### 在前一個 Commit 加入正式版本標籤

如果在前一個 Commit 加入正式標籤 0.1.0：

![git tag v0.1.0](images/%E4%BD%BF%E7%94%A8%20MinVer%20%E8%87%AA%E5%8B%95%E5%8C%96%20.NET%20%E9%A1%9E%E5%88%A5%E5%BA%AB%E7%9A%84%E7%89%88%E6%9C%AC%E8%99%9F%E7%AE%A1%E7%90%86/git-tag-v0.1.0.png)

產生的 DLL 資訊如下（注意 patch 版本自動增加）：

![minver package alpha version](images/%E4%BD%BF%E7%94%A8%20MinVer%20%E8%87%AA%E5%8B%95%E5%8C%96%20.NET%20%E9%A1%9E%E5%88%A5%E5%BA%AB%E7%9A%84%E7%89%88%E6%9C%AC%E8%99%9F%E7%AE%A1%E7%90%86/minver-package-alpha-version.png)
套件指令產生的檔案為：`MinVerTest.0.1.1-alpha.0.1.nupkg`

### 在前一個 Commit 加入預發佈版本標籤

如果在前一個 Commit 加入非正式標籤 0.0.1-alpha.0：

![minver build log](images/%E4%BD%BF%E7%94%A8%20MinVer%20%E8%87%AA%E5%8B%95%E5%8C%96%20.NET%20%E9%A1%9E%E5%88%A5%E5%BA%AB%E7%9A%84%E7%89%88%E6%9C%AC%E8%99%9F%E7%AE%A1%E7%90%86/minver-build-log.png)

產生的 DLL 資訊如下：

![minver dll info v0.1.1](images/%E4%BD%BF%E7%94%A8%20MinVer%20%E8%87%AA%E5%8B%95%E5%8C%96%20.NET%20%E9%A1%9E%E5%88%A5%E5%BA%AB%E7%9A%84%E7%89%88%E6%9C%AC%E8%99%9F%E7%AE%A1%E7%90%86/minver-dll-info-v0.1.1.png)

套件指令產生的檔案為：`MinVerTest.0.0.1-alpha.0.1.nupkg`

::: info
避免使用如 `0.0.1-alpha.0.0` 的標籤格式，否則下一筆會變成 `0.0.1-alpha.0.0.1`，造成版本號混亂。
:::

### 在最新 Commit 加入正式版本標籤

如果在最新 Commit 加入正式標籤 0.1.2：

![minver console output 1](images/%E4%BD%BF%E7%94%A8%20MinVer%20%E8%87%AA%E5%8B%95%E5%8C%96%20.NET%20%E9%A1%9E%E5%88%A5%E5%BA%AB%E7%9A%84%E7%89%88%E6%9C%AC%E8%99%9F%E7%AE%A1%E7%90%86/minver-console-output-1.png)

產生的 DLL 資訊如下（直接採用標籤版本）：

![minver console output 2](images/%E4%BD%BF%E7%94%A8%20MinVer%20%E8%87%AA%E5%8B%95%E5%8C%96%20.NET%20%E9%A1%9E%E5%88%A5%E5%BA%AB%E7%9A%84%E7%89%88%E6%9C%AC%E8%99%9F%E7%AE%A1%E7%90%86/minver-console-output-2.png)

套件指令產生的檔案為：`MinVerTest.0.1.2.nupkg`

::: info
如果專案安裝 MinVer 出現 `git is not present in PATH.` 錯誤，表示 Git 未設定在環境變數的 `path` 中。需要確保 Git 可以從命令列執行。
:::

## 異動歷程

* 2025-03-29 初版文件建立。
