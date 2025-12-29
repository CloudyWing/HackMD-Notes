# 在 Visual Studio 中設定 GitLab 作為 NuGet Packages 來源

之前曾經寫過如何自行開發套件並發佈到 NuGet Server 上，詳情可參考[使用 Visual Studio 發佈帶有預設檔案的 NuGet 套件](https://github.com/CloudyWing/HackMD-Notes/blob/main/%E4%BD%BF%E7%94%A8%20Visual%20Studio%20%E7%99%BC%E4%BD%88%E5%B8%B6%E6%9C%89%E9%A0%90%E8%A8%AD%E6%AA%94%E6%A1%88%E7%9A%84%20NuGet%20%E5%A5%97%E4%BB%B6.md)。若想了解版本號控管，則可參考[使用 MinVer 自動化 .NET 類別庫的版本號管理](https://github.com/CloudyWing/HackMD-Notes/blob/main/%E4%BD%BF%E7%94%A8%20MinVer%20%E8%87%AA%E5%8B%95%E5%8C%96%20.NET%20%E9%A1%9E%E5%88%A5%E5%BA%AB%E7%9A%84%E7%89%88%E6%9C%AC%E8%99%9F%E7%AE%A1%E7%90%86.md)。

不過如果是開發公司內部使用的公用套件時，就不適合發佈到公開的 NuGet Server 上。

## 使用 GitLab Packages 作為套件庫

如果已經使用 GitLab 作為版本控制系統，便可以利用它的 Packages 庫作為套件來源。我通常建議建立一個專門的 GitLab 群組，將作為套件的專案放在此群組下，讓專案能夠使用該群組作為 Packages 庫。

不同於 NuGet Server，GitLab 並沒有提供直接上傳 nupkg 檔案的 UI 介面。不過既然使用 GitLab，我們可以充分利用 GitLab CI/CD 來實現自動發佈流程。

## 設定 GitLab CI/CD 自動發佈

### YAML 設定檔

由於我對指令操作不太熟悉，以下是我透過 Claude 協助產出的版本。若要打造更完整的流程，建議增加 `build` 和 `test` 步驟：當有 Commit 發生時，執行 `build` 和 `test`；而當有標籤作為版本號時，則執行 `pack` 和 `publish`。

```yaml
image: 'mcr.microsoft.com/dotnet/sdk:8.0'

stages:
 - pack     # 第一階段：將專案打包成 NuGet 套件
 - publish  # 第二階段：發佈套件到 GitLab 套件庫

variables:
 NUGET_PACKAGES_DIRECTORY: '.nuget'  # 設定 NuGet 套件的輸出資料夾
 
before_script:
 # 顯示專案結構相關訊息
 - echo "Repository structure:"
 # 找出所有 .csproj 檔案並排序顯示
 - find . -type f -name "*.csproj" | sort
 # 找出第一個 .csproj 檔案並存入變數
 - export PROJECT_FILE=$(find . -type f -name "*.csproj" | head -n 1)
 # 取得專案檔案所在的資料夾路徑
 - export PROJECT_DIR=$(dirname "$PROJECT_FILE")
 # 取得專案名稱（不含 .csproj 副檔名）
 - export PROJECT_NAME=$(basename "$PROJECT_FILE" .csproj)
 # 顯示找到的專案資訊
 - echo "Found project:$PROJECT_NAME at $PROJECT_DIR"
 # 新增 GitLab 群組的 NuGet 套件庫作為來源
 # 注意：此處設定的 name 參數必須與專案層級的套件庫名稱不同，避免衝突
 # 這個套件來源會被用於 dotnet restore 和 dotnet pack 指令，確保能夠解析相依套件
 - dotnet nuget add source "${CI_API_V4_URL}/groups/${PACKAGES_GROUP_ID}/-/packages/nuget/index.json" --name gitlab-packages --username gitlab-ci-token --password ${CI_JOB_TOKEN} --store-password-in-clear-text

pack:
 stage: pack
 tags:
   - docker
 script:
   # 顯示正在打包的專案
   - echo "Packing project:$PROJECT_DIR"
   # 以 Release 模式打包專案並輸出到指定資料夾
   - dotnet pack $PROJECT_DIR --configuration Release --output $NUGET_PACKAGES_DIRECTORY
 artifacts:
   paths:
     # 將產生的 .nupkg 檔案儲存為成品，供後續階段使用
     - $NUGET_PACKAGES_DIRECTORY/*.nupkg

publish:
 stage: publish
 tags:
   - docker
 script:
   # 顯示正在發佈的專案
   - echo "Publishing package for project:$PROJECT_NAME"
   # 上層群組的權限會自動繼承到此專案層級，所以直接新增當前專案的 GitLab NuGet 套件庫作為來源
   # --store-password-in-clear-text 參數是告訴 NuGet 將密碼以明文方式儲存在 NuGet 的設定檔中，而非加密儲存，避免 CI/CD 環境缺乏相應加密元件
   - dotnet nuget add source "${CI_SERVER_URL}/api/v4/projects/${CI_PROJECT_ID}/packages/nuget/index.json" --name gitlab-project --username gitlab-ci-token --password ${CI_JOB_TOKEN} --store-password-in-clear-text
   # 切換到 NuGet 套件資料夾
   - cd $NUGET_PACKAGES_DIRECTORY
   # 發佈打包階段產生的 NuGet 套件（雖然迴圈處理所有 .nupkg 檔案，但實際上只有一個套件，因為僅打包了第一個找到的專案）
   - for pkg in *.nupkg; do dotnet nuget push "$pkg" --source gitlab-project; done
```

Pipeline 執行完，可以在群組或專案的「Deploy」→「Package Registry」中看到該套件，如下圖所示：

![](https://github.com/CloudyWing/HackMD-Notes/blob/main/Images/%E5%9C%A8%20Visual%20Studio%20%E4%B8%AD%E8%A8%AD%E5%AE%9A%20GitLab%20%E4%BD%9C%E7%82%BA%20NuGet%20Packages%20%E4%BE%86%E6%BA%90/gitlab-package-registry.png?raw=true)

### 設定 Job Token 權限

在 YAML 檔案中，可以看到有使用 `$CI_JOB_TOKEN` 來存取 GitLab 的 Packages。不過這個 CI/CD 產生的臨時 Token 預設只能在 CI/CD 流程中存取自身專案的 Packages。若要存取其他專案或群組的 Packages，需要擴充 `$CI_JOB_TOKEN` 的權限範圍。

擴展 Token 權限步驟如下：

1. 前往 「Settings」→「CI/CD」。
2. 在 Job token permissions 區塊，點擊「Add group or project」。

   ![](https://github.com/CloudyWing/HackMD-Notes/blob/main/Images/%E5%9C%A8%20Visual%20Studio%20%E4%B8%AD%E8%A8%AD%E5%AE%9A%20GitLab%20%E4%BD%9C%E7%82%BA%20NuGet%20Packages%20%E4%BE%86%E6%BA%90/gitlab-job-token-permissions.png?raw=true)

3. 新增所需的群組或專案，讓這些群組或專案能夠存取目前專案的 Packages。

:::info
在未額外設定前，我嘗試使用 `$CI_JOB_TOKEN` 和 Group Access Token，在執行 `dotnet nuget add source` 都沒問題，但是執行到 `dotnet restore` 就無法取得相應套件清單。增加 `--verbosity detailed` 參數後，顯示錯誤訊息「error NU1101: Unable to find package {Your Packages}. No packages exist with this id in source(s):」。直到把相依套件專案的 Job Token 權限調整後才能正常運作。
:::

## 在 Visual Studio 中設定 GitLab 套件來源

### 建立存取 Token

首先需要建立一個供 Visual Studio 存取的 Token。

在 GitLab 中建立 Token 的步驟：

1. 點擊個人頭像。
2. 選擇「Preferences」。
3. 點選「Access Tokens」。
4. 點擊「Add new token」。

![](https://github.com/CloudyWing/HackMD-Notes/blob/main/Images/%E5%9C%A8%20Visual%20Studio%20%E4%B8%AD%E8%A8%AD%E5%AE%9A%20GitLab%20%E4%BD%9C%E7%82%BA%20NuGet%20Packages%20%E4%BE%86%E6%BA%90/gitlab-add-new-token.png?raw=true)

在 Token 設定頁面需要完成以下三個部分：

* 設定一個易於識別的名稱，可依個人喜好命名。
* 如有需要，可設定「Expiration date」(到期日)，若無期限限制則可以不填。
* 勾選 API 權限。由於發佈工作是透過 CI/CD 進行，Visual Studio 僅需讀取套件，故只需勾選 `read_api` 權限即可。

設定完成後，點擊「Create personal access token」按鈕產生 Token。

![](https://github.com/CloudyWing/HackMD-Notes/blob/main/Images/%E5%9C%A8%20Visual%20Studio%20%E4%B8%AD%E8%A8%AD%E5%AE%9A%20GitLab%20%E4%BD%9C%E7%82%BA%20NuGet%20Packages%20%E4%BE%86%E6%BA%90/gitlab-create-personal-access-token.png?raw=true)

請注意，Token 只會在此頁面顯示一次，請立即點擊複製按鈕並妥善儲存。

![](https://github.com/CloudyWing/HackMD-Notes/blob/main/Images/%E5%9C%A8%20Visual%20Studio%20%E4%B8%AD%E8%A8%AD%E5%AE%9A%20GitLab%20%E4%BD%9C%E7%82%BA%20NuGet%20Packages%20%E4%BE%86%E6%BA%90/gitlab-copy-token.png?raw=true)

### 在 Visual Studio 中新增套件來源

接著在 Visual Studio 中設定套件來源：

1. 點擊「工具」。
2. 選擇「選項」。
3. 進入「NuGet 套件管理員」。
4. 點選「套件來源」。
5. 加入 `https://{GitLab Domain}/api/v4/groups/{Group 流水號}/-/packages/nuget/index.json` 。

在本例中，我為新套件來源設定的名稱是「GitLabTest」，因此在清單中選擇「GitLabTest」。

![](https://github.com/CloudyWing/HackMD-Notes/blob/main/Images/%E5%9C%A8%20Visual%20Studio%20%E4%B8%AD%E8%A8%AD%E5%AE%9A%20GitLab%20%E4%BD%9C%E7%82%BA%20NuGet%20Packages%20%E4%BE%86%E6%BA%90/vs-nuget-package-source-selection.png?raw=true)

系統會彈出一個要求輸入帳號密碼的視窗。因為我先前已經輸入過，所以這裡沒有截圖。

請在帳號欄位輸入 GitLab 帳號，密碼則輸入剛才產生的 Token。

完成上述設定後，就能看到已發佈的套件了。

![](https://github.com/CloudyWing/HackMD-Notes/blob/main/Images/%E5%9C%A8%20Visual%20Studio%20%E4%B8%AD%E8%A8%AD%E5%AE%9A%20GitLab%20%E4%BD%9C%E7%82%BA%20NuGet%20Packages%20%E4%BE%86%E6%BA%90/vs-browse-gitlab-packages.png?raw=true)

若重新開啟 Visual Studio 後仍跳出 NuGet 憑證輸入視窗，請依照以下步驟檢查設定：

1. 開啟 `%AppData%\NuGet\NuGet.Config` 設定檔。
2. 確認檔案中是否已包含 `<packageSourceCredentials>` 區塊。

若未包含憑證設定，請開啟命令提示字元並執行：

```bash
dotnet nuget add source "https://{GitLab Domain}/api/v4/groups/{Group 流水號}/-/packages/nuget/index.json" --name=GitLab --username={GitLab 帳號} --password={Access Token}
```

## 異動歷程

* 2025-03-30 初版文件建立。

---

###### tags: `.NET` `DevOps` `Git` `Visual Studio` `GitLab` `GitLab CI`