# 使用 Windows Docker Desktop 建立 Oracle 環境

[![hackmd-github-sync-badge](https://hackmd.io/6pfP2QBKSv6PByiZQDOtwg/badge)](https://hackmd.io/6pfP2QBKSv6PByiZQDOtwg)

原先Oracle官方有在Docker Hub提供image，但目前已無提供下載，如果想要用Docker安裝Oracle，只能使用別人提供的版本，或是從[Oracle Github](https://github.com/oracle/docker-images)下載相關資源來建立image，本篇使用第二種方法。

## 安裝前的準備
1. 目前只有提供給Linux Container環境使用。
2. Windows環境必需要能執行Linux Bash Shell，可使用以下兩種方式：
    * 使用Git Bash。
    * 目前Windows 10已有內建，開啟「命令提示字元」輸入bash，如果指令無法執行，請參考此篇[文章](https://blog.gtwang.org/windows/how-to-get-ubuntu-and-bash-running-on-windows-10/)。

## 安裝步驟
1. 下載[Dockerfile相關檔案](https://github.com/oracle/docker-images/tree/main/OracleDatabase/SingleInstance)。
2. 開啟檔案「存放位置/OracleDatabase/SingleInstance/dockerfile/{version}/Dockerfile」，搜尋關鍵字`INSTALL_FILE_1`，查看要安裝的檔案，如果要安裝XE版本，要查看「Dockerfile.xe」。
3. 下載安裝檔案至版本資料夾底下，下載位置可參考Dockerfile檔案裡的備註說明
e.g.
```
# (1) db_home.zip
#     Download Oracle Database 19c Enterprise Edition or Standard Edition 2 for Linux x64
#     from http://www.oracle.com/technetwork/database/enterprise-edition/downloads/index.html
#
```
5. 開啟bash，先將指令位置移到「存放位置/OracleDatabase/SingleInstance/dockerfile/」底下
6. 輸入指令建立image，指令格式為`./buildContainerImage.sh -v [version] -t [image_name:tag] [-e | -s | -x] [-i] [-o] [container build option]`，參數說明如下：
   * -v: 請設定存在資料夾名稱的版本號。
   * -t: 設定docker-image的Tag。
   * -e: 產生安裝「Enterprise Edition」的image，需有檔案「Dockerfile」或「Dockerfile.ee」的版本才可使用。
   * -s: 產生安裝「Standard Edition 2」的image，需有檔案「Dockerfile」或「Dockerfile.se2」的版本才可使用。
   * -x: 產生安裝「Express Edition」的image，需有檔案「Dockerfile.xe」的版本才可使用。
   * -i: 忽略「MD5 checksums」檢查。
   * -o: 輸入 container 建立參數，e.g. 「'--build-arg SLIMMING=false'」。
```
./buildContainerImage.sh -e -v 21.3.0 -o '--build-arg SLIMMING=false'
```
8. 一般不需要使用`-o`，`-i`等有「MD5 checksums」錯誤導致失敗，再加上就好。
9. 如果出現image不存在的錯誤，開啟「dockerfile\{[|.ee|.se2|.xe]\}」，搜尋關鍵字`FROM oraclelinux`查看使用image tag，再至[Oracle Docker Hub](https://hub.docker.com/_/oraclelinux)查詢tag是否不存在，改成已存在的tag，現今應該使用「7-slim」。
10. 靜置image建立完成，需等一段時間。
11. 建立docker-compose檔案，參考如下(標示大括弧的地方請置換成自己的設定)：
```
version: '3.7'

services:
  TP-Oracle:
    image: oracle/database:{image tag}
    container_name: TP-Oracle
    ports:
      - 1521:1521
      - 5500:5500
      - 8080:8080
    volumes:
      - {local oradata}:/opt/oracle/oradata
      - {local scripts/startup}:/opt/oracle/scripts/startup
      - {local scripts/setup}:/opt/oracle/scripts/setup
    restart: always
    environment:
      - ORACLE_PWD={your password}
      - ORACLE_CHARACTERSET=AL32UTF8
```
12. 靜置container建立完成，需等很長一段時間，不確定哪時完成，可以開啟「Docker Dashboard」查看container的log。

## 建立使用者
1. 開啟資料庫管理工具，e.g. 「Oracle SQL Developer」、「sqlplus」，輸入帳號：SYS，密碼為docker-compose的ORACLE_PWD所設定的值，角色：sysdba。
2. 建立使用者時，使用者名稱為全大寫比較不會有問題，密碼有分大小寫。
3. 將使用者設定「connect、「resource」和「unlimited tablespace」，如有其他需求，可再增加其他權限。
4. 使用12c以上的版本，因為有分CDB與PDB，所以建立使用者時，如出現「ORA-01017 invalid username/password;logon denied」，請依以下步驟處理：
    1. 執行sql指令`show pdbs`查看PDB名稱，一般為「ORCLPDB1」或「XEPDB1 」。
    2. 執行sql指令`ALTER SESSION SET CONTAINER={查詢到的名稱}`，切換Container到PDB資料庫。
    3. 重新建立使用者和角色權限設定。
    4. 使用新使用者登入時，應使用`SERVICE_NAME={PDB Name}`，而非`SID={CDB Name}`，或是更改「TNSNAMES.ORA」設定。

## 實際安裝情形
現階段安裝11g、和12c的XE版本都有資料夾權限問題，導致Container無法正常運行，19c SE2版本看起來正常。
電腦或Docker重新啟動時，在Oracle Server剛啟動時會發現新建立的使用者不見了，這是因為PDB的資料庫掛載比較慢，再等一段時間就可以看到。

###### tags: `Docker` `Oracle`