# Excel 欄位寬度的隱藏陷阱

事情的起因是同事在使用 NPOI 匯出 Excel 時，無法產生與客戶提供的範本一致的欄寬度，因此他提出將範本檔案放到主機上，讓程式讀取範本檔案替換值，來產出與客戶範本較為一致的 Excel。但被我拒絕了。畢竟如果是處理複雜樣式的 Word 文件或包含圖表的 Excel就算了，但對於一個簡單的表格來說，不但沒必要，也還有一些潛在風險。例如，程式會過度依賴 Excel 範本檔案，或是有人下載時，檔案會被鎖定，進而影響其他同時下載的人員正常使用，而且這種方式也與現有的做法不一致。

後來我看到他寫了類似的程式碼。

```csharp
// 會影響欄寬度
IFont font = workbook.GetFontAt(0);
font.FontName = "新細明體";
font.FontHeightInPoints = 12;
```

我一開始也沒有仔細看，想說 Excel 字型和欄寬度又沒有直接關聯。就再度質疑他。然後他在我面前測試了一次，發現同樣欄寬值，NPOI 產生出來的欄寬度確實和客戶範本並不一致。後來查詢後發現，雖然我知道 Excel 是以某個字型的寬度除以 256 來計算欄寬，但我不知道的是那個字型是 Excel 所設定的預設字型。

也就是說，針對儲存格所設定的字型與欄寬度無關，但 Excel 的預設字型會造成影響。

## Excel 預設字型

以 Excel 2019 為例，在「檔案 => 選項 => 一般」的設定中可以看到以下內容：

![](https://github.com/CloudyWing/HackMD-Notes/blob/main/Images/Excel%20%E6%AC%84%E4%BD%8D%E5%AF%AC%E5%BA%A6%E7%9A%84%E9%9A%B1%E8%97%8F%E9%99%B7%E9%98%B1/excel-options-general.png?raw=true)

不同版本的 Office Excel 預設字型可能會有所不同。由於我手邊沒有舊版的 Office，無法進行測試。雖然我詢問了 ChatGPT，其回答是預設字型一致，但經常使用 ChatGPT 的人都知道它很常亂講。

:::info
NPOI 2.7.1 的版本預設字型為 `Calibri`，字型大小是 `11`。
:::

如果將字體大小改為 `20`。

![](https://github.com/CloudyWing/HackMD-Notes/blob/main/Images/Excel%20%E6%AC%84%E4%BD%8D%E5%AF%AC%E5%BA%A6%E7%9A%84%E9%9A%B1%E8%97%8F%E9%99%B7%E9%98%B1/excel-font-size-20.png?raw=true)

會出現以下警告，要求關閉 Excel 才能生效

![](https://github.com/CloudyWing/HackMD-Notes/blob/main/Images/Excel%20%E6%AC%84%E4%BD%8D%E5%AF%AC%E5%BA%A6%E7%9A%84%E9%9A%B1%E8%97%8F%E9%99%B7%E9%98%B1/excel-restart-warning.png?raw=true)

:::warning
變更預設字體大小後，必須關閉所有 Excel 文件，並建立新的 Excel 文件，才能套用新的設定。
:::

在相同欄寬值 `8.04` 的情況下，字型大小為 `20` 的欄寬明顯比字型大小為 `12` 的欄寬更寬。

![](https://github.com/CloudyWing/HackMD-Notes/blob/main/Images/Excel%20%E6%AC%84%E4%BD%8D%E5%AF%AC%E5%BA%A6%E7%9A%84%E9%9A%B1%E8%97%8F%E9%99%B7%E9%98%B1/column-width-comparison.png?raw=true)

但是，列高是另一種規則。如下圖所示，列高會隨字型大小的變化而直接增大至 `28.2`。

![](https://github.com/CloudyWing/HackMD-Notes/blob/main/Images/Excel%20%E6%AC%84%E4%BD%8D%E5%AF%AC%E5%BA%A6%E7%9A%84%E9%9A%B1%E8%97%8F%E9%99%B7%E9%98%B1/row-height-auto-adjust.png?raw=true)

如果將列高調整為相同的 `16.2`，則顯示效果會一致。

![](https://github.com/CloudyWing/HackMD-Notes/blob/main/Images/Excel%20%E6%AC%84%E4%BD%8D%E5%AF%AC%E5%BA%A6%E7%9A%84%E9%9A%B1%E8%97%8F%E9%99%B7%E9%98%B1/row-height-manual-adjust.png?raw=true)

## 使用 NPOI 設定預設字型

程式碼範例如下：

```csharp
using IWorkbook workbook = new XSSFWorkbook();
IFont defaultFont = workbook.GetFontAt(0);
Console.WriteLine($"預設字型名稱: {defaultFont.FontName}");
Console.WriteLine($"預設字型大小: {defaultFont.FontHeightInPoints}");
defaultFont.FontName = "微軟正黑體";
defaultFont.FontHeightInPoints = 20;

Console.WriteLine($"預設字型名稱: {defaultFont.FontName}");
Console.WriteLine($"預設字型大小: {defaultFont.FontHeightInPoints}");

workbook.CreateSheet()
    .CreateRow(0)
    .CreateCell(0)
    .SetCellValue("Test");

using FileStream fileStream = new("Test.xlsx", FileMode.Create, FileAccess.Write);
workbook.Write(fileStream);
```

Console 顯示。

```shell
預設字型名稱: Calibri
預設字型大小: 11
預設字型名稱: 微軟正黑體
預設字型大小: 20
```

產生出來的 Excel 欄寬值為 `7.84`，但欄寬比原本欄寬值為 `8.04` 還寬，字型大小也變為 `20`，但字型沒套用到。

![](https://github.com/CloudyWing/HackMD-Notes/blob/main/Images/Excel%20%E6%AC%84%E4%BD%8D%E5%AF%AC%E5%BA%A6%E7%9A%84%E9%9A%B1%E8%97%8F%E9%99%B7%E9%98%B1/npoi-generated-width-issue.png?raw=true)

## 使用 EPPlus 設定預設字型

程式碼範例如下：

```csharp
ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
using ExcelPackage package = new();
ExcelFontXml defaultFont = package.Workbook.Styles.Fonts[0];
Console.WriteLine($"預設字型名稱: {defaultFont.Name}");
Console.WriteLine($"預設字型大小: {defaultFont.Size}");
defaultFont.Name = "微軟正黑體";
defaultFont.Size = 20;
Console.WriteLine($"預設字型名稱: {defaultFont.Name}");
Console.WriteLine($"預設字型大小: {defaultFont.Size}");
ExcelWorksheet sheet = package.Workbook.Worksheets
    .Add("Sheet1");
sheet.Cells[1,1,1,1].Value = "Test";

using FileStream fileStream = new("Test.xlsx", FileMode.Create, FileAccess.Write);
package.SaveAs(fileStream);
```

Console 顯示。

```shell
預設字型名稱: Calibri
預設字型大小: 11
預設字型名稱: 微軟正黑體
預設字型大小: 20
```

產生出來的欄寬值為 `8.23`，但欄寬比原本欄寬值為 `8.04` 的兩倍還寬，字型大小也變為 `20`，且字型有套用到。

![](https://github.com/CloudyWing/HackMD-Notes/blob/main/Images/Excel%20%E6%AC%84%E4%BD%8D%E5%AF%AC%E5%BA%A6%E7%9A%84%E9%9A%B1%E8%97%8F%E9%99%B7%E9%98%B1/epplus-generated-width-correct.png?raw=true)

## 異動歷程

* 2025-08-31 初版文件建立。

---

###### tags: `.NET` `Excel` `EPPlus` `NPOI`