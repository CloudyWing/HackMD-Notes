---
title: "使用 Docker Compose 架設與配置 Nginx"
date: 2025-11-27
lastmod: 2025-11-27
description: "紀錄使用 Docker Compose 快速部署 Nginx 的配置過程。簡介 Nginx 架構 (Main, Events, HTTP Context) 並著重於 Docker Compose V2 語法的實作範例。"
tags: ["Docker","Nginx"]
---

# 使用 Docker Compose 架設與配置 Nginx

以前常聽到 Nginx，只知道它常用來做反向代理。之前公司有遇過 Team Leader 請維運幫忙架設，維運沒空，那位 Team Leader 就自己搞定了，看起來對資深工程師來說可能算是基本功，所以想稍微研究一下。至於 Elasticsearch 的 .NET 查詢篇，等 12 月再來開工。

照慣例不想在本機安裝，所以使用 Docker 來建置環境，方便測試和學習。不過查了一下發現 Nginx 的設定還蠻複雜的，所以這篇筆記主要著重在 Docker Compose 的部分，順便測試一下 Docker Compose V2 語法。

## Nginx 簡介

Nginx（發音為「engine-x」）是 Web Server，主要用來：

1. **提供靜態檔案**：HTML、CSS、JavaScript、圖片等。
2. **Reverse Proxy（反向代理）**：將請求轉發到後端應用程式。

## Nginx 基本設定

Nginx 的主要設定檔為 `/etc/nginx/nginx.conf`，容器啟動時會讀取這個檔案來決定 Nginx 的行為。

## Nginx 架構階層

Nginx 設定檔由多個 context 組成，每個 context 對應一個區塊（block），由外到內可分為以下層級：

### Main Context（最外層）

位於設定檔的最外層，定義全域設定。

```
main context（最外層）
├── user nginx;
├── worker_processes auto;
├── error_log /var/log/nginx/error.log;
├── pid /run/nginx.pid;
│
├── events { }     # 事件處理設定
├── http { }       # HTTP 相關設定
├── mail { }       # 郵件代理設定（選用）
└── stream { }     # TCP/UDP 代理設定（選用）
```

**用途：** 設定 Nginx 程序的執行參數，如 worker 數量、使用者權限、PID 檔案位置等。

### Events Context

定義 Nginx 如何處理連線。

**用途：** 設定連線處理的參數，如每個 worker 可處理的連線數、事件處理模型等。

### HTTP Context

定義 HTTP 伺服器的全域設定。

```
http {
    # HTTP 全域設定
    │
    ├── map { }         # 變數映射（可以有多個）
    │
    ├── server { }      # 虛擬主機（可以有多個）
    ├── server { }
    │
    ├── upstream { }    # 後端伺服器群組（可以有多個）
    └── upstream { }
}
```

**用途：** 設定 HTTP 相關的全域參數，如 MIME 類型、log 格式、gzip 壓縮等。在這個層級定義的設定會套用到所有虛擬主機。

## 常用區塊與指令

### Server 區塊

`server` 區塊定義一個虛擬主機，用於處理特定網域或 port 的請求。

**放置位置：** 只能放在 `http` 區塊內，可以定義多個 `server` 區塊。

**基本結構：**

```nginx
server {
    listen 80;                    # 監聽的 port
    server_name example.com;      # 網域名稱
    
    location / {                  # 路徑匹配規則
        # 處理方式
    }
}
```

在 `server` 區塊內，主要透過 `location` 指令來定義不同路徑的處理方式。

### Location 區塊

#### 匹配邏輯

`location /` 使用**前綴匹配**，會匹配所有以 `/` 開頭的路徑。由於所有 URL 路徑都以 `/` 開頭，因此 `location /` 實際上會匹配**所有請求**，通常作為**預設規則**（fallback）使用。

**基本前綴匹配：**

Nginx 會選擇**最具體（最長）的匹配規則**。

```nginx
server {
    listen 80;
    server_name localhost;
    
    location / {
        # 優先級較低，匹配所有路徑
        return 200 "根路徑\n";
    }
    
    location /api/ {
        # 優先級較高，/api/ 比 / 更具體
        return 200 "API 路徑\n";
    }
}
```

**實際運作：**

```
請求：http://example.com/
→ 匹配 location /

請求：http://example.com/about.html
→ 匹配 location /

請求：http://example.com/api/users
→ 匹配 location /api/（更具體）
```

#### 完整匹配規則與優先級

Location 支援多種匹配修飾符，優先級如下：

1. **精確匹配** `=`：完全相同才匹配（最高優先）
2. **前綴強匹配** `^~`：前綴匹配成功後，停止搜尋正規表示式
3. **正規表示式（區分大小寫）** `~`：按定義順序，先匹配先使用
4. **正規表示式（不區分大小寫）** `~*`：按定義順序，先匹配先使用
5. **普通前綴匹配**：最長的優先
6. **通用匹配** `/`：預設規則（最低優先）

**實測範例：**

```nginx
server {
    listen 80;
    server_name localhost;
    
    # 設定預設 Content-Type
    default_type "text/plain; charset=utf-8";
    
    # 1. exact match（最高優先）
    location = /test123 {
        return 200 "exact_match\n";
    }
    
    # 2. prefix strong（匹配後停止搜尋正規表示式）
    location ^~ /test999 {
        return 200 "prefix_strong\n";
    }
    
    # 3. regex case-sensitive（區分大小寫）
    location ~ ^/test[0-9]+$ {
        return 200 "regex_sensitive\n";
    }
    
    # 4. regex case-insensitive（不區分大小寫）
    location ~* ^/TEST[0-9]+$ {
        return 200 "regex_insensitive\n";
    }
    
    # 5. normal prefix（普通前綴匹配）
    location /test {
        return 200 "prefix_normal\n";
    }
    
    # 6. fallback（預設規則）
    location / {
        return 200 "root\n";
    }
}
```

**測試結果：**

```bash
# 精確匹配（最高優先）
curl http://localhost/test123
→ "exact_match"

# 正規表示式（區分大小寫）
curl http://localhost/test456
→ "regex_sensitive"

# 正規表示式（不區分大小寫）
curl http://localhost/TEST456
→ "regex_insensitive"

curl http://localhost/TEST789
→ "regex_insensitive"

# 前綴強匹配（停止正規表示式搜尋）
curl http://localhost/test999
→ "prefix_strong"

# 普通前綴
curl http://localhost/test
→ "prefix_normal"

curl http://localhost/testaaa
→ "prefix_normal"

# 預設規則
curl http://localhost/other
→ "root"
```

**測試匹配規則：**

```bash
# 查看 Nginx 載入的設定並篩選 location 規則
nginx -T | grep -A5 "/test"
```

::: warning

1. 如果同時定義 `location /test` 和 `location ^~ /test`，Nginx 會因為規則衝突而報錯，應選擇其中一種使用。
2. 測試時建議使用 `curl` 指令，因為某些瀏覽器會根據歷史記錄自動轉換 URL 大小寫。例如先存取 `http://localhost/test123`，後續輸入 `http://localhost/TEST123` 時，瀏覽器可能自動轉換為小寫。
:::

#### 處理方式

**1. 提供靜態檔案**

直接從檔案系統讀取檔案並回應：

```nginx
server {
    listen 80;
    server_name example.com;
    
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ =404;
    }
}
```

**指令說明：**

* `root`：指定靜態檔案的根目錄。
* `index`：指定預設的索引檔案，當請求的是目錄時，會依序尋找這些檔案。
* `try_files`：依序嘗試尋找檔案、目錄，若都不存在則回傳 404 錯誤。

**運作範例：**

假設根目錄結構如下：

```
/usr/share/nginx/html/
├── index.html
├── about.html
└── docs/
    └── index.html
```

請求處理流程：

```
請求：http://example.com/
→ 讀取 /usr/share/nginx/html/index.html

請求：http://example.com/about.html
→ 讀取 /usr/share/nginx/html/about.html

請求：http://example.com/docs/
→ 讀取 /usr/share/nginx/html/docs/index.html

請求：http://example.com/notfound.html
→ 回傳 404 錯誤
```

**2. Reverse Proxy（反向代理）**

將請求轉發到後端應用程式，使用 `proxy_pass` 指令：

```nginx
server {
    listen 80;
    server_name example.com;
    
    location / {
        proxy_pass http://backend:8080;
    }
}
```

#### Proxy Pass 指令

`proxy_pass` 是 Nginx 作為反向代理的核心指令，用於將請求轉發到後端伺服器。

**放置位置：** 只能放在 `location`、`if in location`、`limit_except` 區塊內。

**基本用法：**

```nginx
location / {
    proxy_pass http://backend:8080;
}
```

**Trailing Slash 的影響：**

`proxy_pass` 的 URI 是否包含 trailing slash（結尾斜線）會影響轉發行為。

**情況 1：proxy_pass 沒有 URI（無 trailing slash 或路徑）**

```nginx
location /app/ {
    # 不含路徑，完整轉發
    proxy_pass http://backend;
}
```

完整的原始 URI 會被傳遞到後端：

```
請求：http://example.com/app/test
轉發：http://backend/app/test
```

**情況 2：proxy_pass 有 URI（包含路徑，即使只是 `/`）**

```nginx
location /app/ {
    # 含路徑 /，進行替換
    proxy_pass http://backend/;
}
```

location 匹配的部分會被 proxy_pass 的 URI 取代：

```
請求：http://example.com/app/test
轉發：http://backend/test      （/app/ 被 / 取代）
```

### Map 指令

`map` 指令用於建立自定義變數，根據輸入變數的值來設定輸出變數。

在 `http` 區塊中定義的 `map` 變數是全域的，所有 `server` 區塊都能使用。若定義多個 `map` 且**輸出變數名稱相同**，Nginx 會以**最後載入的定義為準**，前面的定義會被捨棄。

**放置位置：** 只能放在 `http` 區塊內。

**基本語法：**

```nginx
map $input_variable $output_variable {
    value1  result1;
    value2  result2;
    default default_result;
}
```

**簡單範例：**

```nginx
http {
    # 根據請求方法決定變數值
    map $request_method $is_post {
        POST    "yes";
        default "no";
    }
}
```

**使用正規表示式：**

```nginx
map $http_user_agent $browser_type {
    ~Chrome         "chrome";      # 區分大小寫，只匹配 Chrome
    ~*firefox       "firefox";     # 不區分大小寫，匹配 Firefox、firefox、FIREFOX
    ~*mobile        "mobile";      # 不區分大小寫，匹配 Mobile、mobile
    default         "default";
}
```

匹配順序是由上往下，第一個匹配成功就停止。

**關於變數：**

除了使用 `map` 建立自定義變數外，Nginx 也內建許多變數，例如 `$remote_addr`（客戶端 IP）、`$host`（主機名稱）、`$request_uri`（請求 URI）等。完整的變數列表可以參考 [Alphabetical index of variables](https://nginx.org/en/docs/varindex.html)。

## 預設的 nginx.conf

可以使用以下指令查看預設的 nginx.conf：

```bash
docker run --rm nginx cat /etc/nginx/nginx.conf
```

以下是 Docker 映像 `nginx:1.29.3` 的預設設定檔內容，其他版本可能略有差異：

```nginx
user  nginx;
worker_processes  auto;

error_log  /var/log/nginx/error.log notice;
pid        /run/nginx.pid;


events {
    worker_connections  1024;
}


http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile        on;
    #tcp_nopush     on;

    keepalive_timeout  65;

    #gzip  on;

    include /etc/nginx/conf.d/*.conf;
}
```

注意最後一行 `include /etc/nginx/conf.d/*.conf;`，這表示所有放在 `/etc/nginx/conf.d/` 目錄下的 `.conf` 檔案都會被載入到 `http` 區塊內。

**實際效果：**

```nginx
http {
    # nginx.conf 的 HTTP 設定
    include /etc/nginx/mime.types;
    access_log /var/log/nginx/access.log;
    
    # --- 以下是 conf.d/default.conf 的內容被插入這裡 ---
    server {
        listen 80;
        server_name localhost;
        # ...
    }
    # --- 插入結束 ---
}
```

因此，只需要在 `conf.d` 目錄建立網站設定檔（如 `default.conf`），這些設定會自動被載入到 `http` 區塊內。預設的 main context 和 events 設定通常已經足夠使用。

### 修改 nginx.conf 的情境

**大多數情況下不需要修改 nginx.conf**，除非要調整以下設定：

**Main Context 的設定：**

* `worker_processes`：Worker 程序數量。
* `worker_rlimit_nofile`：每個 Worker 可開啟的檔案數。
* `user`：執行 Worker 的使用者。

**Events 區塊的設定：**

* `worker_connections`：每個 Worker 的連線數。
* `use`：事件處理模型（如 epoll）。

如果需要修改這些設定，可以使用以下指令將預設的 nginx.conf 複製出來：

```bash
docker run --rm nginx cat /etc/nginx/nginx.conf > volumes/config/nginx.conf
```

### 使用設定產生器

如果不確定設定檔該如何撰寫，可以使用 [DigitalOcean 的 Nginx 設定產生器](https://www.digitalocean.com/community/tools/nginx)來輔助產生基本的設定檔。這個工具提供圖形化介面，可以根據需求選擇不同的設定選項，例如：

* 靜態網站或 Reverse Proxy。
* SSL/HTTPS 設定。
* PHP 支援。
* 壓縮與快取設定。

產生的設定檔可以直接複製使用，再根據實際需求微調。

## 在 conf.d 建立網站設定

Nginx 的 Docker 映像啟動時，會在 `/etc/nginx/conf.d/` 目錄有內建一個 `default.conf` 檔案作為預設設定。以下是預設的 `default.conf` 內容：

```nginx
server {
    listen       80;
    server_name  localhost;

    #access_log  /var/log/nginx/host.access.log  main;

    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
    }

    #error_page  404              /404.html;

    # redirect server error pages to the static page /50x.html
    #
    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }

    # proxy the PHP scripts to Apache listening on 127.0.0.1:80
    #
    #location ~ \.php$ {
    #    proxy_pass   http://127.0.0.1;
    #}

    # pass the PHP scripts to FastCGI server listening on 127.0.0.1:9000
    #
    #location ~ \.php$ {
    #    root           html;
    #    fastcgi_pass   127.0.0.1:9000;
    #    fastcgi_index  index.php;
    #    fastcgi_param  SCRIPT_FILENAME  /scripts$fastcgi_script_name;
    #    include        fastcgi_params;
    #}

    # deny access to .htaccess files, if Apache's document root
    # concurs with nginx's one
    #
    #location ~ /\.ht {
    #    deny  all;
    #}
}
```

實務上會建立自己的設定檔來覆寫或替換預設設定。

### 指令的繼承與覆寫

許多 Nginx 指令可以在不同層級設定，子層級的設定會覆寫父層級的設定。以 log 設定為例：

`access_log` 和 `error_log` 可以在多個層級設定：

| 指令 | 可設定位置 |
|------|-----------|
| `error_log` | main, http, mail, stream, server, location |
| `access_log` | http, server, location, if in location, limit_except |

如果在 `server` 或 `location` 設定 log 路徑，會覆寫上層的設定。如果沒有設定，會繼承上層（http 或 main）的設定。

**範例：**

```nginx
# nginx.conf
http {
    access_log /var/log/nginx/access.log;  # 預設路徑
    
    # conf.d/site-a.conf
    server {
        server_name site-a.com;
        access_log /var/log/nginx/site-a.log;  # 覆寫，使用獨立的 log
    }
    
    # conf.d/site-b.conf
    server {
        server_name site-b.com;
        # 沒設定，繼承 http 的 /var/log/nginx/access.log
    }
}
```

### Map 變數的跨檔案共享

在 `http` 區塊中定義的 `map` 變數是全域的，所有 `server` 區塊都能使用。由於 Nginx 會載入 `conf.d/*.conf` 中的所有檔案，不同 conf 檔案中定義的 `map` 變數會共享在同一個命名空間中。

Nginx 按照**檔名的字母順序**載入 conf 檔案。由於前述提到重複定義相同輸出變數會被覆蓋，建議將所有 `map` 定義集中在一個獨立的 conf 檔案中，避免預期外的覆蓋問題。

**檔案結構範例：**

```
volumes/config/conf.d/
├── maps.conf        # 所有 map 定義
├── api.conf         # API 服務設定
└── default.conf     # 預設網站設定
```

## 實作範例

### 靜態網站範例

#### 建立資料目錄

首先建立必要的資料目錄，用於存放 Nginx 設定檔、網站檔案和 log 檔案。

```bash
# 建立資料目錄
mkdir -p volumes/config/conf.d
mkdir -p volumes/html
mkdir -p volumes/logs
```

#### 基本 Docker Compose 設定

建立 `compose.yaml` 檔案：

```yaml
services:
  nginx:
    image: nginx:latest
    container_name: nginx
    restart: always
    ports:
      - "80:80"
    volumes:
      # 如果需要覆寫 main context 設定，可以取消下面這行的註解
      # - ./volumes/config/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./volumes/config/conf.d:/etc/nginx/conf.d:ro
      - ./volumes/html:/usr/share/nginx/html:ro
      - ./volumes/logs:/var/log/nginx
    environment:
      - TZ=Asia/Taipei
```

#### volumes 掛載說明

```yaml
volumes:
  - ./volumes/config/conf.d:/etc/nginx/conf.d:ro      # 設定檔（唯讀）
  - ./volumes/html:/usr/share/nginx/html:ro           # 靜態檔案（唯讀）
  - ./volumes/logs:/var/log/nginx                     # log 目錄（需要寫入）
```

**`:ro`（read-only）的使用：**

為什麼要加 `:ro`？

* 防止容器內的程序意外修改主機檔案。
* 保護設定檔不被竄改。
* 明確表達這些目錄只用來讀取。

舉例來說，當容器啟動時，Nginx 會檢查 `default.conf` 是否為官方預設的設定檔，如果是，會嘗試加上 `listen [::]:80;` 使之支援 IPv6。如果有加上 `:ro`，就可以避免被修改。

哪些不能加 `:ro`？

* log 目錄：Nginx 必須能寫入 log。
* 上傳目錄：如果網站允許使用者上傳檔案。
* 快取目錄：Nginx 需要寫入快取資料。

#### 建立網站設定檔

在 `volumes/config/conf.d` 目錄下建立 `default.conf`：

```nginx
server {
    listen 80;        # 監聽 IPv4
    listen [::]:80;   # 監聽 IPv6
    server_name localhost;
    
    # 設定根目錄
    root /usr/share/nginx/html;
    index index.html index.htm;
    
    # 字元編碼
    charset utf-8;
    
    # log 路徑
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;
    
    # 主要位置設定
    location / {
        try_files $uri $uri/ =404;
    }
    
    # 禁止存取隱藏檔案
    location ~ /\. {
        deny all;
    }
}
```

#### 建立測試網頁

在 `volumes/html` 目錄下建立 `index.html`：

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nginx 測試頁面</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            text-align: center;
        }
        h1 {
            color: #2c3e50;
            margin-bottom: 20px;
        }
        p {
            color: #555;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>✓ Nginx 運作成功</h1>
        <p>這是使用 Docker Compose 架設的 Nginx 測試環境</p>
    </div>
</body>
</html>
```

#### 驗證網頁

執行以下指令啟動容器：

```bash
docker compose up -d
```

在瀏覽器輸入 `http://localhost/`，即可看到測試網頁。

#### 測試與重新載入設定檔

修改設定檔後，可以在**執行中**的容器使用以下指令檢查語法，避免因設定錯誤導致服務無法重新載入。

```bash
# 測試設定檔語法
docker compose exec nginx nginx -t

# 重新載入設定檔（不中斷服務）
docker compose exec nginx nginx -s reload
```

建議先用 `nginx -t` 測試語法，確認無誤後再執行 `nginx -s reload` 重新載入。

### Reverse Proxy 範例

將請求轉發到後端應用程式。官方的 Reverse Proxy 範例說明可以參考 [NGINX Reverse Proxy](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/) 和 [WebSocket proxying](https://nginx.org/en/docs/http/websocket.html)。

以下是整合的參考範例：

**volumes/config/conf.d/maps.conf：**

```nginx
# WebSocket 支援：定義 Connection 升級變數
map $http_upgrade $connection_upgrade {
    ''      close;
    default upgrade;
}
```

**volumes/config/conf.d/default.conf：**

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name localhost;

    location / {
        # 轉發到 web 容器的應用程式
        proxy_pass http://web:8080/;
        
        # === 基本 Header（必要） ===
        # 傳遞原始主機名稱
        proxy_set_header Host $host;
        
        # 傳遞真實客戶端 IP
        proxy_set_header X-Real-IP $remote_addr;
        
        # 傳遞客戶端 IP 鏈（如果經過多層代理）
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # 傳遞原始協定（http 或 https）
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # === 完整轉發資訊（選用） ===
        # 傳遞原始主機名稱（專門用於 X-Forwarded 系列）
        # proxy_set_header X-Forwarded-Host $host;
        
        # 傳遞原始 port
        # 注意：$server_port 是 Nginx 監聽的 port
        # proxy_set_header X-Forwarded-Port $server_port;
        
        # === WebSocket 支援（選用） ===
        # WebSocket 需要 HTTP/1.1 協定
        # proxy_http_version 1.1;
        
        # 傳遞 Upgrade Header
        # proxy_set_header Upgrade $http_upgrade;
        
        # 根據是否有 Upgrade Header 來設定 Connection
        # proxy_set_header Connection $connection_upgrade;
        
        # WebSocket 長連線 timeout（預設 60 秒，這裡設為 24 小時）
        # proxy_read_timeout 86400s;
        
        # === 請求追蹤（選用） ===
        # 傳遞唯一請求 ID，用於日誌追蹤、問題排查
        # 需要 Nginx 1.11.0+
        # proxy_set_header X-Request-ID $request_id;
        
        # === Timeout 設定（選用） ===
        # 連接應用程式的超時時間（預設 60 秒）
        # 如果應用程式啟動慢或網路不穩定，可能需要調整
        # proxy_connect_timeout 60s;
        
        # 傳送請求到應用程式的超時時間（預設 60 秒）
        # 如果上傳大檔案，需要增加此值
        # proxy_send_timeout 60s;
        
        # 從應用程式讀取回應的超時時間（預設 60 秒）
        # 如果應用程式處理時間較長（報表產生、資料匯出等），需要調整此值
        # 注意：如果啟用 WebSocket，應使用上方的 proxy_read_timeout 86400s
        # proxy_read_timeout 60s;
    }
}
```

#### 搭配網站服務的 Docker Compose

```yaml
services:
  nginx:
    image: nginx:latest
    container_name: nginx
    ports:
      - "80:80"
    volumes:
      - ./volumes/config/conf.d:/etc/nginx/conf.d:ro
    depends_on:
      - web
    environment:
      - TZ=Asia/Taipei
      
  web:
    image: mcr.microsoft.com/dotnet/samples:aspnetapp
    container_name: web
    environment:
      - TZ=Asia/Taipei
    # 不對外開放 port，僅供 Nginx 內部存取
```

這裡直接使用 .NET 提供的範例映像，詳細內容可以參考官方的 GitHub [.NET container samples](https://github.com/dotnet/dotnet-docker/tree/main/samples)。

這個映像是 Razor Pages 的網頁應用程式，容器啟動後，在瀏覽器輸入 `http://localhost/` 即可查看網頁內容。

### Template 與環境變數範例

Nginx 官方映像從 1.19 版本開始支援 template 功能，詳細使用方式可以參考 [Nginx 官方 Docker Hub](https://hub.docker.com/_/nginx#using-environment-variables-in-nginx-configuration-new-in-119)。

這個功能可以藉由定義 template 檔案，在 Docker Compose 中使用環境變數方式設定，讓使用者可以專注在少數設定上。

#### 修改 Docker Compose

```yaml
services:
  nginx:
    image: nginx:latest
    ports:
      - "80:80"
    volumes:
      - ./volumes/templates:/etc/nginx/templates
      - ./volumes/config/templates.d:/etc/nginx/conf.d  # 用於查看產生的 conf 檔案
    environment:
      - TZ=Asia/Taipei
      - NGINX_HOST=localhost
      - NGINX_PORT=80
```

#### 建立 template 檔案

在 `volumes/templates` 目錄下建立 `default.conf.template`：

```nginx
server {
    listen       ${NGINX_PORT};
    server_name  ${NGINX_HOST};

    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
    }
}
```

容器啟動時會自動將環境變數替換到設定檔中，產生的結果如下：

```nginx
server {
    listen       80;
    server_name  localhost;

    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
    }
}
```

#### 注意事項

使用 template 方式時，環境變數的替換只在**容器啟動時**進行。因此：

* ✅ 修改環境變數後，需要重新啟動容器：`docker compose up -d`
* ❌ 無法使用 `docker compose exec nginx nginx -s reload` 重新載入設定。

如果需要頻繁調整設定，建議使用直接掛載 conf 檔案的方式。

## 參考資源

* [Nginx 官方文件](https://nginx.org/en/docs/)

## 異動歷程

* 2025-11-27 初版文件建立。
