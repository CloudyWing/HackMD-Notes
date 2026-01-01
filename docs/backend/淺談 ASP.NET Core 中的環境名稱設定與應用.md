---
title: "淺談 ASP.NET Core 中的環境名稱設定與應用"
date: 2024-07-12
lastmod: 2024-07-12
description: "解析 ASP.NET Core 中 `EnvironmentName` (Development, Staging, Production) 的運作機制。比較 Web.config Transform 與 appsettings.json 覆蓋邏輯的差異，並說明 `IHostEnvironment` 的應用。"
tags: [".NET","ASP.NET","ASP.NET Core"]
---

# 淺談 ASP.NET Core 中的環境名稱設定與應用

起因是同事對於 ASP.NET Core 的發佈不太熟悉，而我也有一些細節搞錯，所以想寫一篇文章來整理相關內容。

## 組態設定

在過往的 .NET Framework 中，主要用組態設定來切換不同的設定檔。詳細內容可以參考「[在 .NET Framework 裡，有關 Web.config (App.config) 的應用](https://cloudywing.github.io/WingTechMurmur/%E5%9C%A8%20.NET%20%E5%B0%88%E6%A1%88%E5%BC%95%E7%94%A8%E5%8B%95%E6%85%8B%E9%80%A3%E7%B5%90%E7%A8%8B%E5%BC%8F%E5%BA%AB(DLL)%E7%9A%84%E6%AD%A3%E7%A2%BA%E6%96%B9%E5%BC%8F/)」。使用 Web.config 為主檔，透過 `Web.{組態}.config` 來覆蓋 Web.config 的內容。在每個組態中，可以定義相應的常數，並使用條件式編譯進行切換。

## 環境名稱

在 .NET Core 和 .NET 5 及之後的版本中，除了組態設定外，還增加了環境變數 `EnvironmentName` 來區分不同的環境。`EnvironmentName` 可以是任何值，但 ASP.NET Core 預設提供以下值：

* Development：本機開發使用。
* Staging：預發佈版本
* Production：如果未設定 `DOTNET_ENVIRONMENT` 和 `ASPNETCORE_ENVIRONMENT`，則為預設值，一般做為正式機版本使用。

這三個環境名稱可以對應到 GitLab Flow 的 master、pre-production 和 production 分支。如果 GitLab Flow 定義了其他環境分支，也可以設定相應的環境名稱。

在 ASP.NET Core 中，主要使用 appsettings.json 作為設定檔，並使用 appsettings.{環境}.json 來覆蓋主要設定檔的內容。與過往 Web.config 的不同之處在於，Web.config 使用 Web.{組態}.config 進行 Transform 的替換機制，建置後產生新的 Web.config；而 appsettings.json 則是依照載入順序，後載入的設定會覆蓋之前的設定。

當 ASP.NET Core 執行 `WebApplication.CreateBuilder(args)` 時，內部會呼叫擴充方法 `HostingHostBuilderExtensions.ConfigureDefaults()`，並載入 appsettings.json 和 appsettings.{環境}.json。以下節錄部分程式碼：

```csharp
builder.ConfigureAppConfiguration((hostingContext, config) => {
    IHostEnvironment env = hostingContext.HostingEnvironment;
    bool reloadOnChange = GetReloadConfigOnChangeValue(hostingContext);

    config.AddJsonFile("appsettings.json", optional: true, reloadOnChange: reloadOnChange)
            .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true, reloadOnChange: reloadOnChange);

    if (env.IsDevelopment() && env.ApplicationName is { Length: > 0 }) {
        var appAssembly = Assembly.Load(new AssemblyName(env.ApplicationName));
        if (appAssembly is not null) {
            config.AddUserSecrets(appAssembly, optional: true, reloadOnChange: reloadOnChange);
        }
    }

    config.AddEnvironmentVariables();

    if (args is { Length: > 0 }) {
        config.AddCommandLine(args);
    }
})
```

::: warning
由於 ASP.NET Core 內部已經會載入 appsettings.json 和 appsettings.{環境}.json，如果再手動載入 appsettings.json 可能會覆蓋 appsettings.{環境}.json 的設定。我之前就曾因不明原因沒讀取到 appsettings.{環境}.json，又被 Web.config 的思維誤導，在 `Program` 裡加入這兩行做測試，然後嘗試註解引用 appsettings.{環境}.json，一直疑惑為何沒吃到設定，後續看同事把兩行都註解掉測試，才發現哪邊有問題。
:::

## 設定環境變數的方法

### 本機開發

ASP.NET Core 可以在「Properties\launchSettings.json」檔案中設定本機開發環境。此設定的環境值會顯示在 Visual Studio 的模擬器列表上，並會覆蓋全域環境設定。以下為預設範例，更多具體設定請參考 MSDN 的「[開發和 launchSettings.json](https://learn.microsoft.com/zh-tw/aspnet/core/fundamentals/environments?view=aspnetcore-8.0#development-and-launchsettingsjson)」。

```json
{
  "iisSettings": {
    "windowsAuthentication": false,
    "anonymousAuthentication": true,
    "iisExpress": {
      "applicationUrl": "http://localhost:59481",
      "sslPort": 44308
    }
  },
  "profiles": {
    "Sample": {
      "commandName": "Project",
      "dotnetRunMessages": true,
      "launchBrowser": true,
      "applicationUrl": "https://localhost:7152;http://localhost:5105",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    },
    "IIS Express": {
      "commandName": "IISExpress",
      "launchBrowser": true,
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    }
  }
}
```

### 使用 Visual Studio 發佈

發佈方式請參考之前文章的 [Web 專案發佈](https://cloudywing.github.io/WingTechMurmur/%E5%9C%A8%20.NET%20Framework%20%E8%A3%A1%EF%BC%8C%E6%9C%89%E9%97%9C%20Web.config%20(App.config)%20%E7%9A%84%E6%87%89%E7%94%A8/#web-%E5%B0%88%E6%A1%88%E7%99%BC%E4%BD%88)，雖然當時是寫 ASP.NET 版本，但 ASP.NET Core 操作方式相同，唯一的不同是需要在 XML 裡加上以下內容來設定環境名稱：

```xml
<EnvironmentName>Staging</EnvironmentName>
```

發佈後，會在 Web.config 增加以下內容，IIS 會以此內容作為環境變數的值：

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <location path="." inheritInChildApplications="false">
    <system.webServer>
      <handlers>
        <add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModuleV2" resourceType="Unspecified" />
      </handlers>
      <aspNetCore processPath="dotnet" arguments=".\KunYou.KyFido.Backend.WebApi.dll" stdoutLogEnabled="false" stdoutLogFile=".\logs\stdout" hostingModel="inprocess">
        <!--額外產生內容設定-->
        <environmentVariables>
          <environmentVariable name="ASPNETCORE_ENVIRONMENT" value="Development" />
        </environmentVariables>
      </aspNetCore>
    </system.webServer>
  </location>
</configuration>
```

::: info
過往在 ASP.NET 設定 Publish.xml，可以設定 `<ExcludeFilesFromDeployment>` 或 `<ExcludeFoldersFromDeployment>` 來排除特定檔案或資料夾，但是在 ASP.NET Core 中此設定無效，所以無法用此排除多餘的 appsettings.{環境}.json 檔案。
:::

### 使用 Dockerfile 設定

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:6.0 AS base
# 增加此行設定環境變數
ENV ASPNETCORE_ENVIRONMENT=Staging
```

## 操作環境設定

ASP.NET Core 使用 `IWebHostEnvironment` 物件定義環境相關操作。此介面實作的 `IHostEnvironment` 定義了屬性 `EnvironmentName`。此外，在 `HostEnvironmentEnvExtensions` 中定義了擴充方法 `IsDevelopment()`、`IsStaging()` 和 `IsProduction()`，以便在執行階段判斷目前的環境名稱。如果是自定義的環境名稱，可以使用 `IsEnvironment({environmentName})` 來判斷。

## 異動歷程

* 2024-07-12 初版文件建立。
