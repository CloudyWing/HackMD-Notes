# 在離線環境中，在 Visual Studio 中使用本機 NuGet 開發

## 前言
在某些情境下，開發環境可能限制了對外網路的連線。因此，在使用套件時，需要手動下載相應的 DLL 進行引用。但由於有些套件會針對多個版本的 Framework 進行發佈，手上的 DLL 可能並不適用於目前的 Framework。同時，有些套件可能相依於其他套件，這樣的情況需要將相關 DLL 都引用才可使用。

直接引用 DLL 的方式，在將專案轉交給其他使用 NuGet 的開發人員時，後續也維護無法透過 NuGet 有效管理套件。因此，在這樣的情境中，還是建議避免直接使用手動下載的 DLL 進行引用。

此外，如果接手的專案是透過 NuGet 來安裝套件，且在無網路環境下進行開發，也可能會面臨套件還原的相關問題。

## NuGet 離線套件設定
在 Visual Studio 的「套件來源」設定中，可以看到預設已經有離線套件的相關設定。  
![](https://i.imgur.com/4jegvU7.png)

在設定的資料夾底下，預設存在一些套件。  
![](https://i.imgur.com/B9BuVhd.png)

也可以點擊右上角的「+」按鈕自行擴充來源。  
![](https://i.imgur.com/7MBfU6m.png)

在使用 NuGet 安裝套件時，可以在中右上角選擇套件來源。  
![](https://i.imgur.com/BiyiRVW.png)

## 擴充本機套件
有關將 Class Library 發佈成套件的方式，請參考 [使用 Visual Studio 發佈帶有預設檔案的 NuGet 套件](/W1EoK2qRSMSXF6Ja410jrA)，這邊不多做說明。

要將本機套件發佈到本機資料夾有兩種方法：
1. 從 [NuGet Downloads](https://www.nuget.org/downloads) 下載「nuget.exe」
2. 安裝 NuGet 的「NuGet.CommandLine」後，使用「Package Manager Console」進行操作（本質上也是操作「nuget.exe」，它會隨著安裝「NuGet.CommandLine」時，一起下載下來）。

接著，使用 `nuget add {packagePath} -Source {sourcePath}` 指令將套件發佈到 {packagePath} 中。具體指令說明可參考 [add 命令 （NuGet CLI）](https://learn.microsoft.com/zh-tw/nuget/reference/cli-reference/cli-ref-add)。

## 擴充來自 NuGet 的套件
此方法需要一台可以連接 NuGet 的電腦，並且該電腦有權限將檔案傳送至開發環境。

當從 NuGet 安裝套件時，會將帶有 NuGet 資料的套件下載到本機。在 Windows 環境中，路徑為「%userprofile%.nuget\packages」。後續有專案要安裝相同套件時，會嘗試先從本機安裝。若本機不存在此套件或無法安裝指定版本，才會從設定的套件來源進行安裝。

因此，只需將要使用的套件放置到開發環境套件來源所設定的離線套件來源即可。換句話說，若要控制開發環境所能使用的套件或版本，可以由負責的人員先行安裝套件，然後將其放置在各個開發環境供開發人員使用。

:::warning
當使用 .NET Framework 安裝 NuGet 套件時，預設是使用「package.config」，此時在專案根目錄會有一個「packages」的資料夾，裡面也會有安裝過的套件，但這邊的套件不包含完整的 NuGet 資料，因此切勿從此處複製到設定的本機套件來源裡。
:::

###### tags: `Visual Studio` `NuGet` `NuGet Package`