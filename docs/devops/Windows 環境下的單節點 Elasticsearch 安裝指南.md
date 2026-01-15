---
title: "Windows 環境下的單節點 Elasticsearch 安裝指南"
date: 2025-01-23
lastmod: 2025-03-18
description: "教學如何在 Windows 上安裝單節點 Elasticsearch。包含 JDK 環境、`elasticsearch.yml` 基礎設定 (Cluster/Node Name, Data/Log Path, Network Host) 與 CORS 配置，以及 JVM 記憶體參數調整。"
tags: ["Elastic Stack","Elasticsearch"]
---

# Windows 環境下的單節點 Elasticsearch 安裝指南

## 下載與安裝

1. 前往官方網站下載 Windows 版本的 Elasticsearch。
   - 網址：[https://www.elastic.co/downloads/elasticsearch](https://www.elastic.co/downloads/elasticsearch)。
   - 下載 Windows 的 .zip 檔案。

2. 目錄結構說明：
   - bin：執行檔目錄。
   - config：設定檔目錄。
   - jdk：內建 Java 環境。
   - lib：核心程式庫與相依性套件。
   - logs：記錄檔目錄。
   - modules：核心模組。
   - plugins：外掛目錄。

## 基本設定

### YAML 設定檔 (config/elasticsearch.yml)

#### 節點與叢集設定

```yaml
# 節點名稱，若未設定，系統會將主機名稱轉為大寫作為預設值
node.name: node-1

# 當第一次建立叢集時才需要此設定
cluster.initial_master_nodes: ["node-1"]
```

#### 路徑設定

```yaml
# 路徑設定
# 若使用 / 開頭代表絕對路徑，否則會以 Elasticsearch 安裝目錄為基準
path.data: /path/to/data
path.logs: /path/to/logs

# 建立 snapshot 做備份還原才需要設定
path.repo: ["/path/to/repo"]
```

建議將資料存放在 Elasticsearch 安裝目錄以外的位置，進行小版本升級時，可以直接將新安裝設定指向原有 data 位置。

#### 網路設定

```yaml
# 網路設定
network.host: 0.0.0.0 # localhost 僅本機存取，0.0.0.0 允許所有連線。如果只希望某些特定網卡接受連線，可以指定具體的 IP 地址
http.port: 9200        # 預設為 9200，有需要使用其他 port 時才要設定

# CORS 設定
http.cors.enabled: true
# 注意：目前設定允許所有來源存取，實際部署時應限制為必要的服務位址
http.cors.allow-origin: "*"
http.cors.allow-methods: OPTIONS, HEAD, GET, POST, PUT, DELETE
http.cors.allow-headers: "X-Requested-With, Content-Type, Content-Length, X-User"
```

### JVM 記憶體設定 (config/jvm.options)

```properties
# 最小記憶體設定
-Xms2g

# 最大記憶體設定
-Xmx2g
```

記憶體使用建議：

1. 最小與最大記憶體設定相同，避免記憶體重新分配的效能損耗。
2. 不超過系統可用記憶體的 50%，至少預留 2GB 給作業系統。
3. 32GB 以下記憶體建議設定為系統記憶體的 50%；32GB 以上則使用 31GB，讓 JVM 使用 compressed ordinary object pointers 提升效能。

## 安全性設定

### 建立 CA 憑證

CA（Certificate Authority）憑證是用於簽發其他憑證，例如 SSL 憑證或多節點間使用的 x.509 憑證。

1. 在 bin 目錄下執行憑證產生工具，建立 CA 憑證（這邊設定 5 年有效期，請依實際狀況調整）：

    ```bash
    elasticsearch-certutil ca --days 1825
    ```

    執行後會顯示憑證工具的功能說明，大致上是說這個工具將協助生成 X.509 憑證和憑證簽署請求（CSR），可用於 Elastic Stack 的 SSL/TLS 設定。CA 模式將產生一個包含憑證和私鑰的 PKCS#12 檔案。

    ```text
    This tool assists you in the generation of X.509 certificates and certificate
    signing requests for use with SSL/TLS in the Elastic stack.

    The 'ca' mode generates a new 'certificate authority'
    This will create a new X.509 certificate and private key that can be used
    to sign certificate when running in 'cert' mode.

    Use the 'ca-dn' option if you wish to configure the 'distinguished name'
    of the certificate authority

    By default the 'ca' mode produces a single PKCS#12 output file which holds:
        * The CA certificate
        * The CA's private key

    If you elect to generate PEM format certificates (the -pem option), then the output will
    be a zip file containing individual files for the CA certificate and private key
    ```

2. 設定 CA 憑證檔名：

    - 可直接按 Enter 使用預設檔名 `elastic-stack-ca.p12`，或輸入自訂檔名。
    - 檔案會產生在 Elasticsearch 安裝目錄底下。

    ```text
    Please enter the desired output file [elastic-stack-ca.p12]: 
    ```

3. 設定 CA 憑證密碼，輸入的密碼後續會用於建立 SSL 憑證。

    ```text
    Enter password for elastic-stack-ca.p12 :
    ```

### 建立 SSL 憑證

1. 在 bin 目錄下執行憑證產生工具：

    ```bash
    elasticsearch-certutil http
    ```

2. 選擇是否產生 CSR，CSR（Certificate Signing Request）是向憑證機構申請正式 SSL 憑證時需要的請求檔案。如果使用自簽憑證或是使用現有的 CA 憑證，則輸入 `N`。

    ```text
    Generate a CSR? [y/N]
    ```

3. 選擇是否使用既有的 CA 憑證，此步驟會使用剛才建立的 CA 憑證，因此輸入 `Y`。

    ```text
    Use an existing CA? [y/N]
    ```

4. 輸入 CA 憑證的位置：
這邊要注意相對路徑：從 config 資料夾開始計算，所以要將憑證放在 config 底下，或使用 `/` 開頭的絕對路徑，例如 `/ELK/elasticsearch-8.17.1/elastic-stack-ca.p12`。

    ```text
    What is the path to your CA?

    Please enter the full pathname to the Certificate Authority that you wish to
    use for signing your new http certificate. This can be in PKCS#12 (.p12), JKS
    (.jks) or PEM (.crt, .key, .pem) format.
    CA Path: 
    ```

5. 輸入 CA 憑證密碼。

    ```text
    Reading a PKCS12 keystore requires a password.
    It is possible for the keystore's password to be blank,
    in which case you can simply press <ENTER> at the prompt
    Password for elastic-stack-ca.p12:
    ```

6. 輸入憑證有效期限。

    ```text
    You may enter the validity period in years (靘? 3Y), months (靘? 18M), or days (靘? 90D)

    For how long should your certificate be valid? [5y]
    ```

7. 這個選項主要用於決定是否為每個節點產生獨立的憑證，單節點環境輸入 `N`。

    ```text
    Do you wish to generate one certificate per node?

    If you have multiple nodes in your cluster, then you may choose to generate a
    separate certificate for each of these nodes. Each certificate will have its
    own private key, and will be issued for a specific hostname or IP address.

    Alternatively, you may wish to generate a single certificate that is valid
    across all the hostnames or addresses in your cluster.

    If all of your nodes will be accessed through a single domain
    (靘? node01.es.example.com, node02.es.example.com, etc) then you may find it
    simpler to generate one certificate with a wildcard hostname (*.es.example.com)
    and use that across all of your nodes.

    However, if you do not have a common domain name, and you expect to add
    additional nodes to your cluster in the future, then you should generate a
    certificate per node so that you can more easily generate new certificates when
    you provision new nodes.

    Generate a certificate per node? [y/N]
    ```

8. 輸入主機名稱。以下是常見的設定方式：

   - localhost - 如果只在本機存取。
   - 實際主機名稱。
   - *.domain.com - 如果想要使用萬用字元憑證。
   - 多個主機名稱 - 每行輸入一個，輸入完成後按 Enter。

    ```text
    Which hostnames will be used to connect to your nodes?

    These hostnames will be added as "DNS" names in the "Subject Alternative Name"
    (SAN) field in your certificate.

    You should list every hostname and variant that people will use to connect to
    your cluster over http.
    Do not list IP addresses here, you will be asked to enter them later.

    If you wish to use a wildcard certificate (for example *.es.example.com) you
    can enter that here.

    Enter all the hostnames that you need, one per line.
    When you are done, press <ENTER> once more to move on to the next step.
    ```

9. 確認主機名稱正確則輸入 `Y`。

    ```text
    You entered the following hostnames.

     - {hostname}

    Is this correct [Y/n]
    ```

10. 輸入 IP 位址。

    ```text
    Which IP addresses will be used to connect to your nodes?

    If your clients will ever connect to your nodes by numeric IP address, then you
    can list these as valid IP "Subject Alternative Name" (SAN) fields in your
    certificate.

    If you do not have fixed IP addresses, or not wish to support direct IP access
    to your cluster then you can just press <ENTER> to skip this step.

    Enter all the IP addresses that you need, one per line.
    When you are done, press <ENTER> once more to move on to the next step.
    ```

11. 確認 IP 位址正確則輸入 `Y`。

    ```text
    You entered the following IP addresses.

     - {ip}

    Is this correct [Y/n]
    ```

12. 是否要修改憑證資訊，如果沒要修改，則輸入 `N`。

    ```text
    Other certificate options

    The generated certificate will have the following additional configuration
    values. These values have been selected based on a combination of the
    information you have provided above and secure defaults. You should not need to
    change these values unless you have specific requirements.

    Key Name: {hostname}
    Subject DN: CN={hostname}
    Key Size: 2048

    Do you wish to change any of these options? [y/N]
    ```

13. 輸入 SSL 憑證密碼。

    ```text
    What password do you want for your private key(s)?

    Your private key(s) will be stored in a PKCS#12 keystore file named "http.p12".
    This type of keystore is always password protected, but it is possible to use a
    blank password.

    If you wish to use a blank password, simply press <enter> at the prompt below.
    Provide a password for the "http.p12" file:  [<ENTER> for none]
    ```

14. 再次輸入 SSL 憑證密碼。

    ```text
    If you wish to use a blank password, simply press <enter> at the prompt below.
    Provide a password for the "http.p12" file:  [<ENTER> for none]
    Repeat password to confirm:
    ```

15. 這個步驟是設定產生檔案的儲存位置。工具會產生的私鑰、公鑰證書，以及 Elastic Stack 產品的範例設定，並將這些檔案打包成一個 zip 壓縮檔。
如果想使用預設的檔名 `elasticsearch-ssl-http.zip`，只需按 Enter。

    ```text
    Where should we save the generated files?

    A number of files will be generated including your private key(s),
    public certificate(s), and sample configuration options for Elastic Stack products.

    These files will be included in a single zip archive.

    What filename should be used for the output zip file? [elasticsearch-ssl-http.zip]
    ```

16. 在 `config` 目錄建立 `certs` 資料夾，將 `http.p12` 解壓縮後放在其底下。

17. 建立 keystore 並加入憑證密碼：
    1. 建立 keystore：

        ```bash
        elasticsearch-keystore create
        ```

    2. 執行後會看到確認訊息：

        ```text
        Created elasticsearch keystore in {path}/config/elasticsearch.keystore
        ```

    3. 將 SSL 憑證密碼加入 keystore：

        ```bash
        elasticsearch-keystore add xpack.security.http.ssl.keystore.secure_password
        ```

    4. 輸入剛才建立 SSL 憑證時所設定的密碼。

        ```text
        Enter value for xpack.security.http.ssl.keystore.secure_password:
        ```

    5. 如果有設定 Truststore，則要額外將 CA 憑證密碼加入 keystore：

        ```bash
        elasticsearch-keystore add xpack.security.http.ssl.truststore.secure_password
        ```

    6. 輸入 CA 憑證的密碼。

        ```bash
        Enter value for xpack.security.http.ssl.truststore.secure_password:
        ```

18. 在 elasticsearch.yml 加入設定：

    ```yaml
    # 啟用 xpack 功能，目前較新的版本預設 true，不需要特別去設
    xpack.security.enabled: true
    xpack.security.http.ssl.enabled: true
    xpack.security.http.ssl.keystore.path: "certs/elasticsearch/http.p12"
    ```

::: tip
當設定 SSL 憑證時，有兩個憑證檔案相關設定：

- Keystore：用於存放伺服器的私鑰和憑證。
- Truststore：用於存放受信任的 CA 憑證。

使用 `elasticsearch-certutil http` 產生的 `http.p12` 檔案，已經包含了必要的 CA 憑證。因此可以將同一個 p12 檔案同時用於 Keystore 和 Truststore。如果有特殊需求，也可以使用不同的 p12 檔案，但請確保它們都是由同一個 CA 憑證所簽發。

系統預設會將 Truststore 設定作為 Keystore 的內容。
> 註：此設定僅適用於 SSL 憑證，對於多叢集間的 x.509 憑證設定，通常都需要單獨指定。

因此，如果沒有特別指定 `xpack.security.http.ssl.truststore.path`，系統會自動使用 `xpack.security.http.ssl.keystore.path` 的設定值。
:::

::: warning

- 目前測試 `elasticsearch-certutil ca` 產生出來的 CA 憑證不能作為 Truststore 使用。
- 在 elasticsearch.yml 中，`xpack.security.http.ssl.keystore.path` 的路徑必須相對於 `config` 目錄。如果使用指向其他位置的絕對路徑，系統會產生錯誤而無法啟動。
:::

### 建立 x.509 的憑證

::: warning
有關單節點環境中，是否需要設定 transport 的 x.509 憑證一事，目前我在 Elasticsearch 8.17.1 版本測試過三個環境：在我的本機不需設定就能啟用 SSL，但另兩台 Server 則必須設定才能啟用。目前尚未弄清楚造成不同結果的原因。建議依照各環境實際情況進行調整。
:::

1. 在 bin 目錄下執行憑證產生工具（這邊設定 5 年有效期，請依實際狀況調整）：

    ```bash
    elasticsearch-certutil cert --ca elastic-stack-ca.p12 –days 1825
    ```

    執行後會顯示憑證工具的功能說明，大致上是說這個工具將協助生成 X.509 憑證和憑證簽署請求（CSR），可用於 Elastic Stack 的 SSL/TLS 設定。

    ```bash
    This tool assists you in the generation of X.509 certificates and certificate
    signing requests for use with SSL/TLS in the Elastic stack.

    The 'cert' mode generates X.509 certificate and private keys.
        * By default, this generates a single certificate and key for use
           on a single instance.
        * The '-multiple' option will prompt you to enter details for multiple
           instances and will generate a certificate and key for each one
        * The '-in' option allows for the certificate generation to be automated by describing
           the details of each instance in a YAML file

        * An instance is any piece of the Elastic Stack that requires an SSL certificate.
          Depending on your configuration, Elasticsearch, Logstash, Kibana, and Beats
          may all require a certificate and private key.
        * The minimum required value for each instance is a name. This can simply be the
          hostname, which will be used as the Common Name of the certificate. A full
          distinguished name may also be used.
        * A filename value may be required for each instance. This is necessary when the
          name would result in an invalid file or directory name. The name provided here
          is used as the directory name (within the zip) and the prefix for the key and
          certificate files. The filename is required if you are prompted and the name
          is not displayed in the prompt.
        * IP addresses and DNS names are optional. Multiple values can be specified as a
          comma separated string. If no IP addresses or DNS names are provided, you may
          disable hostname verification in your SSL configuration.


        * All certificates generated by this tool will be signed by a certificate authority (CA)
          unless the --self-signed command line option is specified.
          The tool can automatically generate a new CA for you, or you can provide your own with
          the --ca or --ca-cert command line options.


    By default the 'cert' mode produces a single PKCS#12 output file which holds:
        * The instance certificate
        * The private key for the instance certificate
        * The CA certificate

    If you specify any of the following options:
        * -pem (PEM formatted output)
        * -multiple (generate multiple certificates)
        * -in (generate certificates from an input file)
    then the output will be be a zip file containing individual certificate/key files
    ```

2. 輸入 CA 憑證密碼，需注意 CA 憑證必需在根目錄底下。

    ```bash
    Enter password for CA (elastic-stack-ca.p12) :
    ```

3. 輸入 x.509 的憑證的檔名，可直接 enter 產出預設的檔名即可。

    ```bash
    Please enter the desired output file [elastic-certificates.p12]:
    ```

4. 輸入要設定的 .x509 密碼：

    ```bash
    Enter password for elastic-certificates.p12 :
    ```

5. 後續看到此訊息後，可以發現安裝目錄底下多了 elastic-certificates.p12 檔案。

    ```bash
    For client applications, you may only need to copy the CA certificate and
    configure the client to trust this certificate.
    ```

6. 建立 keystore 並加入憑證密碼：
    1. 設定 x.509 憑證的 Keystore 密碼。

        ```bash
        elasticsearch-keystore add xpack.security.transport.ssl.keystore.secure_password
        ```

    2. 輸入剛剛建立的 x.509 憑證的密碼。

        ```bash
        Enter value for xpack.security.transport.ssl.keystore.secure_password:
        ```

    3. 設定 x.509 憑證的 Truststore 密碼。

        ```bash
        elasticsearch-keystore add xpack.security.transport.ssl.keystore.secure_password
        ```

    4. 輸入剛剛建立的 x.509 憑證的密碼。

        ```bash
        Enter value for xpack.security.transport.ssl.truststore.secure_password:
        ```

7. 在 elasticsearch.yml 加入設定：

    ```yaml
    xpack.security.transport.ssl.enabled: true
    xpack.security.transport.ssl.verification_mode: certificate
    xpack.security.transport.ssl.keystore.path: certs/elastic-certificates.p12
    xpack.security.transport.ssl.truststore.path: certs/elastic-certificates.p12
    ```

### 使用者管理

建立超級使用者：

```bash
elasticsearch-users useradd {username} -p {password} -r superuser
```

- 密碼至少 6 碼。
- 使用者資訊儲存於 `config/users` 與 `config/users_roles`。

其他使用者管理指令：

```bash
elasticsearch-users list            # 列出使用者
elasticsearch-users passwd {username}   # 變更密碼
elasticsearch-users userdel {username}  # 刪除使用者
```

## 啟動服務

### 手動啟動

1. 以系統管理員權限開啟命令提示字元。
2. 切換至 bin 目錄：

    ```batch
    cd D:\ELK\elasticsearch-8.17.1\bin
    ```

3. 執行：

    ```batch
    elasticsearch.bat
    ```

4. 等待啟動完成後，開啟瀏覽器測試：<http://localhost:9200> 或 <https://localhost:9200>。

    若 JSON 回應中 `cluster_uuid` 顯示 `_na_`，表示叢集未正確啟動，需檢查 cluster.initial_master_nodes 設定。

### 註冊 Windows 服務

註冊服務避免視窗關閉或忘記啟動：

```batch
elasticsearch-service.bat install
```

註冊後可在 Windows 服務中找到 `Elasticsearch-8.17.1（elasticsearch-service-x64）`，將其設為`自動`。

## 異動歷程

- 2025-01-23 初版文件建立。
- 2025-03-05 增加 x.509 憑證設定。
- 2025-03-18 補充 keystore 描述。
