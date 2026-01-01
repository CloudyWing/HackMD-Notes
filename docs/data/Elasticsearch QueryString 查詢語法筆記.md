---
title: "Elasticsearch QueryString 查詢語法筆記"
date: 2025-04-13
lastmod: 2025-10-03
description: "介紹 Elasticsearch 的 `query_string` 語法。說明如何使用簡易的字串條件 (如 AND, OR, 萬用字元) 進行全文檢索，適合 Elasticvue 或 Kibana Discover 的快速查詢場景。"
tags: ["Elastic Stack","Elasticsearch"]
---

# Elasticsearch QueryString 查詢語法筆記

最近開始想把 LOG 儲存在 Elasticsearch 裡，但這樣做需要有個方便查詢的 UI 介面，對我而言 Kibana 功能過於複雜，Postman 查詢又比較麻煩。後來發現了 Elasticvue 這個工具，選擇它的原因是它支援多種瀏覽器擴充套件及桌面應用程式版本。

[Elasticvue](https://github.com/cars10/elasticvue) 的查詢介面主要基於 query_string 語法，這是 Elasticsearch 中基於 Lucene 查詢語法的擴展版本。對熟悉 SQL 的使用者來說，`query_string` 比其他 DSL 語法更容易上手，因此我整理了一些常用的語法方便查閱。

可從 [Elasticvue 官網](https://elasticvue.com/) 查看各個瀏覽器擴充套件，或是桌面應用程式的安裝檔案或連結。

測試版本：Elasticsearch 9.1.4

## 基本語法

### 基本 API 結構

```json
{
  "query": {
    "query_string": {
      "query": "your query string here",     // 必要參數：查詢字串（使用 "*" 可搜尋所有文件）
      "default_field": "content",            // 選用參數：預設搜尋欄位，未指定，預設為 "*"，搜尋全部欄位
      "default_operator": "OR"               // 選用參數：預設運算子，預設值為 OR
      // 其他可選參數
    }
  },
  "size": 10,                                // 選用參數：回傳結果數量，預設為 10
  "from": 0,                                 // 選用參數：起始位置，預設為 0
  "sort": []                                 // 選用參數：結果排序
}
```

未指定欄位時，QueryString 會在所有可搜尋欄位中進行搜尋。

## 查詢語法

### 1. 基本搜尋

簡單關鍵字搜尋：

```text
apple
```

多個詞彙（預設使用 OR 連接）：

```text
apple banana
```

#### 不同欄位類型的搜尋行為

Elasticsearch 對不同欄位型別使用不同分析策略（[官方文件](https://www.elastic.co/docs/reference/text-analysis/analyzer-reference)）：

* **text 欄位**：使用 standard 分析器，會分詞並轉小寫。
* **keyword 欄位**：使用 keyword 分析器，保持完整字串不變。
* **數值/日期/布林欄位**：不使用分析器，索引原始值。
* **query_string**：會依目標欄位型別選擇對應策略處理查詢字串。

| 欄位類型 | 查詢字串 | 行為說明 |
|---------|---------|---------|
| text | `apple banana` | 等同 `apple OR banana`，找到任一詞彙即符合 |
| keyword | `"apple" "banana"` | 必須用雙引號明確搜尋多個完整字串，或著使用 `apple OR banana` |
| keyword | `apple banana` | 查不到，因為會被視為完整字串比對 |
| 數值/日期/布林 | `"123" "456"` | 多值搜尋必須用雙引號明確指定值，或著使用 `123 OR 456` |
| 數值/日期/布林 | `123 456` | 查不到，因為 query_string 不會自動拆分多個完整值 |

**JSON 多詞彙查詢範例（使用雙引號跳脫）：**

```json
{
  "query": {
    "query_string": {
      "query": "\"apple\" \"banana\""
    }
  }
}
```

精確片語搜尋（使用雙引號）：

```text
"red apple"
```

### 2. 布林運算子

AND 運算子（兩個詞都必須存在）：

```text
apple AND banana
```

OR 運算子（至少有一個詞必須存在）：

```text
apple OR banana
```

NOT 運算子（排除包含某詞的文件）：

```text
apple NOT banana
```

加號（必須包含此詞）：

```text
+apple banana
```

減號（必須排除此詞）：

```text
apple -banana
```

::: warning
英文運算子必需全部大寫。
:::

### 3. 欄位指定查詢

針對特定欄位搜尋：

```text
title:apple
```

針對多個欄位的查詢：

```text
title:apple AND content:banana
```

多值查詢（OR 條件）：

```text
user_id:(1234 OR 5678)
```

欄位存在性查詢：

```text
_exists_:email        // 查詢 email 欄位存在的文件，可以理解成不為 null
NOT _exists_:phone    // 查詢 phone 欄位不存在的文件，可以理解成為 null
```

欄位指定優先順序：查詢字串中明確指定欄位 > fields 參數 > default_field 參數。

### 4. 範圍查詢與比較運算子

**範圍查詢：**

```text
price:[10 TO 20]    // 閉區間，包含 10 和 20
price:{10 TO 20}    // 開區間，不包含 10 和 20
price:[10 TO *]     // 大於等於 10
price:[* TO 20]     // 小於等於 20
```

**比較運算子：**

```text
price:>10           // 大於 10
price:>=10          // 大於等於 10
price:<20           // 小於 20
price:<=20          // 小於等於 20
```

這兩種寫法在功能上大致相同，可依情境選擇使用。不過實測發現，範圍查詢語法在各種參數組合下的相容性較佳，以下為測試範例：

**比較運算子使用限制：**

比較運算子（`>`、`>=`、`<`、`<=`）在搭配 `fields` 陣列參數時會產生錯誤，但使用 `default_field` 或直接在查詢字串中指定欄位時可正常運作。

✅ **可正常使用的寫法：**

```json
// 方式 1：未指定欄位
{
  "query": {
    "query_string": {
      "query": ">=10"
    }
  }
}

// 方式 2：在查詢字串中指定欄位
{
  "query": {
    "query_string": {
      "query": "price:>=10"
    }
  }
}

// 方式 3：使用 default_field 參數
{
  "query": {
    "query_string": {
      "query": ">=10",
      "default_field": "price"
    }
  }
}
```

❌ **會產生錯誤的寫法：**

```json
// 使用 fields 陣列會導致查詢失敗
{
  "query": {
    "query_string": {
      "query": ">=10",
      "fields": ["price"]
    }
  }
}
```

✅ **解決方案：改用範圍查詢語法**

範圍查詢語法（`[x TO y]`）與 `fields` 參數相容，可正常使用：

```json
{
  "query": {
    "query_string": {
      "query": "[10 TO *]",
      "fields": ["price"]
    }
  }
}
```

### 5. 萬用字元搜尋

萬用字元搜尋：

```text
te?t      // 問號代表一個字元
test*     // 星號代表零個或多個字元
```

### 6. 日期時間查詢

#### 基本日期範圍查詢

使用範圍語法進行日期查詢：

```text
timestamp:[2023-01-01 TO 2023-01-31]
```

也可以使用相對時間進行查詢：

```text
timestamp:>now-1d  // 查詢過去 24 小時的資料
```

**常用相對時間表達式：**

* `now-1h`：一小時前
* `now-1d`：一天前
* `now-1w`：一週前
* `now/d`：今天開始（00:00:00）
* `now/w`：本週開始
* `now/M`：本月開始

#### 日期時間格式

Elasticsearch 的 `date` 型別預設支援到毫秒精度，若需要奈秒精度可改用 `date_nanos` 型別。

**支援的格式：**

* **標準格式**：`yyyy-MM-ddTHH:mm:ss.SSSZ`（例如：`2023-01-15T08:30:00.000Z`）
* **簡化格式**：`yyyy-MM-dd`（例如：`2023-01-15`）
* 預設時區為 UTC。

**格式行為差異：**

不同精度的日期格式在查詢時會有不同的行為，以下是關鍵差異：

```json
// 查詢到「年」時，會精確比對該年的第一秒
{
  "query": {
    "query_string": {
      "query": "timestamp:2023"  // 等同於 ="2023-01-01T00:00:00Z"
    }
  }
}

// 查詢到「月」時，會精確比對該月的第一秒
{
  "query": {
    "query_string": {
      "query": "timestamp:2023-02"  // 等同於 ="2023-02-01T00:00:00Z"
    }
  }
}

// 當精度達到「日」，行為開始改變
// 這會查詢該日期的整個區間範圍
{
  "query": {
    "query_string": {
      "query": "timestamp:2023-03-01"  // 查詢 >="2023-03-01T00:00:00Z" <"2023-03-02T00:00:00Z"
    }
  }
}

// 精度到「小時」時，查詢該小時的整個區間
{
  "query": {
    "query_string": {
      "query": "timestamp:2023-03-01T08"  // 查詢 >="2023-03-01T08:00:00Z" <"2023-03-01T09:00:00Z"
    }
  }
}

// 精度到「分鐘」時，需要用雙引號（因包含冒號）
{
  "query": {
    "query_string": {
      "query": "timestamp:\"2023-03-01T08:00\""  // 查詢 >="2023-03-01T08:00:00Z" <"2023-03-01T08:01:00Z"
    }
  }
}
```

#### 使用注意事項

**1. 標準格式需要使用雙引號**

因為標準格式包含冒號 `:`，在 QueryString 中會被視為特殊字元，必須用雙引號包起來：

❌ **錯誤寫法（會產生解析錯誤）：**

```json
{
  "query": {
    "query_string": {
      "query": "timestamp:2023-01-15T08:30:00Z"
    }
  }
}
```

✅ **正確寫法：**

```json
// 方法 1：使用雙引號包起來
{
  "query": {
    "query_string": {
      "query": "timestamp:\"2023-01-15T08:30:00Z\""
    }
  }
}

// 方法 2：使用簡化格式（不含冒號）
{
  "query": {
    "query_string": {
      "query": "timestamp:2023-01-15"
    }
  }
}
```

**2. 日期查詢不支援比較運算子**

當使用比較運算子查詢日期時，查詢會失效或產生錯誤：

```json
// 這個查詢實際上會在「全部欄位」中搜尋符合該日期的資料
// 而不是在 timestamp 欄位中進行比較
{
  "query": {
    "query_string": {
      "query": "timestamp:>=\"2023-01-15T08:30:00Z\""
    }
  }
}

// 若改用 default_field 或 fields，會直接產生解析錯誤
{
  "query": {
    "query_string": {
      "query": ">=\"2023-01-15T08:30:00Z\"",
      "fields": ["timestamp"]  // ❌ 會報錯
    }
  }
}

{
  "query": {
    "query_string": {
      "query": ">=\"2023-01-15T08:30:00Z\"",
      "default_field": "timestamp"  // ❌ 會報錯
    }
  }
}
```

✅ **正確做法：使用範圍查詢語法**

```json
{
  "query": {
    "query_string": {
      "query": "timestamp:[2023-01-15T08:30:00Z TO *]"
    }
  }
}
```

**3. 自訂格式的影響**

當 `date` 型別的欄位有指定 [format](https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/mapping-date-format#strict-date-time)  時（非預設的 `strict_date_optional_time||epoch_millis`），查詢格式必須完全符合指定格式：

```json
// 假設欄位定義如下
"timestamp": {
    "type": "date",
    "format": "yyyy-MM-dd'T'HH:mm:ss'Z'"
}
```

使用錯誤格式會導致不同結果：

```json
// 在 query 中直接指定欄位：查詢無結果（靜默失敗）
{
  "query": {
    "query_string": {
      "query": "timestamp:[2023-01-15T08:30 TO *]"  // 格式不符
    }
  }
}

// 使用 default_field 或 fields：產生錯誤訊息
{
  "query": {
    "query_string": {
      "query": "[2023-01-15T08:30 TO *]",
      "default_field": "timestamp"  // 會報錯：failed to parse date field
    }
  }
}
```

錯誤訊息範例：

```text
failed to parse date field [2023-01-15T08:30] with format [yyyy-MM-dd'T'HH:mm:ss'Z']
```

## 其他參數

### 1. 欄位相關參數

**default_field vs fields**:

* `default_field`: 指定預設搜尋的單一欄位。
* `fields`: 指定多個搜尋欄位及其權重。

```json
// 使用 default_field
{
  "query_string": {
    "query": "apple",
    "default_field": "content"
  }
}

// 使用 fields
{
  "query_string": {
    "query": "apple",
    "fields": ["title^2", "content", "tags"]
  }
}
```

### 2. analyzer

指定 `query_string` 如何處理和分析查詢字串，Elasticsearch 提供多種內建分析器，詳細列表可參考[官方文件](https://www.elastic.co/docs/reference/text-analysis/analyzer-reference)。

```json
{
  "query_string": {
    "query": "The Quick Brown Fox",
    "analyzer": "standard"
  }
}
```

#### 重要概念：索引時 vs 查詢時分析器

Elasticsearch 有兩個階段會使用分析器：

**1. 索引時分析器（Index-time Analyzer）**

* 處理存入索引的資料。
* 例子：text 欄位存入 `"Wing Chou"` → 分詞為 `["wing", "chou"]`。

**2. 查詢時分析器（Query-time Analyzer）**

* 處理查詢字串。
* `query_string` 的 `analyzer` 參數控制此階段。

#### 實例說明

假設 text 欄位已存入 `"Wing Chou"`，索引時分詞為 `["wing", "chou"]`：

```json
// ✅ 使用 standard 分析器
// 查詢字串被分析為 ["wing", "chou"]，然後預設運算子為 OR，因為不論是 wing 還是 chou 都可以比對到資料
{
  "query_string": {
    "query": "Wing Chou",
    "analyzer": "standard"
  }
}

// ❌ 使用 keyword 分析器，錯誤查詢條件
// 查詢字串保持完整 "Wing Chou"，無法符合分詞結果
{
  "query_string": {
    "query": "Wing Chou", 
    "analyzer": "keyword"
  }
}

// 查詢字串保持 "Wing"（大寫），無法符合資料中的 "wing"（小寫）
{
  "query_string": {
    "query": "Wing", 
    "analyzer": "keyword"
  }
}

// ✅ 使用 keyword 分析器，正確查詢條件
{
  "query_string": {
    "query": "wing",
    "analyzer": "keyword" 
  }
}

{
  "query_string": {
    "query": "wing OR chou",
    "analyzer": "keyword" 
  }
}
```

### 3. analyze_wildcard

控制是否對萬用字元表達式進行分析處理。[官方文件](https://www.elastic.co/docs/reference/query-languages/query-dsl/query-dsl-query-string-query#query-string-top-level-params)說明如下：

> （選用參數，布林值）若設為 `true`，查詢時會嘗試對萬用字元詞彙進行分析處理。預設為 `false`。
>
> 需要注意的是，即使設為 `true`，也只有**結尾是 `*` 的查詢**才會進行完整分析。**開頭或中間包含 `*` 的查詢**只會進行正規化處理。

```json
{
  "query_string": {
    "query": "Te*",
    "analyze_wildcard": true,
    "analyzer": "standard"
  }
}
```

#### 參數值說明

* `analyze_wildcard: false`（預設）：萬用字元表達式不經過分析器處理
* `analyze_wildcard: true`：萬用字元表達式會經過分析器處理，但處理方式取決於萬用字元位置：
  * **結尾萬用字元**（如 `Te*`）：進行完整分析
  * **開頭或中間萬用字元**（如 `*Te*`、`T*e`）：只進行正規化

#### 實測觀察與疑問

在實際測試中發現，這個參數的行為與官方說明存在一些不一致或難以理解的地方：

**1. Text 欄位的行為**

不管 `analyze_wildcard` 設定為 `true` 或 `false`，查詢都是大小寫不敏感：

```json
// 以下兩個查詢結果相同，都能匹配到資料
{
  "query_string": {
    "query": "name:Te*",
    "analyze_wildcard": true
  }
}

{
  "query_string": {
    "query": "name:Te*",
    "analyze_wildcard": false
  }
}
```

**2. Keyword 欄位不指定 analyzer**

不管 `analyze_wildcard` 設定為 `true` 或 `false`，查詢都是大小寫敏感：

```json
// 以下兩個查詢結果相同，都只能精確匹配大小寫
{
  "query_string": {
    "query": "email:Te*",
    "analyze_wildcard": true
  }
}

{
  "query_string": {
    "query": "email:Te*",
    "analyze_wildcard": false
  }
}
```

**3. Keyword 欄位指定 analyzer 時的矛盾行為**

當對 keyword 欄位指定 `analyzer: "standard"` 時，出現了與官方說明不一致的現象（也可能是我對「完整分析」與「正規化」的理解有誤）：

```json
// 開頭或中間有萬用字元：會轉小寫（符合「正規化」說明）
// 實際查詢：*te*
{
  "query_string": {
    "query": "email:(*Te*)",
    "analyze_wildcard": true,
    "analyzer": "standard"
  }
}

// 結尾萬用字元：不會轉小寫（與「完整分析」說明矛盾）
// 實際查詢：Te*
{
  "query_string": {
    "query": "email:(Te*)",
    "analyze_wildcard": true,
    "analyzer": "standard"
  }
}
```

根據官方說明，結尾萬用字元應該進行「完整分析」，理論上 `Te*` 應該被 standard analyzer 轉換成 `te*`，但實測結果卻是保持 `Te*` 不變。

#### 萬用字元位置的處理差異

| 萬用字元模式 | 官方說明的處理方式 | Keyword + standard analyzer 實測 |
|-------------|------------------|----------------------------------|
| `Te*` | 完整分析 | 不轉小寫（`Te*`） |
| `*Te*` | 只正規化 | 會轉小寫（`*te*`） |
| `*Te` | 只正規化 | 會轉小寫（`*te`） |
| `T*e` | 只正規化 | 會轉小寫（`t*e`） |

### 4. auto_generate_synonyms_phrase_query

控制同義詞處理方式：

* `true`（預設）：自動為同義詞生成片語查詢，保持詞序和相鄰性。
* `false`：只生成普通同義詞查詢，不考慮詞序。

例如，若設定 "ny" 與 "new york" 為同義詞：

```json
{
  "query_string": {
    "query": "ny restaurants",
    "auto_generate_synonyms_phrase_query": true
  }
}
```

* true：會比對 "ny restaurants" 或 "new york restaurants"（"new york" 作為整體片語）。
* false：會比對 "ny restaurants" 或 "new restaurants" 或 "york restaurants"。

### 5. 權重控制：boost 與欄位加權

Elasticsearch 提供兩種層級的權重控制機制：

#### 5.1 欄位加權（Field Boost）

使用 `^` 語法調整特定欄位的權重。

```json
{
  "query_string": {
    "query": "apple iphone",
    "fields": ["title^3", "description^2", "content"]
  }
}
```

* **功能**：控制同一個查詢中不同欄位的相對重要性。
* **作用方式**：
  * 每個欄位各自獨立計算基礎分數（基於 BM25 演算法）。
  * title 欄位的分數會乘以 3。
  * description 欄位的分數會乘以 2。
  * content 欄位的分數乘以 1（預設值）。
  * 最後將所有加權後的欄位分數相加，得到最終分數。
* **重要說明**：`title^3` 並非表示 title 的最終得分是 content 的 3 倍，而是表示 title 欄位的基礎分數會被放大 3 倍後，再與其他欄位組合。最終分數還會受到詞頻、逆文件頻率、文件長度等因素影響。
* **適用場景**：多欄位搜尋時，某些欄位（如標題）比其他欄位（如內容）更能代表文件主題。

**計算範例**（基礎分數為假設值）：

假設搜尋 "apple"，各欄位的基礎分數如下：

| 欄位 | 基礎分數 | 加權後分數 |
|------|---------|-----------|
| title | 2.0 | 2.0 × 3 = 6.0 |
| description | 1.5 | 1.5 × 2 = 3.0 |
| content | 2.5 | 2.5 × 1 = 2.5 |
| **最終分數** | | **11.5** |

> **注意**：上述基礎分數為假設性範例，用於說明計算邏輯。實際分數會依照索引狀態、文件內容、詞頻等因素而有所不同，需使用 `_explain` API 查看真實評分過程。

---

#### 5.2 查詢層級 boost（Query Boost）

調整整個查詢子句的權重。

```json
{
  "query_string": {
    "query": "apple iphone",
    "boost": 2.0
  }
}
```

* **功能**：在複合查詢（如 bool query）中調整整個查詢子句的重要性。
* **重要限制**：如果單獨使用一個查詢，boost 參數對排序沒有影響（所有文件的分數都乘以相同倍數，相對排序不會改變）。
* **主要用途**：
  * 在 `bool` query 的 `should` 子句中，調整不同查詢條件的相對重要性。
  * 讓某些匹配條件比其他條件對最終排序有更大影響。
  * 體現業務邏輯中不同搜尋維度的重要性差異。
* **適用場景**：結合多種查詢方式（文字搜尋、精確匹配、範圍查詢等），需要調整它們對最終排序的影響權重。

---

#### 5.3 兩者結合使用

**範例**

```json
{
  "query": {
    "bool": {
      "should": [
        {
          "query_string": {
            "query": "apple",
            "fields": ["title^2"],
            "boost": 2.0
          }
        },
        {
          "query_string": {
            "query": "iphone",
            "fields": ["description"],
            "boost": 4.0
          }
        }
      ]
    }
  }
}
```

**計算說明**（基礎分數為假設值）：

假設有以下三個文件：

| 文件 | title 包含 "apple" | description 包含 "iphone" | 分數計算 |
|------|-------------------|-------------------------|---------|
| 文件 A | ✅ (基礎分 3.0) | ✅ (基礎分 2.0) | (3.0 × 2 × 2.0) + (2.0 × 1 × 4.0) = **20.0** |
| 文件 B | ✅ (基礎分 2.5) | ❌ | (2.5 × 2 × 2.0) + 0 = **10.0** |
| 文件 C | ❌ | ✅ (基礎分 2.5) | 0 + (2.5 × 1 × 4.0) = **10.0** |

**排序結果**：文件 A (20.0) > 文件 B (10.0) = 文件 C (10.0)

**分析**：

* 文件 A 同時匹配兩個條件，獲得最高分。
* 文件 B 只匹配 title 中的 "apple"：欄位基。礎分 2.5 × 欄位 boost 2 × 查詢 boost 2.0 = 10.0。
* 文件 C 只匹配 description 中的 "iphone"：欄位基礎分 2.5 × 欄位 boost 1 × 查詢 boost 4.0 = 10.0。

即使文件 C 的查詢 boost (4.0) 比文件 B 的 (2.0) 高，但因為文件 B 有欄位 boost (^2)，實際結果仍需依照基礎分數而定。

> **注意**：上述基礎分數為假設性範例，實際分數需使用 `_explain` API 查看。

---

#### 5.4 關鍵差異

| 特性 | 欄位加權 (`^`) | 查詢 boost (`boost`) |
|------|---------------|---------------------|
| **作用範圍** | 單一查詢內的不同欄位 | 複合查詢中的不同查詢子句 |
| **控制對象** | 欄位間的相對權重 | 查詢子句間的相對權重 |
| **使用位置** | `fields` 參數中 | 查詢子句的頂層參數 |
| **單獨使用** | 有效（影響欄位分數組合） | 無效（不改變排序） |
| **典型場景** | 標題比內容重要 | 使用者搜尋比篩選條件重要 |

---

### 6. 模糊搜尋（fuzziness 與 phrase_slop）

波浪號 `~` 在 QueryString 中有兩種不同用途，取決於它的位置：

#### 6.1 模糊搜尋（單詞後的波浪號）

```text
apple~    // 單詞後接波浪號，表示模糊搜尋
apple~2   // 指定模糊度為 2
```

* 對應參數：`fuzziness`。
* 功能：處理單個詞的拼寫錯誤，基於編輯距離。
* 識別方式：用於**單詞**後面。

**模糊度值的限制：**

* 有效值：`0`、`1`、`2` 或 `"AUTO"`。
* 超過 2 會報錯：`Valid edit distances are [0, 1, 2]`。

**fuzziness 參數生效條件：**

`fuzziness` 參數只在查詢字串中有單詞使用 `~`（但未指定數字）時才會生效：

```json
// ✅ 單詞有 ~，無數字，未設定 fuzziness：預設模糊度為 1
{
  "query_string": {
    "query": "apple~"  // apple 使用模糊度 1（預設值）
  }
}

// ✅ 單詞有 ~，無數字：使用 fuzziness 參數
{
  "query_string": {
    "query": "apple~",
    "fuzziness": 2  // 生效，apple 使用模糊度 2
  }
}

// ❌ 單詞無 ~：不生效
{
  "query_string": {
    "query": "apple banana",
    "fuzziness": 1  // 不生效，兩個詞都是精確匹配
  }
}

// ❌ 單詞有 ~N（明確數字）：以查詢字串中的數字為準
{
  "query_string": {
    "query": "apple~2",
    "fuzziness": 1  // 不生效，以查詢字串中的 2 為準
  }
}

// ⚠️ 混用情況：只有帶 ~ 的詞會套用模糊搜尋
{
  "query_string": {
    "query": "apple~2 banana",
    "fuzziness": 1  // 不生效，apple 用 2，banana 精確匹配
  }
}

{
  "query_string": {
    "query": "apple~ banana",
    "fuzziness": 1  // 只對 apple 生效（模糊度 1），banana 精確匹配
  }
}
```

**優先順序規則：**

1. 查詢字串中的 `~N`（明確數字）：直接使用該數字
2. 查詢字串中的 `~`（無數字）+ `fuzziness` 參數：使用 `fuzziness` 參數值
3. 查詢字串中的 `~`（無數字）+ 未設定 `fuzziness`：預設模糊度為 1
4. 查詢字串中沒有 `~`：該詞為精確匹配，`fuzziness` 參數不生效

⚠️ **重要注意事項**：

**`fuzziness` 參數必須搭配查詢字串中的 `~` 才會生效**。如果詞彙後面沒有 `~`，該詞會被視為精確匹配，無論 `fuzziness` 參數設定為何。

**fuzziness 設定差異**：

* `"fuzziness": "AUTO"`：根據詞長自動調整。預設行為等同於 `AUTO:3,6`，規則如下：
  * 詞長 0-2 字元：fuzziness = 0（必須精確匹配）
  * 詞長 3-5 字元：fuzziness = 1
  * 詞長 6+ 字元：fuzziness = 2
* `"fuzziness": "AUTO:[low],[high]"`：自訂閾值的 AUTO 模式。例如 `AUTO:4,7` 代表：
  * 詞長 0-3 字元：fuzziness = 0
  * 詞長 4-6 字元：fuzziness = 1
  * 詞長 7+ 字元：fuzziness = 2
* `"fuzziness": 1` 或 `"fuzziness": 2`：固定允許的最大編輯距離

詳細說明請參考[官方文件](https://www.elastic.co/guide/en/elasticsearch/reference/current/common-options.html#fuzziness)。

**範例說明**：

* `apple~1` 可比對出 "aple"、"appla" 等拼寫錯誤的詞。

---

#### 6.2 近似搜尋（片語後的波浪號）

```text
"apple banana"~5  // 片語後接波浪號，表示近似搜尋
```

* 對應參數：`phrase_slop`
* 功能：處理片語中詞的順序和距離
* 識別方式：用於**引號包圍的片語**後面

**Slop 值的計算邏輯：**

Slop 代表詞彙需要「移動」的最小步數，可以處理：

1. 詞彙間有其他詞穿插。
2. 詞彙順序不對（對調）。

**計算方式說明：**

假設索引中有 `"quick brown fox jumps"`

```text
// 範例 1：詞彙間有穿插
查詢："quick fox"
索引："quick brown fox"
→ "fox" 需要往左移動 1 步跳過 "brown"
→ slop = 1

// 範例 2：相鄰詞序對調
查詢："brown quick"
索引："quick brown"
→ 兩個詞互換位置
→ slop = 2（官方文件說明：對調成本為 2）

// 範例 3：不相鄰詞序對調 + 穿插
查詢："fox quick"
索引："quick brown fox"
→ "fox" 需要移動到 "quick" 前面，跨過 2 個位置
→ slop = 3
```

**實際範例：**

```json
// slop = 0：必須完全符合
{
  "query_string": {
    "query": "\"quick brown\""
  }
}

// ✅ 匹配："quick brown fox"
// slop = 1：允許中間有 1 個詞
{
  "query_string": {
    "query": "\"quick fox\"~1"
  }
}

// slop = 2：允許相鄰詞對調
// ✅ 匹配："quick brown fox"
// ❌ 不匹配："quick fox"
{
  "query_string": {
    "query": "\"brown quick\"~2"
  }
}

// slop = 3：允許更複雜的移動
// ✅ 匹配："quick brown fox"
{
  "query_string": {
    "query": "\"fox quick\"~3"
  }
}
```

**在 API 中設定：**

```json
{
  "query_string": {
    "query": "apple~2 \"quick fox\"~3",
    "fuzziness": "AUTO",  // 全域設定，會被查詢中的具體值覆蓋
    "phrase_slop": 2      // 全域設定，會被查詢中的具體值覆蓋
  }
}
```

**優先順序**：

查詢字串中使用 `~` 設定的值會覆蓋 API 參數中的全域設定。

## 分頁與排序

### 分頁參數

```json
{
  "query": {
    "query_string": {
      "query": "apple"
    }
  },
  "from": 0,   // 起始位置，預設為 0
  "size": 10   // 每頁數量，預設為 10
}
```

* `from`：指定從第幾筆結果開始回傳（0 代表第一筆）
* `size`：指定要回傳幾筆結果

**注意事項：**

* 深度分頁（`from` + `size` 過大）會影響效能。
* Elasticsearch 預設限制 `from` + `size` 不能超過 10000。
* 如需處理大量資料，建議使用 Search After 或 Scroll API。

---

### 排序參數

`sort` 參數接受陣列，可以指定多個排序條件，排序優先順序由陣列順序決定。

#### 排序語法

**方式 1：簡單欄位名稱（預設升序）**

```json
{
  "sort": ["price"]  // 按 price 升序排序
}
```

**方式 2：欄位 + 排序方向物件**

```json
{
  "sort": [
    { "price": "asc" }   // 按 price 升序
  ]
}
```

**方式 3：完整設定物件**

```json
{
  "sort": [
    {
      "price": {
        "order": "desc",           // 排序方向：asc（升序）或 desc（降序）
        "missing": "_last"         // 缺少該欄位的文件排在最後
      }
    }
  ]
}
```

#### 多欄位排序

```json
{
  "query": {
    "query_string": {
      "query": "apple"
    }
  },
  "sort": [
    { "price": "asc" },      // 第一優先：按價格升序
    { "created_at": "desc" }, // 第二優先：價格相同時按建立時間降序
    "_score"                  // 第三優先：其他條件相同時按相關性分數排序
  ]
}
```

#### 特殊排序值

* `"_score"`：按查詢相關性分數排序（預設為降序）。
* `"_doc"`：按文件的內部順序排序（最快，但順序不固定）。

#### 排序方向

* `"asc"`：升序（Ascending）- 從小到大。
* `"desc"`：降序（Descending）- 從大到小。

#### 處理缺失值

使用 `missing` 參數指定缺少排序欄位的文件應該排在哪裡：

```json
{
  "sort": [
    {
      "price": {
        "order": "asc",
        "missing": "_last"   // 選項：_first（排最前）、_last（排最後）、或指定預設值
      }
    }
  ]
}
```

#### 完整範例

```json
{
  "query": {
    "query_string": {
      "query": "laptop"
    }
  },
  "from": 0,
  "size": 20,
  "sort": [
    { "price": { "order": "asc", "missing": "_last" } },
    { "rating": "desc" },
    "_score"
  ]
}
```

**排序邏輯說明：**

1. 優先按價格升序排列（沒有價格的排最後）。
2. 價格相同時，按評分降序排列。
3. 價格和評分都相同時，按相關性分數排列。

### 特殊字元轉義

QueryString 中有許多特殊字元具有特定含義，若要作為普通字元使用，需要使用反斜線 `\` 轉義：

```text
\+ \- \= \&\& \|\| \> \< \! \( \) \{ \} \[ \] \^ \" \~ \* \? \: \\ \/
```

例如：

* 搜尋包含加號的文件：`title:\+1`。
* 搜尋包含括號的文件：`content:\(sample\)`。
* 搜尋包含引號的文件：`description:\"quoted text\"`。

## 異動歷程

* 2025-04-13 初版文件建立。
* 2025-10-03
  * 修正語句用詞，統一使用台灣慣用語。
  * 修正日期查詢範圍語法說明（日期欄位不支援比較運算子，應使用範圍查詢語法）。
  * 修正權重計算遺漏欄位基礎分數的部分。
  * 補充技術細節。
