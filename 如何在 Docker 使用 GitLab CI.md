# 如何在 Docker 使用 GitLab CI

[![hackmd-github-sync-badge](https://hackmd.io/0Qij0TNHT6GQBVX4oBjwXQ/badge)](https://hackmd.io/0Qij0TNHT6GQBVX4oBjwXQ)


## 在 Docker 上安裝 GitLab
參考[官方文檔](https://docs.gitlab.com/ee/install/docker.html)，撰寫Docker Compose。
```yaml
version: '3.7'

services:
  GitLab-Server:
    image: 'gitlab/gitlab-ee:latest'
    container_name: GitLab-Server
    environment:
      GITLAB_OMNIBUS_CONFIG: |
        external_url 'http://127.0.0.1:5080/'
        nginx['listen_port'] = 80
        gitlab_rails['gitlab_shell_ssh_port'] = 5022
    ports:
      - 5080:80
      - 5443:443
      - '5022:22'
    privileged: true
    volumes:
      - .\Volumes\GitLab-Server\Config:/etc/gitlab
      - data:/var/opt/gitlab
      - .\Volumes\GitLab-Server\Logs:/var/log/gitlab
    shm_size: '256m'
    networks:
      default:
        ipv4_address: 172.20.0.2
    restart: always
volumes:
  data:
networks:
  default:
    driver: bridge
    ipam:
      driver: default
      config:
        - subnet: 172.20.0.0/16
          gateway: 172.20.0.1
```

2. 將指令游標切換至 docker-compose.yml 所在位置，並執行 `docker-compose up -d` 運行 Container。
3. 稍等幾分鐘後，在網頁輸入「http://127.0.0.1:5080」訪問GitLab Web，帳號預設為 `root`，密碼則存放至檔案(/srv/gitlab/config/initial_root_password)裡。
4. 點選右上角頭像 > preferences > password，將密碼改成好記的密碼，並重新登入。

:::info
* `external_url` 不設定雖然可以連到網頁，但會有部分功能找不到網頁，且網域非所設定的 IP，而是一連串的英數字組合，或是在儲存庫上 SSH、http 裡記錄的複製儲存庫網址有這個問題。
* `external_url` 最好設定成外部 IP 或是 Domain Name，這邊用 `127.0.0.1` 是因為雖然有指定 IP，但是無法使用主機使用設定 IP 連線(不過有時候設定又可能，暫時找不到原因)。
* 當有設定 `external_url` 時，使用非 80 port，則要設定 `nginx['listen_port'] = 80`，如果是用 https ，則改為 `443`，詳細原因請參照此篇[文章](https://www.gushiciku.cn/pl/gv52/zh-tw)。
* 50xx 的 Port 可以自行視需求變更如果出現「invalid port specification」的錯誤訊息，參考 [Invalid port specification: 601342](https://gitlab.com/gitlab-org/gitlab-foss/-/issues/2056)，將`5022:22`用引號括起來。
* `external_url` 和 `gitlab_rails['gitlab_shell_ssh_port']` 的 port 設定與 ports 的對應關係要一致。
* volumes 底下 `/var/opt/gitlab` 的路徑綁定，官網範例雖然是用「Bind Mount」，但在「artifacts」功能會因權限功能無法正常，所以是用「Volume」連結。
:::

### GitLab 的設置
GitLab 目前有提供兩種設定方式
1. gitlab.rb：存放在「/srv/gitlab/config/」底下，更改設定後，執行指令更新 GitLab 設定 `gitlab-ctl reconfigure` 來生效。
2. Pre-configure：在 Docker 設定環境變數 `GITLAB_OMNIBUS_CONFIG`，此設定不會覆蓋 「gitlab.rb」，而是在每次執行 `docker run` 或是 `docker-compose up` 時，依所輸入的設定去更新 GitLab 設定，完整可支援的設定請參閱「[gitlab.rb.template](https://gitlab.com/gitlab-org/omnibus-gitlab/blob/master/files/gitlab-config-template/gitlab.rb.template?_gl=1%2awodqh8%2a_ga%2aNjEzMzczMTEzLjE2NjUwMjI0NjE.%2a_ga_ENFH3X7M5Y%2aMTY2NTU1Nzc5Ni4zMy4xLjE2NjU1NTc5NTEuMC4wLjA.)」。

## 在 Docker 上安裝 GitLab Runner
安裝方法可參考[官方文檔](https://docs.gitlab.com/ee/install/docker.html)來設定 docker-compose，這邊將 GitLab Runner 的內容加至原先的 docker-compose.yml 裡面。

docker-compose.yml 裡 GitLab Runner的部分
```yaml
services:
  GitLab-Server：
#...GitLab-Server的內容，這裡先省略...
  GitLab-Runner:
    image: gitlab/gitlab-runner:latest
    container_name: GitLab-Runner
    privileged: true
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - .\Volumes\GitLab-Runner\Config:/etc/gitlab-runner
    networks:
      default:
        ipv4_address: 172.20.0.3
    restart: always
#...volumes和networks的內容，這裡先省略...
```

:::info
如果有使用Docker Executor的話需要設定 `/var/run/docker.sock:/var/run/docker.sock`。
:::

## 註冊 GitLab Runner
輸入指令 `docker exec -it GitLab-Runner gitlab-runner register`，其中字首大寫的「GitLab-Runner」為 在docker-compose 設定的 container_name，第二個全小寫的 gitlab-runner 為 gitlab-runner.exe。
當執行 Register 時，Command Line 會出現以下訊息，進行 Runner 的設定初始化。
1. Enter the GitLab instance URL =>
可讓 Runner 連上 GitLab 的網址，如上面範例為`http://172.20.0.2`。理論上複製 Token 頁面上會有網址可以複製，但是如果未設定 `external_url` 或是網址為 `127.0.0.1` 或 `localhost` 之類的網址的話，那邊的網址無法正常使用。
2. Enter the registration token =>
GitLab 有三種 Scope 的 Runner 類型可以註冊，可參閱「[The scope of runners](https://docs.gitlab.com/ee/ci/runners/runners_scope.html)」，取得 Token 的位置如下表：

| Scope                   | 描述                       | Token位置                                                                                        |
| ----------------------- | -------------------------- | ------------------------------------------------------------------------------------------------ |
| Shared Runner           | 每個項目都可以使用。       | GitLab Admin Area > Overview > Runners > 點擊按鈕「Register an instance runner」則會顯示 Token。 |
| Group Runner            | 僅供特定專案群組可以使用。 | CI/CD > Runners > 點擊按鈕「Register a group runner」則會顯示 Token。                            |
| Project-Specific Runner | 只有指定專案可以使用。     | Settings > CI/CD > 展開 Runners > Specific runners 區塊有顯示 Token。                            |

3. Enter a description for the runner:
簡易輸入此 Runner 用途會做為此 Runner 的名稱，後面可在 GitLab 用戶界面中更改此值。
4. Enter tags for the runner (comma-separated):
可輸入 Runner 的環境、Executor等內容，供後續 GitLab CI 在執行時，可以搜尋到符合的 Runner，後面可在 GitLab 用戶界面中更改此值。
5. Enter optional maintenance note for the runner:
輸入一些給此 Runnner 其他開發維護人員需了解的相關的信息，可以輸入空白。
6. Enter an executor: ssh, docker+machine, docker-ssh+machine, kubernetes, virtualbox, custom, docker, docker-ssh, parallels, shell:
輸入建構環境的方法，例如使用 docker 建置測試環境則輸入 docker，完整訊息請參閱[Executors](https://docs.gitlab.com/runner/executors/)，另外如果 Runner 是安裝在 Windows 環境底下，還有 `docker-windows` 可以設定用來建置 Windows 平台的環境，不過目前支援環境不多。
7. Enter the default Docker image:
如果輸入 docker 會顯示此訊息，輸入預設的 docker image，例如：`docker:stable`。

設定完成後，會發現「\srv\gitlab-runner\config」產生一個檔案「config.toml」作為 Runner 的設定檔。如果更新設定檔後，正常是使用 `gitlab-runner restart`，但這邊 Runner 是建立在 Docker，官方是建議直接使用 `docker restart GitLab-Runner` 重啟 Container，GitLab-Runner 自行替換為自己設定的容器名稱。

各個平台註冊 Runner 的方法請參閱 [Registering runners](https://docs.gitlab.com/runner/register)。
Runner 設定請參閱 [Configuring GitLab Runner](https://docs.gitlab.com/runner/configuration/)。

## 簡單的 GitLab CI 實例 (Linux)
### 前置作業
1. 建立一個 Respority 為「TestCore」。
2. 將「TestCore」 Clone到本機。
3. 在「TestCore」建立一個 .NET 6 的專案，資料結構如下：
```
TestCore
│   .gitignore
│   .gitlab-ci.yml    
│   README.md
│
└───build
│   │   Dockerfile
│   
└───src
    │
    └───TestCore
        │   TestCore.sln
        │   TestCore
        │   ...
```

3. 幫「TestCore」註冊一個使用 Docker Executor 的 Runner，tags 為`docker` 和 `linux`，並開啟「config.toml」進行以下調整。
 * `privileged` 改為 `true`。
 * `volumes` 改為 `["/var/run/docker.sock:/var/run/docker.sock", "/cache"]`，讓 Runner Executor 使用主機外部的 Docker Engine。
 * 如果 GitLab 未設定 `external_url` 或是設定為 `127.0.0.1`、`localhost` 之類的，則須加上 `clone_url`。
 * `network_mode` 設為 `gitlab_default`，讓 Runner Executor 可以用連到 GitLab。

完整內容如下：
```
concurrent = 1
check_interval = 0

[session_server]
  session_timeout = 1800

[[runners]]
  name = "Run Linux Docker"
  url = "http://172.20.0.2"
  id = 1
  token = "dayFwyc86q4TdQzYz_Ca"
  token_obtained_at = 2022-10-19T07:09:03Z
  token_expires_at = 0001-01-01T00:00:00Z
  clone_url = "http://172.20.0.2"
  executor = "docker"
  [runners.custom_build_dir]
  [runners.cache]
    [runners.cache.s3]
    [runners.cache.gcs]
    [runners.cache.azure]
  [runners.docker]
    tls_verify = false
    image = "docker:stable"
    privileged = true
    disable_entrypoint_overwrite = false
    oom_kill_disable = false
    disable_cache = false
    volumes = ["/var/run/docker.sock:/var/run/docker.sock", "/cache"]
    shm_size = 0
	network_mode = "gitlab_default"
```

:::warning
`network_mode` 不能設定成 `host`，否則 Runner 執行時，可能會造成 GitLab 忙碌無法回應。
:::


Dockfile內容
```
FROM mcr.microsoft.com/dotnet/sdk:6.0

WORKDIR /app
COPY ./publish ./

EXPOSE 80

ENV ASPNETCORE_URLS "http://+:80"

ENTRYPOINT ["dotnet", "TestCore.dll"]
```

.gitlab-ci.yml內容

```yaml
stages:
  - build
  - list
  - deploy

build-job:
  stage: build
  image: mcr.microsoft.com/dotnet/sdk:6.0
  tags:
    - 'docker'
    - 'linux'
  script:
    - cd src/TestCore
    - dotnet restore
    - dotnet build --configuration Release
    - dotnet publish --configuration Release --output ../../build/publish
  artifacts:
    paths:
      - ./build/publish/*
    expire_in: never
    
list-job:
  stage: list
  image: bitnami/git:latest
  script:
    - git config --global core.quotepath false
    - git diff-tree -r --no-commit-id --name-status --diff-algorithm=minimal HEAD > changes.txt
  artifacts:
    paths:
      - ./changes.txt
    expire_in: never
  tags:
    - 'docker'
    - 'linux'
 
deploy-job:
  stage: deploy
  tags:
    - 'docker'
    - 'linux'
  variables:
    CONTAINER_RELEASE_IMAGE: $CI_PROJECT_PATH_SLUG:latest
  script:
    - cd build
    - docker build --tag $CONTAINER_RELEASE_IMAGE .
    - docker stop $CI_PROJECT_NAME || true && docker rm $CI_PROJECT_NAME || true
    - docker run -d -p 9080:80 --restart=always --name $CI_PROJECT_NAME $CONTAINER_RELEASE_IMAGE
  environment:
    name: production
    url: http://127.0.0.1:9080
```

### .gitlab-ci.yml說明
這邊簡化分支部分，僅做一個簡化的流程範例

#### 使用關鍵詞
* stages：定義有哪些要執行的 Stage 名稱和順序，名稱可自己設定。
* job：範例中的 `build-job` 和`deploy-job`，名稱可自己設定。
    * stage：設定此 Job 屬於 `stages` 裡的哪個 Stage。
    * tags：設定執行的 Runner，例如我這邊設定`docker`、`linux`，那就會只有設定`docker`、`linux` 的 Runner 會執行，若找不到符合 Runner，則會停擺直到 timeout。
    * image：因為是使用 Docker Executor，每個 Stage 都為一個 Docker Container，所以要設定此 Stage 所使用的 Image 環境，如果沒設定，就會使用 Runner 設定的 Default Image。
    * variables：變數宣告。
    * script：要在 Runner 裡執行的 Command Script。
    * artifacts：設定成功後附加到作業的文件和目錄列表，由於每階段是獨立的 Container，所以執行後把像是編譯過後的程式進行上傳，在從下個 Stage 下載使用。
        * paths：要上傳的檔案路徑。
        * expire_in：保留時間。
    * environment：要部屬的環境設定
        * name：環境名稱。
        * 給外面連結 Url。

#### 流程說明
##### build-job：
1. 設定使用 Image 為 `mcr.microsoft.com/dotnet/sdk:6.0`，這邊最好和 Dockfile 用的 Image 一致。
2. State 開始時，會從 Repository 下載此次上傳版本的檔案、資料夾。
3. 因為 Repository 的專案資料夾是放在 `src/方案目錄/專案目錄`，所以先用 cd 切換目錄到方案目錄底下，如果有多專案，則切換到要選擇的專案資料夾底下。
4. 使用 `dotnet restore` 做套件還原，不過官網說執行 `docker build` 會自動進行 `dotnet restore`。
5. 使用 `- dotnet build --configuration Release`，建置專案，因為這邊是範例，所以configuration 直接設定為 `Release`，實務上應搭配分支決定 configuration。
6. `- dotnet publish --configuration Release --output ../../build/publish` 發佈專案，並指定輸出資料夾。
7. `artifacts` 設定要保留的路徑檔案和時間。

##### list-job：
1. 使用 `git config --global core.quotepath false` 來停止轉譯特殊字符，在輸出路徑時，中文會被當成特殊字符轉換掉，所以將 `core.quotepath` 設為 `false`。
2. 產出異動清單，Command 說明如下：
    * git diff-tree：透過比較兩個節點的樹對象，找到的差異的內容和模式，如果只輸入一個節點，則比較此節點與其父節點比較。
    * -r：遞歸到子樹，若未設定只會比較一層。
    * --no-commit-id：不顯示 Commit ID。
    * --name-status：僅顯示更改文件的名稱和狀態。
    * --diff-algorithm=minimal：選擇差異算法，使用最小差異。
    * HEAD：當前分支的最後一次提交

如果需要針對匯出格式調整，請參考官方文章 [diff-tree](https://git-scm.com/docs/git-diff-tree)。

##### deploy-job：
1. 未設定 Image，所以會使用 Runner 定義的 `docker:stable`。
2. State 開始時，除了下載 Repository 的檔案外，會額外將前面 `artifacts` 設定的路徑檔案下載下來至「build/publish」底下，所以 build 結構如下。
```
build
│   Dockerfile(來自Repository)
│
└───publish/*(來自artifacts)
```
4. 切換目錄至「build」。
5. 使用 `docker build` 將 Dockerfile 和 「publish」底下檔案建置成 image可執行 Web 的image。
6. 嘗試移除同名的 Container。
7. 使用 `docker run` 將剛建置的 image 來啟動 Container。
8. `environment` 將 Container 裡的 Web Url 提供給部屬裡的環境設定。


### 執行結果
#### CI/CD > Jobs
如果 State 有上傳檔案至 `artifacts` 裡，會出現可下載圖示，藍框可以下載異動清單，紅框可下載編譯後檔案。
![](https://i.imgur.com/mvyz1Ew.png)

#### Deployments > Environments
會顯示一個可用環境，點擊「開啟」後，會開啟網址為 `http://127.0.0.1:9080` 的網頁，不從這邊開啟，直接輸入網址也可以。
![](https://i.imgur.com/QhrF9j3.png)

:::warning
1. 網路有些做法是用 `Docker in Docker(DIND)`，使用的Docker Image Tag會是 dind 結尾，不過此法建立的 Container 我不知要如何讓外部使用，所以選擇在 Runner 的「config.toml」裡，將 volumes 增加 `docker.sock` 的對應，此法會讓建立的 Image 和 Container 都掛載在外部的 Docker 底下。
2. 「CI_」開頭的變數為系統內部變數，詳情參考 [Predefined variables reference](https://docs.gitlab.com/ee/ci/variables/predefined_variables.html)。
3. 官網範例在建立 Image 是使用「CI_REGISTRY」開頭的變數，因為要啟用 Registry 相關功能要走 https，且要建立相應的 `Access Token` 才可使用，這邊就不提了。
4. Image 名稱只能為小寫，因為範例裡的 Respority 名稱有含大寫，所以使用`CI_PROJECT_PATH_SLUG`。
:::

### 參考資料來源
[The .gitlab-ci.yml file](https://docs.gitlab.com/ee/ci/yaml/gitlab_ci_yaml.html)
[Environments and deployments](https://docs.gitlab.com/ee/ci/environments/#environments-and-deployments)
[gitlab-ci build asp.net core docker](https://stackoverflow.com/questions/61011982/gitlab-ci-build-asp-net-core-docker)
[.Net & Docker（一）在Docker容器上運行.Net Core API](https://mp.weixin.qq.com/s?__biz=MzI1MTA0OTM0Mw==&mid=2650959260&idx=1&sn=8dcfbc4f075cc806409663cccc8cf690&chksm=f20e298cc579a09a2eb93cd89ea9035fdc0ae1ec3906dc358a71015cf163edbd53245652ab9a&scene=21#wechat_redirect)

###### tags: `Docker` `GitLab` `GitLab CI`
