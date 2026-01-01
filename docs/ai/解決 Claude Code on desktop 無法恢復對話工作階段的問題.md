---
title: "解決 Claude Code on desktop 無法恢復對話工作階段的問題"
date: 2025-12-27
lastmod: 2025-12-27
description: "針對 Claude Code on Desktop 預覽版因 OAuth 驗證過期導致無法恢復對話工作階段 (Session) 的已知 Bug，提供了一個非官方的臨時解決方案：重新執行安裝檔以重置 Sessions。"
tags: ["Claude"]
---

# 解決 Claude Code on desktop 無法恢復對話工作階段的問題

Claude Desktop 在 **2025 年 11 月 25 日** 開始內建 **Claude Code**，這對於不太愛打指令的我來說是個福音，不過目前還是 Preview 版本，所以還不穩定，前段時間一直有 **對話工作階段** 中斷就無法接續處理的問題，所以就跑去研究 Gemini。

最近覺得還是要了解一下，畢竟雖然在絕望谷底待久了，已經習慣了，但是看到那個谷頂越來越遙不可及，還是會有點焦慮的。

---

## 問題現象

當 **OAuth 驗證狀態** 長時間未操作過期後，再次輸入指令會觸發以下錯誤：

```text
API Error: 401 {"type":"error","error":{"type":"authentication_error","message":"OAuth token has expired. Please obtain a new token or refresh your existing token."},"request_id":"req_011CWWoXen3mpmsjy27LGmqn"} · Please run /login
```

不過按照提示執行 `/login` 指令時，會出現以下異常行為：

1. **初次輸入**：指令無任何視覺回饋
2. **延遲後**：系統回報 `Unknown slash command: login`

導致該對話工作階段無法繼續操作。

此問題已在官方社群中引起多位 **Claude Desktop (Windows/macOS)** 使用者反應，證實為目前的已知 Bug：

* **[GitHub Issue #13928: Claude Code for Windows unusable due to OAuth loop](https://github.com/anthropics/claude-code/issues/13928)**
* **[GitHub Issue #15007: /login Does Not Recover Active Session](https://github.com/anthropics/claude-code/issues/15007)**

## 臨時解決方案

::: warning
以下為非官方臨時解法，而是我亂試試出來的，建議持續關注官方更新，等待正式修復。
:::

在官方修正驗證重連機制之前，可透過以下步驟恢復操作：

1. 手動關閉 Claude Desktop 視窗（執行安裝檔時雖會自動關閉，但建議先手動關閉以避免殘留程式干擾）。
2. 重新執行 `Claude Setup.exe`。

重新執行安裝檔後，對話工作階段可立即恢復運作，無需重新登入或建立新的對話工作階段。此方法僅作為官方修正前的過渡手段。

---

## 異動歷程

* 2025-12-27 初版文件建立。
