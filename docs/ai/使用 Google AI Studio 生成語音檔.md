---
title: "使用 Google AI Studio 生成語音檔"
date: 2025-12-25
lastmod: 2025-12-25
description: "介紹如何使用 Google AI Studio 的 Generate Speech 功能將文字轉為語音，比較了 Gemini (個人助手) 與 AI Studio (開發者工具) 的定位、計費與隱私差異，並提供詳細的操作步驟。"
tags: ["Gemini","Google AI Studio","Text-to-Speech"]
---

# 使用 Google AI Studio 生成語音檔

因為 ChatGPT 5 用起來很不順手，在 Gemini 3 的 AI 模型推出後就改投 Gemini 3 陣營，剛好新手機有送 Google One Pro 訂閱。12 月的時候又發現 Claude Desktop 在 11 月 25 日新增了內建 Claude Code 的功能，於是整個 12 月都在研究 Claude Code 和 Gemini 的各項功能。由於 Claude Code on Desktop 目前問題還很多，所以主要還是以研究 Gemini 功能為主。

因為我的英文很爛，之前就常常念錯被糾正，之前有買一本書叫「軟體工程師的英文使用守則」，但因為看書仍然不知道怎麼念，所以就想讓 Gemini 幫我產生一些常用的單字然後丟給 Google AI Studio 產生語音檔來聽怎麼念。

## 前言

通常說到 Google 的 AI 工具，大家第一個想到的是 Gemini，但要生成語音檔需要使用另一個工具：**Google AI Studio**（以下簡稱 AI Studio）。以下說明兩者的定位差異（若已熟悉可直接跳至[操作流程](#操作流程)）：

**工具定位與功能**

- **Gemini**：個人數位助手，介面較為直覺友善，整合 Google 雲端硬碟、郵件等服務，適合日常任務。
- **AI Studio**：開發者工作站，提供專業參數控制與 Generate speech 等進階功能。

**計費模式（兩者獨立計費）**

- **Gemini**：免費方案可使用，進階功能採訂閱制，月費固定。
- **AI Studio**：免費配額 + 隨用隨付，開發測試階段有每日免費額度。

**資料隱私差異（重要）**

- **Gemini**：預設會用對話資料訓練模型，需手動關閉「活動紀錄」保護隱私（但會失去對話儲存功能）。
- **AI Studio**：免費配額下會用於訓練；若要確保隱私，需設定計費專案（Set up billing），此模式下輸入的資料絕對不會被用於訓練。

::: warning
若處理敏感內容或在意隱私，建議在 AI Studio 設定計費專案。
:::

## 操作流程

了解兩者差異後，接下來說明如何使用 AI Studio 的 Generate speech 工具將文字轉換為擬真的 AI 語音。

首先，進入 [Google AI Studio](https://aistudio.google.com/) 首頁（需登入 Google 帳號）→ 點擊左側選單的「Playground」→ 選擇上方的「Audio」分類 → 點選「Gemini 2.5 Pro Preview TTS」。也可以直接使用此[連結](https://aistudio.google.com/generate-speech)進入。

![ai studio navigation](images/%E4%BD%BF%E7%94%A8%20Google%20AI%20Studio%20%E7%94%9F%E6%88%90%E8%AA%9E%E9%9F%B3%E6%AA%94/ai-studio-navigation.png)

**基本操作步驟：**

1. 在左側或中央的 Text 輸入框貼上準備好的腳本。
2. 在設定欄位選擇 Voice（語音角色）。
3. 點擊「Run Ctrl + ↵」按鈕（或使用快捷鍵 Ctrl + Enter），系統即會開始運算並產出音訊檔案。
4. 試聽後，點擊右邊的三點圖示（⋮），再選擇下載選項即可取得 `.wav` 格式的音訊檔。

![ai studio audio player](images/%E4%BD%BF%E7%94%A8%20Google%20AI%20Studio%20%E7%94%9F%E6%88%90%E8%AA%9E%E9%9F%B3%E6%AA%94/ai-studio-audio-player.png)

::: warning
若短時間內大量生成，可能遇到 `Failed to generate content: user has exceeded quota. Please try again later.` 錯誤，代表額度用完，請稍後再試。
:::

## 參數設定說明

在實際使用時，AI Studio 提供多個參數可調整語音生成品質，以下逐一說明：

### Mode（模式選擇）

根據腳本需求選擇對應模式：

- **Single-speaker audio**：單人腳本。
- **Multi-speaker audio**：多人腳本（目前只能設定兩人，之後會不會增加人數還不清楚）。

![ai studio single speaker interface](images/%E4%BD%BF%E7%94%A8%20Google%20AI%20Studio%20%E7%94%9F%E6%88%90%E8%AA%9E%E9%9F%B3%E6%AA%94/ai-studio-single-speaker-interface.png)

![ai studio multi speaker interface](images/%E4%BD%BF%E7%94%A8%20Google%20AI%20Studio%20%E7%94%9F%E6%88%90%E8%AA%9E%E9%9F%B3%E6%AA%94/ai-studio-multi-speaker-interface.png)

### Model settings（模型參數）

#### Temperature

範圍 `0` ~ `2`，預設 `1`。此參數控制語音生成的隨機性，可理解為導演允許演員的自由發揮度。

我個人建議維持預設值 `1`。雖然理論上數值越低越穩定，但實測往下調整時，反而容易發生「前段正常，後段突然靜音或產生無意義噪音」的狀況，且觸發門檻不固定（例如我昨天試要低於 `0.6` 才觸發，今天卻是低於 `0.7` 就開始出問題）。此外，低於 `0.6` 時語氣容易帶有機器音。除非你有耐心反覆測試極限值，否則建議維持預設值。

### Voice（語音角色）

除了模型參數外，語音角色的選擇也會影響最終效果。系統提供多種聲音角色，每個角色都有特色說明，例如：`Zephyr` 的聲音特色是 `Bright, higher pitch`，選擇前也可以播放試聽。

![ai studio voice selector](images/%E4%BD%BF%E7%94%A8%20Google%20AI%20Studio%20%E7%94%9F%E6%88%90%E8%AA%9E%E9%9F%B3%E6%AA%94/ai-studio-voice-selector.png)

### Style instructions（風格指令）

透過風格指令可以進一步調整語音的情緒、語速、張力和說話情境（Context），可以理解為劇本告訴演員如何演繹這段內容。

### Text（腳本內容）

輸入要轉換為語音的文字腳本。建議注意以下事項：

- **中英夾雜最佳化**：在中文與英文單字之間加入半形空格，能協助 AI 更精準地切換語系與發音。
- **段落停頓**：段落間的空行代表停頓，但請勿連續超過兩行。實測發現過多空行可能誤導模型，導致語音提前結束。
- **時長限制**：單次生成上限約 11 分鐘（我前兩天測上限固定在 10 分 55 秒，但今天最長到 11 分 05 秒）。若內容只差一點點，可以嘗試重新執行，因為每次語速略有不同，有可能下次就能完整產出。

::: info
由於訓練資料中大陸用語佔比較高，系統常自動將台灣用語替換成大陸用語（例如將「堆疊」換成「堆棧」）。雖然可以嘗試在關鍵詞中間插入空格（例如：`堆 疊`）強迫模型視為獨立字元，但實際上可能被替換成更奇怪的詞。這部分目前無完美解法，我個人選擇放棄。
:::

## 腳本範例

以下是其中一集的腳本範例（實際使用時會製作多集，每集包含 40 個以上的單字）：

**Style instructions**

```text
請用生動、熱情且自然的對話語氣。中文語調請保持柔和、親切，英文請用標準美式口音。
```

**Text**

```text
歡迎收聽軟體工程師英語的第一集。今天我們的主題是 Git 版本控制。這是現代開發者每天賴以生存的工具。我們將從基礎指令到團隊協作的術語一一掃描。請放鬆心情，準備好你的耳朵，我們開始吧。

版本控制
Version Control
例句：Git is the most popular distributed version control system.
Git 是最受歡迎的分散式版本控制系統。

檔案庫
Repository
例句：Please clone the repository to your local machine.
請將檔案庫複製到你的本機。

初始化
Initialize
例句：Run git init to initialize a new repository here.
執行 git init 在這裡初始化一個新檔案庫。

Git 的指令雖然多，但只要掌握這 50 個最核心的動作，就能應對 90% 的工作場景。建議您反覆聆聽，特別是 Rebase 和 Merge 的區別。下一集，我們將進入 .NET 的開發世界。
```

## 總結

Google AI Studio 的 Generate speech 與傳統 TTS 最大的差異在於：它會「理解並演繹」腳本內容，而非單純逐字朗讀。這個特性有利有弊：

**適合的使用情境**

- 製作 Podcast 或有聲內容，需要自然、有情感的語音表達。
- 報告或簡報前的練習，透過設定 Style instructions 來聽聽 AI 如何詮釋你的內容，對不擅長朗讀或報告的人（沒錯，就是我）可能有幫助。
- 台詞改寫或劇本試讀，快速產生不同風格的演繹版本。

**不適合的使用情境**

- 需要完全忠於原文的逐字朗讀，例如法律文件、技術規格文件等，這種情況建議使用傳統 TTS 工具。

## 異動歷程

- 2025-12-25 初版文件建立。
