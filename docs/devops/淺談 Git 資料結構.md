---
title: "淺談 Git 資料結構"
date: 2024-07-31
lastmod: 2024-09-20
description: "深入解析 `.git` 目錄結構。介紹 hooks, info, logs, refs 等資料夾用途，並解說 Git 物件 (Blob, Tree, Commit) 如何以 SHA-1 Hash 儲存檔案內容與版本歷程。"
tags: ["Git"]
---

# 淺談 Git 資料結構

Git 所有的儲存資料都存在於「.git」資料夾裡。刪除「.git」資料夾即等同於刪除該儲存庫的本機版控。以下是「.git」資料夾的主要內容。

## 資料夾

### hooks

存放各種客製化腳本，可以在 Git 操作的特定時機自動執行，例如：`commit`、`push` 或 `merge` 之前或之後。這些腳本可以用來執行自動化測試、檢查程式碼風格等操作。常見的 hooks 有 `pre-commit`、`pre-push`、`post-merge` 等。

### info

儲存一些輔助性的資訊文件。預設會有一個「exclude」檔案，用來定義排除特定檔案或目錄的規則，與「.gitignore」用途相同，但「exclude」是本機設定，適用於單個開發者的環境設置。如果是團隊開發，應該使用「.gitignore」並記錄在版控裡。

### logs

記錄每次引用（如 branch、HEAD）的更新歷史，這些日誌可以用來追踪誰在什麼時間對某個分支做了哪些更改。常見內容包括：

- HEAD：記錄每次 HEAD 變動的歷史。
- refs\heads\：存放各分支的變動歷史。
- \refs\remotes\origin\：存放遠端分支的 `git fetch` 和 `git push` 紀錄。「origin」是本機儲存庫幫連結的遠端儲存庫取得的預設別名，但也可視需要建立其他名稱。

::: tip

- Git 指令 `git reflog` 會顯示「logs/HEAD」的內容。如果使用 `git reset --hard` 或 `git rebase -i` 刪除了 Commit 記錄，可以用 `git reflog` 找出操作紀錄，再用 `git reset --hard` 還原 Commit。
:::

### objects

- 用途：儲存 Git 的所有資料物件，包括 blob、tree、commit 和 tag 物件。
- 結構：依物件內容的 SHA-1 哈希值前兩個字元作為目錄，後面的 38 個字元作為檔案名稱。例如，SHA-1 哈希值為 `d670460b4b4aece5915caf5c68d12f560a9fe3e4` 的物件會存放在 「.git/objects/d6/70460b4b4aece5915caf5c68d12f560a9fe3e4」。

#### Commit 操作中的物件生成

假設 Commit 一個檔案的變更，會產生三個物件：

- Blob 物件：
儲存檔案的實際內容，例如新增或修改的檔案內容會被建立成 blob 物件儲存。

- Tree 物件：
儲存目錄結構和該目錄下所有檔案的 blob 物件的 SHA-1 哈希值，描述檔案和子目錄的樹狀結構。

- Commit 物件：
儲存 Commit 資訊，包括 tree 物件的 SHA-1 哈希值、上一個 Commit 的 SHA-1 哈希值、Commit 訊息、作者和提交者資訊等，在版本控制系統中看到的 HASH 值為這個。

更詳細的檔案內容，可參考官網的「[Git Internals - Git Objects](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects)」。

### refs

檔名為分支或 Tag 名稱，內容為目前所對應的 Commit 的 HASH 值。常見資料夾有：

- heads：儲存本機分支，若分支名稱含「/」，則會建立對應的目錄結構。例如：「feature/需求1」，則會建立一個「feature」的資料夾，底下存「需求1」的檔案。
- remotes：儲存遠端分支，以遠端儲存庫名稱為資料夾，例如「origin」。
- tags：儲存 Tag 的名稱。

## 檔案

### COMMIT_EDITMSG

紀錄上一次 Commit 的內容。若使用 `git commit`（沒有 -m），`git commit --amend` 或解衝突過程中出現的訊息編輯，都會開啟此檔案以供編輯。有些 GUI 工具在執行這些指令時，可能會提供 UI 編輯而不開啟此檔案。

::: tip
使用 `git commit --amend` 所帶入的內容和這個檔案無關。而是把上一次 Commit 的內容寫入此檔提供編輯。
:::

### config

儲存該儲存庫的 Git 設定。此檔案類似「.gitconfig」，但主要是針對特定儲存庫的設定。

### description

供 Git Web GUI 讀取儲存庫的描述資訊。

### index

最新一次 Commit 後的儲存庫檔案快照及 `git add` 所加入的檔案資訊組成的二進位檔案。

### HEAD

儲存當前檢出的分支名稱或具體 Commit。當目前的 HEAD 指向分支（如 `main`）時，會顯示 `ref: refs/heads/main`；當 HEAD 指向某個 Commit 時，則儲存 Commit 的 HASH 值。

### ORIG_HEAD

儲存進行破壞性操作（如 `git reset`、`git merge` 等）之前的 HEAD 狀態，用於在必要時恢復到之前的狀態。

### FETCH_HEAD

標註每個分支的最後一次 `git fetch` 的紀錄，每行格式如下：

```text
{Commit SHA-1} [not-for-merge] branch '{分支名稱}' of {遠端儲存庫網址}`
```

範例：

```text
3b3a827b86d264f9c81bc77ef6e0e3df5e302ae8 not-for-merge branch 'main' of http://127.0.0.1/wing/Project
```

\[not-for-merge\]：表示該節點暫時不合併到當前分支。`git pull` 實際上是 `git fetch` + `git merge`，若觸發 Merge 行為，就不會包含此標記。

## 淺談分支

由上述 Git 結構可知，分支和 Tag 都只是指向特定 Commit 的物件。Tag 指向固定的 Commit 物件，而分支則隨每次 Commit 更新。分支圖是從分支所指向的 Commit 物件開始，逐步追溯其紀錄的上一個 Commit 物件，最後產生出完整的 Commit 歷史結構。

以上只是為了複習幾年前上保哥 Git 課的內容，這邊開始才是我要開始胡言亂語的主要內容。

用玄幻小說的角度來看，分支圖就像是一個已知的時間線，分支代表當前的節點，而 Tag 則是一個固定的歷史座標。每次 Commit 後，再使用 `git reset` 或 `git rebase`，被還原前的節點仍儲存在「objects」資料夾內。分支圖的各個 Commit 節點是已確定的過去，而 `git reset` 前的節點則是可能的未來。HEAD 代表當前所在的時空位置。要穿越時空，可以看到的只有歷史座標（Tag）和已知的時間線（分支圖），其餘都要靠 git reflog 來查詢。

## 異動歷程

- 2024-07-31 初版文件建立。
- 2024-09-20 儲存庫根目錄底下的「.gitconfig」無法生效，所以移除可作為版控的相關描述。
