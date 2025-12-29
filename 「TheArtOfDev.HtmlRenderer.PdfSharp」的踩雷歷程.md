# 「TheArtOfDev.HtmlRenderer.PdfSharp」的踩雷歷程

[![hackmd-github-sync-badge](https://hackmd.io/xkMzOQXuQgyZc2it13rZ-Q/badge)](https://hackmd.io/xkMzOQXuQgyZc2it13rZ-Q)


## 前言
最近遇到一項需求，由於「iTextSharp」的免費版本存在授權問題，所以開始尋找其他免費的 PDF 套件。最終，選擇了「PDFsharp」。然而，由於「PDFsharp」並不提供將 HTML 字符串轉換為 PDF 的功能，所以又找了「TheArtOfDev.HtmlRenderer.PdfSharp」來搭配使用來搭配。儘管該套件的最後更新日期為「2015/5/6」，但後續有在維護的版本「HtmlRenderer.PdfSharp.NetStandard2」是使用 .NET Standard 2.1 開發，不適用於目前的 .NET Framework 專案。本文不會深入介紹這兩個套件的使用方法，因為我僅使用 HTML 轉 PDF 的功能，而是專注列舉可能遇到的問題。

## 套件介紹
* PDFsharp：PDF 套件，這個名稱的大小寫我沒打錯，就是長這樣。
* HtmlRenderer.Core：此套件用於解析 HTML 元素，並使用自定義類別來存儲相關資訊。
* HtmlRenderer.PdfSharp：將 「HtmlRenderer.Core」所定義的物件轉成成「PDFsharp」所需資訊來產出 PDF。

## 踩雷歷程

### 嘗試執行
首先，按照README.md提供的範例進行執行，程式碼如下：
```csharp
PdfDocument pdf = PdfGenerator.GeneratePdf("<p><h1>Hello World</h1>This is html rendered text</p>", PageSize.A4);
pdf.Save("document.pdf");
```

第一步就出現問題...，發生了以下 Exception：  
![](https://github.com/CloudyWing/HackMD-Notes/blob/main/Images/%E3%80%8CTheArtOfDev.HtmlRenderer.PdfSharp%E3%80%8D%E7%9A%84%E8%B8%A9%E9%9B%B7%E6%AD%B7%E7%A8%8B/exception-error-message.png?raw=true)

感覺是版本問題，嘗試降低嘗試降低「TheArtOfDev.HtmlRenderer.PdfSharp」版本，但問題依然存在。由於原始碼中找不到問題，只好下載下來，以 Debug 的方式尋找原因。但在重新設定引用後，卻發現無法正常編譯。查看專案檔(csproj)後發現，相較於一般套件，多了以下設定：
```xml

  <Import Project="$(SolutionDir)\.nuget\NuGet.targets" Condition="Exists('$(SolutionDir)\.nuget\NuGet.targets')" />
  <Target Name="EnsureNuGetPackageBuildImports" BeforeTargets="PrepareForBuild">
    <PropertyGroup>
      <ErrorText>This project references NuGet package(s) that are missing on this computer. Enable NuGet Package Restore to download them.  For more information, see http://go.microsoft.com/fwlink/?LinkID=322105. The missing file is {0}.</ErrorText>
    </PropertyGroup>
    <Error Condition="!Exists('$(SolutionDir)\.nuget\NuGet.targets')" Text="$([System.String]::Format('$(ErrorText)', '$(SolutionDir)\.nuget\NuGet.targets'))" />
  </Target>
```

移除上述有關 NuGet 還原的設定後重新建置，PDF 可以就正常建立了。這代表應該不是程式碼有問題，看來可能真的是版本設定的問題，看來可能真的是版本設定的問題。後來有人提醒我，可以嘗試降低「PDFsharp」的版本。經過將其降版為「1.32.3057」後，終於成功賣出第一步 =.=a。

### 中文字型
當嘗試輸出中文時，可能遇到無法正常顯示的問題，如下所示：
```csharp
PdfDocument pdf = PdfGenerator.GeneratePdf("<p>中文</p>", PageSize.A4);
pdf.Save("document.pdf");
```

![](https://github.com/CloudyWing/HackMD-Notes/blob/main/Images/%E3%80%8CTheArtOfDev.HtmlRenderer.PdfSharp%E3%80%8D%E7%9A%84%E8%B8%A9%E9%9B%B7%E6%AD%B7%E7%A8%8B/pdf-generation-issue-1.png?raw=true)

解決方法是在 HTML 中加入 CSS `font-family`，將其設為`標楷體`，即可正常顯示：
```csharp
string html = @"
    <style>
        * {
            font-family: 標楷體;
        }
    </style>
    <p>中文</p>
";
PdfDocument pdf = PdfGenerator.GeneratePdf(html, PageSize.A4);
pdf.Save("document.pdf");
```

![](https://github.com/CloudyWing/HackMD-Notes/blob/main/Images/%E3%80%8CTheArtOfDev.HtmlRenderer.PdfSharp%E3%80%8D%E7%9A%84%E8%B8%A9%E9%9B%B7%E6%AD%B7%E7%A8%8B/pdf-generation-issue-2.png?raw=true)

:::info
* 目前預設字型中，僅有「標楷體」和「Malgun Gothic」能夠正確顯示中文。
* 在 Windows 英文環境中，請將「標楷體」更改為「DFKai-SB」。反之，在中文環境中請勿使用「DFKai-SB」。
:::

### 表格被截斷
在以下情境中，可能會導致 `<table>` 底部框線被截除：
1. 使用巢狀 `<table>`。
2. 內部 `<table>` 的 `<td>` 元素具有指定的 `height` 屬性，且其值超過一定數字，同時 `<td>` 元素內部的元素高度未超過 `<td>`。
3. 內部 `<table>` 設有框線。至於未設定框線的情況下難以確定是否存在問題，因為無法透過框線識別截斷情況，但目前尚未觀察到 `<td>` 內文被截斷的情況。

以下為示範案例：
```csharp
string rowsHtml = "";
for (int i = 0; i < 5; i++)
{
    rowsHtml += $"<tr><td>Text{i}0</td><td>Text{i}1</td><td>Text{i}2</td></tr>";
}

string html = $@"
    <style>
        table.list, table.list td {{
            border-collapse: collapse;
            border: 1xp solid black;
        }}
        td {{
            height: 30px;
        }}
    </style>
    <html>
    <body>
        <table>
            <tr>
                <td>
                    <table class=""list"">
                        {rowsHtml}
                    </table>
                </td>
            </td>
        </table>
    </body>
    </html>
";

PdfDocument pdf = PdfGenerator.GeneratePdf(html, PageSize.A4);
pdf.Save("document.pdf");
```

![](https://github.com/CloudyWing/HackMD-Notes/blob/main/Images/%E3%80%8CTheArtOfDev.HtmlRenderer.PdfSharp%E3%80%8D%E7%9A%84%E8%B8%A9%E9%9B%B7%E6%AD%B7%E7%A8%8B/pdf-generation-issue-3.png?raw=true)

我猜測問題可能在於計算元素高度時，外部 `<td>` 的高度計算錯誤，導致內部 `<table>` 超出外部 `<td>` 的範圍，目前尚未找到適當的解決方案，只能在最後增加一個額外的 `<tr>`，並將底下 `<td>` 的 `height` 屬性先設為 `0px`。此時仍然有框線被截斷的問題，則逐步以 `0.5px` 為單位增加 `height` 屬性的值，找到一個既能正常顯示又不會多顯示其他框線高度的值。但此時有一定機率變成內部 `<table>`上方框線被截掉，如果上方框線被截掉，同樣在前面增加一個額外的 `<tr>`，並以相同方式處理。以下是一個範例：

```csharp
string rowsHtml = "";
for (int i = 0; i < 5; i++)
{
    rowsHtml += $"<tr><td>Text{i}0</td><td>Text{i}1</td><td>Text{i}2</td></tr>";
}

string html = $@"
    <style>
        table.list, table.list td {{
            border-collapse: collapse;
            border: 1xp solid black;
        }}
        td {{
            height: 30px;
        }}
    </style>
    <html>
    <body>
        <table>
            <tr>
                <td>
                    <table class=""list"">
                        {rowsHtml}
                        <!--額外增加的 tr-->
                        <tr>
                            <td colspan=""3"" style=""height: 9px;""></td>
                        <tr>
                    </table>
                </td>
            </td>
        </table>
    </body>
    </html>
";

PdfDocument pdf = PdfGenerator.GeneratePdf(html, PageSize.A4);
pdf.Save("document.pdf");
```

![](https://github.com/CloudyWing/HackMD-Notes/blob/main/Images/%E3%80%8CTheArtOfDev.HtmlRenderer.PdfSharp%E3%80%8D%E7%9A%84%E8%B8%A9%E9%9B%B7%E6%AD%B7%E7%A8%8B/pdf-generation-issue-4.png?raw=true)

## 使用感想
單就將 HTML 轉成 PDF 這項功能而言，「TheArtOfDev.HtmlRenderer.PdfSharp」的樣式會比「iTextSharp」更為完整，在更換套件的過程中，我多次發現樣式表現不如預期，原因是由於一些 CSS 樣式在「iTextSharp」沒能發揮效果，而在「TheArtOfDev.HtmlRenderer.PdfSharp」生效了，進而影響到我當前處理的部分。

需要注意的是在某些不符合 HTML 結構的情況下，判斷呈現結果哪一個較接近瀏覽器的效果相對複雜。例如，在 `<td>` 元素內部放置 `<hr />`  這樣的情況，在目前版本的 Chrome 中，它可以接受這種結構，而「iTextSharp」呈現結果為 `<td>` 內出現一條水平線。而在使用「TheArtOfDev.HtmlRenderer.PdfSharp」時，水平線的顯示位置可能會跑掉。

至於「HtmlRenderer.PdfSharp.NetStandard2」，由於未使用過，這邊就不發表意見。

###### tags: `.NET` `Portable Document Format`
