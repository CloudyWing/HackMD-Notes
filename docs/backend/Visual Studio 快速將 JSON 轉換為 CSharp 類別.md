---
title: "Visual Studio 快速將 JSON 轉換為 C# 類別"
date: 2025-05-27
lastmod: 2025-05-27
description: "介紹 Visual Studio 內建的「選擇性貼上 (Paste Special)」功能，能快速將 JSON 字串轉換為 C# 類別 (Class) 結構，並提醒在作為 DTO 使用時需注意屬性命名與型別驗證。"
tags: ["C#","Visual Studio"]
---

# Visual Studio 快速將 JSON 轉換為 C# 類別

## 操作步驟

### 步驟 1：準備 JSON 資料

複製你要轉換的 JSON 內容，例如：

```json
{
  "User": {
    "Id": "Wing",
    "Name": "小翼",
    "Dept": {
      "Id": "SAO",
      "Name": "艾恩葛朗特"
    }
  }
}
```

### 步驟 2：定位程式碼位置

在 Visual Studio 編輯器中，將游標移到你想要產生類別程式碼的位置。

### 步驟 3：執行轉換

依序點選：**編輯** → **選擇性貼上** → **貼上 JSON 做為類別**

![操作步驟](images/Visual%20Studio%20%E5%BF%AB%E9%80%9F%E5%B0%87%20JSON%20%E8%BD%89%E6%8F%9B%E7%82%BA%20CSharp%20%E9%A1%9E%E5%88%A5/%E6%93%8D%E4%BD%9C%E6%AD%A5%E9%A9%9F.png)

## 產生結果

Visual Studio 會自動產生對應的類別結構：

```csharp
public class Rootobject {
    public User User { get; set; }
}

public class User {
    public string Id { get; set; }
    public string Name { get; set; }
    public Dept Dept { get; set; }
}

public class Dept {
    public string Id { get; set; }
    public string Name { get; set; }
}
```

## 提醒

這個功能主要是為了快速產生基礎的類別結構。如果你要建立用於 API 串接的 DTO（Data Transfer Object），還需要額外注意以下幾點：

- **型別檢查**：確認自動產生的屬性型別是否符合實際需求。
- **命名規範**：當雙方的命名慣例不同時，可使用。`[JsonPropertyName]` 屬性來對應正確的欄位名稱。
- **資料驗證**：根據業務需求加入適當的驗證邏輯。

## 異動歷程

- 2025-05-27 初版文件建立。
