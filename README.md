# 雲翼的技術隨筆 (CloudWing's Log)

這是一個基於 **VitePress** 建構的技術文檔專案，旨在實踐 **Docs as Code** 的開發流程。

本專案將 GitHub 視為內容的 **Single Source of Truth (SSOT)**，透過版控與自動化部署 (CI/CD)，確保技術債、架構決策與踩坑經驗能被系統化地保存。

## 🎯 專案目標

* **知識資產化**：將零散的開發經驗轉化為可索引、可搜尋的結構化文檔。
* **降本增效**：作為「寫給未來自己的操作手冊」，減少重複解決相同問題的時間成本。
* **技術驗證**：實驗與驗證各種前端與文檔工程的最佳實踐 (如 SEO、i18n、a11y)。
* **版本化追蹤**：利用 Git Commit 歷史作為技術決策的紀錄線 (Audit Trail)，確保每一項架構變更皆有跡可循。

## 🛠️ 本地開發

確保您的環境已安裝 Node.js。

```bash
# 安裝依賴
npm install

# 啟動本地預覽 (http://localhost:5173)
npm run docs:dev

# 建置生產版本
npm run docs:build
```

## 📄 License

本專案採用 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) 授權條款。  
This project is licensed under the [Creative Commons Attribution-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-sa/4.0/).
