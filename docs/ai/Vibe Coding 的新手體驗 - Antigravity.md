---
title: "Vibe Coding 的新手體驗 - Antigravity"
date: 2026-01-07
lastmod: 2026-01-07
description: "分享使用 Antigravity 進行 Vibe Coding 的體驗，包含 UI 介面介紹、設定說明、GEMINI.md 進階技巧、實際案例應用以及遇到的地雷（Git 快照、編碼問題）。"
tags: ["Antigravity", "Gemini"]
---

因為 Claude Code 的額度用完後續又未續訂，所以去年 12 月底起改用 **Antigravity** 來繼續體驗 Vibe Coding 的開發模式。

## 關於 Antigravity

Antigravity 是基於 **Code OSS**（VS Code 的開源版本）建構的，因此介面與操作邏輯和 VS Code 高度相似。對於習慣 VS Code 的開發者來說，遷移成本極低；但像我這種以 Visual Studio 為主力、VS Code 為輔助的使用者，可能需要一點時間適應。

### Antigravity Cockpit

這是 Antigravity 的必裝核心擴充套件，安裝後右下角會顯示當前各模型的可用額度概覽。

![Antigravity Cockpit Overview](./images/Vibe%20Coding%20的新手體驗%20-%20Antigravity/antigravity-cockpit-quota-overview.png)

::: tip
圖中的 Group 名稱我有手動修改過，原本預設顯示好像是 `Group 1` 和 `Group 3`。
:::

將滑鼠游標移至圖示上，會顯示各模型的詳細剩餘額度與重置時間；若直接點擊則可開啟完整儀表板（Dashboard）。此外，當額度低於 30% 時，系統也會自動跳出低電量提示。

![Model Usage Detail](./images/Vibe%20Coding%20的新手體驗%20-%20Antigravity/antigravity-cockpit-model-usage.png)

::: tip
Antigravity 的額度池與網頁版 Gemini (Gemini 3 / Advanced) 是**分開計算**的。這與 Claude 不同（Claude Code 額度用完會連帶影響網頁版 Chat 的使用），所以不用擔心在 IDE 寫程式消耗太多，會導致網頁版無法使用。
:::

::: warning
雖然同一個額度群組（Quota Group）內包含多個模型（例如 Gemini 系列共用一組；Claude 與 GPT-OSS 共用另一組），但這不代表同組內不同模型消耗額度的權重（Weight）相同。
:::

另外還有一套名為 `Antigravity Quota` 的擴充套件也能查看額度，但介面相對陽春，功能也較簡單。

## 操作介面

由於 Antigravity 的 AI 互動介面與標準 VS Code 不同，這邊稍微說明一下主要的功能區塊：

![Antigravity UI Panels](./images/Vibe%20Coding%20的新手體驗%20-%20Antigravity/antigravity-ui-panels.png)

1. **Agent 視窗開關**（紅框）：如果不小心關閉了 AI 對話視窗，可以點擊此處重新開啟。
2. **對話輸入框**（藍框）：在此輸入指令請 AI 執行操作。
3. **歷史紀錄**（橘框）：重啟 Antigravity 後，若想找回之前的對話 Context，可從這裡恢復。

## 權限設定

安裝時會有設定精靈，之後也可以透過 `Settings => Open Antigravity User Settings` 調整。建議根據專案性質設定不同的權限等級。

### 1. Agent 行為與 Review Policy

這些設定決定了 AI 執行動作時的自主權：

![Agent Review Policy](./images/Vibe%20Coding%20的新手體驗%20-%20Antigravity/antigravity-agent-review-policy.png)

- **Review Policy**：
    當你提出需求時，AI 會產生執行計畫（Plan）。
  - `Always Proceed`：永遠自動執行，不需確認。
  - `Agent Decides`：由 Agent 自行判斷是否需要人類介入。
  - `Request Review`：永遠需要使用者手動批准計畫。
- **Terminal**：
    控制終端機指令（如 Commit、npm install 等）的執行權限。
  - `Always Proceed`：直接執行。
  - `Request Review`：需使用者批准。

### 2. Browser Tools 設定

![Browser Tool Settings](./images/Vibe%20Coding%20的新手體驗%20-%20Antigravity/antigravity-browser-tool-settings.png)

- **Enable Browser Tools**：是否允許 Agent 讀取外部網站。
- **Browser Javascript Execution Policy**：是否允許執行網頁上的 JavaScript。
  - `Disabled`：禁止。
  - `Request Review`：需批准（建議選項，尤其是涉及金流或外部介接的網站）。
  - `Always Proceed`：自動執行。

### 3. Conversation Mode（對話模式）

在輸入框除了選擇模型外，還能切換模式：

![Conversation Mode](./images/Vibe%20Coding%20的新手體驗%20-%20Antigravity/antigravity-conversation-mode.png)

- **Planning**：先思考、產生計畫報告，經使用者確認後才執行（比較穩健）。
- **Fast**：直接執行任務，可能會忽略部分 Review Policy 設定（適合簡單任務，我一般不會使用）。

## 實際體驗

### 寫 Code 的手感：Ghost Text

在進入具體專案前，先提一下 Antigravity 的基礎 Coding 體驗。它內建了類似 GitHub Copilot 的程式碼補完功能（Ghost Text）。

它會根據上下文預判我要做的操作，如果我手殘打錯，看到它的紅色建議修訂，就能提前發現並修正。

### 看得見的思考過程 (Thinking Process)

Antigravity 在處理指令時，介面上首先會顯示 `Thinking for...`（思考中），待思考完畢後會轉變為 `Thought for...`（思考歷程）。點擊展開該區塊，即可查看 Agent 完整的思考路徑。

![Thinking Process](./images/Vibe%20Coding%20的新手體驗%20-%20Antigravity/antigravity-thinking-process.png)

在使用中文指令時，Gemini 模型的思考過程通常仍顯示英文，而 Claude 模型則會顯示中文。透過觀察這段思考歷程，我可以確認 Agent 是否正確理解我的語意，或即時發現思考方向的偏差。

### 案例 1：英聽練習專案 (SoftwareEnglishPodcast)

我第一個拿來練習的專案是用來產生英聽 Podcast 的工具。

如果是用網頁版的 Gemini 3，處理這類任務會很痛苦：

1. **輸出格式不穩**：它不像 Claude 可以產生檔案到 Artifacts 上，框選內容時容易遺失格式，而且讓它產生的輸出的內容，也常常會包含其他對話內容，完整複製還要刪除，如果輸出內容的程式碼區塊又包含其他程式碼區塊，就會造成格式被截斷的問題。
2. **版本迭代困難**：若要進行多次優化，容易發生 Context 遺失，每次都要重新貼上程式碼也很麻煩。

改用 Antigravity 後，在這個專案中它能直接操作檔案系統，完美解決了上述問題。我只需要下指令，它就會讀取現有程式碼、進行修改並存檔，整個流程順暢非常多。

### 案例 2：技術筆記網站遷移 (本專案)

這是目前的技術筆記專案，最初只是發現 GitHub 有 GitHub Pages 可以作為靜態網站平台，正好有一個現成的技術筆記專案，就想拿來測試。

當然後續把 HackMD 的筆記轉移過來又是另一回事了。

#### 自動化圖片遷移

早期筆記圖片都放在 Imgur，但後來筆記都有在 GitHub 備份，就考慮過要不要改放 GitHub，後來因為 Imgur 開始擋台灣 IP 上傳圖片，所以勢必要進行遷移。這個任務如果手動做會很崩潰，但用 Antigravity 卻非常簡單：
> 「檢查整個專案 Markdown 檔案裡的 Imgur 圖片連結，下載圖片到 `images` 資料夾（以文章檔名為子目錄），根據上下文重新命名圖片，並依照指定格式替換文章中的連結。」

它就會根據輸入產生執行計畫，我確認沒問題請它執行後，自動完成了上百張圖片的遷移與連結替換。

#### 無痛轉移框架

一開始我讓它轉成 Jekyll 格式，後來和 Gemini 3 討論後又決定改成 VitePress。
不論是 Jekyll 還是 VitePress，它們都需要在 Markdown 檔頭包含 **Frontmatter**。最繁瑣的部分其實是資料補全——我花了一天時間從原本的 HackMD 上找每篇文章最初的發佈日期與根據的 Commit 紀錄，手動補上異動歷程並統一格式。

待資料準備好後，剩下的工作就簡單了。我讓 Antigravity 讀取這裡面整理好的異動歷程與標題，自動為每篇文章生成符合框架要求的 Frontmatter，就完成了最後的轉換。

#### 批次更新 HackMD 內容

最初我曾經想同時維護 HackMD 和 GitHub Pages，後來因維護成本考量，決定只維護 GitHub Pages 。但之前已經把圖片遷移到 GitHub 上，且更新連結後的內容已經手動更新回 HackMD 上。

為了結束 HackMD 的維護，我使用寫腳本呼叫 HackMD API 更新所有舊文章，加上遷移通知。利用 Antigravity 變得很簡單，我不用去管腳本怎寫，HackMD API 該怎麼呼叫，把邏輯寫好給它處理就好，後續處理流程如下：

1. 先呼叫 HackMD API 取得所有文章的 ID 與標題清單。
2. 準備一份包含「文章已遷移通知...」的 Markdown 範本。
3. 讓 Antigravity 撰寫腳本，將本機的 Markdown 檔案與 HackMD 的文章標題進行匹配（即使因為檔名特殊符號或目錄結構差異導致不完全一致，它也能智慧判別）。
4. 自動呼叫 API，將每一篇 HackMD 文章內容替換為帶有新連結的遷移通知。

就這樣，一次解決了 87 篇文章的「告別」作業。

::: tip
我是因為全部的文章本機都有留一份，所以不怕它執行失敗，但正常在執行還是需要了解 HackMD API 怎麼使用。
:::

#### Browser Control 自動測試

如果你的 Chrome 安裝了 `Antigravity Browser Control` 擴充套件，Antigravity 可以直接操控你的瀏覽器進行 End-to-End 測試。當然它的測試，是屬於用 JavaScript 讀 DOM，所以一些樣式問題，例如不同頁面寬度有落差，它可能會說它已經截圖認為沒問題，但實際上問題還是沒解決。

Claude 模型有時會主動使用此功能；Gemini 目前我沒看過它主動使用過，但可以用明確指令進行要求。

使用此功能時，它會額外呼叫 Gemini Flash 模型來撰寫自動化腳本，因此你會看到有兩個模型同時消耗額度。根據我的經驗，Gemini Flash 在此過程中消耗的額度通常會比主模型還高。

如果 Policy 設定為 `Request Review`，每次操作瀏覽器前都會跳出確認視窗（如下圖）。

![Browser Control Request](./images/Vibe%20Coding%20的新手體驗%20-%20Antigravity/antigravity-browser-control-request.png)

::: tip
因為我這網站是靜態網站，不涉及任何外部介接，所以我是設定 `Always Proceed`；若涉及後端資料寫入或金流，還是建議設為 `Request Review`。
:::

## Agent 記憶體設定

在[官方文件](https://developers.google.com/gemini-code-assist/docs/use-agentic-chat-pair-programmer?hl=zh-tw#create-context-file)中發現，可以透過建立 `GEMINI.md` 檔案來提供 Agent 背景資訊。

這個概念就非常像是在使用 Claude Code 的 `CLAUDE.md` 檔案，Agent 在規劃任務時就會強制參考。

::: tip
雖然連結網址是針對 Gemini Code Assist，但是 Antigravity 也有作用。如果想進行測試，可以嘗試在 `~/.gemini/GEMINI.md` 寫一句「規則：回答時請一律在句尾加上『皮卡皮卡』。」關掉所有開啟視窗，點一下其他檔案（如果開啟 Antigravity 可能會順便讀取目前正開啟檔案，以及工作目錄目前 focus 的檔案），在空白上下文的情況下輸入 Hello，看 Antigravity 回應會不會加上皮卡皮卡。
:::

### GEMINI.md 的作用範圍與繼承關係

可以在不同位置建立 `GEMINI.md` 檔案，以控制不同的作用範圍：

| 範圍 | 位置 |
| --- | --- |
| **所有專案** | `~/.gemini/GEMINI.md` |
| **特定專案** | 工作目錄或任何上層目錄，直到專案根目錄（以 `.git` 資料夾識別）或主目錄為止 |
| **專案的特定元件、模組或子區段** | 工作目錄的子目錄 |

Agent 的記憶體系統會**從多個位置載入內容檔案**，並遵循以下繼承規則：

- **更具體的檔案優先**：來自特定元件或模組的 `GEMINI.md` 內容，會**覆寫或補充**來自更一般內容檔案（如全域 `~/.gemini/GEMINI.md`）的內容。
- **由近到遠載入**：Agent 會從當前工作目錄開始，逐層向上查找並載入所有 `GEMINI.md` 檔案，直到專案根目錄或主目錄。

### 實際應用：鎖定 Commit 規範

我最常用的做法是拿它來鎖定 **Commit 規範**，確保 Agent 寫的 Commit Message 是我想要的內容。

## 遇到的地雷與問題

雖然 Vibe Coding 讓我不需了解現今的前端生態（Vite/Vue/Vitepress 等）也能完成專案，但仍有一些不得不注意的坑：

### 1. 快照機制的雷

Antigravity 會對檔案進行快照（Snapshot）。如果你在它工作期間手動用 Git 修改了檔案（或它自己之前的 Commit 沒更新到快照），它可能會用舊的內容覆蓋新的變更，導致 Git 紀錄混亂或檔案內容回溯。

### 2. 編碼與腳本偏好

* **Gemini 模型**：偏好寫 Python (`.py`) 腳本來批次處理檔案。
* **Claude 模型**：偏好使用 PowerShell (`.ps1`) 腳本。

我在調整專案名稱時，Claude 寫的 PowerShell 腳本在處理檔案編碼時發生錯誤，把所有的中文內容都變成了亂碼。更糟的是，它讀取檔案時用的是壞掉的編碼，覺得「沒問題」，但我若有即時檢查 Git Diff 就能發現。但因為在測試，所以沒有過多介入，最後這輪 5 小時的額度就燒完了。

而後續又發現多次改壞編碼情況，所以在請它處理時，要特別告知它使用編碼安全的方式處理。

### 3. 殘餘檔案

因為執行任務時，不論是 Gemini 還是 Claude 模型都是使用腳本，或是會把一些內容先輸出在 txt 檔案上，這些檔案都會在根目錄裡，所以 Commit 時很容易一不小心把它們也一起 Commit，所以如果專案絕對不會有這些類型檔案，建議還是在 .gitignore 設定忽略清單比較保險。

### 4. 幻覺 (Hallucination)

即使開啟了 `Enable Browser Tools`，它有時還是會偷懶，例如它幫我之前有篇文章請它幫我查官方文章來源，但它給我幾次網址都是錯的，後來我去查才發現官方當時只有發信通知用戶，沒有發新聞稿。這點在 Gemini 3 上也常發生，我之前常給它一個網址，它可能根本沒去爬，而是根據網址名稱瞎掰內容回我。

### 5. 樣式調整的極限

對於不熟悉前端的人（如我），Vibe Coding 可以處理大架構，但遇到細微的 CSS/RWD 調整（如懸浮按鈕的精確定位），往往會陷入「修好 A 壞了 B」的循環。如果有足夠的前端知識，直接介入修改通常比跟 AI 溝通快得多。

### 6. 批次處理與語意理解的限制

批次處理檔案時，有時候 Antigravity 沒有真的去讀那些檔案，而是直接寫腳本進行處理，例如我請它幫我檢查文章中的大陸用語，轉換成台灣用語，它可能就直接寫腳本進行轉換，例如把項目替換成專案，但是有可能在那個上下文就是要叫項目，所以強烈建議請它先讀完後，再判斷要怎調整，我沒選 Fast 模式就是有可能我希望它針對每篇文章內容幫我產生 description，Fast 可能就會直接用文章前一段文字來當作 description，Planning 想這樣做以前還會先問一下。

### 7. 隱藏的技術債 (Technical Debt)

雖然 AI 寫出來的 Code 乍看之下可以運作，甚至細節處理得比我好，但如果沒有仔細 Review，很容易產出帶有技術債的程式碼。例如：將相同的字串直接散落在各處，而不是提取成共用的常數。

這種程式碼當下能跑，但維護性極差。這也凸顯了 Vibe Coding 並不代表可以「把腦丟掉」；相反地，**使用者的技術底蘊決定了程式碼品質的下限**。如果缺乏相應的知識來檢核 AI 的產出，專案很快就會變成一堆難以維護的程式碼。

## 結論

Antigravity 和過往的 Chatbot 聊天相比，更像是直接「指揮」AI 做事，讓 Agent 直接幫我改檔案、跑遷移。

過往那些「不難但可以煩死人」的任務（像我這次的圖片遷移、框架轉換）可以利用它來自動化處理；但如果是要大改程式邏輯或是涉及 Git Reset 這類破壞性操作，還是要注意修改內容，甚至最好還是自己處理。

---

## 異動歷程

- 2026-01-07 初版文件建立。
- 2026-01-08 補充 GEMINI.md 的作用範圍、繼承關係說明及測試方法。
