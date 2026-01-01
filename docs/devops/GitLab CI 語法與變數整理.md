---
title: "GitLab CI 語法與變數整理"
date: 2025-04-07
lastmod: 2025-04-07
description: "整理 GitLab CI/CD (`.gitlab-ci.yml`) 常用語法與關鍵字。涵蓋 Stages, Jobs, Rules, Only/Except 定義，以及預定義變數 (Predefined Variables) 的使用參考。"
tags: ["Git","GitLab"]
---

# GitLab CI 語法與變數整理

最近又開始研究 GitLab CI，其實這項工作早就開始進行的，但因為一直斷斷續續地研究，導致我常常需要重新查某些語法的用途。乾脆讓 Claude 幫我把一些常用語法整理下來，方便日後查閱。

## 基本結構

GitLab CI 的設定檔案是 `.gitlab-ci.yml`，這個檔案定義了你的專案在 GitLab CI pipeline 中應該執行的任務。

一般檔案命名如下：

* 主要 CI/CD 設定檔案: `.gitlab-ci.yml` (固定名稱)。
* 包含檔案 (includes): 通常使用 `.gitlab-ci-*.yml` 格式，例如：
  * `.gitlab-ci-deploy.yml`。
  * `.gitlab-ci-build.yml`。
  * `.gitlab-ci-test.yml`。

## Stages (階段)

Stages 定義了 jobs 執行的階段順序：

```yaml
stages:
  - build
  - test
  - deploy
```

每個 stage 中的所有 jobs 會並行執行，而且必須全部成功後才會進入下一個 stage。

**常見的 stages 命名（依執行順序）：**

* `build` - 建構階段。
* `test` - 測試階段。
* `quality` - 程式碼品質檢查。
* `security` - 安全性檢查。
* `publish` - 發佈至登記檔 (registry)。
* `deploy` - 部署至環境。
* `notify` - 通知。
* `cleanup` - 清理資源。

## Jobs (任務)

Jobs 是實際執行工作的單位：

```yaml
build-job:
  stage: build
  script:
    - echo "Building the app..."
    - mkdir build
    - cd build
    - cmake ..
```

**命名慣例：**
Jobs 通常遵循「動作-物件-環境」的模式，例如：

* `build-app`。
* `test-api`。
* `deploy-staging`。

## Rules (規則)

Rules 可以定義在什麼條件下 job 會被執行：

```yaml
test-job:
  stage: test
  script:
    - echo "Running tests..."
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
      when: always
    - when: never
```

規則按照順序評估，當一個規則符合時，就會套用該規則的 `when` 值來決定 job 是否執行。

## Only/Except (僅在/排除)

這是較舊的語法，但仍然有效，可以根據分支或標籤來限制 job 的執行：

```yaml
deploy-job:
  stage: deploy
  script:
    - echo "Deploying application..."
  only:
    - main
    - tags
```

::: info
GitLab 官方推薦使用 `rules` 而非 `only/except`，因為 `rules` 提供更多靈活性和控制能力。同樣功能的 `rules` 寫法如下：

```yaml
deploy-job:
  stage: deploy
  script:
    - echo "Deploying application..."
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
      when: always
    - if: $CI_COMMIT_TAG
      when: always
    - when: never
```

:::

## Variables (變數)

可以定義全域或 job 特定的變數：

```yaml
variables:
  GLOBAL_VAR: "global value"

test-job:
  variables:
    JOB_SPECIFIC_VAR: "job specific value"
  script:
    - echo $GLOBAL_VAR
    - echo $JOB_SPECIFIC_VAR
```

**命名慣例：**
變數通常使用全大寫並以底線區隔，例如：

* `APP_VERSION`。
* `DOCKER_IMAGE_NAME`。
* `DATABASE_URL`。

::: info
在 GitLab CI 中使用變數時，可以用 `$VARIABLE_NAME` 或 `${VARIABLE_NAME}` 的語法來引用變數。當變數名稱需要與其他文字相連時，可以使用大括弧語法 `${VARIABLE_NAME}` 來明確界定變數名稱的範圍，避免解析錯誤。
:::

## Before Script / After Script

在 job 執行前後要執行的腳本：

```yaml
default:
  before_script:
    - echo "Before script section"
  after_script:
    - echo "After script section"

job1:
  script:
    - echo "My script"
```

## Cache (快取)

用於儲存和重用 build 之間的檔案：

```yaml
cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/
    - .npm/
```

**命名慣例：**
Cache 鍵通常使用變數組合：

* `${CI_COMMIT_REF_SLUG}` - 依據分支。
* `${CI_JOB_NAME}-${CI_COMMIT_REF_SLUG}` - 依據 job 和分支。

## Artifacts (成品)

jobs 完成後產生的檔案，可被下載或用於後續的 jobs：

```yaml
build-job:
  stage: build
  script:
    - echo "Creating artifacts..."
    - mkdir -p build/
    - touch build/info.txt
  artifacts:
    paths:
      - build/
    expire_in: 1 week
```

## Dependencies (依賴)

定義一個 job 使用哪些 jobs 的 artifacts：

```yaml
test-job:
  stage: test
  dependencies:
    - build-job
  script:
    - echo "Testing with artifacts from build-job"
```

## Workflow (工作流程)

Workflow 可以控制整個 pipeline 的執行條件。與 job 層級的 `rules` 不同，`workflow:rules` 決定是否要建立整個 pipeline。如果沒有規則匹配或所有規則都評估為 `when:never`，則整個 pipeline 不會執行。

### 基本語法

```yaml
workflow:
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
      when: always
    - if: $CI_MERGE_REQUEST_IID
      when: always
    - if: $CI_COMMIT_TAG
      when: always
    - when: never
```

以上範例的含義：

* 當提交到 `main` 分支時，總是執行 pipeline。
* 當有合併請求時，總是執行 pipeline。
* 當有標籤時，總是執行 pipeline。
* 對於其他情況，不執行 pipeline。

### 命名 Pipeline

你可以為 pipeline 指定一個名稱，這在 GitLab 界面中顯示：

```yaml
workflow:
  name: "Main Pipeline"
```

你也可以在名稱中使用變數：

```yaml
workflow:
  name: "$CI_COMMIT_REF_NAME 部署"
```

### 規則條件

Workflow 規則支援與 job 規則相同的條件：

```yaml
workflow:
  rules:
    # 僅在排程 pipeline 中執行
    - if: $CI_PIPELINE_SOURCE == "schedule"
      when: always
    
    # 僅在特定分支的推送上執行
    - if: $CI_COMMIT_BRANCH == "release/*"
      when: always
    
    # 根據文件變化決定是否執行
    - if: $CI_COMMIT_BRANCH == "main" && $CI_PIPELINE_SOURCE == "push" && $CI_COMMIT_TITLE =~ /docs:/
      changes:
        - docs/**/*
      when: always
    
    # 當設定文件自身修改時執行
    - changes:
      - .gitlab-ci.yml
      when: always
    
    # 設定變數
    - if: $CI_COMMIT_BRANCH == "develop"
      variables:
        IS_DEVELOPMENT: "true"
      when: always
    
    # 預設情況
    - when: never
```

### 實用範例

1. **根據提交訊息決定是否執行 pipeline**：

```yaml
workflow:
  rules:
    - if: $CI_COMMIT_TITLE =~ /\[skip ci\]/
      when: never
    - if: $CI_COMMIT_TITLE =~ /\[run ci\]/
      when: always
    - when: on_success
```

1. **根據專案路徑變化決定執行不同 pipeline**：

```yaml
workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      changes:
        - frontend/**/*
      variables:
        PIPELINE_TYPE: "frontend"
      when: always
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      changes:
        - backend/**/*
      variables:
        PIPELINE_TYPE: "backend"
      when: always
    - when: never
```

1. **僅在工作時間內自動執行 pipeline**：

```yaml
workflow:
  rules:
    # 工作日 (週一至週五)
    - if: $CI_PIPELINE_SOURCE == "schedule" && $CI_COMMIT_BRANCH == "main"
      when: always
    # 工作時間 (9:00 - 18:00)
    - if: $CI_PIPELINE_SOURCE == "push" && $CI_COMMIT_BRANCH == "main" && $HOUR >= 9 && $HOUR < 18
      when: always
    # 非工作時間需手動觸發
    - if: $CI_COMMIT_BRANCH == "main"
      when: manual
      allow_failure: true
    - when: never
```

### 注意事項

1. `workflow:rules` 是全局性的，會影響整個 pipeline。
2. 如果沒有設定 `workflow:rules`，GitLab 會使用預設規則，即所有 push 和合併請求都會觸發 pipeline。
3. 在 `workflow:rules` 中使用 `when:never` 時，整個 pipeline 都不會執行，而不僅僅是跳過規則。
4. Workflow 規則是按順序評估的，一旦找到匹配的規則，就會停止評估。
5. 你可以在 workflow 中設定的 variables 可以被所有 jobs 訪問。

## Needs (需要)

讓某個 job 在指定的 jobs 完成後立即執行，而不必等待整個 stage 完成：

```yaml
job2:
  stage: test
  needs:
    - job1
  script:
    - echo "This job runs after job1, even if they're in the same stage"
```

## Services (服務)

定義一個附加的 Docker 容器，通常用於提供資料庫等服務：

```yaml
test:
  services:
    - postgres:13
  script:
    - echo "Testing with Postgres service"
```

## Includes (包含)

從其他檔案引入設定：

```yaml
include:
  - local: '/templates/ci-template.yml'
  - project: 'my-group/my-project'
    file: '/templates/ci-template.yml'
  - template: Auto-DevOps.gitlab-ci.yml
```

## Templates (模板)

使用 YAML 錨點和別名來建立可重複使用的模板：

```yaml
# 定義模板 (以點開頭的 job 不會被執行)
.build_template: &build_definition
  stage: build
  script:
    - echo "Building using template"
  tags:
    - docker

# 使用模板
build_job1:
  <<: *build_definition
  script:
    - echo "Building job 1"
    - make build

# 擴展模板
build_job2:
  <<: *build_definition
  script:
    - echo "Building job 2"
    - make special-build
  variables:
    BUILD_TYPE: "special"
```

**命名慣例：**

* 模板 job 名稱以點開頭，如 `.build_template`。
* 模板錨點通常使用 `_definition` 或 `_template` 後綴。

## 預先定義環境變數清單

以下內容節錄至 [Predefined CI/CD variables reference](https://docs.gitlab.com/ci/variables/predefined_variables/)，我利用 Claude 協助我轉成中文，方便我自己查閱。

### 可用範圍說明

| 可用範圍 | 描述 |
|------------|------|
| Pre-pipeline | 在 pipeline 建立前就已存在的變數，所有 job 皆可使用 |
| Pipeline | 在 pipeline 建立後產生的變數，所有 job 皆可使用 |
| Job-only | 僅在特定 job 執行環境中可用的變數 |

### ChatOps 與基本 CI 變數

| 變數 | 可用範圍 | 描述 |
|------|--------|------|
| CHAT_CHANNEL | Pipeline | 觸發 ChatOps 指令的來源聊天頻道。 |
| CHAT_INPUT | Pipeline | 與 ChatOps 指令一起傳遞的附加參數。 |
| CHAT_USER_ID | Pipeline | 觸發 ChatOps 指令的使用者在聊天服務中的使用者 ID。 |
| CI | Pre-pipeline | 在所有 CI/CD 執行的 job 中都可用。當可用時為 true。 |
| CI_API_V4_URL | Pre-pipeline | GitLab API v4 根 URL。 |
| CI_API_GRAPHQL_URL | Pre-pipeline | GitLab API GraphQL 根 URL。於 GitLab 15.11 版引入。 |
| CI_DEBUG_TRACE | Pipeline | 如果啟用了偵錯日誌記錄（追蹤），則為 true。 |
| CI_DEBUG_SERVICES | Pipeline | 如果啟用了服務容器日誌記錄，則為 true。於 GitLab 15.7 版引入。需要 GitLab Runner 15.7。 |
| GITLAB_CI | Pre-pipeline | 在 CI/CD 中執行的所有 job 都可用。當可用時為 true。 |
| GITLAB_FEATURES | Pre-pipeline | GitLab 實例和授權可用的授權功能的逗號分隔清單。 |

### 提交相關變數

| 變數 | 可用範圍 | 描述 |
|------|--------|------|
| CI_BUILDS_DIR | Job-only | 執行 builds 的頂層目錄。 |
| CI_COMMIT_AUTHOR | Pre-pipeline | 提交的作者，格式為 Name &lt;email&gt;。 |
| CI_COMMIT_BEFORE_SHA | Pre-pipeline | 分支或標籤上先前的最新提交。在合併請求 pipeline、排程 pipeline、分支或標籤的第一個提交的 pipeline 中，或手動執行 pipeline 時，一律為 0000000000000000000000000000000000000000。 |
| CI_COMMIT_BRANCH | Pre-pipeline | 提交的分支名稱。在分支 pipeline 中可用，包括預設分支的 pipeline。在合併請求 pipeline 或標籤 pipeline 中不可用。 |
| CI_COMMIT_DESCRIPTION | Pre-pipeline | 提交的描述。如果標題少於 100 個字元，則為不包含第一行的訊息。 |
| CI_COMMIT_MESSAGE | Pre-pipeline | 完整的提交訊息。 |
| CI_COMMIT_REF_NAME | Pre-pipeline | 專案建置的分支或標籤名稱。 |
| CI_COMMIT_REF_PROTECTED | Pre-pipeline | 如果 job 正在為受保護的引用執行，則為 true，否則為 false。 |
| CI_COMMIT_REF_SLUG | Pre-pipeline | CI_COMMIT_REF_NAME 的小寫形式，縮短為 63 個位元組，除了 0-9 和 a-z 之外的所有內容都用 - 替換。無前導/尾隨 -。用於 URL、主機名和網域名稱。 |
| CI_COMMIT_SHA | Pre-pipeline | 專案建置的提交修訂版本。 |
| CI_COMMIT_SHORT_SHA | Pre-pipeline | CI_COMMIT_SHA 的前八個字元。 |
| CI_COMMIT_TAG | Pre-pipeline | 提交標籤名稱。僅在標籤的 pipeline 中可用。 |
| CI_COMMIT_TAG_MESSAGE | Pre-pipeline | 提交標籤訊息。僅在標籤的 pipeline 中可用。於 GitLab 15.5 版引入。 |
| CI_COMMIT_TIMESTAMP | Pre-pipeline | 提交的時間戳，採用 ISO 8601 格式。例如，2022-01-31T16:47:55Z。預設為 UTC。 |
| CI_COMMIT_TITLE | Pre-pipeline | 提交的標題。訊息的完整第一行。 |
| CI_OPEN_MERGE_REQUESTS | Pre-pipeline | 最多四個使用當前分支和專案作為合併請求來源的合併請求的逗號分隔列表。僅在分支和合併請求 pipeline 中可用，如果分支有關聯的合併請求。例如，gitlab-org/gitlab!333,gitlab-org/gitlab-foss!11。 |

### 設定與路徑相關變數

| 變數 | 可用範圍 | 描述 |
|------|--------|------|
| CI_CONFIG_PATH | Pre-pipeline | CI/CD 設定檔的路徑。預設為 .gitlab-ci.yml。 |
| CI_CONCURRENT_ID | Job-only | 在單一執行器中建置執行的唯一 ID。 |
| CI_CONCURRENT_PROJECT_ID | Job-only | 在單一執行器和專案中建置執行的唯一 ID。 |
| CI_DEFAULT_BRANCH | Pre-pipeline | 專案的預設分支名稱。 |
| CI_PROJECT_DIR | Job-only | 複製儲存庫並執行 job 的完整路徑。如果設定了 GitLab Runner builds_dir 參數，此變數相對於 builds_dir 的值設定。有關更多資訊，請參閱進階 GitLab Runner 設定。 |
| CI_REPOSITORY_URL | Job-only | 使用 CI/CD job 令牌 Git 複製（HTTP）儲存庫的完整路徑，格式為 <https://gitlab-ci-token:$CI_JOB_TOKEN@gitlab.example.com/my-group/my-project.git。> |

### 相依性代理相關變數

| 變數 | 可用範圍 | 描述 |
|------|--------|------|
| CI_DEPENDENCY_PROXY_DIRECT_GROUP_IMAGE_PREFIX | Pre-pipeline | 透過相依性代理拉取映像的直接群組映像前綴。 |
| CI_DEPENDENCY_PROXY_GROUP_IMAGE_PREFIX | Pre-pipeline | 透過相依性代理拉取映像的頂層群組映像前綴。 |
| CI_DEPENDENCY_PROXY_PASSWORD | Pipeline | 透過相依性代理拉取映像的密碼。 |
| CI_DEPENDENCY_PROXY_SERVER | Pre-pipeline | 登入相依性代理的伺服器。此變數等同於 $CI_SERVER_HOST:$CI_SERVER_PORT。 |
| CI_DEPENDENCY_PROXY_USER | Pipeline | 透過相依性代理拉取映像的使用者名稱。 |

### 部署與環境相關變數

| 變數 | 可用範圍 | 描述 |
|------|--------|------|
| CI_DEPLOY_FREEZE | Pre-pipeline | 僅在 pipeline 在部署凍結窗口期間執行時可用。當可用時為 true。 |
| CI_DEPLOY_PASSWORD | Job-only | GitLab Deploy Token 的認證密碼，如果專案有的話。 |
| CI_DEPLOY_USER | Job-only | GitLab Deploy Token 的認證使用者名稱，如果專案有的話。 |
| CI_DISPOSABLE_ENVIRONMENT | Pipeline | 僅在 job 在一次性環境中執行時可用（僅為此 job 建立並在執行後處理/銷毀的環境 - 除 shell 和 ssh 以外的所有執行器）。當可用時為 true。 |
| CI_ENVIRONMENT_NAME | Pipeline | 此 job 的環境名稱。如果設定了 environment:name，則可用。 |
| CI_ENVIRONMENT_SLUG | Pipeline | 環境名稱的簡化版本，適合包含在 DNS、URL、Kubernetes 標籤等中。如果設定了 environment:name，則可用。slug 被截斷為 24 個字元。對於大寫環境名稱，會自動添加隨機後綴。 |
| CI_ENVIRONMENT_URL | Pipeline | 此 job 的環境 URL。如果設定了 environment:url，則可用。 |
| CI_ENVIRONMENT_ACTION | Pipeline | 為此 job 的環境指定的操作註解。如果設定了 environment:action，則可用。可以是 start、prepare 或 stop。 |
| CI_ENVIRONMENT_TIER | Pipeline | 此 job 的環境的部署層級。 |
| CI_KUBERNETES_ACTIVE | Pre-pipeline | 僅當 pipeline 有可用於部署的 Kubernetes 叢集時可用。當可用時為 true。 |
| CI_RELEASE_DESCRIPTION | Pipeline | 發佈的描述。僅在標籤的 pipeline 中可用。描述長度限制為前 1024 個字元。於 GitLab 15.5 版引入。 |
| KUBECONFIG | Pipeline | kubeconfig 檔案的路徑，其中包含每個共享代理連接的環境設定。僅當 GitLab 代理被授權存取專案時可用。 |

### Job 相關變數

| 變數 | 可用範圍 | 描述 |
|------|--------|------|
| CI_GITLAB_FIPS_MODE | Pre-pipeline | 僅在 GitLab 實例中啟用 FIPS 模式時可用。當可用時為 true。 |
| CI_HAS_OPEN_REQUIREMENTS | Pipeline | 僅當 pipeline 的專案有開放需求時可用。當可用時為 true。 |
| CI_JOB_GROUP_NAME | Pipeline | job 群組的共享名稱，當使用並行或手動分組 job 時。例如，如果 job 名稱是 rspec:test: [ruby, ubuntu]，CI_JOB_GROUP_NAME 是 rspec:test。否則與 CI_JOB_NAME 相同。於 GitLab 17.10 版引入。 |
| CI_JOB_ID | Job-only | job 的內部 ID，在 GitLab 實例的所有 job 中是唯一的。 |
| CI_JOB_IMAGE | Pipeline | 執行 job 的 Docker 映像名稱。 |
| CI_JOB_MANUAL | Pipeline | 僅在 job 手動啟動時可用。當可用時為 true。 |
| CI_JOB_NAME | Pipeline | job 的名稱。 |
| CI_JOB_NAME_SLUG | Pipeline | CI_JOB_NAME 的小寫形式，縮短為 63 個位元組，除了 0-9 和 a-z 之外的所有內容都用 - 替換。無前導/尾隨 -。用於路徑。於 GitLab 15.4 版引入。 |
| CI_JOB_STAGE | Pipeline | job 的階段名稱。 |
| CI_JOB_STATUS | Job-only | 執行每個 runner 階段時 job 的狀態。與 after_script 一起使用。可以是 success、failed 或 canceled。 |
| CI_JOB_TIMEOUT | Job-only | job 逾時時間，以秒為單位。於 GitLab 15.7 版引入。需要 GitLab Runner 15.7。 |
| CI_JOB_TOKEN | Job-only | 用於驗證某些 API 端點的令牌。令牌在 job 執行期間有效。 |
| CI_JOB_URL | Job-only | job 詳情 URL。 |
| CI_JOB_STARTED_AT | Job-only | job 開始的日期和時間，採用 ISO 8601 格式。例如，2022-01-31T16:47:55Z。預設為 UTC。 |
| CI_NODE_INDEX | Pipeline | job 在 job 集中的索引。僅當 job 使用 parallel 時可用。 |
| CI_NODE_TOTAL | Pipeline | 此 job 並行執行的實例總數。如果 job 不使用 parallel，則設定為 1。 |

### Pages 相關變數

| 變數 | 可用範圍 | 描述 |
|------|--------|------|
| CI_PAGES_DOMAIN | Pre-pipeline | 託管 GitLab Pages 的實例域名，不包括命名空間子域名。要使用完整的主機名，請使用 CI_PAGES_HOSTNAME。 |
| CI_PAGES_HOSTNAME | Job-only | Pages 部署的完整主機名。 |
| CI_PAGES_URL | Job-only | GitLab Pages 網站的 URL。始終是 CI_PAGES_DOMAIN 的子域名。在 GitLab 17.9 及更高版本中，當指定 path_prefix 時，值包括 path_prefix。 |

### Pipeline 相關變數

| 變數 | 可用範圍 | 描述 |
|------|--------|------|
| CI_PIPELINE_ID | Job-only | 當前 pipeline 的實例層級 ID。此 ID 在 GitLab 實例的所有專案中是唯一的。 |
| CI_PIPELINE_IID | Pipeline | 當前 pipeline 的專案層級 IID（內部 ID）。此 ID 僅在當前專案中是唯一的。 |
| CI_PIPELINE_SOURCE | Pre-pipeline | pipeline 的觸發方式。值可以是 pipeline 來源之一。 |
| CI_PIPELINE_TRIGGERED | Pipeline | 如果 job 被觸發，則為 true。 |
| CI_PIPELINE_URL | Job-only | pipeline 詳情的 URL。 |
| CI_PIPELINE_CREATED_AT | Pre-pipeline | pipeline 建立的日期和時間，採用 ISO 8601 格式。例如，2022-01-31T16:47:55Z。預設為 UTC。 |
| CI_PIPELINE_NAME | Pre-pipeline | 在 workflow:name 中定義的 pipeline 名稱。於 GitLab 16.3 版引入。 |
| CI_PIPELINE_SCHEDULE_DESCRIPTION | Pre-pipeline | pipeline 排程的描述。僅在排程 pipeline 中可用。於 GitLab 17.8 版引入。 |

### 專案相關變數

| 變數 | 可用範圍 | 描述 |
|------|--------|------|
| CI_PROJECT_ID | Pre-pipeline | 當前專案的 ID。此 ID 在 GitLab 實例的所有專案中是唯一的。 |
| CI_PROJECT_NAME | Pre-pipeline | 專案目錄的名稱。例如，如果專案 URL 是 gitlab.example.com/group-name/project-1，則 CI_PROJECT_NAME 是 project-1。 |
| CI_PROJECT_NAMESPACE | Pre-pipeline | job 的專案命名空間（使用者名稱或群組名稱）。 |
| CI_PROJECT_NAMESPACE_ID | Pre-pipeline | job 的專案命名空間 ID。於 GitLab 15.7 版引入。 |
| CI_PROJECT_NAMESPACE_SLUG | Pre-pipeline | $CI_PROJECT_NAMESPACE 的小寫形式，不是 a-z 或 0-9 的字元替換為 - 並縮短為 63 個位元組。 |
| CI_PROJECT_PATH_SLUG | Pre-pipeline | $CI_PROJECT_PATH 的小寫形式，不是 a-z 或 0-9 的字元替換為 - 並縮短為 63 個位元組。用於 URL 和網域名稱。 |
| CI_PROJECT_PATH | Pre-pipeline | 包含專案名稱的專案命名空間。 |
| CI_PROJECT_REPOSITORY_LANGUAGES | Pre-pipeline | 儲存庫中使用的語言的逗號分隔、小寫清單。例如 ruby,javascript,html,css。語言的最大數量限制為 5。有一個 issue 提議增加限制。 |
| CI_PROJECT_ROOT_NAMESPACE | Pre-pipeline | job 的根專案命名空間（使用者名稱或群組名稱）。例如，如果 CI_PROJECT_NAMESPACE 是 root-group/child-group/grandchild-group，則 CI_PROJECT_ROOT_NAMESPACE 是 root-group。 |
| CI_PROJECT_TITLE | Pre-pipeline | 在 GitLab Web 界面中顯示的人類可讀的專案名稱。 |
| CI_PROJECT_DESCRIPTION | Pre-pipeline | 在 GitLab Web 界面中顯示的專案描述。於 GitLab 15.1 版引入。 |
| CI_PROJECT_URL | Pre-pipeline | 專案的 HTTP(S) 網址。 |
| CI_PROJECT_VISIBILITY | Pre-pipeline | 專案可見性。可以是 internal、private 或 public。 |
| CI_PROJECT_CLASSIFICATION_LABEL | Pre-pipeline | 專案外部授權分類標籤。 |

### 容器註冊相關變數

| 變數 | 可用範圍 | 描述 |
|------|--------|------|
| CI_REGISTRY | Pre-pipeline | 容器註冊伺服器的網址，格式為 &lt;host&gt;[:&lt;port&gt;]。例如：registry.gitlab.example.com。僅當 GitLab 實例啟用容器註冊時可用。 |
| CI_REGISTRY_IMAGE | Pre-pipeline | 用於推送、拉取或標記專案映像的容器註冊基本網址，格式為 &lt;host&gt;[:&lt;port&gt;]/&lt;project_full_path&gt;。例如：registry.gitlab.example.com/my_group/my_project。映像名稱必須遵循容器註冊命名慣例。僅當為專案啟用容器註冊時可用。 |
| CI_REGISTRY_PASSWORD | Job-only | 推送容器到 GitLab 專案的容器註冊的密碼。僅當為專案啟用容器註冊時可用。此密碼值與 CI_JOB_TOKEN 相同，僅在 job 執行期間有效。使用 CI_DEPLOY_PASSWORD 進行長期訪問註冊。 |
| CI_REGISTRY_USER | Job-only | 推送容器到專案的 GitLab 容器註冊的使用者名稱。僅當為專案啟用容器註冊時可用。 |
| CI_TEMPLATE_REGISTRY_HOST | Pre-pipeline | CI/CD 範本使用的註冊主機。預設為 registry.gitlab.com。於 GitLab 15.3 版引入。 |

### Runner 相關變數

| 變數 | 可用範圍 | 描述 |
|------|--------|------|
| CI_RUNNER_DESCRIPTION | Job-only | runner 的描述。 |
| CI_RUNNER_EXECUTABLE_ARCH | Job-only | GitLab Runner 可執行檔的 OS/架構。可能與執行器的環境不同。 |
| CI_RUNNER_ID | Job-only | 正在使用的 runner 的唯一 ID。 |
| CI_RUNNER_REVISION | Job-only | 執行 job 的 runner 的修訂版本。 |
| CI_RUNNER_SHORT_TOKEN | Job-only | runner 的唯一 ID，用於驗證新 job 請求。令牌包含前綴，使用前 17 個字元。 |
| CI_RUNNER_TAGS | Job-only | runner 標籤的 JSON 陣列。例如 ["tag_1", "tag_2"]。 |
| CI_RUNNER_VERSION | Job-only | 執行 job 的 GitLab Runner 的版本。 |
| CI_SHARED_ENVIRONMENT | Pipeline | 僅當 job 在共享環境中執行時可用（在 CI/CD 調用之間持久存在的環境，如 shell 或 ssh 執行器）。當可用時為 true。 |

### 伺服器相關變數

| 變數 | 可用範圍 | 描述 |
|------|--------|------|
| CI_SERVER_FQDN | Pre-pipeline | 實例的完全限定網域名稱 (FQDN)。例如 gitlab.example.com:8080。於 GitLab 16.10 版引入。 |
| CI_SERVER_HOST | Pre-pipeline | GitLab 實例 URL 的主機，不包括協議或連接埠。例如 gitlab.example.com。 |
| CI_SERVER_NAME | Pre-pipeline | 協調 job 的 CI/CD 伺服器的名稱。 |
| CI_SERVER_PORT | Pre-pipeline | GitLab 實例 URL 的連接埠，不包括主機或協議。例如 8080。 |
| CI_SERVER_PROTOCOL | Pre-pipeline | GitLab 實例 URL 的協議，不包括主機或連接埠。例如 https。 |
| CI_SERVER_SHELL_SSH_HOST | Pre-pipeline | GitLab 實例的 SSH 主機，用於透過 SSH 存取 Git 儲存庫。例如 gitlab.com。於 GitLab 15.11 版引入。 |
| CI_SERVER_SHELL_SSH_PORT | Pre-pipeline | GitLab 實例的 SSH 連接埠，用於透過 SSH 存取 Git 儲存庫。例如 22。於 GitLab 15.11 版引入。 |
| CI_SERVER_REVISION | Pre-pipeline | 排程 job 的 GitLab 修訂版本。 |
| CI_SERVER_TLS_CA_FILE | Pipeline | 包含 TLS CA 憑證的檔案，用於在 runner 設定中設定 tls-ca-file 時驗證 GitLab 伺服器。 |
| CI_SERVER_TLS_CERT_FILE | Pipeline | 包含 TLS 憑證的檔案，用於在 runner 設定中設定 tls-cert-file 時驗證 GitLab 伺服器。 |
| CI_SERVER_TLS_KEY_FILE | Pipeline | 包含 TLS 金鑰的檔案，用於在 runner 設定中設定 tls-key-file 時驗證 GitLab 伺服器。 |
| CI_SERVER_URL | Pre-pipeline | GitLab 實例的基本 URL，包括協議和連接埠。例如 <https://gitlab.example.com:8080。> |
| CI_SERVER_VERSION_MAJOR | Pre-pipeline | GitLab 實例的主要版本。例如，如果 GitLab 版本是 17.2.1，則 CI_SERVER_VERSION_MAJOR 是 17。 |
| CI_SERVER_VERSION_MINOR | Pre-pipeline | GitLab 實例的次要版本。例如，如果 GitLab 版本是 17.2.1，則 CI_SERVER_VERSION_MINOR 是 2。 |
| CI_SERVER_VERSION_PATCH | Pre-pipeline | GitLab 實例的修補版本。例如，如果 GitLab 版本是 17.2.1，則 CI_SERVER_VERSION_PATCH 是 1。 |
| CI_SERVER_VERSION | Pre-pipeline | GitLab 實例的完整版本。 |
| CI_SERVER | Job-only | 在 CI/CD 中執行的所有 job 都可用。當可用時為 yes。 |

### 觸發與使用者相關變數

| 變數 | 可用範圍 | 描述 |
|------|--------|------|
| CI_TRIGGER_SHORT_TOKEN | Job-only | 當前 job 的觸發令牌的前 4 個字元。僅當 pipeline 由觸發令牌觸發時可用。例如，對於觸發令牌 glptt-1234567890abcdefghij，CI_TRIGGER_SHORT_TOKEN 為 1234。於 GitLab 17.0 版引入。 |
| GITLAB_USER_EMAIL | Pipeline | 啟動 pipeline 的使用者的電子郵件，除非 job 是手動 job。在手動 job 中，值是啟動 job 的使用者的電子郵件。 |
| GITLAB_USER_ID | Pipeline | 啟動 pipeline 的使用者的數字 ID，除非 job 是手動 job。在手動 job 中，值是啟動 job 的使用者的 ID。 |
| GITLAB_USER_LOGIN | Pipeline | 啟動 pipeline 的使用者的唯一使用者名稱，除非 job 是手動 job。在手動 job 中，值是啟動 job 的使用者的使用者名稱。 |
| GITLAB_USER_NAME | Pipeline | 啟動 pipeline 的使用者的顯示名稱（使用者在個人資料設定中定義的全名），除非 job 是手動 job。在手動 job 中，值是啟動 job 的使用者的名稱。 |
| TRIGGER_PAYLOAD | Pipeline | webhook 資料載體。僅當使用 webhook 觸發 pipeline 時可用。 |

### 合併請求相關變數

| 變數 | 描述 |
|------|------|
| CI_MERGE_REQUEST_APPROVED | 合併請求的批准狀態。當合併請求批准可用且合併請求已被批准時為 true。 |
| CI_MERGE_REQUEST_ASSIGNEES | 合併請求的受指派人用戶名的逗號分隔列表。僅當合併請求至少有一個受讓人時可用。 |
| CI_MERGE_REQUEST_DIFF_BASE_SHA | 合併請求差異的基本 SHA。 |
| CI_MERGE_REQUEST_DIFF_ID | 合併請求差異的版本。 |
| CI_MERGE_REQUEST_EVENT_TYPE | 合併請求的事件類型。可以是 detached、merged_result 或 merge_train。 |
| CI_MERGE_REQUEST_DESCRIPTION | 合併請求的描述。如果描述長度超過 2700 個字符，則只有前 2700 個字符存儲在變數中。在 GitLab 16.7 中引入。 |
| CI_MERGE_REQUEST_DESCRIPTION_IS_TRUNCATED | 如果 CI_MERGE_REQUEST_DESCRIPTION 因為合併請求的描述太長而被截斷到 2700 個字符，則為 true，否則為 false。在 GitLab 16.8 中引入。 |
| CI_MERGE_REQUEST_ID | 合併請求的實例級 ID。此 ID 在 GitLab 實例的所有專案中是唯一的。 |
| CI_MERGE_REQUEST_IID | 合併請求的專案級 IID（內部 ID）。此 ID 在當前專案中是唯一的，並且是合併請求 URL、頁面標題和其他可見位置中使用的編號。 |
| CI_MERGE_REQUEST_LABELS | 合併請求的標籤名稱的逗號分隔列表。僅當合併請求至少有一個標籤時可用。 |
| CI_MERGE_REQUEST_MILESTONE | 合併請求的里程碑標題。僅當合併請求設定了里程碑時可用。 |
| CI_MERGE_REQUEST_PROJECT_ID | 合併請求的專案 ID。 |
| CI_MERGE_REQUEST_PROJECT_PATH | 合併請求的專案路徑。例如 namespace/awesome-project。 |
| CI_MERGE_REQUEST_PROJECT_URL | 合併請求的專案 URL。例如 <http://192.168.10.15:3000/namespace/awesome-project。> |
| CI_MERGE_REQUEST_REF_PATH | 合併請求的引用路徑。例如 refs/merge-requests/1/head。 |
| CI_MERGE_REQUEST_SOURCE_BRANCH_NAME | 合併請求的源分支名稱。 |
| CI_MERGE_REQUEST_SOURCE_BRANCH_PROTECTED | 當合併請求的源分支受保護時為 true。在 GitLab 16.4 中引入。 |
| CI_MERGE_REQUEST_SOURCE_BRANCH_SHA | 合併請求的源分支的 HEAD SHA。在合併請求 pipeline 中，變數為空。SHA 僅出現在合併結果 pipeline 中。 |
| CI_MERGE_REQUEST_SOURCE_PROJECT_ID | 合併請求的源專案 ID。 |
| CI_MERGE_REQUEST_SOURCE_PROJECT_PATH | 合併請求的源專案路徑。 |
| CI_MERGE_REQUEST_SOURCE_PROJECT_URL | 合併請求的源專案 URL。 |
| CI_MERGE_REQUEST_SQUASH_ON_MERGE | 當設定了合併時壓縮選項時為 true。在 GitLab 16.4 中引入。 |
| CI_MERGE_REQUEST_TARGET_BRANCH_NAME | 合併請求的目標分支名稱。 |
| CI_MERGE_REQUEST_TARGET_BRANCH_PROTECTED | 當合併請求的目標分支受保護時為 true。在 GitLab 15.2 中引入。 |
| CI_MERGE_REQUEST_TARGET_BRANCH_SHA | 合併請求的目標分支的 HEAD SHA。在合併請求 pipeline 中，變數為空。SHA 僅出現在合併結果 pipeline 中。 |
| CI_MERGE_REQUEST_TITLE | 合併請求的標題。 |
| CI_MERGE_REQUEST_DRAFT | 如果合併請求是草稿，則為 true。在 GitLab 17.10 中引入。 |

### 外部請求相關變數

| 變數 | 描述 |
|------|------|
| CI_EXTERNAL_PULL_REQUEST_IID | 來自 GitHub 的拉取請求 ID。 |
| CI_EXTERNAL_PULL_REQUEST_SOURCE_REPOSITORY | 拉取請求的來源儲存庫名稱。 |
| CI_EXTERNAL_PULL_REQUEST_TARGET_REPOSITORY | 拉取請求的目標儲存庫名稱。 |
| CI_EXTERNAL_PULL_REQUEST_SOURCE_BRANCH_NAME | 拉取請求的來源分支名稱。 |
| CI_EXTERNAL_PULL_REQUEST_SOURCE_BRANCH_SHA | 拉取請求的來源分支的 HEAD SHA。 |
| CI_EXTERNAL_PULL_REQUEST_TARGET_BRANCH_NAME | 拉取請求的目標分支名稱。 |
| CI_EXTERNAL_PULL_REQUEST_TARGET_BRANCH_SHA | 拉取請求的目標分支的 HEAD SHA。 |
| CI_EXTERNAL_PULL_REQUEST_LABELS | 拉取請求的標籤的逗號分隔清單。僅當合併請求至少有一個標籤時可用。 |
| CI_EXTERNAL_PULL_REQUEST_TITLE | 拉取請求的標題。 |
| CI_EXTERNAL_PULL_REQUEST_DESCRIPTION | 拉取請求的描述。 |
| CI_EXTERNAL_PULL_REQUEST_HTML_URL | 拉取請求的 HTML URL。 |

### 整合變數

以下整合變數在 job 中可用作「僅 job」預定義變數：

#### Harbor

| 變數 | 描述 |
|------|------|
| HARBOR_URL | Harbor 實例的 URL。 |
| HARBOR_HOST | Harbor 實例的主機名。 |
| HARBOR_OCI | Harbor OCI 連接設定。 |
| HARBOR_PROJECT | 目標 Harbor 專案名稱。 |
| HARBOR_USERNAME | Harbor 認證使用者名稱。 |
| HARBOR_PASSWORD | Harbor 認證密碼。 |

#### Apple App Store Connect

| 變數 | 描述 |
|------|------|
| APP_STORE_CONNECT_API_KEY_ISSUER_ID | Apple App Store Connect API 金鑰發行者 ID。 |
| APP_STORE_CONNECT_API_KEY_KEY_ID | Apple App Store Connect API 金鑰 ID。 |
| APP_STORE_CONNECT_API_KEY_KEY | Apple App Store Connect API 金鑰內容。 |
| APP_STORE_CONNECT_API_KEY_IS_KEY_CONTENT_BASE64 | 指示 API 金鑰內容是否為 Base64 編碼。 |

#### Google Play

| 變數 | 描述 |
|------|------|
| SUPPLY_PACKAGE_NAME | Android 應用程式的套件名稱。 |
| SUPPLY_JSON_KEY_DATA | Google Play API 存取的 JSON 金鑰資料。 |

#### Diffblue Cover

| 變數 | 描述 |
|------|------|
| DIFFBLUE_LICENSE_KEY | Diffblue Cover 的授權金鑰。 |
| DIFFBLUE_ACCESS_TOKEN_NAME | Diffblue 存取令牌名稱。 |
| DIFFBLUE_ACCESS_TOKEN | Diffblue 存取令牌。 |

## 異動歷程

* 2025-04-07 初版文件建立。
