---
title: "常用套件整理 - Visual Studio Code"
date: 2026-01-15
lastmod: 2026-01-15
description: "整理作者常用的 Visual Studio Code (VS Code) 擴充套件，包含前端、後端、測試、DevOps 與開發體驗 (DX) 相關工具。"
tags: ["Visual Studio Code"]
---

# 常用套件整理 - Visual Studio Code

原本我只把 VS Code 當作 WSL 的檔案瀏覽工具，裝的套件很少。不過最近隨著開始接觸 Vue 開發，為了避免日後重裝 VS Code 時遺漏了這些慣用套件，決定將它們整理成這篇筆記。

## 一般與外觀 (General & Appearance)

- [Chinese (Traditional) Language Pack for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=MS-CEINTL.vscode-language-pack-zh-hant)：VS Code 的繁體中文語言套件。
- [Visual Studio Keymap](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vs-keybindings)：讓 VS Code 使用 Visual Studio 的快捷鍵設定。因為我開發主要還是使用 Visual Studio，這樣能讓兩者的操作體驗盡量保持一致，降低轉換成本。
- [Material Icon Theme](https://marketplace.visualstudio.com/items?itemName=PKief.material-icon-theme)：提供豐富且辨識度高的檔案圖示主題。
- [EditorConfig for VS Code](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig)：支援 `.editorconfig` 設定檔，讓不同編輯器與 IDE 保持一致的程式碼風格（如縮排、換行符號）。

## 開發體驗 (Developer Experience)

- [Error Lens](https://marketplace.visualstudio.com/items?itemName=usernamehw.errorlens)：
  - 直接在程式碼行尾顯示錯誤、警告與診斷訊息，並對整行進行醒目提示。
- [Code Spell Checker](https://marketplace.visualstudio.com/items?itemName=streetsidesoftware.code-spell-checker)：
  - 檢查程式碼中的拼字錯誤（支援 CamelCase 等命名慣例）。
- [Markdown All in One](https://marketplace.visualstudio.com/items?itemName=yzhang.markdown-all-in-one)：提供 Markdown 撰寫所需的快捷鍵、目錄生成 (TOC)、列表編輯等全方位支援。
- [Markdown Preview Mermaid Support](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid)：讓 VS Code 的內建 Markdown 預覽功能支援 Mermaid 圖表與流程圖。

## 前端開發 (Frontend Development)

- [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar)：Vue 官方推薦的開發工具（原 Volar）。
  - 提供 Vue 3 的語法高亮、IntelliSense 與 TypeScript 支援。
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)：整合 ESLint 到 VS Code，即時顯示語法錯誤與風格問題。
- [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)：程式碼格式化工具。
- [Auto Close Tag](https://marketplace.visualstudio.com/items?itemName=formulahendry.auto-close-tag)：自動閉合 HTML/XML 標籤。
- [Auto Rename Tag](https://marketplace.visualstudio.com/items?itemName=formulahendry.auto-rename-tag)：修改起始標籤時，自動同步修改結尾標籤。
- [Pretty TypeScript Errors](https://marketplace.visualstudio.com/items?itemName=yoavbls.pretty-ts-errors)：將 TypeScript 冗長難讀的錯誤訊息進行格式化與語法高亮。

## 測試 (Testing)

- [Playwright Test for VSCode](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright)：
  - 官方提供的 Playwright 測試擴充套件。
  - 支援直接在編輯器中執行測試、偵錯測試、錄製新測試以及生成選擇器 (Selectors)。
  - 若有使用 Playwright 進行 E2E 測試，此為必裝套件。

## 容器與 DevOps (Containers & DevOps)

- [Container Tools](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-containers)：
  - **取代了舊版的 Docker 擴充套件**。
  - 包含了 Docker 擴充功能的所有功能，並附有額外的 Podman 支援及其他功能。
  - 如果只需要容器工具，可以只安裝此套件。
- [Docker DX](https://marketplace.visualstudio.com/items?itemName=docker.docker)：
  - 專注於開發體驗 (Developer Experience)，提供 Dockerfile 與 Compose 檔案的 IntelliSense、語法檢查與除錯功能。
  - 支援 BuildKit 整合與語法提示。
- [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)：
  - 允許開發者將容器本身作為「開發環境」。
  - 透過專案內的 `.devcontainer` 設定，確保所有開發者都使用完全一致的工具鏈與 Runtime，無需在本地機器安裝各種依賴。
- [WSL](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-wsl)：
  - 讓 VS Code 直接連線到 WSL (Windows Subsystem for Linux) 內部。
  - 這樣你可以在 Windows 上跑 VS Code UI，但所有的終端機指令、編譯與執行都發生在 Linux 環境中，是 Windows 開發者使用 Linux 工具鏈的最佳方案。

## AI 輔助 (AI Assistance)

- [GitHub Copilot](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot)：AI 程式碼補全工具，提升寫作效率。
- [GitHub Copilot Chat](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot-chat)：整合於側邊欄的 AI 聊天介面，可詢問程式碼解釋、重構與除錯。

## 其他基於 VS Code 的編輯器工具

以下是一些基於 VS Code 延伸的編輯器專用套件。由於這些編輯器的擴充套件生態與 VS Code 大致相同，我在使用時也會參考本篇筆記，因此一併記錄於此。

- **Antigravity Cockpit**：
  - 用於查詢 Antigravity 各個模型的使用額度。

## 異動歷程

- 2026-01-15 初版文件建立。
