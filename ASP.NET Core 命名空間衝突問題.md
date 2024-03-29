# ASP.NET Core 命名空間衝突問題

[![hackmd-github-sync-badge](https://hackmd.io/eNFyilwkRxeJfYM8bqpJWA/badge)](https://hackmd.io/eNFyilwkRxeJfYM8bqpJWA)

## 發生情境
最近在翻寫別人的專案時，就專案的名稱是「SYS」結尾，我就自作聰明改成「.System」，此時悲劇就發生了，專案無法進行編譯，以下是模擬情境。

專案 Namespace 是「TestNameSpace.Web」，編譯時 Razor 檔案的部分出現大量錯誤。
![](https://i.imgur.com/7HdXqgc.png)

本來以為是 DLL 引用問題，但後來仔細看錯誤訊息後發現不對勁，訊息**不**是「命名空間'**System**'中沒有類型或命名空間'Threading'」，而是「命名空間'**TestNameSpace.System**'中沒有類型或命名空間'Threading'」，「TestNameSpace.System.Threading」???，看來是命名空間衝突造成的。

## Global Using Directives
.NET 6 所支援的 C# 10 有提供一個新功能是「[Global Using Directives](https://learn.microsoft.com/zh-tw/dotnet/csharp/whats-new/csharp-10#global-using-directives)」，可以設定全域的 Using，又有提供隱含的全域 Using 可以設定，下圖那些反灰的都是預設無法調整，但可以額外擴充。
![](https://i.imgur.com/TgKXsKo.png)

在專案檔裡對應的 XML 結構如下圖，上面是設定是否要啟用隱含全域 Using，底下是額外增加的全域 Using。  
![](https://i.imgur.com/7lmrIQJ.png)

專案建置後，可以在 「obj/{組態}/{.NET 版本}」 資料夾底下看到有一個檔案是「{專案名稱}.GlobalUsings.g.cs」。  
![](https://i.imgur.com/7bSacBU.png)

在沒有設定其他隱含的全域 Using 時，檔案內容如下。  
```csharp
// <auto-generated/>
global using global::System;
global using global::System.Collections.Generic;
global using global::System.IO;
global using global::System.Linq;
global using global::System.Net.Http;
global using global::System.Threading;
global using global::System.Threading.Tasks;
```

## 問題解決了嗎？
將隱含全域 Using 關掉後，會發現仍然無法編譯成功，後續將 Framework 版本改為不支援「Global Using Directives」的 .NET 5 後發現仍然無法編譯完成，代表 Razor 檔案的全域 Using 設定來自別的地方，最後開啟「obj\Debug\net5.0\Razor\Pages\Index.cshtml.g.cs」，內容如下圖，可以發現除了「\_ViewStart.cshtml」設定的 Using 外，預設還有 Using 其他 Namespace，而且和 Global Using 裡的內容不同，目前推測有可能是寫死的。  
![](https://i.imgur.com/I9EP4bk.png)

從上圖可以得知，每個 Razor 檔案的 Root Namespace 是在「\_ViewStart.cshtml」中定義的。預設情況下，會使用專案名稱作為 Root Namespace。因此，可以參考以下程式碼，將定義的 Namespace 改為所需的 Namespace。不過，請注意「\_ViewStart.cshtml」設定的 Namespace 必須與「{Page}.cshtml.cs」中的 Namespace 相同。如果您將與 Razor 相關的所有檔案的 Namespace 都更改，但與專案其他檔案的 Namespace 不同，這也很奇怪。即使通常情況下「專案名稱」、「組件」和「Root Namespace」不需要保持一致，但在這個案例中，最好還是一開始就避免使用關鍵字。

```csharp
@using TestNamespace.Sys.Web
@*這邊把 System 改為 Sys，這樣 Razor 檔案都會套用到此 Namespace*@
@namespace TestNamespace.Sys.Web.Pages
@addTagHelper *, Microsoft.AspNetCore.Mvc.TagHelpers
```

:::info
上述路徑是 .NET 5 才有找到，目前我沒找到 .NET 6 是將編譯過程中產生的「\Razor\Pages\{Page Name}.cshtml.g.cs」的檔案放在哪邊。
:::

## 結論
如果 ASP.NET Core 建立有使用 Razor 檔案的專案時，建議專案名稱不要包含「System」或是「Microsoft」。

###### tags: `.NET` `.NET Core & .NET 5+` `ASP.NET Core`
