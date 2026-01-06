---
title: "在 Windows 上使用 WSL 2 安裝 Linux"
date: 2022-10-24
lastmod: 2024-10-30
description: "教學如何在 Windows 10/11 上安裝 WSL 2 (Windows Subsystem for Linux)。說明 WSL 2 與 Docker Desktop 的架構關係，以及如何設定預設 Linux 發行版。"
tags: ["Docker","WSL"]
---

# 在 Windows 上使用 WSL 2 安裝 Linux

## 前言

Docker Desktop 的 Linux Containers 大致有以下架構：

1. Moby VM：Linux Containers 建立在 Moby VM 所建立的 Linux Container Host裡，完整內容請參考[Windows 10 上的 Linux 容器](https://learn.microsoft.com/zh-tw/virtualization/windowscontainers/deploy-containers/linux-containers)。
2. LCOW：Docker Desktop 所提出一個實驗性架構，可讓 Windows / Linux 兩種 Containers 同時運行，可以參考此篇[文章](https://www.cnblogs.com/chasingdreams2017/p/10381017.html)了解兩者的架構差異。
3. WSL 2：[Windows Subsystem for Linux 2](https://learn.microsoft.com/zh-tw/windows/wsl/about#what-is-wsl-2) 的縮寫，為 Microsoft 所提供存在於 Windows 底下擁有完整 Linux 內核的子系統，可直接在 Windows 利用檔案總管或 Command Line 方式操作 Linux檔案。

## Windows 安裝 WSL 2 的版本要求

- Windows 10 必需為 2004 版(組建 19041) 或更新版本。
- Windows 11。

## 安裝 WSL 2

- 以下指令使用 **Windows PowerShell(系統管理員身分)** 輸入。
- 看到 **&lt;DistributionName&gt;**，則替換成要安裝的 Linux 套件。

1. 安裝 WSL 2。

    ```bash
    wsl --install
    # or
    wsl --install -d <DistributionName>
    ```

::: tip

- 未指定 Linux 發行版時，預設為 **Ubuntu**。
  - 只有尚未安裝任何 Linux 發行版時，才可不指定 Linux 發行版。
  - 可用 `wsl --list --online` 或 `wsl -l -o` 查詢可安裝的 Linux 發行版名稱。
:::

1. 將 WSL 2 設定為預設版本。

    ```bash
    wsl --set-default-version 2
    ```

2. 設定剛安裝的 Linux 發行版的 WSL 版本設定為 2。

    ```bash
    wsl --set-version <DistributionName> 2
    ```

3. 設定預設 Linux 發行版。

    ```bash
    wsl --set-default-version <DistributionName>
    # or
    wsl -s <DistributionName>
    ```

::: tip

- 可用 `wsl --list --verbose` 或 `wsl -l -v` 查詢目前已安裝和正在使用的套件為何。
  - 安裝 Docker Desktop 時，如果有勾選「Install required components for WSL 2」，會安裝以下兩個 Linux 發行版：

    - docker-desktop：用於運行 Docker Engine(dockerd)。
    - docker-desktop-data：用於存儲 Containers 和 Images。
:::

1. 移除 Linux 發行版。

    ```bash
    wsl --unregister <DistributionName>
    ```

::: warning
請注意，移除 Linux 發行版將會刪除相應的資料夾及所有資料，無法復原。
:::

### 官方相關文件

- [使用 WSL 在 Windows 上安裝 Linux](https://learn.microsoft.com/zh-tw/windows/wsl/install?source=recommendations)
- [WSL 的基本命令](https://learn.microsoft.com/zh-tw/windows/wsl/basic-commands)

## Linux Containers 整合 WLS 2

Docker 官方提到 Linux Containers 改為整合 WLS 2 有以下優點：

1. Docker Desktop 使用 WSL 2 中的動態記憶體分配功能，極大地改善了資源消耗。
2. 使用 WSL 2，冷啟動後啟動 Docker 守護程式所需的時間明顯加快。

Linux Containers 模式下要整合 WSL 2 需進行以下設定：

- [x] Settings > General > Use the WSL 2 based engine。
- [x] Settings > Resources > WSL Integration：
  - [x]  Enable integration with my default WSL distro。
  - [x]  在「Enable integration with additional distros:」底下專案啟用要使用 Linux 套件。

### 官方相關文件

[Docker Desktop WSL 2 backen](https://docs.docker.com/desktop/windows/wsl/)
[在 WSL 2 上開始使用 Docker 遠端容器](https://learn.microsoft.com/zh-tw/windows/wsl/tutorials/wsl-containers)

## 同時運行 Windows Containers 和 Linux Containers

Docker Desktop 有 Windows Containers 和 Linux Containers 兩個模式，但同時間只能運行一個。過往曾在v17.09登出實驗性質的 Linux Container On Windows(LCOW)，可讓 Docker 在 Windows Containers 模式下利用 Hyper-V Container 來同時運行 Linux Containers 的能力，不過這項實驗性功能已經廢止了。

但目前有了 WSL 2 以後，電腦上是可以同時運行 Windows 和 Linux 兩個系統，所以可以將 Docker Desktop 切換成 Windows Containers，Linux 安裝 Docker Engine 來運行 Linux Containers。

目前 Docker 版本第一次切換 Windows Containers 需使用執行以下指令，相關討論請參考此篇 [Qestion](https://stackoverflow.com/questions/36590514/how-to-enable-the-windows-10-containers-feature)：

```text
Enable-WindowsOptionalFeature -Online -FeatureName $("Microsoft-Hyper-V", "Containers") -All
```

如果執行 `docker-compose up`，出現以下錯誤訊息，請參考此篇[文章](http://andy51002000.blogspot.com/2019/02/docker-permission-denied.html)解決。

```sql
docker: Got permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock: Post http://%2Fvar%2Frun%2Fdocker.sock/v1.26/containers/create: dial unix /var/run/docker.sock: connect: permission denied. See 'docker run --help'.
```

目前的 Ubuntu 已有預設安裝 Docker Engine，如果剛安裝完 WSL 2 Ubuntu覺得預設版本太舊，可參考官網[文章](https://docs.docker.com/engine/install/ubuntu/)更新 Docker Engine 版本。

## Windows 與 Linux 發行版互相存取資料的方法

- Windows 可在檔案總管上方路經輸入`\\wsl$\&lt;DistributionName&gt;`連至 Linux 發行版根目錄，&lt;DistributionName&gt; 為要連結的發行版名稱；透過`\\wsl$` 存取 Linux 檔案將會使用 WSL 發行版本的預設使用者。
- 而 Linux 則是透過路徑 `/mnt/&lt;WindowsDriveLetter&gt;` 連至各硬碟根目錄，&lt;WindowsDriveLetter&gt; 為要連結的硬碟代號；而 Linux 發行版存取 Windows 檔案時，檔案權限會從 Windows 權限中計算，或從已由 Linux 新增至檔案的中繼資料中讀取。

### 詳細的內容請參閱

- [跨 Windows 和 Linux 檔案系統運作](https://stackoverflow.com/questions/36590514/how-to-enable-the-windows-10-containers-feature)
- [WSL 的檔案權限](https://learn.microsoft.com/zh-tw/windows/wsl/file-permissions)

## 未解決問題

1. 當切換至 Windows Container 時，重開機 WSL 2 裡的 Docker 不會自動啟動。
2. 網路上有些提到安裝 WSL 2的方式是此篇「[舊版 WSL 的手動安裝步驟](https://learn.microsoft.com/zh-tw/windows/wsl/install-manual)」提到的舊安裝方法，根據此篇[文章](https://github.com/microsoft/WSL/issues/5718)提到有可能會造成 Windows 的「檔案總管」無法透過「網路芳鄰」異動 Linux 上面的檔案，但我用新版方式安裝後發現，除了用戶資料夾(/home/{使用者帳號}/)以外的檔案，重開機仍有此問題，所以對於不習慣 Linux 介面的人來說，可能要評估是否要將資料集中存放在用戶資料夾底下。

以上問題可能可以在 [WSL 中的進階設定組態](https://learn.microsoft.com/zh-tw/windows/wsl/wsl-config#wslconf) 找到解決方案，但我尚未親自測試。

有關 Docker 重啟的問題，或許可以透過 `boot` 設定來執行 Docker 自動重啟指令。

至於檔案權限問題，可以通過設定 `umask`、`fmask` 和 `dmask` 來解決，但我不熟悉 Linux 權限設定，具體怎設定並不清楚。不過，如果不在乎安全性風險，也可以考慮直接在 `user` 設定 `default = root`（但這不建議）。

## 異動歷程

- 2022-10-24 初版文件建立。
- 2024-10-30
  - 將簡寫指令改為完整指令。
  - 補充解除安裝 WSL 的指令。
  - 嘗試提供之前問題的解決方案。
