# 使用 Docker Compose 安裝 Elasticsearch 與 Kibana

離上次筆記不知不覺又隔了一個月，最近都在運動健身，有點懶惰。

最近想要練習 Elasticsearch，但不想在本機直接安裝這些服務，所以照慣例使用 Docker 來建置環境。這邊是從 Elastic 官方 [GitHub](https://github.com/elastic/elasticsearch/tree/main/docs/reference/setup/install/docker) 的 Docker-Compose 範例修改成的單節點設定。

## 環境設定

### 建立資料目錄

首先建立必要的資料目錄，並設定正確的權限，避免之後因為權限問題導致服務無法啟動。

```bash
# 建立資料目錄
mkdir -p volumes/elasticsearch/data

# 設定權限 (1000 是 Elasticsearch 容器內的使用者 ID)
sudo chown -R 1000:1000 volumes
```

:::info
* 這裡刻意不建立 logs 的 volume，因為在升級或遷移 Elasticsearch 時，log 檔案的權限問題可能會造成啟動失敗。
* Kibana 本身不儲存重要資料，所以沒建立 data 的 volume。
:::

## 設定檔案

### 環境變數設定 (.env)

建立 `.env` 檔案來管理環境變數：

```env
# Password for the 'elastic' user (至少 6 個字元)
ELASTIC_PASSWORD=YourPassword

# Password for the 'kibana_system' user (至少 6 個字元)
KIBANA_PASSWORD=Wing1205

# Version of Elastic products
STACK_VERSION=9.1.4

# Set the cluster name
CLUSTER_NAME=docker-cluster

# Set to 'basic' or 'trial' to automatically start the 30-day trial
LICENSE=basic
#LICENSE=trial

# Port to expose Elasticsearch HTTP API to the host
ES_PORT=9200
#ES_PORT=9200

# Port to expose Kibana to the host
KIBANA_PORT=5601
#KIBANA_PORT=80

# Increase or decrease based on the available host memory (in bytes)
# 1GB = 1073741824 bytes
MEM_LIMIT=2147483648
```

### Docker Compose 設定

建立 `docker-compose.yml` 檔案：

```yaml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:${STACK_VERSION}
    container_name: elasticsearch
    restart: always
    environment:
      - node.name=elasticsearch
      - cluster.name=${CLUSTER_NAME}
      - discovery.type=single-node
      - ELASTIC_PASSWORD=${ELASTIC_PASSWORD}
      - bootstrap.memory_lock=true
      - xpack.security.enabled=true
      - xpack.security.http.ssl.enabled=false
      - xpack.security.transport.ssl.enabled=false
      - xpack.license.self_generated.type=${LICENSE}
      - ES_JAVA_OPTS=-Xms512m -Xmx512m -Xlog:gc:stdout:time,level,tags
    volumes:
      - ./volumes/elasticsearch/data:/usr/share/elasticsearch/data
    ports:
      - ${ES_PORT}:9200
    mem_limit: ${MEM_LIMIT}
    ulimits:
      memlock:
        soft: -1
        hard: -1
    healthcheck:
      test: ["CMD-SHELL", "curl -s -u elastic:${ELASTIC_PASSWORD} http://localhost:9200/_cluster/health | grep -q 'yellow\\|green'"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s

  kibana:
    depends_on:
      elasticsearch:
        condition: service_healthy
    image: docker.elastic.co/kibana/kibana:${STACK_VERSION}
    container_name: kibana
    restart: always
    environment:
      - SERVER_NAME=kibana
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
      - ELASTICSEARCH_USERNAME=kibana_system
      - ELASTICSEARCH_PASSWORD=${KIBANA_PASSWORD}
    ports:
      - ${KIBANA_PORT}:5601
    mem_limit: ${MEM_LIMIT}
    healthcheck:
      test: ["CMD-SHELL", "curl -s -I http://localhost:5601 | grep -q 'HTTP/1.1 302 Found'"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s

  setup:
    image: docker.elastic.co/elasticsearch/elasticsearch:${STACK_VERSION}
    container_name: elasticsearch-setup
    user: "0"
    command: >
      bash -c '
        echo "等待 Elasticsearch 啟動...";
        until curl -s -u elastic:${ELASTIC_PASSWORD} http://elasticsearch:9200/_cluster/health?pretty | grep -q "yellow\|green"; do
          echo "Elasticsearch 尚未就緒，等待中...";
          sleep 10;
        done;
        echo "設定 kibana_system 使用者密碼...";
        curl -s -X POST -u elastic:${ELASTIC_PASSWORD} -H "Content-Type: application/json" \
          http://elasticsearch:9200/_security/user/kibana_system/_password \
          -d "{\"password\":\"${KIBANA_PASSWORD}\"}";
        echo "初始化完成！";
      '
    depends_on:
      elasticsearch:
        condition: service_healthy
```

## 設定說明

### 配置項目

* **單節點模式**：`discovery.type=single-node` 適合開發環境。
* **SSL 關閉**：為了簡化設定，關閉了 HTTP 和 Transport 層的 SSL。
* **記憶體鎖定**：`bootstrap.memory_lock=true` 防止 JVM heap 被交換到磁碟。
* **健康檢查**：確保服務正常啟動後才啟動相依服務。
* **kibana_system 密碼**：Elasticsearch 會自動建立 `kibana_system` 帳號，但密碼是隨機字串，所以 setup 服務透過 API 幫設定指定密碼。

### 常見問題與解法

* **記憶體不足**：
  * 調整 .env 中的 MEM_LIMIT，或修改 ES_JAVA_OPTS。
  * 建議 JVM Heap 設定為主機記憶體的 50% 左右。

* **權限問題**：
  * 確認 `volumes/elasticsearch/data` 權限為 UID 1000:1000。
  * 若仍遇到錯誤，可 `sudo chmod -R 777 volumes/elasticsearch/data` 測試（僅限開發環境）。


## 異動歷程

* 2025-09-24 初版文件建立。
* 2025-11-04 修正 YAML 檔遺漏 restart 設定導致重開機會自動啟動之問題。

###### tags: `Docker` `ELK` `Elasticsearch` `Kibana`