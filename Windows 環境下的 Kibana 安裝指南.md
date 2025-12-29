# Windows 環境下的 Kibana 安裝指南

之前在 [Windows 環境下的單節點 Elasticsearch 安裝指南](https://hackmd.io/@CloudyWing/HJIkeAawye) 撰寫 Elasticsearch 的安裝筆記，之前研究了 2 ~ 3 天，終於成功把 Kibana 環境也架起來了，想說趁還有記憶，趕快也寫一份筆記，雖然後續 SSL 卡關，又拖稿兩週，才把這篇生出來。

## 下載與安裝

* 前往官方網站下載 Windows 版本的 Kibana。
* 網址：[https://www.elastic.co/downloads/kibana](https://www.elastic.co/downloads/kibana)。
* 下載 Windows 的 .zip 檔案。

## 目錄結構說明

* bin：執行檔目錄。
* config：設定檔目錄。
* node：包含 Node.js 執行環境，Kibana 使用 Node.js 作為其運行時環境。
* node_modules：儲存 Kibana 所需的 Node.js 套件。
* packages：核心程式庫與相依性套件。
* plugins：外掛目錄。
* src：Kibana 的原始碼。
* x-pack：Elastic Stack 的付費功能。
* .i18nrc.json：國際化 (i18n) 設定檔，用於語言本地化。

## YAML 設定檔 (config/kibana.yml)

### 網路設定

```yaml
# 網路設定
network.host: 0.0.0.0 # localhost 僅本機存取，0.0.0.0 允許所有連線。如果只希望某些特定網卡接受連線，可以指定具體的 IP 地址
http.port: 5601       # 預設為 5601，有需要使用其他 port 時才要設定
```

### Elasticsearch 設定

* Kibana 連線至 Elasticsearch，要使用 `kibana_system` 這個帳號，我之前就是卡在這邊，一直拿之前在 Elasticsearch 手動建立的帳密去連線，結果因為 Kibana 一直起不來。
* 在建立 Elasticsearch 時會產生 `elastic`、`kibana_system` 和 `logstash_system` 這三組系統帳號，以及相應的隨機密碼，如果和我一樣在建立服務時沒注意到或存到隨機密碼，可以在 Elasticsearch 的 bin 資料夾底下執行以下指令重設密碼，密碼會顯示在 Console 畫面上。

    ```bash
    elasticsearch-reset-password -u kibana_system
    ```

* 之前 Elasticsearch 建立 SSL 憑證時，`elasticsearch-ssl-http.zip` 裡面有包含一個 kibana 資料夾，將其放置在 Kibana 的 bin 底下。

    ```yaml
    # 設定要連線的 Elasticsearch 節點網址，這邊要用 IP 或 Domain，不能用 localhost
    elasticsearch.hosts: ["https://127.0.0.1:9200"]
    # 連線至 Elasticsearch 的帳號密碼
    elasticsearch.username: "kibana_system"
    elasticsearch.password: "pass"
    # 如果 ELK 有啟用 SSL 連線，則把當初產生的憑證放在 Kibana 底下
    elasticsearch.ssl.certificateAuthorities: [ "certs/kibana/elasticsearch-ca.pem" ]
    ```

### 語系設定

```yaml
# Supported languages are the following: English (default) "en", Chinese "zh-CN", Japanese "ja-JP", French "fr-FR".
i18n.locale: "zh-CN"
```

## 設定 SSL 憑證

我這邊偷懶，直接把 Elasticsearch 的 http.p12 複製到 Kibana 底下。

```yaml
server.ssl.enabled: true
server.ssl.keystore.path: "certs/elasticsearch/http.p12"
```

和 Elasticsearch 一樣，可以把一些敏感資訊放在 keystore 裡。

* 在 bin 資料夾底下輸入以下指令建立 keystore：

    ```bash
    kibana-keystore create
    ```

* it 建立成功會看到以下訊息：

    ```bash
    Created Kibana keystore in D:\ELK\kibana-8.17.1\config\kibana.keystore
    ```

* 將 SSL 憑證密碼加入 keystore：

    ```bash
    kibana-keystore add server.ssl.keystore.password
    ```

* 看到以下訊息，則輸入 http.p12 的密碼：

    ```bash
    Enter value for server.ssl.keystore.password:
    ```

## 啟動服務

### 手動啟動

* 以系統管理員權限開啟命令提示字元。
* 切換至 bin 目錄：

    ```bash
    cd D:\ELK\kibana-8.17.1\bin
    ```

* 執行：

    ```bash
    kibana.bat
    ```

* 等待啟動完成後，開啟瀏覽器測試：<http://localhost:5601> 或 <https://localhost:560>1。
* 需注意第一次執行時，執行完 CMD 出現以下訊息後，會再出現載入其他資訊，沒出現，可能是出現錯誤，可以檢查 Kibana 或 Elasticsearch 的 LOG，看是 Kibana 有問題，還是與 Elasticsearch 連線失敗，後續 CMD 停在這邊是正常情況。

```bash
Native global console methods have been overridden in production environment.
```

## 登入 Kibana

* 登入 Kibana 要使用 `elastic` 帳號，這是 Elasticsearch 預設的超級管理員帳號，擁有所有權限。
* 如果忘記密碼，可在 Elasticsearch 的 bin 資料夾下執行以下指令重設密碼：
    ```bash
    elasticsearch-reset-password -u elastic
    ```

* 使用 `elastic` 帳號可以在 Kibana 的 Management 介面中建立其他用戶帳號：
  * 在左側選單找到 Stack Management -> Security -> Users。
  * 點擊 Create user 按鈕建立新用戶。
  * 設定用戶名、密碼和適當的角色權限。

### 註冊成 Windows 服務

我在查，Kibana 不像 Elasticsearch 有內建一個 bat 來輔助 Windows 服務安裝，網路上看大家是用 NSSM 處理，但這工具我不熟，就先不撰寫這部分，哪天有研究，再另寫一篇筆記。

## 異動歷程

* 2025-03-18 初版文件建立。

---

###### tags: `Database` `ELK` `Kibana`