---
title: "解決 WSL 2 Docker 檔案權限問題"
date: 2026-01-19
lastmod: 2026-01-22
description: "分享從 Windows Docker 遷移至 WSL 2 的心路歷程，解決檔案權限問題的暴力解法，以及最終改用 Dev Containers 的優雅方案。"
tags: ["Docker", "WSL", "Visual Studio Code", "Dev Containers"]
---

# 解決 WSL 2 Docker 檔案權限問題

早期我的 Docker 環境都是架設在 Windows 上，但網路上的教學與設定資源大多是以 Linux 環境為主，加上 Windows 與 Linux 檔案系統的路徑差異 (例如 `C:\` vs `/mnt/c`)，常常需要花時間轉換與除錯。

此外，透過 WSL 2 連結回 Windows 檔案系統雖然方便，但跨作業系統的檔案 I/O 效能始終會有損耗。為了追求更原生的 Linux 體驗與更好的效能，後來我將 Docker Compose 專案都遷移到了 WSL 2 上。

## 遇到的權限地獄

遷移到 WSL 2 後，我習慣直接使用 Windows 上的 Visual Studio Code (VS Code) 配合 `Remote - WSL` 套件，把它當作 WSL 內部的檔案瀏覽器與編輯器來使用。

但這時遇到一個棘手的問題：**Docker 容器啟動後產生的檔案，我無法直接存取。**

這主要是因為 Docker 容器內預設通常是以 `root` 權限執行，因此它掛載 (Volume) 到本機 (WSL) 的檔案，擁有者也會變成 `root`。但我登入 WSL 的使用者通常是建立時設定的一般使用者（例如 `wing`），導致 VS Code 以一般使用者身分去讀寫這些 `root` 擁有的檔案時，會直接跳出 `Permission Denied`。

如果是習慣使用指令的大神，可能直接 `sudo vim` 或 `sudo nano` 就解決了；但我就是個依賴 GUI 的廢人，如果不能用 VS Code 點兩下開啟檔案編輯，開發體驗會大打折扣。

### 嘗試過的解決方案

為了這個問題我找遍了各種方法：

1. **修改檔案權限**：手動修改檔案權限 (`chmod`/`chown`)，或是設定容器 User。結果往往無法完全解決，甚至不小心導致 VS Code 連線權限錯誤。

### 暴力解法

後來實在受不了，決定開大絕招：我直接修改 WSL 的設定檔 `/etc/wsl.conf`，將預設登入使用者改為 `root`。

```ini
# /etc/wsl.conf
[user]
default = root
```

::: warning
這是一個極度不安全的作法。將預設使用者改為 root 會讓你在 WSL 內的所有操作都具有最高權限，一旦誤執行惡意腳本或操作失誤（例如 `rm -rf /`），後果不堪設想。請勿在生產環境或重要的工作環境中模仿。
:::

反正這是我本機開發，自此之後，檔案權限問題確實消失了，我可以快樂地用 VS Code 編輯任何檔案。

## 稍微更安全的解法：Dev Containers

直到最近在和 Gemini 聊天討論這個困擾時，它建議我試試看 Dev Containers。

### 什麼是 Dev Containers？

[Dev Containers](https://code.visualstudio.com/docs/devcontainers/containers) (Development Containers) 是 VS Code 的一個擴充功能，它允許你將整個「開發環境」打包在 Docker 容器中。

這解決了什麼問題？

1. **環境一致性**：不再需要先在 WSL 安裝 Node.js, Python 等環境，容器開起來環境就好了。
2. **自動同步身分 (解決權限問題)**：這是最關鍵的一點。Linux 認的是 UID (數字 ID) 而非帳號名稱，Dev Containers 啟動時會自動將容器內使用者的 UID 修改為與 WSL 外部一致 (例如 1000)。這代表你在容器內建立的檔案，在 Host 上看來也是「你的」，自然就不會有 Permission Denied 的問題。不過要注意的是，這項機制**無法解決**本案例中「Docker Compose 服務強制以 root 產生檔案」的問題，這也是我們稍後需要特殊設定的原因。

## Dev Containers 實戰

接下來說明如何設定一個基本的 Dev Container 環境。

### 建立工作區

假設我以 `/home/wing/docker` 這個目錄作為 Dev Container 的工作區。

### 步驟 1：初始化 Dev Container 設定

如果是空專案，我們可以透過 VS Code 的指令來產生設定檔。

1. 按下 `F1` 或 `Ctrl+Shift+P` 開啟指令面板。
2. 輸入並選擇 **Dev Containers: Add Dev Container Configuration Files...**。

    ![新增 Dev Container 設定檔指令](images/解決%20WSL%202%20Docker%20檔案權限問題/add-dev-container-config-command.png)

3. 接下來會出現選單問你要使用哪種定義檔 (Definition)。
    - 如果是 Node.js 專案，可以選 `Node.js`。
    - 如果只是想要一個乾淨的環境，可以選 `Ubuntu` 或 `Debian`。因為我的 WSL 是 Ubuntu-24.04，並且只是要拿來建 Docker 環境，所以這邊我選擇 **Show All Definitions...** 然後搜尋並選擇 **Ubuntu** 作為示範。

4. 選擇版本（例如 `noble` 即 Ubuntu 24.04）。
5. 接下來會問你是否需要安裝額外的功能 (Features)，請搜尋並勾選 `Docker (outside of Docker)`。

   ::: tip
   - 請注意，搜尋結果可能會出現多個同名選項。請務必選擇 **devcontainers** 維護的版本（通常帶有官方認證圖示），以確保最佳相容性。
   - Docker (outside of Docker) 本身並沒有 Docker 功能，它只是在容器內建立一個 Docker client，用來控制外部 (Host) 的 Docker 引擎。
   :::

   ![搜尋 Docker outside of Docker](images/解決%20WSL%202%20Docker%20檔案權限問題/search-docker-outside-of-docker.png)

6. 接著會跳出 `Docker (outside of Docker)` 的設定選項：
    - **Select or enter a Docker/Moby CLI version**: 選擇 `latest` (預設)。
    - **要保留功能預設值或設定選項嗎？**: 選擇「設定選項」。
    - **為 'Docker (docker-outside-of-docker)' 選取布林值選項**:
        - `installDockerBuildx`: 勾選。
        - `installDockerComposeSwitch`: 勾選。
        - `moby` (Install OSS Moby...): **不勾選**，我只需要標準的 Docker CLI 來控制外部的 Docker Desktop，不需要安裝 Moby OSS 版本。
    - **Compose version to use for docker-compose**: 選擇 `v2`。
    - **包含下列選用檔案/目錄** (`.github/dependabot.yml`): **不勾選**，這只是單純的本機開發環境，不需要 GitHub Dependabot 的自動化依賴更新設定。

此時，VS Code 會在你的專案目錄下建立一個 `.devcontainer` 資料夾，裡面包含 `devcontainer.json` 設定檔。

```json
// For format details, see https://aka.ms/devcontainer.json. For config options, see the
// README at: https://github.com/devcontainers/templates/tree/main/src/ubuntu
{
    "name": "Ubuntu",
    // Or use a Dockerfile or Docker Compose file. More info: https://containers.dev/guide/dockerfile
    "image": "mcr.microsoft.com/devcontainers/base:noble",
    "features": {
        "ghcr.io/devcontainers/features/docker-outside-of-docker:1": {
            "installDockerBuildx": true,
            "installDockerComposeSwitch": true,
            "version": "latest",
            "dockerDashComposeVersion": "v2"
        }
    },

    // Features to add to the dev container. More info: https://containers.dev/features.
    // "features": {},

    // Use 'forwardPorts' to make a list of ports inside the container available locally.
    // "forwardPorts": [],

    // Use 'postCreateCommand' to run commands after the container is created.
    // "postCreateCommand": "uname -a",

    // Configure tool-specific properties.
    // "customizations": {},
    
    // Uncomment to connect as root instead. More info: https://aka.ms/dev-containers-non-root.
    "remoteUser": "root"
}
```

::: tip
`"remoteUser": "root"` 預設是註解的，如果 Volumes 是用 **Bind Mount** 的話 必須啟用此行，否則無法編輯 Docker Compose 生成的 root 權限檔案。
:::

::: warning
`devcontainer.json` 如果有修改的話，必須要 **Rebuild** 才會生效。

理論上修改時，右下角會跳出提醒要 Rebuild，可以從提醒點按鈕執行。但如果錯過了，就參考以下的「步驟 2：在容器中開啟」再執行一次。
:::

### 步驟 2：在容器中開啟

1. 按下 `F1` 或 `Ctrl+Shift+P`。
2. 輸入並選擇 **Dev Containers: Reopen in Container**。

VS Code 這時會開始建立 Docker Image (第一次會比較久)，並啟動容器。

### 步驟 3：體驗成果

當左下角的綠色狀態列顯示為 **Dev Container: Ubuntu...** 時，代表你已經成功進入容器了！

這時候你可以打開終端機，你會發現你已經身處於容器內部。

為了驗證這是一個完整的 Docker 開發環境，我們試著建立一個 `compose.yml`：

```yaml
services: 
  searxng:
    image: searxng/searxng:latest
    container_name: searxng
    ports:
      - "8080:8080"
    volumes:
      - ./volumes/searxng:/etc/searxng
    restart: unless-stopped
```

**接下來不要在這個工作區直接啟動 Docker Compose，而是建議在 Dev Container 外部啟動。**

::: warning
這邊主要是因為我個人習慣使用 **Bind Mount** (將本機目錄掛載到容器)，但 Bind Mount 其實很容易有權限問題。

以 docker-outside-of-docker (DooD) 來說，因為 Dev Container 內部只是透過 Socket 控制外部 (Host) 的 Docker Daemon，當你指令傳送給 Daemon 說要掛載 `./volumes` 時，Daemon 會從 **Host 的路徑** 去尋找，而不是 Dev Container 內部的路徑。這會導致路徑對應錯誤，容器建立後的檔案無法正確存取或出現空目錄。

詳細可以參考官方文件：[Using Docker from Docker (Docker-outside-of-Docker)](https://code.visualstudio.com/remote/advancedcontainers/use-docker-kubernetes#_mounting-host-volumes-with-docker-from-inside-a-container)

但如果你是使用 **Named Volume**，就可以避開 DooD 下 Bind Mount 在 Host / Container 間的路徑解析問題，甚至還可以在 `devcontainer.json` 加上 `"postCreateCommand": "docker compose up -d"` 一鍵到位。~~這樣感覺堅持使用 Bind Mount 的我，好像該被淘汰了~~。
:::

這裡做個對比：

如果在 Dev Container 外部（原本的 WSL 工作區），我們會發現因為權限問題無法直接編輯 volumes 底下的 `settings.yml`：

![權限不足無法存取](images/解決%20WSL%202%20Docker%20檔案權限問題/host-permission-denied.png)

但是在 Dev Container 裡，我們就可以正常開啟並編輯該檔案：

![Dev Container 內正常存取](images/解決%20WSL%202%20Docker%20檔案權限問題/dev-container-file-access.png)

當有開啟 Dev Container 的 VS Code 時，查看 Docker Container 清單會發現多出一個容器（如下圖的 `hungry_mccarthy`），這就是 Dev Container 本身：

![Dev Container 容器列表](images/解決%20WSL%202%20Docker%20檔案權限問題/dev-container-list.png)

而當把那個 VS Code 視窗關掉時，這個 Dev Container 也會自動停止：

![Dev Container 自動停止](images/解決%20WSL%202%20Docker%20檔案權限問題/dev-container-stopped.png)

## 另一種選擇：直接將 Dev Container 整合進 Docker Compose

如果覺得要為了 Dev Container 特地產生 `.devcontainer` 資料夾、維護額外的設定檔很麻煩，或者希望這個開發環境能直接寫在專案的 `compose.yml` 裡一目了然，我們可以採用「手動加入工具容器」的方式。

這種做法的概念是：在 `compose.yml` 中多開一個專門用來跑 VS Code 的容器（我們姑且稱它為 `vscode-editor`），把它跟其他服務（如資料庫、Redis）放在同一個網路下，這樣既能解決檔案權限問題，又能直接在容器內連線除錯其他服務。

### 步驟 1：修改 docker-compose.yml

在 `docker-compose.yml` 中加入一個 `vscode-editor` 服務：

```yaml
services:
  # ... 原有的服務 (searxng, database, etc.) ...

  vscode-editor:
    # 使用微軟官方維護的 Dev Container 基底映像檔 (與標準 Dev Container 相同)
    image: mcr.microsoft.com/devcontainers/base:ubuntu-24.04
    container_name: vscode-editor
    # 讓容器保持啟動狀態，隨時待命讓我們連線
    command: sleep infinity 
    # 這裡直接用 root 啟動，最暴力解決掛載權限問題
    user: root 
    volumes:
      # 決定掛載進容器的路徑範圍，可以是單一專案 (./) 或多個服務的共同父目錄 (詳見下方 Tip)
      - ./:/workspace
    working_dir: /workspace
    # 確保加入相同的網路，方便 ping 或連線其他容器
    networks:
      - default
```

::: tip
關於 Workspace 具體要掛載多大的範圍比較適合？其實我目前也沒有標準答案，僅分享我個人的想法：
- **若同網路的服務眾多**：我會考慮掛載涵蓋這些服務的最小共同父目錄。這樣 `compose.yml` 會比較簡潔，不用列出一長串 volumes 清單，也能在同一個 VS Code 視窗中同時管理多個相關服務。
- **若同網路的服務較少**：例如只有一兩個容器需要頻繁修改，那麼直接條列式地掛載特定的資料夾即可，這樣能保持環境最單純，也避免在容器內誤動到不相關的檔案。
:::

啟動專案：

```bash
docker compose up -d
```

### 步驟 2：附加至已執行的容器

啟動後，這個 `vscode-editor` 容器會一直在背景待命。接下來我們透過 VS Code 連進去：

1. 按下 `F1` 或 `Ctrl+Shift+P` 開啟指令面板。
2. 輸入並選擇 **Dev Containers: Attach to Running Container...**。

    ![附加至執行中的容器](images/解決%20WSL%202%20Docker%20檔案權限問題/attach-to-container-command.png)

3. 在選單中選擇我們剛剛建立的 `vscode-editor` 容器。

此時 VS Code 會開啟一個新的視窗並連線到容器內部。接著選擇 **開啟資料夾 (Open Folder)**，路徑輸入我們剛才掛載的 `/workspace`。

### 步驟 3：修正權限設定 (設定 devcontainer.json)

雖然在 YAML 裡已經指定了 `user: root`，但為了確保 VS Code 的擴充功能與終端機行為一致，建議還是為這個容器建立一份設定檔。

1. 在連線後的視窗中，按下 `F1`。
2. 搜尋並選擇 **Dev Containers: Open Container Configuration File** (開啟容器設定檔)。

    ![開啟附加容器設定檔](images/解決%20WSL%202%20Docker%20檔案權限問題/open-container-config-command.png)

    ![附加映像檔](images/解決%20WSL%202%20Docker%20檔案權限問題/attach-image.png)
3. 此時 VS Code 會為這個「附加容器」建立一份專屬設定，請在裡面加入 `"remoteUser": "root"`：

```json
{
    "workspaceFolder": "/workspace",
    "remoteUser": "root"
}
```

如此一來，你在容器內對 `/workspace` 內所有檔案的修改，都會是以 `root` 身分執行，這就能完美解決 Docker Compose 其他服務產生的權限問題。

::: tip
**關於「Rebuild」指令不見了？**
如果你在第一次編輯 `devcontainer.json` 後看過重建提示，但之後在指令面板中卻找不到了，別擔心，這很正常。

若修改了設定（例如切換 `remoteUser`）想要套用，最簡單的做法是按下 `F1` 執行 **Developer: Reload Window (開發者: 重新載入視窗)**，重新連線後設定就會生效。
:::

這種做法最大的好處是：**開發環境本身就是基礎設施的一部分**，隨開隨用，不需要額外的初始化步驟。

### 替代方案：Docker Desktop 內建編輯器

除了 Dev Containers，若只需要快速修改少量檔案，Docker Desktop 的 GUI 介面現在也支援直接編輯容器內的檔案：

![Docker Desktop 內建編輯器](images/解決%20WSL%202%20Docker%20檔案權限問題/docker-desktop-editor.png)

## 結論

雖然這邊使用 Dev Container 還是用了 `root`，反而有點無法體現 Dev Container 的本意（User Mapping）。但至少這把 `root` 的執行限定在 Dev Container 內，而非整個 WSL 都是 `root`；且容器內預設也不會讀取 Dev Container 範圍外的檔案，權限相對來說會比較安全（應該吧）。

## 異動歷程

- 2026-01-19 初版文件建立。
- 2026-01-22 補充將 Dev Container 整合進 Docker Compose 的另一種做法。
