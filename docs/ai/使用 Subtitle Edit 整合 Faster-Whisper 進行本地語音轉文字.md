---
title: "使用 Subtitle Edit 整合 Faster-Whisper 進行本地語音轉文字"
date: 2026-01-31
lastmod: 2026-01-31
description: "實測使用 Subtitle Edit 整合 Faster-Whisper 進行離線語音轉文字的效能與準確度，並比較不同 Whisper 模型的差異。"
tags: ["Whisper", "Subtitle Edit"]
---

# 使用 Subtitle Edit 整合 Faster-Whisper 進行本地語音轉文字

本來有點懶得寫這篇，不過這幾天無意間發現，從我把筆記由 HackMD 搬家到 GitHub Pages 後，點閱數最高的竟然是之前寫的 [簡單測試使用 WhisperDesktop 將語音轉成文字](./簡單測試使用%20WhisperDesktop%20將語音轉成文字.md)。考量到 WhisperDesktop 其實已經有點過時，所以決定還是來更新一下目前的解決方案。

1 月時找了一些本地執行的 AI 工具來玩，在語音轉文字 (STT) 的部分發現了更好的選擇——[Whisper Standalone](https://github.com/Purfview/whisper-standalone-win/releases)。

它提供了三個版本：

- **Faster-Whisper**：
  輕量基礎版，適合單純只需要轉錄文字的使用者。
- **Faster-Whisper-XXL** **(推薦)**：
  作者主力維護的版本。額外支援 **Speaker Diarization (區分說話者)** 與翻譯功能，適合需要整理多人會議記錄的情境。
- **Faster-Whisper-XXL Pro**：
  提供給贊助者的特別版。

當初嘗試安裝 Faster-Whisper-XXL 時，一直無法正常執行，推測可能又是 Python 影音相關套件的相依性問題（之前玩 TTS 時，也被類似問題搞到）。

後來決定改用 **Subtitle Edit** 透過整合的方式來使用它，過程相對順利許多。

## Faster Whisper 是什麼？

Faster Whisper 是基於 **CTranslate2**（一個支援 Transformer 模型的快速推論引擎）所實作的 Whisper 重新編寫版本。

與原始的 OpenAI Whisper 相比，Faster Whisper 的優勢在於：

- **速度更快**
  - 效能提升約 4 倍以上。
- **記憶體佔用更少**
  - 透過 8-bit 量化技術，大幅降低 VRAM 需求。

對於希望在本地端執行 Whisper 且不希望造成系統卡頓的使用者來說，Faster Whisper 是效能較好的選擇。

## Subtitle Edit

Subtitle Edit 本身是一款強大的字幕編輯軟體，支援整合 Faster Whisper 功能，可以直接將其作為自動語音辨識工具使用。

### 整合方式

1. 開啟 Subtitle Edit，選擇上方選單的 **「視訊 (Video)」** -> **「Audio to text (Whisper)...」**。

   ![subtitle-edit-audio-to-text-menu](./images/%E4%BD%BF%E7%94%A8%20Subtitle%20Edit%20%E6%95%B4%E5%90%88%20Faster-Whisper%20%E9%80%B2%E8%A1%8C%E6%9C%AC%E5%9C%B0%E8%AA%9E%E9%9F%B3%E8%BD%89%E6%96%87%E5%AD%97/subtitle-edit-audio-to-text-menu.png)

2. 點擊後若尚未安裝 ffmpeg，系統會提示下載，點擊確認即可。

3. 在 **Engine** 選項中選擇 **「Purfview's Faster-Whisper-XXL」**。
   - 若未安裝對應組件，會跳出下載 Whisper 的訊息，同樣選擇下載。

4. 在 **Choose model** 下拉選單中下載想要使用的模型。
   - 建議選擇 `faster-whisper-large-v3` 或 `faster-whisper-large-v3-turbo`。

   ![faster-whisper-model-selection](./images/%E4%BD%BF%E7%94%A8%20Subtitle%20Edit%20%E6%95%B4%E5%90%88%20Faster-Whisper%20%E9%80%B2%E8%A1%8C%E6%9C%AC%E5%9C%B0%E8%AA%9E%E9%9F%B3%E8%BD%89%E6%96%87%E5%AD%97/faster-whisper-model-selection.png)

   ::: tip
   **模型差異說明**：
   - **Large-v3**
     - 目前準確度最高的模型，參數最多。
     - 推論速度較慢，需要較多的記憶體。
   - **Large-v3-Turbo**
     - 這是 v3 的「蒸餾 (distilled)」版本，將解碼層 (Decoder Layers) 從 32 層減少到 4 層。
     - 雖然參數減少了約 48%，但速度提升了約 8 倍，且在英文辨識的準確度上與完整版幾乎無異。
   :::

5. 設定完成後，將要轉換的影音檔案拖入或點擊加入，最後按下 **「Generate (產生)」** 即可開始辨識。

   ![generate-transcription-window](./images/%E4%BD%BF%E7%94%A8%20Subtitle%20Edit%20%E6%95%B4%E5%90%88%20Faster-Whisper%20%E9%80%B2%E8%A1%8C%E6%9C%AC%E5%9C%B0%E8%AA%9E%E9%9F%B3%E8%BD%89%E6%96%87%E5%AD%97/generate-transcription-window.png)

   ::: tip
   檔案選擇視窗預設可能只顯示視訊檔案，如果想轉換 mp3 等音訊檔，記得將檔案類型過濾器調整一下。
   :::

6. 轉檔完成後，字幕會直接顯示在 Subtitle Edit 的編輯介面中。
   - 可直接進行校對與修改，完成後再另存即為與檔名相同的字幕檔。
     ![subtitle-edit-main-interface-with-results](./images/%E4%BD%BF%E7%94%A8%20Subtitle%20Edit%20%E6%95%B4%E5%90%88%20Faster-Whisper%20%E9%80%B2%E8%A1%8C%E6%9C%AC%E5%9C%B0%E8%AA%9E%E9%9F%B3%E8%BD%89%E6%96%87%E5%AD%97/subtitle-edit-main-interface-with-results.png)

## 實測結果

以之前使用 WhisperDesktop 的測試數據作為基準：

> - **測試環境**：PNY RTX 4070 Ti Super 16GB Blower
> - **測試素材**：5 分 16 秒的 mp3 檔案
> - **WhisperDesktop 測試數據**：
>   - 使用 `ggml-large-v3.bin`
>     - 耗時 **22 分 01 秒**（且不一定成功，偶爾會轉出空白）。
>   - 使用 `ggml-medium.bin`
>     - 耗時 **11 秒**。

這次改用 **Subtitle Edit 整合 Faster-Whisper-XXL** 進行測試，硬體環境與檔案皆相同：

- **Subtitle Edit 測試數據**：
  - 使用 `large-v3-turbo`
    - 約 **16 秒**。
  - 使用 `large-v3`
    - 約 **32 秒**。

::: tip
由於 Subtitle Edit 轉檔完畢後不會保留時間紀錄，以上數據為手動計時的結果。
:::

從數據來看，Turbo 版（16 秒）雖然略慢於之前舊版 WhisperDesktop 使用 Medium 模型（11 秒），但讓我比較驚訝的是 **Large-v3 竟然能在 32 秒內跑完**，這在舊版工具上幾乎是無法想像的速度提升。

至於轉出的品質，Large v3 確實比 Medium 好，但並沒有我想像中提升那麼多。推測原因可能是這次測試的檔案是歌曲，受到背景音樂干擾，加上演唱時為了配合音調調整發音，本來就比較難辨識。話說回來，光是這個執行速度，拿來當作本地端的語音轉字工具，我覺得也夠用了。

## 異動歷程

- 2026-01-30 初版文件建立。
