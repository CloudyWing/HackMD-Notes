---
title: "使用 SQL Server Management Studio 設定資料表描述"
date: 2024-07-15
lastmod: 2024-08-23
description: "說明如何在 SSMS 中設定資料表描述 (Description)，以支援 DB Schema 文件化。介紹透過 SSMS UI「擴充屬性 (Extended Properties)」與使用 `sp_addextendedproperty` 預存程序兩種設定方式。"
tags: ["SQL Server"]
---

# 使用 SQL Server Management Studio 設定資料表描述

一般來說，為了讓人了解資料表的用途和結構，我們會在資料表中設定描述。這不僅有助於文件化資料庫結構，還能支援開發工具產生 Table Schema 文件。

資料表欄位的描述可以在設計功能進行編輯，而資料表雖然乍看之下沒有設定描述的選項，但實際上仍然可以進行設定，以下進行說明。

## 使用 SSMS 設定

1. 在 SQL Server Management Studio (SSMS) 中，右鍵點擊目標資料表，選擇「屬性」。
2. 在「屬性」視窗中，進入「擴展屬性」頁面，新增屬性 `MS_Description`，輸入資料表的描述。

![extended properties dialog](images/%E4%BD%BF%E7%94%A8%20SQL%20Server%20Management%20Studio%20%E8%A8%AD%E5%AE%9A%E8%B3%87%E6%96%99%E8%A1%A8%E6%8F%8F%E8%BF%B0/extended-properties-dialog.png)

::: warning
畫面旁邊的三個點的按鈕，點擊會跳出可多行編輯的 UI 視窗。若使用 Entity Framework 反向工程，請避免使用多行描述，以免導致生成無法編譯的程式碼。
:::

### 2024-08-23

突然發現在資料表設計模式的屬性視窗就可以直接編輯資料表描述了，如下圖。難怪我一直記得早期設定資料表描述沒那麻煩...

![table designer description property](images/%E4%BD%BF%E7%94%A8%20SQL%20Server%20Management%20Studio%20%E8%A8%AD%E5%AE%9A%E8%B3%87%E6%96%99%E8%A1%A8%E6%8F%8F%E8%BF%B0/table-designer-description-property.png)

## 使用 SQL 語法編輯

可以透過以下 SQL 語法來設定或修改資料表描述：

### 增加資料表描述

```sql
EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = N'{資料表描述}', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'{資料表名稱}';
```

### 修改資料表描述

```sql
EXECUTE sp_updateextendedproperty @name = N'MS_Description', @value = N'{資料表描述}', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'{資料表名稱}';
```

## 異動歷程

- 2024-07-15 初版文件建立。
- 2024-08-23 增加 SSMS 第二種設定方式。
