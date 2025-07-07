# Elasticsearch QueryString 查詢語法筆記

最近開始想把 LOG 儲存在 Elasticsearch 裡，但這樣做需要有個方便查詢的 UI 介面，對我而言 Kibana 功能過於複雜，Postman 查詢又比較麻煩。後來發現了 Elasticvue 這個工具，選擇它的原因是它支援多種瀏覽器擴充套件及桌面應用程式版本。

[Elasticvue](https://github.com/cars10/elasticvue) 的查詢介面主要基於 query_string 語法，這是 Elasticsearch 中基於 Lucene 查詢語法的擴展版本。對熟悉 SQL 的使用者來說，`query_string` 比其他 DSL 語法更容易上手，因此我整理了一些常用的語法方便查閱。

可從 [Elasticvue 官網](https://elasticvue.com/) 查看各個瀏覽器擴充套件，或是桌面應用程式的安裝檔案或連結。

## 基本語法

### 基本 API 結構

```json
{
  "query": {
    "query_string": {
      "query": "your query string here",     // 必要參數：查詢字串（使用 "*" 可搜尋所有文件）
      "default_field": "content",            // 選用參數：預設搜尋欄位，未指定則搜尋全部欄位
      "default_operator": "OR"               // 選用參數：預設運算符，預設值為 OR
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
```
apple
```

多個詞彙（預設使用 OR 連接）：
```
apple banana
```

精確片語搜尋（使用雙引號）：
```
"red apple"
```

### 2. 布林運算符

AND 運算符（兩個詞都必須存在）：
```
apple AND banana
```

OR 運算符（至少有一個詞必須存在）：
```
apple OR banana
```

NOT 運算符（排除包含某詞的文件）：
```
apple NOT banana
```

加號（必須包含此詞）：
```
+apple banana
```

減號（必須排除此詞）：
```
apple -banana
```

### 3. 欄位指定查詢

針對特定欄位搜尋：

```
title:apple
```

針對多個欄位的查詢：

```
title:apple AND content:banana
```

多值查詢（OR 條件）：

```
user_id:(1234 OR 5678)
```

欄位存在性查詢：

```
_exists_:email        // 查詢 email 欄位存在的文件，可以理解成不為 null
NOT _exists_:phone    // 查詢 phone 欄位不存在的文件，可以理解成為 null
```

欄位指定優先順序：查詢字串中明確指定欄位 > fields 參數 > default_field 參數。

### 4. 範圍查詢與比較運算符

範圍查詢：

```
price:[10 TO 20]    // 閉區間，包含 10 和 20
price:{10 TO 20}    // 開區間，不包含 10 和 20
price:[10 TO *]     // 大於等於 10
price:[* TO 20]     // 小於等於 20
```

比較運算符：

```
price:>10           // 大於 10
price:>=10          // 大於等於 10
price:<20           // 小於 20
price:<=20          // 小於等於 20
```

這兩種寫法在功能上通常等價，可依情境選擇使用。

### 5. 萬用字元搜尋

萬用字元搜尋：

```
te?t      // 問號代表一個字元
test*     // 星號代表零個或多個字元
```

## 重要參數

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

### 2. analyze_wildcard

控制是否對萬用字元表達式進行分析處理：

* `analyze_wildcard: false`（預設）：萬用字元表達式不經過分析器處理。
* `analyze_wildcard: true`：萬用字元表達式先經過分析器處理，可實現大小寫不敏感搜尋。

```json
{
  "query_string": {
    "query": "Te*",
    "analyze_wildcard": true,
    "analyzer": "standard"
  }
}
```

### 3. analyzer

指定如何處理和分析查詢字串：

```json
{
  "query_string": {
    "query": "The Quick Brown Fox",
    "analyzer": "standard"
  }
}
```

analyzer 在 text 與 keyword 類型欄位上的差異：
* text 欄位：分析器會分詞並通常轉換為小寫。
* keyword 欄位：通常保留原始格式，需要特殊處理才能實現大小寫不敏感。

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

* true：會匹配 "ny restaurants" 或 "new york restaurants"（"new york" 作為整體片語）。
* false：會匹配 "ny restaurants" 或 "new restaurants" 或 "york restaurants"。

### 5. 權重控制：boost 與欄位加權

Elasticsearch 提供兩種方式來控制搜尋權重：

**1. boost 參數**：調整整個查詢的權重。
```json
{
  "query_string": {
    "query": "apple iphone",
    "boost": 2.0
  }
}
```
* 功能：增加整個查詢的重要性。
* 主要用途：
  * 在複合查詢結構中調整當前 query_string 查詢相對於其他查詢子句的重要性。
  * 與欄位加權結合使用，同時控制查詢級別和欄位級別的權重。

**2. 欄位加權**：使用 `^` 語法調整特定欄位的權重。
```json
{
  "query_string": {
    "query": "apple iphone",
    "fields": ["title^3", "description^2", "content"]
  }
}
```
* 功能：增加特定欄位的相對重要性。
* 適用場景：當在多個欄位中搜尋相同關鍵詞，但某些欄位應更重要時。
* 說明：在上例中，title 欄位的匹配權重是 content 欄位的 3 倍，description 是 2 倍。

**兩者結合使用的例子**：
```json
{
  "query_string": {
    "query": "apple",
    "fields": ["title^3", "description"],
    "boost": 2.0
  }
}
```
在這個例子中：
* 欄位加權：控制 title 欄位相對 description 欄位的重要性。
* boost：控制整個 query_string 查詢的整體權重（在更大的查詢結構中）。

**差異**：
* `boost`：控制整個查詢的權重。
* 欄位加權 `^`：控制查詢內不同欄位間的相對權重。

### 6. 模糊搜尋（fuzziness 與 phrase_slop）

波浪號 `~` 在 QueryString 中有兩種不同用途，取決於它的位置：

**1. 模糊搜尋（單詞後的波浪號）**：
```
apple~    // 單詞後接波浪號，表示模糊搜尋
apple~2   // 指定模糊度為 2
```
* 對應參數：`fuzziness`
* 功能：處理單個詞的拼寫錯誤，基於編輯距離。
* 識別方式：用於**單詞**後面。

**2. 近似搜尋（片語後的波浪號）**：
```
"apple banana"~5  // 片語後接波浪號，表示近似搜尋
```
* 對應參數：`phrase_slop`
* 功能：處理片語中詞的順序和距離。
* 識別方式：用於**引號包圍的片語**後面。

**在 API 中設定這些參數**：

```json
{
  "query_string": {
    "query": "apple~2 \"quick fox\"~3",
    "fuzziness": "AUTO",  // 全域設定，會被查詢中的具體值覆蓋
    "phrase_slop": 2      // 全域設定，會被查詢中的具體值覆蓋
  }
}
```

**fuzziness 設定差異**：
* `"fuzziness": "AUTO"`：根據詞長自動調整（1-2字元：0錯誤，3-5字元：1錯誤，>5字元：2錯誤）。
* `"fuzziness": 2`：固定允許最多2個字元編輯距離。

**範例說明**：
* `apple~1` 可匹配 "aple", "appla" 等拼寫錯誤的詞。
* `"quick fox"~3` 可匹配 "quick brown fox"（中間有詞）或 "fox is quick"（順序變化）。

**優先順序**：
* 查詢字串中使用 `~` 設定的值會覆蓋 API 參數中的全域設定。

## 日期時間查詢

基本日期範圍搜尋：

```
timestamp:[2023-01-01 TO 2023-01-31]
```

相對時間搜尋：

```
timestamp:>now-1d  // 過去24小時
```

常用相對時間表達式：
* `now-1h`：一小時前。
* `now-1w`：一週前。
* `now/d`：今天開始。
* `now/w`：本週開始。
* `now/M`：本月開始。

範圍語法vs比較運算符：

```
// 兩種等價的寫法
timeStamp:[\"2025-01-01T00:00\" TO *]
timeStamp:>=\"2025-01-01T00:00\"
```

日期時間格式：
* 標準格式：`yyyy-MM-ddTHH:mm:ss.SSSZ`。
* 簡化格式：`yyyy-MM-dd`。
* 注意時區設定，預設為 UTC。

## 分頁與排序

在查詢中加入分頁參數：
```json
{
  "query": {
    "query_string": {
      "query": "apple"
    }
  },
  "from": 0,   // 起始位置
  "size": 10,  // 每頁數量
  "sort": [
    { "price": "asc" },  // 按價格升序
    "_score"             // 相同價格按相關性排序
  ]
}
```

## 實用範例

### 1. 複雜布林組合查詢

```json
{
  "query": {
    "query_string": {
      "query": "(title:apple OR description:apple) AND (price:[500 TO 1000] OR brand:\"Apple Inc.\")",
      "default_operator": "AND"
    }
  }
}
```

### 2. 模糊搜尋與時間範圍組合

```json
{
  "query": {
    "query_string": {
      "query": "phne~ AND date:[now-30d TO now]",
      "fields": ["title", "content"]
    }
  }
}
```

### 特殊字元轉義

QueryString 中有許多特殊字元具有特定含義，若要作為普通字元使用，需要使用反斜線 `\` 轉義：

```
\+ \- \= \&\& \|\| \> \< \! \( \) \{ \} \[ \] \^ \" \~ \* \? \: \\ \/
```

例如：
* 搜尋包含加號的文件：`title:\+1`
* 搜尋包含括號的文件：`content:\(sample\)`
* 搜尋包含引號的文件：`description:\"quoted text\"`

###### tags: `ELK` `Elasticsearch`