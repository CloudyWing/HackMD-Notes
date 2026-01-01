---
title: "使用 Visual Studio 發佈帶有預設檔案的 NuGet 套件"
date: 2022-11-08
lastmod: 2022-11-08
description: "教學如何製作包含預設設定檔 (如 Config 範本) 的 NuGet 套件。說明 .NET Standard 專案設定、`.nuspec` 檔案配置以及在安裝套件時自動複製檔案到目標專案的技巧。"
tags: [".NET","NuGet"]
---

# 使用 Visual Studio 發佈帶有預設檔案的 NuGet 套件

撰寫這篇文章的原因是之前有寫過帶有自訂 Config 檔案的 NuGet 套件，當時為了要做到異動 Config 檔案而自動更新設定一事，相依了幾個 `Microsoft.Extensions.Configuration` 相關套件，但後續為了減少套件相依，決定移除用 Config 檔案設定的部分，為避免後續會有套件附帶預設檔案的需求，先把作法記錄下來。

::: info
如果開發的套件有使用自定義的設定檔，應提供基本的範本，並在套件安裝時，在目標專案增加此範本。
:::

## 開發套件前的基本知識

### Class Library 介紹

Class Library 有分以下三種目標平台可以選擇：

* .NET Framework：只有「.NET Framework」的專案可以使用。
* .NET Core：只有「.NET Core」的專案可以使用。
* .NET Standard：跨平台支援，不過 2.1 後的版本不再支援「.NET Framework」。

有關「.NET Standard」的版本支援選擇請參考 [.NET Standard](https://learn.microsoft.com/zh-tw/dotnet/standard/net-standard?tabs=net-standard-1-0)

比較新版的 Visual Studio，「.NET Core」和「.NET Standard」合併成同一個選項，應該是「.NET Core」後來被改名成「.NET」的關係，後續選擇版本才提供選擇，如下圖所示。

![dotnet new project dialog](images/%E4%BD%BF%E7%94%A8%20Visual%20Studio%20%E7%99%BC%E4%BD%88%E5%B8%B6%E6%9C%89%E9%A0%90%E8%A8%AD%E6%AA%94%E6%A1%88%E7%9A%84%20NuGet%20%E5%A5%97%E4%BB%B6/dotnet-new-project-dialog.png)

![dotnet version selection](images/%E4%BD%BF%E7%94%A8%20Visual%20Studio%20%E7%99%BC%E4%BD%88%E5%B8%B6%E6%9C%89%E9%A0%90%E8%A8%AD%E6%AA%94%E6%A1%88%E7%9A%84%20NuGet%20%E5%A5%97%E4%BB%B6/dotnet-version-selection.png)

::: info
有關目標平台的選擇，如果是開發專案用的 Class Library，請選擇與專案一致的平台及版本，如果是要開發 NuGet 套件則建議選擇「.NET Standard」，如有需支援較舊版的「.NET Framework」，再調整專案檔改成支援多版本即可。
:::

### 編輯套件資訊

以下內容僅針對「.NET Standard」，畢竟現今不太會有特意開發套件給「.NET Framework」使用的情況，而專案裡的 Class Library 也不需要發佈成套件，再加上 Visual Studio 有針對「.NET Standard」開發簡化，例如可以在專案檔(csproj)編輯套件資訊，不需要額外準備「nuspec」檔案。

對著專案點右鍵，可以開啟專案檔的 XML，其實就是修改專案檔(csproj)內容。

![edit csproj menu](images/%E4%BD%BF%E7%94%A8%20Visual%20Studio%20%E7%99%BC%E4%BD%88%E5%B8%B6%E6%9C%89%E9%A0%90%E8%A8%AD%E6%AA%94%E6%A1%88%E7%9A%84%20NuGet%20%E5%A5%97%E4%BB%B6/edit-csproj-menu.png)

有關套件 XML 的資訊請參考[Pack Target Inputs](https://learn.microsoft.com/zh-tw/nuget/reference/msbuild-targets#pack-target-inputs)，這邊僅針對幾項必要設定作說明。

* TargetFramework：由於「.NET Standard 2.0 」只支援到「.NET Framework 4.6.1」，如果要讓更舊版本的專案也可以使用，要將`TargetFramework` 改為 `TargetFrameworks`，內容填入要支援的版本，版本間用「;」隔開。

```xml
<PropertyGroup>
  <TargetFrameworks>netstandard2.1;netstandard2.0;net45</TargetFrameworks>
</PropertyGroup>
```

* Version：
Assembly 一般會有以下幾種版本號，版本號由大於或等於 0 整數組合，最大值為 `UInt16.MaxValue - 1`。

  * AssemblyVersion：當將參考新增至專案中的任何元件時，會是內嵌的這個版本號碼，一般格式會是「{Major}.{Minor}.0.0」。
  * FileVersion：設定專案的 AssemblyFileVersion，實際 DLL 檔案的版本號，一般格式會是「{Major}.{Minor}.{Build}.{Revision}」。
  * Version：設定專案的 AssemblyInfoVersion，提供給套件辨識用的版本號，如果未設定 `PackageVersion`，NuGet 版本會使用此設定，格式「{Major}.{Minor}.{Patch}」，可在符合 [SemVer](https://semver.org/lang/zh-TW/) 的情況下，增加後綴詞。

    各變數含意(節錄自 MSDN)：

    * Major：主版號，具有相同名稱但不同主要版本的程式集不可互換。 較高的版本號可能表示對無法假定向後兼容性的產品進行了重大重寫。
    * Minor：次版號，如果兩個程式集的名稱和主要版本號相同，但次要版本號不同，則表示為了向後兼容而進行了顯著增強。 這個更高的次要版本號可能表示產品的點發佈或產品的完全向後兼容的新版本。
    * Build：組建編號，內部版本號的差異表示對同一原始碼的重新編譯。 當處理器、平台或編譯器發生變化時，可能會使用不同的內部版本號。
    * Revision：修訂號：具有相同名稱、主要和次要版本號但不同修訂版的程式集旨在完全互換。 在修復先前發佈的程式集中的安全漏洞的構建中可能會使用更高的修訂版號。
    * Patch：修訂號，當未修改介面的問題修正。

    有關版本號的部分可以參閱 [使用 AssemblyVersion 和 AssemblyFileVersion 屬性](https://learn.microsoft.com/zh-tw/troubleshoot/developer/visualstudio/general/assembly-version-assembly-file-version) 和 [Version 類別](https://learn.microsoft.com/zh-tw/dotnet/api/system.version?redirectedfrom=MSDN&view=net-6.0)。

::: info

* AssemblyVersion的 {Build} 和 {Revision} 為 0 的原因是這兩個版本號的變更與介面變更無關，較無兼容問題，所以都設 0 以減少元件間參考時的變更。
  * Build 的作法比較多種，有些公司是每天會發佈一個版本，此時 Build 的值會是從特定日子到發佈日的天數。如果小套件版本發佈沒很頻繁，有些就直接使用 Patch 的值，此時的 Revision 就會變成區隔預發佈的各版本以及正式版用的，當然這樣作就沒符合原來作法的定義。
:::

* PackageId：套件的名稱，如果未指定，會以 AssemblyName 或目錄名稱作為套件的名稱。
* Description：將套件上傳至 [NuGet.org](https://nuget.org) 時，Description 欄位限制為 4000 個字元。
* Authors：套件的作者，多個作者用「;」分隔。
* PackageLicenseExpression：套件內授權檔案的 SPDX 授權運算式或路徑，通常會顯示在像是 [NuGet.org](https://nuget.org) 的 UI 中。如果在一般授權下授權套件，例如 MIT 或 BSD-2-Clause，請使用相關聯的 [SPDX 授權識別碼](https://spdx.org/licenses/)，靘? `<PackageLicenseExpression>MIT</PackageLicenseExpression>`，如果使用其他授權，請在專案新增授權檔案，並使用 `PackageLicenseFile` 指定授權檔的位置。

::: warning
NuGet.org 只接受開放原始碼方案或免費軟體基礎核准的授權運算式。
:::

## 發佈帶有檔案的 NuGet 套件

安裝 NuGet 套件有提供以下兩種套件管理格式：

* package.config：「.NET Framework」建議選擇此方式。
* PackageReference：直接在專案檔(csproj)管理，「ASP.NET Core」都是使用此方式。

::: info
「PackageReference」對於「.NET Framework」的支援程度不完整，詳情參閱「[packages.config (PC) 到 PackageReference (PR) 遷移 #5877](https://github.com/NuGet/Home/issues/5877))」。
:::

### 檔案內容

#### install.ps1

為了讓使用「package.config」的專案可以正確加入套件檔案，需要此檔案。
範例的內容當初是參考 NLog，不過 NLog 目前也換作法了，只能從其他人的 Blog 看到當初 NLog 的 「install.ps1」，所以就不附來源。

```shell
param($installPath, $toolsPath, $package, $project)

# Set default File Name
$configItem = $project.ProjectItems.Item("Config.json")

# Set 'Copy To Output Directory'. Values are: 1. Never 2. Always 3. PreserveNewest
$copyToOutput = $configItem.Properties.Item("CopyToOutputDirectory")
$copyToOutput.Value = 2

# Set 'Build Action' to 'Content'.
$buildAction = $configItem.Properties.Item("BuildAction")
$buildAction.Value = 2
```

#### 專案檔(csproj)

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <!--套件及專案資訊-->
  <PropertyGroup>
    <TargetFrameworks>netstandard2.0;net45</TargetFrameworks>
    <AssemblyName>LibrarySample</AssemblyName>
    <Authors>Wing</Authors>
    <AssemblyVersion>0.0.0.0</AssemblyVersion>
    <FileVersion>0.0.0.0</FileVersion>
    <Version>0.0.1</Version>
    <Description>測試用</Description>
    <PackageLicenseExpression>MIT</PackageLicenseExpression>
  </PropertyGroup>
  <!--預設檔案和install.ps1，設定套件發佈資訊-->
  <ItemGroup>
    <Content Include=".\Config.json">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
      <PackageCopyToOutput>true</PackageCopyToOutput>
    </Content>
    <None Include=".\install.ps1">
      <Pack>True</Pack>
      <PackagePath>tools</PackagePath><!--一定要設定tools，大小寫隨意-->
    </None>
  </ItemGroup>
</Project>
```

### 發佈套件

1. 對著專案點右鍵後，選擇「套件」(如果發佈正式套件，建議將組態檔改成 Release)。

    ![pack nuget menu](images/%E4%BD%BF%E7%94%A8%20Visual%20Studio%20%E7%99%BC%E4%BD%88%E5%B8%B6%E6%9C%89%E9%A0%90%E8%A8%AD%E6%AA%94%E6%A1%88%E7%9A%84%20NuGet%20%E5%A5%97%E4%BB%B6/pack-nuget-menu.png)

2. 中繼資料夾「\obj\\{組態設定}」底下會有「nuspec」檔案，後面操作不會使用到此檔案，只是說明一下內容，這邊可以看到「Config.json」被輸出到多個目標資料夾，這是為了相容不同版本的 NuGet 和相容兩種套件管理格式造成，這邊節錄 MSDN [文件](https://learn.microsoft.com/zh-tw/nuget/reference/nuspec#including-assembly-files)。
    >使用 NuGet 2.x 及更舊版本，並規劃使用 packages.config；在安裝套件時，也會使用 `<files>` 專案包含不可變的內容檔。
    >使用 NuGet 3.3+ 和專案 PackageReference，則改用 `<contentFiles>` 元素。

    ```xml
    <?xml version="1.0" encoding="utf-8"?>
    <package xmlns="http://schemas.microsoft.com/packaging/2012/06/nuspec.xsd">
      <metadata>
        <id>LibrarySample</id>
        <version>0.0.1</version>
        <authors>Wing</authors>
        <license type="expression">MIT</license>
        <licenseUrl>https://licenses.nuget.org/MIT</licenseUrl>
        <description>測試用</description>
        <dependencies>
          <group targetFramework=".NETFramework4.5" />
          <group targetFramework=".NETStandard2.0" />
        </dependencies>
        <contentFiles>
          <files include="any/net45/./Config.json" buildAction="Content" copyToOutput="true" />
          <files include="any/netstandard2.0/./Config.json" buildAction="Content" copyToOutput="true" />
        </contentFiles>
      </metadata>
      <files>
        <file src="D:\Projects\PackageSample\src\LibrarySample\bin\Debug\net45\LibrarySample.dll" target="lib\net45\LibrarySample.dll" />
        <file src="D:\Projects\PackageSample\src\LibrarySample\bin\Debug\netstandard2.0\LibrarySample.dll" target="lib\netstandard2.0\LibrarySample.dll" />
        <file src="D:\Projects\PackageSample\src\LibrarySample\Config.json" target="content\.\Config.json" />
        <file src="D:\Projects\PackageSample\src\LibrarySample\Config.json" target="contentFiles\any\net45\.\Config.json" />
        <file src="D:\Projects\PackageSample\src\LibrarySample\Config.json" target="contentFiles\any\netstandard2.0\.\Config.json" />
        <file src="D:\Projects\PackageSample\src\LibrarySample\install.ps1" target="tools\install.ps1" />
      </files>
    </package>
    ```

3. 上傳至 NuGet Server。
「bin\\{組態設定}」底下會有一個「nupkg」的檔案，將之上傳到 NuGet Server上。
如果 Server 是 [NuGet.org](https://nuget.org)，可直接選擇檔案上傳。

    ![nuget org upload](images/%E4%BD%BF%E7%94%A8%20Visual%20Studio%20%E7%99%BC%E4%BD%88%E5%B8%B6%E6%9C%89%E9%A0%90%E8%A8%AD%E6%AA%94%E6%A1%88%E7%9A%84%20NuGet%20%E5%A5%97%E4%BB%B6/nuget-org-upload.png)

    如果 Server 是自己搭建的 NuGet Server，有些上面會有上傳指令，請先切換至正確路徑，再把「package.nupkg」替換成實際檔案名稱執行。

    ![nuget package push command](images/%E4%BD%BF%E7%94%A8%20Visual%20Studio%20%E7%99%BC%E4%BD%88%E5%B8%B6%E6%9C%89%E9%A0%90%E8%A8%AD%E6%AA%94%E6%A1%88%E7%9A%84%20NuGet%20%E5%A5%97%E4%BB%B6/nuget-package-push-command.png)

::: info
雖然我自己也很常寫一些只有我自己在用的垃圾套件，將之上傳到 NuGet 上，但建議這種測試用的套件還是上傳到自己建的環境比較好。
:::

### 安裝套件看結果

#### .NET Framework 搭配 package.config

安裝套件時，會自動執行「tools\install.ps1」。

![nuget install ps1 execution](images/%E4%BD%BF%E7%94%A8%20Visual%20Studio%20%E7%99%BC%E4%BD%88%E5%B8%B6%E6%9C%89%E9%A0%90%E8%A8%AD%E6%AA%94%E6%A1%88%E7%9A%84%20NuGet%20%E5%A5%97%E4%BB%B6/nuget-install-ps1-execution.png)

專案底下有 Config.json 檔案。

![config json in project](images/%E4%BD%BF%E7%94%A8%20Visual%20Studio%20%E7%99%BC%E4%BD%88%E5%B8%B6%E6%9C%89%E9%A0%90%E8%A8%AD%E6%AA%94%E6%A1%88%E7%9A%84%20NuGet%20%E5%A5%97%E4%BB%B6/config-json-in-project.png)

檔案屬性如「install.ps1」設置的一樣建置動作為「內容」和複製到輸出目錄為「有更新才複製」。

![file properties copy to output](images/%E4%BD%BF%E7%94%A8%20Visual%20Studio%20%E7%99%BC%E4%BD%88%E5%B8%B6%E6%9C%89%E9%A0%90%E8%A8%AD%E6%AA%94%E6%A1%88%E7%9A%84%20NuGet%20%E5%A5%97%E4%BB%B6/file-properties-copy-to-output.png)

「packages\{套件}」底下的資料夾會和前述提到的「nuspec」檔案內容一致，
「content」和「contentFiles」存放靜態檔案，「lib」存放「DLL」。

![nuget package explorer structure](images/%E4%BD%BF%E7%94%A8%20Visual%20Studio%20%E7%99%BC%E4%BD%88%E5%B8%B6%E6%9C%89%E9%A0%90%E8%A8%AD%E6%AA%94%E6%A1%88%E7%9A%84%20NuGet%20%E5%A5%97%E4%BB%B6/nuget-package-explorer-structure.png)

#### ASP.NET Core

與前面使用「package.config」的輸出比較，可以發現使用「PackageReference」並不會執行「tools\install.ps1」。

![package reference no install ps1](images/%E4%BD%BF%E7%94%A8%20Visual%20Studio%20%E7%99%BC%E4%BD%88%E5%B8%B6%E6%9C%89%E9%A0%90%E8%A8%AD%E6%AA%94%E6%A1%88%E7%9A%84%20NuGet%20%E5%A5%97%E4%BB%B6/package-reference-no-install-ps1.png)

專案底下有 Config.json 檔案。

![config json present](images/%E4%BD%BF%E7%94%A8%20Visual%20Studio%20%E7%99%BC%E4%BD%88%E5%B8%B6%E6%9C%89%E9%A0%90%E8%A8%AD%E6%AA%94%E6%A1%88%E7%9A%84%20NuGet%20%E5%A5%97%E4%BB%B6/config-json-present.png)

檔案屬性的複製到輸出目錄為「有更新才複製」(這邊不知道是吃哪邊設定，但「install.ps1」並無執行，所以應該無關)。

![file properties copy to output](images/%E4%BD%BF%E7%94%A8%20Visual%20Studio%20%E7%99%BC%E4%BD%88%E5%B8%B6%E6%9C%89%E9%A0%90%E8%A8%AD%E6%AA%94%E6%A1%88%E7%9A%84%20NuGet%20%E5%A5%97%E4%BB%B6/file-properties-copy-to-output.png)

#### .NET Framework 搭配 PackageReference

無執行「tools\install.ps1」。

![no install ps1 execution](images/%E4%BD%BF%E7%94%A8%20Visual%20Studio%20%E7%99%BC%E4%BD%88%E5%B8%B6%E6%9C%89%E9%A0%90%E8%A8%AD%E6%AA%94%E6%A1%88%E7%9A%84%20NuGet%20%E5%A5%97%E4%BB%B6/no-install-ps1-execution.png)

連檔案都沒複製到專案底下。

![no install ps1 execution](images/%E4%BD%BF%E7%94%A8%20Visual%20Studio%20%E7%99%BC%E4%BD%88%E5%B8%B6%E6%9C%89%E9%A0%90%E8%A8%AD%E6%AA%94%E6%A1%88%E7%9A%84%20NuGet%20%E5%A5%97%E4%BB%B6/no-install-ps1-execution.png)

::: warning
也許有方法可以讓「.NET Framework」搭配「PackageReference」可以正常使用，但 NuGet 上有多少套件可以搭配這樣使用是存疑的，我有測試過大家常用的「NLog.Config」套件，一樣也沒有複製「NLog.Config」檔案到專案底下。
:::

## 異動歷程

* 2022-11-08 初版文件建立。
