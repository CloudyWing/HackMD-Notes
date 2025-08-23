# Docker Compose 架設 SQL Server 權限問題解決方案

最近都在運動減肥和找工作，程式都沒什麼在研究，曾經中間有想要整理一些資料給別人，但後來懶了，想想還是別多事。

這幾天看朋友都在咖啡廳學習程式相關資料充實自己，想想還是振作一下，避免在面試時因為技術生疏而表現不佳。。

## 環境設定

我將之前建立的 SQL Server Docker-Compose 檔案放置在 WSL 環境下，配置如下：

```yaml
services:
  SQL-Server:
    image: mcr.microsoft.com/mssql/server:2022-latest
    container_name: SQL-Server
    ports:
      - "1433:1433"
    volumes:
      - ./volumes/data:/var/opt/mssql/data
      - ./volumes/log:/var/opt/mssql/log
      - ./volumes/backup:/var/opt/mssql/backup
    restart: always
    environment:
      ACCEPT_EULA: "Y"
      SA_PASSWORD: "YourStrongPassword123!"
      TZ: "Asia/Taipei" # 設定時區
    deploy:
      resources:
        limits:
          memory: 2G # 最大記憶體使用量
          cpus: '1.0' # 最大CPU使用核心數
        reservations:
          memory: 1G # 保證分配的記憶體
    healthcheck:
      test: ["CMD-SHELL", "/opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P $$SA_PASSWORD -Q 'SELECT 1'"]
      interval: 30s # 每30秒檢查一次
      timeout: 10s # 檢查指令10秒超時
      retries: 3 # 失敗3次才判定為不健康
      start_period: 60s # 容器啟動後60秒才開始檢查
```

## 遇到的問題

執行 Docker Compose 時出現權限相關的錯誤訊息：

```bash
SQL Server 2022 will run as non-root by default.
This container is running as user mssql.
To learn more visit https://go.microsoft.com/fwlink/?linkid=2099216.⁠
2025-08-23 00:01:10.09 Server Setup step is copying system data file 'C:\templatedata\master.mdf' to '/var/opt/mssql/data/master.mdf'.
ERROR: BootstrapSystemDataDirectories() failure (HRESULT 0x80070005)
00:00:07.43 Server ERROR: Setup FAILED copying system data file 'C:\templatedata\master.mdf' to '/var/opt/mssql/data/master.mdf': 5(Access is denied.)
00:01:10.10 Server ERROR: Setup FAILED copying system data file 'C:\templatedata\master.mdf' to '/var/opt/mssql/data/master.mdf': 5(Access is denied.)
```

## 過往的權宜之計

以前為了規避權限問題，我會將 Volume 設定為：

```yaml
./volumes/:/var/opt/mssql/external
```

這種做法是因為 SQL Server 的預設資料夾（`/var/opt/mssql/data`、`/var/opt/mssql/log`、`/var/opt/mssql/backup`）存在權限限制，所以改為將 Volume 對應到沒有權限問題的 `/var/opt/mssql/external` 自訂資料夾。使用這種方式時，需要在建立資料庫時手動指定檔案路徑到 external 目錄，才能將 `.mdf` 和 `.bak` 檔案存放在掛載的 Volume 中。不過，這種方式的缺點是建立資料庫時經常忘記手動指定檔案位置，導致檔案仍存放在容器內的預設位置，無法持久化保存。因此，後來決定尋找更正規的解決方案。

## 正規解決方案

參考 Stack Overflow 上的這篇文章：[Unable to run SQL Server 2019 docker with volumes and get ERROR: Setup FAILED copying system data file](https://stackoverflow.com/questions/65601077/unable-to-run-sql-server-2019-docker-with-volumes-and-get-error-setup-failed-co)

解決方法是在包含 volumes 資料夾的目錄中執行以下終端指令，針對 volumes 資料夾進行權限設定：

```bash
chgrp -R 0 volumes
chmod -R g=u volumes
chown -R 10001:0 volumes
```

## 權限指令詳解

因為我對 Linux 指令不太熟，所以以下是問 Claude 這些權限指令的相關說明：

### 第一行指令

```bash
chgrp -R 0 volumes
```

- **chgrp**: 改變群組擁有者 (change group)
- **-R**: 遞迴處理，包含所有子目錄和檔案
- **0**: 群組 ID 0，即 root 群組
- **volumes**: 目標目錄

**作用**：將 volumes 目錄及其所有內容的群組擁有者改為 root 群組。

### 第二行指令

```bash
chmod -R g=u volumes
```

- **chmod**: 改變檔案權限 (change mode)
- **-R**: 遞迴處理
- **g=u**: 將群組權限 (group) 設定為與使用者權限 (user) 相同

**作用**：讓群組擁有與檔案擁有者相同的權限。

### 第三行指令

```bash
chown -R 10001:0 volumes
```

- **chown**: 改變擁有者 (change owner)
- **-R**: 遞迴處理
- **10001:0**: 使用者 ID 10001，群組 ID 0
  - 10001 = SQL Server 容器內的 mssql 使用者 ID
  - 0 = root 群組

**作用**：將 volumes 目錄的擁有者改為 UID 10001 (SQL Server 容器內的 mssql 使用者)，群組設為 root。

## 整體效果

這三個指令的組合目的：
1. 確保群組設為 root (群組 ID 0)。
2. 讓群組權限等同於擁有者權限 (讀寫執行)。
3. 將擁有者設為 SQL Server 容器內的 mssql 使用者 (UID 10001)。

透過這樣的權限設定，SQL Server 容器就能正常存取掛載的 volumes 資料夾，解決了權限拒絕的問題。


###### tags: `docker` `SQL Server`