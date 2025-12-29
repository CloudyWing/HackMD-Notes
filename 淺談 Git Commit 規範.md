# 淺談 Git Commit 規範

目前網路上的 Git Commit 規範多數來自於 Angular 團隊的格式，隨著時間延伸出許多版本。雖然這些資訊在網上隨處可見，為了防止遺失，我還是決定寫一篇文章紀錄，畢竟我五年前看到的文章現在也找不到了。目前的「[Angular Commit Format]」是這樣的。(https://github.com/angular/angular/blob/main/CONTRIBUTING.md)。

## Commit Format

Angular Commit Format 規範分為 header、body 和 footer 三個部分，各部分用空行隔開。其中 header 是必填的，body 視 header 的 type 而定（若 type 為 docs，則必填），footer 是選填的。

```xml
<header>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

### Header

Header 格式如下（節錄自 Angular Commit Format 的內容)：

```xml
<type>(<scope>): <short summary>
  │       │             │
  │       │             └─⫸ Summary in present tense. Not capitalized. No period at the end.
  │       │
  │       └─⫸ Commit Scope: animations|bazel|benchpress|common|compiler|compiler-cli|core|
  │                          elements|forms|http|language-service|localize|platform-browser|
  │                          platform-browser-dynamic|platform-server|router|service-worker|
  │                          upgrade|zone.js|packaging|changelog|docs-infra|migrations|
  │                          devtools
  │
  └─⫸ Commit Type: build|ci|docs|feat|fix|perf|refactor|test
```

#### Type

Type 用於給 Commit 分類，不同時期的分類有所不同，目前整理如下表，主要差異在於`style` 和 `chore` 被移除了，而 CI/CD 從 `build` 中獨立出來：
| Type | 描述 | 新描述 |
| --- | --- | --- |
| feat | 新功能 | 新功能 |
| fix | bug 修復 | bug 修復 |
| docs | 僅限文件更新 | 僅限文件更新 |
| style | 不影響程式碼含義的更改 (空白字元, 格式化, 少了分號, 其他) |  |
| refactor | 既不修復錯誤也不增加功能的程式碼變更 | 既不修復錯誤也不增加功能的程式碼變更 |
| test | 補測試或更正現有測試 | 補測試或更正現有測試 |
| perf | 提升效能的程式碼變更 | 提升效能的程式碼變更 |
| build | 影響打包機制，CI設定或外部依賴關係的更改 (example scopes: gulp, broccoli, npm) | 影響打包機制或外部依賴關係的更改 (example scopes: gulp, broccoli, npm) |
| chore | 其他不修改 src 或測試文件的更改 | |
| ci | | 變更 CI 設定文件和腳本（example：CircleCI, SauceLabs） |

#### Scope

Scope 表示受影響的 npm 套件的名稱，這是針對 Angular 定義的，其他程式語言可能不適用。對於我來說，大部分情況下會選擇省略，或標註變更的專案名稱。

#### Short Summary（Subject）

Short Summary 是對變更的簡潔描述，Angular 規範如下：

* use the imperative, present tense: "change" not "changed" nor "changes"
* don't capitalize the first letter
* no dot (.) at the end

但是我都用中文，所以就句尾不用句號而已。

### Body

Angular 團隊原文如下：
> Just as in the summary, use the imperative, present tense: "fix" not "fixed" nor "fixes".
> 
> Explain the motivation for the change in the commit message body. This commit message should explain why you are making the change. You can include a comparison of the previous behavior with the new behavior in order to illustrate the impact of the change.

因為我是用中文寫，所以沒有時態問題。實際上，除非修改內容複雜或需特別描述變更原因，否則我會省略 Body。但最近有朋友提到可以使用 Visual Studio 的 Copilot 來幫忙生成 Commit 訊息（若有訂閱 Copilot），我可能會改用其生成的訊息作為 Body 的基底。

### Footer

Footer 可以包含破壞性變更和棄用資訊，也可用於引用 GitHub issue、Jira ticket 和其他 PR。例如：

```text
BREAKING CHANGE: <breaking change summary>
<BLANK LINE>
<breaking change description + migration instructions>
<BLANK LINE>
<BLANK LINE>
Fixes #<issue number>
```

或著

```sql
DEPRECATED: <what is deprecated>
<BLANK LINE>
<deprecation description + recommended update path>
<BLANK LINE>
<BLANK LINE>
Closes #<pr number>
```

`BREAKING CHANGE` 用於重大不兼容變更，`DEPRECATED` 用於描述棄用內容。

大部分情況下，Footer 僅用於關聯需求單號，具體關聯方式取決於所使用的 Issue Tracker。

舉例來說，在 GitHub 中可以使用以下關鍵字將 PR 關聯並關閉 Issue，詳見 GitHub 文件「[Linking a pull request to an issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue)」。

* close
* closes
* closed
* fix
* fixes
* fixed
* resolve
* resolves
* resolved

在 GitLab 中，可以用以下方式做連結，其中 `123` 替換成相應 ID：

* 關聯 Issue：#123
* 關聯 MR：!123
* 關聯 Snippet：$123

GitLab 同樣可以使用 `Closes #123` 或 `Fixes #123`，在合併所屬分支時，關閉相應的 Issue。詳見 GitLab 文件 GitLab 文件「[Tutorial: It's all connected in GitLab](https://about.gitlab.com/blog/2016/03/08/gitlab-tutorial-its-all-connected/)」。

就我個人在實務上來說，由於 PR 或 MR 可能未與 Issue Tracker 關聯，或著希望手動控制關聯，我會用 `issue` 開頭，讓人從語意上就能了解 `#123` 是與 Issue 關聯。

:::info
`close`  等關鍵字是不分大小寫的，文件中的範例是因為它在句首，所以字首大寫，如果仔細看在句中出現的，則是用小寫。
:::

## Commit Tempate

上面簡單的介紹現今主流的 Commit 規範，但實際操作時，可能會忘記一些不常用內容，像我自己就經常忘記一些不常用的 Type。而Git 支援預設的 Commit Template，可以幫助我們統一 Commit 訊息格式。

### 設定方法

首先，新增一個檔案「.gitmessage.txt」，檔名不能改，內容如下，可依自身需求調整：

```git
<type>(<scope>): <subject>

# -- Type --
# 必須是以下之一:
#
# feat: 新功能
# fix:  bug 修復
# docs: 僅限文件更新
# style: 不影響程式碼含義的更改 (空白字元, 格式化, 少了分號, 其他)
# refactor: 既不修復錯誤也不增加功能的程式碼變更
# perf: 提升效能的程式碼變更
# test: 補測試或更正現有測試
# build: 影響打包機制或外部依賴關係的更改 (example scopes: gulp, broccoli, npm)
# chore: 其他不修改 src 或測試文件的更改
# ci: 變更 CI 設定文件和腳本（example：CircleCI, SauceLabs）
#

# -- Scope --
# 範圍可以是指定提交更改位置的任何內容 例如 編譯, 元素注入, etc.
#
# init
# runner
# watcher
# config
# web-server
# proxy
# etc.

# -- Subject --
# Subject 包含對變更的簡潔的描述：
# 使用必要的現在時態： "change" not "changed" nor "changes"
# 不要第一個字大寫
# 不要用句點當結尾
#

# -- Body --
# 就像在這個題目一樣，使用必須的現在時態： "change" not "changed" nor "changes".
# Body 該包含變化的動機，並與以前的行為進行對比。
#

# -- Footer --
# Footer 應該包含 Breaking Changes 的資訊並且也是 GitHub issue close 的參照
# Breaking Changes 應以 "BREAKING CHANGE" 一詞開頭：帶有空格或兩個換行符。然後使用其餘的提交消息。
# Deprecated 應以 "DEPRECATED"一詞開頭：帶有空格或兩個換行符。然後使用其餘的提交消息。

```

接著，開啟 Git Bash，並輸入以下命令（其中`~/` 預設會是 `C:\Users\{Windows 帳號}`，或將 `~/` 替換換成要放置檔案的完整路徑）：

```git
git config --global commit.template ~/.gitmessage.txt
git config --global commit.cleanup strip
```

說明

* `git config`: 這是 Git 的設定指定，用於查看和設定 Git 的設定選項。
* `--global`: 此註記表示該設定將用於全域範圍，即所有的 Git 儲存庫。如果不使用此註記，設定只會生效於當前的 Git 儲存庫。
* `commit.template`: 用來指定 Commit 訊息的 Template 檔案位置。
* `commit.cleanup`: 用來指定在 Commit 時如何處理 Commit 訊息，預設是 `whitespace` 不忽略註解行。
* `strip`: 這是 `commit.cleanup` 選項的值，表示在 Commit 時，將 Commit 訊息中的註解行和多餘的空行移除。

執行完畢後，會在全域的 .gitconfig 增加以下內容，全域的 .gitconfig 在 Windows 預設存放位置在使用者帳號底下，例如：`C:\Users\{Windows 帳號}`。

```text
[commit]
	cleanup = strip
	template = {指定路徑}/.gitmessage.txt
```

如果輸入指定未包含 `--global`，此內容則會產生在該儲存庫的 「./.git/config」檔案裡。

:::info
如果 `template` 設定為 `./.gitmessage.txt`，Git 會使用儲存庫根目錄下的 `.gitmessage.txt` 檔案作為 Commit Template。
:::

Git 一共有三個 config 設定：

* System 設定：
  * 位置：`C:\Program Files\Git\etc\gitconfig`。
  * 優先度最低。此設定影響整個系統中的所有使用者和專案，通常是系統管理員設置的全局設定，適合全系統共用的 Git 行為規範。
* Global 設定
  * `C:\Users\{Windows 帳號}\.gitconfig`：
  * 次高優先度。此設定適用於單一使用者，但會被 Local 設定覆蓋。常用來設定個人使用的 Git 選項，對於所有儲存庫都有影響，除非被 Local 設定所取代。
* Local 設定：
  * `.git\config`
  * 優先度最高。此設定僅對當前專案有效，覆蓋 Global 和 System 的設定。由於它的影響範圍僅限特定儲存庫，因此對於需要針對專案做特殊設定的情況特別有用。

:::info
三個檔名都不一樣 XD
:::

### 實際使用

當於 Git Bash 輸入 `git commit` 時，會出現訊息 `hint: Waiting for your editor to close the file...`，並開啟記事本，該記事本會包含「.gitmessage.txt」的內容以及以下資訊：

```git
# Please enter the commit message for your changes. Lines starting
# with '#' will be ignored, and an empty message aborts the commit.
#
# On branch main
# Your branch is up to date with 'origin/main'.
#
# Changes to be committed:
#	modified:   "{異動檔案名稱}"
```

前段「.gitmessage.txt」尾行增加空行是為了與此段訊息分開，此段內容主要在說明請你輸入 Commit 訊息，以 `#` 開頭的行將會被忽略，以及異動檔案清單。

當異動完檔案，並儲存後，則會將檔案內容作為 Commit 訊息。

如果使用其他 Git 版控軟體，不一定會忽略 `#` 開頭的行，所以需要設定 `commit.cleanup strip` 。

目前我已知有支援 Commit Template 的版控軟體如下：

* GitKraken：
  在儲存庫頁籤點選 File => Preferences... => Commit，會顯示 Commit Template 設定，如果未設定 `commit.cleanup strip` 記得要勾選「Removes comments from commit messages」來忽略 `#` 開頭的行。

*  Tortoisegit：
  當 `commit.cleanup` 為 `whitespace`，Commit **不**會忽略 `#` 開頭的行。

* Git Extensions：
  當 `commit.cleanup` 為 `whitespace`，Commit **仍**會忽略 `#` 開頭的行（感謝同事友情測試）。

* Sourcetree：
    * Mac 版的 4.2.8 有支援（感謝同事友情測試)；Windows 版的 3.4.20 開始支援。
    * 當 `commit.cleanup` 為 `whitespace`，Commit **仍**會忽略 `#` 開頭的行。

:::info
Sourcetree 3.4.18 版尚未支援 Git Template，但我看在 2024/6/27，官方在把大家喊好幾年的 Jira 單全關閉了，說在 [Commit template message](https://jira.atlassian.com/browse/SRCTREEWIN-3817) 已解決，所以也許後續某個版本有可能會支援了。

Sourcetree 3.4.20 已新增支援，詳見 [Sourcetree release notes](https://product-downloads.atlassian.com/software/sourcetree/windows/ga/ReleaseNotes_3.4.20.html)。
> SourceTree 3.4.20 [17 September 2024]
> * Changes: Supporting git commit template feature
> * Changes: Upgrade to Git 2.46.0 and Git LFS to 3.5.1
> * Fixed: 'Push changes immediately' checkbox is disabled in No Staging View
> * Fixed: Arbitrary code execution vulnerability
> * Fixed: Interactive rebase always aborting when a merge is necessary
> * Fixed: Silent crash when creating a hotfix
> * Fixed: Sourcetree diff treats large .sql files as binary
> * Fixed: Windows Line breaks are replaced with Unix breaks on "Discard Hunk" click
:::

### 還原設定

可以用以下指令移除 Git Template 設定：

```git
git config --unset --global commit.template
```

使用以下指令還原忽略註解行的設定：

```git
git config --global commit.cleanup whitespace
```

## 異動歷程

* 2024-07-23 初版文件建立。
* 2024-09-20
  * 更新 Windows 版 Sourcetree 3.4.20 支援 Git Commit Template 功能。
  * 修正設定檔位置的說明。

---

###### tags: `Git`