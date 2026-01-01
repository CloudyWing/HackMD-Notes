---
title: "如何在發佈 ASP.NET Core 網站時自動套用 Shadow Copying 設定"
date: 2025-03-18
lastmod: 2026-01-01
description: "解決 ASP.NET Core 部署時 DLL 鎖死無法更新的問題。推薦在專案根目錄預置 `web.config` 並設定 Shadow Copying，優於手動修改伺服器設定的傳統做法。"
tags: [".NET","ASP.NET","ASP.NET Core"]
---

# 如何在發佈 ASP.NET Core 網站時自動套用 Shadow Copying 設定

我去年從同事那裡聽到 Shadow Copying 這個名詞。Shadow Copying (陰影複製) 是一種機制，它會將應用程式的檔案複製到另一個暫存位置執行，而非直接從原始部署位置執行。這解決了 ASP.NET Core 在執行時的一個常見問題：當 Web 應用程式正在運行時，相關 DLL 會被鎖定，導致無法直接更新檔案，必須先停止應用程式集區才能進行更新。

一開始，我查閱了保哥的「[如何啟用 ASP.NET Core 6.0 部署到 IIS 的陰影複製 (Shadow-copying) 功能](https://blog.miniasp.com/post/2021/11/13/ASPNET-Core-6-Shadow-copying-in-IIS)」文章，發現需要手動修改 web.config。然而，我一直秉持「發佈時就應該產出完整設定」的原則，不希望每次都要手動調整設定檔，因此一開始沒有採用這個機制。

後來我採取的方式是第一次發佈時手動修改 web.config 加入 Shadow Copying 功能，後續版本更新時則不再變動此設定檔。但這個做法仍然不夠理想，因為若在交接或佈版過程中出現疏失，不小心覆蓋了原有的 web.config，Shadow Copying 機制就會失效。這種作法特別不適合導入 CI/CD 流程，因為在自動化腳本中處理 web.config 的修改較為困難，容易出錯。

最近我發現了一個更好的解決方案：如果在 Web 專案根目錄預先放置一個 web.config 檔案，發佈後的 web.config 就會以此為基礎產生。這讓自動化部署變得更加簡單。

以下是正常發佈後的 web.config：

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <location path="." inheritInChildApplications="false">
    <system.webServer>
      <handlers>
        <add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModuleV2" resourceType="Unspecified" />
      </handlers>
      <aspNetCore processPath="dotnet" arguments=".\WebApi.dll" stdoutLogEnabled="false" stdoutLogFile=".\logs\stdout" hostingModel="inprocess" />
    </system.webServer>
  </location>
</configuration>
```

如果在專案的發佈設定檔 (.pubxml) 中加上以下程式碼，可以設定應用程式的執行環境：(具體用途請參考我之前寫的「[淺談 ASP.NET Core 中的環境名稱設定與應用](%E6%B7%BA%E8%AB%87%20ASP.NET%20Core%20%E4%B8%AD%E7%9A%84%E7%92%B0%E5%A2%83%E5%90%8D%E7%A8%B1%E8%A8%AD%E5%AE%9A%E8%88%87%E6%87%89%E7%94%A8.md)」文章)：

```xml
<EnvironmentName>Staging</EnvironmentName>
```

產生的 web.config 會自動加入環境變數設定：

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <location path="." inheritInChildApplications="false">
    <system.webServer>
      <handlers>
        <add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModuleV2" resourceType="Unspecified" />
      </handlers>
      <aspNetCore processPath="dotnet" arguments=".\WebApi.dll" stdoutLogEnabled="false" stdoutLogFile=".\logs\stdout" hostingModel="inprocess">
        <!--增加環境變數的環境名稱設定-->
        <environmentVariables>
          <environmentVariable name="ASPNETCORE_ENVIRONMENT" value="Staging" />
        </environmentVariables>
      </aspNetCore>
    </system.webServer>
  </location>
</configuration>
```

現在，若我在 ASP.NET Core Web 專案根目錄預先建立一個包含 Shadow Copying 設定的 web.config 檔案：

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <location path="." inheritInChildApplications="false">
    <system.webServer>
      <handlers>
        <add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModuleV2" resourceType="Unspecified" />
      </handlers>
      <aspNetCore processPath="dotnet" arguments=".\WebApi.dll" stdoutLogEnabled="false" stdoutLogFile=".\logs\stdout" hostingModel="inprocess">
        <!--增加 Shadow Copying 相關設定-->
        <handlerSettings>
          <handlerSetting name="enableShadowCopy" value="true" />
          <!--指定 Shadow Copying  檔案的存放路徑-->
          <handlerSetting name="shadowCopyDirectory" value="../ShadowCopy/" />
        </handlerSettings>
      </aspNetCore>
    </system.webServer>
  </location>
</configuration>
```

最終產生出來的 web.config 將會合併兩者的設定，同時包含 Shadow Copying 功能和環境變數：

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <location path="." inheritInChildApplications="false">
    <system.webServer>
      <handlers>
        <add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModuleV2" resourceType="Unspecified" />
      </handlers>
      <aspNetCore processPath="dotnet" arguments=".\WebApi.dll" stdoutLogEnabled="false" stdoutLogFile=".\logs\stdout" hostingModel="inprocess">
        <handlerSettings>
          <handlerSetting name="enableShadowCopy" value="true" />
          <handlerSetting name="shadowCopyDirectory" value="../ShadowCopy/" />
        </handlerSettings>
        <environmentVariables>
          <environmentVariable name="ASPNETCORE_ENVIRONMENT" value="Staging" />
        </environmentVariables>
      </aspNetCore>
    </system.webServer>
  </location>
</configuration>
```

這樣一來，在 CI/CD 流程中只需使用以下指令即可發佈帶有完整設定的應用程式：

```bash
dotnet publish -c Release -p:EnvironmentName=Staging
```

需注意，web.config 中的 Shadow Copying 設定會因 ASP.NET Core 版本而異。在 .NET 6 時期，這項功能還處於實驗階段，所以設定的參數名稱與後續版本不同。這個設定與 Web 專案本身的 .NET 版本無關，主要取決於伺服器上安裝的 Hosting Bundle 版本。以下是不同版本的使用方式：

* 使用 ASP.NET Core Hosting Bundle 7.0.0 以上版本：使用 `enableShadowCopy` 參數。
* 使用 ASP.NET Core Hosting Bundle 6.0.0 版本：使用 `experimentalEnableShadowCopy` 參數。

::: warning

* 升級 .NET 版本後，必須刪除 Shadow Copying 資料夾，否則 IIS 會出現 500.30 錯誤。此時事件檢視器會顯示以下錯誤訊息：

    ```text
    Application '/LM/W3SVC/1/ROOT/{應用程式集區}' with physical root '{網站路徑}' failed to load coreclr. Exception message:
    Unexpected exception: directory_iterator::directory_iterator: The system cannot find the path specified.
    ```

* 使用 Shadow Copying 時請注意，應避免在應用程式目錄中寫入檔案或 Log，否則每次檔案異動都可能觸發 Shadow Copying 機制，導致應用程式不必要的重啟。
:::

## 異動歷程

* 2025-03-18 初版文件建立。
* 2025-04-08 補充升級 .NET 版本造成 Shadow Copying 異常。
* 2026-01-01 補充使用 Shadow Copying 時需避免在應用程式目錄寫入檔案的注意事項。
