---
title: "Elasticsearch Query DSL 查詢語法筆記"
date: 2025-11-04
lastmod: 2025-11-04
description: "整理 Elasticsearch Query DSL 常用語法。對比 Query String，DSL 支援 Nested 巢狀查詢、Geo 地理查詢及 Function Score 自訂評分，適合建構複雜且精準的搜尋邏輯。"
tags: ["Elastic Stack","Elasticsearch"]
---

# Elasticsearch Query DSL 查詢語法筆記

之前說過今年底前都會和 Elasticsearch 死磕，但現在改變計畫了。這篇寫完後，應該只會再補一篇關於在 .NET 的應用就算收尾。本來預計 10 月底能完成，結果拖到 11 月才生出來，照這進度，下一篇大概也會拖到年底。

原本還打算順便寫 Geo Query 和 Aggregations，但後來想想還是拆開比較好。Aggregations 偏向統計分析，和查詢語法本身關聯不大；Geo Query 則先擱著吧，這篇寫太久有點煩了，等有空、有心情再另外寫一篇。

減重從 9 月 16 日卡關到 10 月 9 日，10 月又莫名陷入厭世狀態，只想待在家裡看小說、刷短片，不想出門也不想動腦。之後會不會又發病不知道，下一篇什麼時候寫完也沒譜。

---

之前寫了一篇 Elasticsearch QueryString 查詢語法筆記，主要介紹在 query_string 欄位中使用簡單查詢字串的方式。那種語法簡潔直觀，很適合快速測試或簡單的查詢需求。
不過在實際的正式環境中，更常使用的是 Query DSL(Domain Specific Language)。Query DSL 是 Elasticsearch 提供的 JSON 結構化查詢語言，功能遠比 Query String 強大且靈活。
**這篇文章以實測結果為主，並輔以官方文件交叉驗證，整理 Query DSL 的查詢語法**。

測試版本： Elasticsearch 9.1.5

---

## Query DSL vs Query String

在開始之前，先簡單說明一下 Query DSL 相比 Query String 有哪些優點：

### 1. 功能更完整

某些查詢功能**只能用 Query DSL** 實作，Query String 無法支援：

- **Nested 查詢**：需要保留巢狀物件內部欄位關聯時，必須使用 Query DSL 的 `nested` 查詢。
- **地理空間查詢**：像是 `geo_distance` 之類的地理查詢功能。
- **自訂評分**：使用 `function_score` 來客製化文件的相關性評分。
- **複雜的布林邏輯組合**：透過 `bool` 查詢靈活組合 `must`、`should`、`must_not`、`filter` 等條件。

### 2. 結構更清晰

Query String：

```json
{
  "query": {
    "query_string": {
      "query": "title:Elasticsearch AND status:published AND created_date:[2024-01-01 TO 2024-12-31]"
    }
  }
}
```

Query DSL：

```json
{
  "query": {
    "bool": {
      "must": [
        { "match": { "title": "Elasticsearch" }},
        { "term": { "status": "published" }},
        { "range": { 
            "created_date": {
              "gte": "2024-01-01",
              "lte": "2024-12-31"
            }
          }
        }
      ]
    }
  }
}
```

雖然 Query DSL 看起來比較冗長，但結構更清楚，每個查詢條件都有明確的型別和參數，易於維護和除錯。此外，Query DSL 能提供更清楚的錯誤訊息，明確指出哪個欄位或參數有問題。

## 常用 Query DSL 語法

### 1. Match Query - 全文檢索查詢

用於全文檢索，會進行分詞和相關性評分。

**適用型別：**

- **Text 欄位**：會分詞，支援所有進階參數。
- **Keyword 欄位**：不分詞，完整比對。
- **Numeric/Date/Boolean 欄位**：精確比對，不支援 `fuzziness`、`analyzer` 等參數。

---

#### 基本查詢

```json
{
  "query": {
    "match": {
      "title": "Elasticsearch 教學"
    }
  }
}
```

---

#### operator 參數

控制多個 token 之間的邏輯關係。

**OR（預設）**

只要符合任一個詞就回傳：

```json
{
  "query": {
    "match": {
      "title": {
        "query": "quick brown fox",
        "operator": "OR"
      }
    }
  }
}
```

**效果**：文件只要包含 `quick`、`brown`、`fox` 任一個詞就會被回傳。

---

**AND**

必須符合所有詞：

```json
{
  "query": {
    "match": {
      "title": {
        "query": "quick brown fox",
        "operator": "AND"
      }
    }
  }
}
```

**效果**：文件必須同時包含 `quick`、`brown`、`fox` 三個詞。

---

#### minimum_should_match 參數

**重要：此參數只在 `operator = "OR"` 時有效。**

控制至少要符合多少個條件。

**正整數（絕對數量）**

```json
{
  "query": {
    "match": {
      "content": {
        "query": "quick brown fox jumps",
        "minimum_should_match": 3
      }
    }
  }
}
```

**效果**：4 個詞中至少要符合 3 個。

**範例：**

- `quick brown fox jumps` ✓（4 個都符合）。
- `quick brown fox dog` ✓（3 個符合：quick brown fox）。
- `quick brown lazy dog` ✗（只有 2 個符合：quick brown）。
- `the fox jumps high` ✗（只有 2 個符合：fox jumps）。

---

**負整數（允許遺漏數量）**

```json
{
  "query": {
    "match": {
      "content": {
        "query": "quick brown fox jumps",
        "minimum_should_match": -1
      }
    }
  }
}
```

**效果**：最多遺漏 1 個詞，等同於至少要 3 個。

**範例：**

- `quick brown fox jumps` ✓（遺漏 0 個）。
- `quick brown fox dog` ✓（遺漏 1 個：jumps）。
- `quick brown lazy dog` ✗（遺漏 2 個：fox 和 jumps）。

**⚠️ 特殊情況：最少符合數保底為 1。**

當設定 `-4`（遺漏數 = token 總數）或 `-100%`（遺漏 100%）時，不會回傳全部資料，至少要符合 **1 個詞**才會回傳結果。

**範例（`-4` 或 `-100%`）：**

- `quick dog` ✓（1 個符合：quick）。
- `brown cat` ✓（1 個符合：brown）。
- `lazy slow` ✗（0 個符合）。

---

**百分比（無條件捨去法）**

```json
{
  "query": {
    "match": {
      "content": {
        "query": "quick brown fox jumps",
        "minimum_should_match": "75%"
      }
    }
  }
}
```

**效果**：至少要符合 75%，也就是 4 個詞中至少 3 個（4 × 0.75 = 3）。

**⚠️ 計算規則（無條件捨去法）：**

- `75%`：4 × 0.75 = 3.0 → **3 個**。
- `74%`：4 × 0.74 = 2.96 → 無條件捨去為 **2 個**。
- `50%`：4 × 0.50 = 2.0 → **2 個**。
- `26%`：4 × 0.26 = 1.04 → 無條件捨去為 **1 個**。
- `25%`：4 × 0.25 = 1.0 → **1 個**。

**範例（`75%`）：**

- `quick brown fox jumps` ✓（100% 符合）。
- `quick brown fox dog` ✓（3 個符合，符合 75%）。
- `quick brown dog cat` ✗（只有 2 個符合，不足 75%）。

**範例（`74%`）：**

- `quick brown dog cat` ✓（2 個符合，2.96 無條件捨去為 2）。
- `quick dog cat rat` ✗（只有 1 個符合）。

---

**負百分比（無條件捨去法）**

```json
{
  "query": {
    "match": {
      "content": {
        "query": "quick brown fox jumps",
        "minimum_should_match": "-25%"
      }
    }
  }
}
```

**效果**：最多遺漏 25%，也就是最多遺漏 1 個詞（4 × 0.25 = 1），等同於至少要 3 個。

**⚠️ 計算規則（無條件捨去法）：**

- `-25%`：4 × 0.25 = 1 → 最多遺漏 **1 個**，需要 **3 個**。
- `-26%`：4 × 0.26 = 1.04 → 無條件捨去為 1，最多遺漏 **1 個**，需要 **3 個**。
- `-74%`：4 × 0.74 = 2.96 → 無條件捨去為 2，最多遺漏 **2 個**，需要 **2 個**。
- `-75%`：4 × 0.75 = 3 → 最多遺漏 **3 個**，需要 **1 個**。

**範例（`-25%`）：**

- `quick brown fox jumps` ✓（遺漏 0 個）。
- `quick brown fox dog` ✓（遺漏 1 個，符合最多遺漏 25%）。
- `quick brown dog cat` ✗（遺漏 2 個，超過限制）。

**範例（`-74%`）：**

- `quick brown dog cat` ✓（2 個符合，最多遺漏 2 個）。
- `quick dog cat rat` ✗（只有 1 個符合，遺漏 3 個）。

**範例（`-75%`）：**

- `quick dog cat rat` ✓（1 個符合，最多遺漏 3 個）。
- `lazy slow fast dog` ✗（0 個符合）。

---

**單條件組合（進階）**

**⚠️ 重要：單條件的解讀方式。**

格式：`N<VALUE` 或 `N>VALUE`。

- `N<VALUE`：當 token 數量 **≤ N** 時，使用預設規則（100%）；當 **> N** 時，套用 VALUE 規則。
- `N>VALUE`：當 token 數量 **> N** 時，使用預設規則（100%）；當 **≤ N** 時，套用 VALUE 規則。

**範例 1：`3<90%`**

```json
{
  "query": {
    "match": {
      "content": {
        "query": "some long search query with many terms",
        "minimum_should_match": "3<90%"
      }
    }
  }
}
```

**解讀：**

- 當查詢 **≤ 3 個 token**：需要 100% 符合（預設）。
- 當查詢 **> 3 個 token**：需要 90% 符合。

**範例（假設查詢「one two three four five」5 個詞）：**

- `one two three four five` ✓（100% 符合，5/5）。
- `one two three four dog` ✓（80% 符合，但只需 90%，因為 5 > 3）。
- `one two three dog cat` ✗（只有 60% 符合，3/5）。

---

**範例 2：`3<-1`**

```json
{
  "query": {
    "match": {
      "content": {
        "query": "alpha beta gamma delta",
        "minimum_should_match": "3<-1"
      }
    }
  }
}
```

**解讀：**

- 當查詢 **≤ 3 個 token**：需要 100% 符合。
- 當查詢 **> 3 個 token**：最多遺漏 1 個。

**範例（4 個詞）：**

- `alpha beta gamma delta` ✓（遺漏 0 個）。
- `alpha beta gamma dog` ✓（遺漏 1 個：delta）。
- `alpha beta dog cat` ✗（遺漏 2 個：gamma 和 delta）。

---

**多條件組合（進階）**

**⚠️ 重要：多條件的解讀方式與單條件不同。**

格式：`N1<VALUE1 N2<VALUE2 ...`。

多條件是用「區間」的方式解讀，而不是「小於」：

- **第一個條件之前**：使用預設規則（100%）。
- **N1 和 N2 之間**：套用 VALUE1。
- **N2 之後**：套用 VALUE2。

**範例：`2<-25% 9<-3`**

```json
{
  "query": {
    "match": {
      "content": {
        "query": "very long search query with lots of terms",
        "minimum_should_match": "2<-25% 9<-3"
      }
    }
  }
}
```

**⚠️ 正確解讀（區間方式）：**

- **≤ 2 個 token**：100% 符合（預設）。
- **3-9 個 token**：最多遺漏 25%（套用第一個條件 `-25%`）。
- **> 9 個 token**：最多遺漏 3 個（套用第二個條件 `-3`）。

**❌ 錯誤解讀（用單條件方式理解）：**

- ~~≤ 2：套用 -25%~~（錯誤！）
- ~~> 9：套用 -3~~（錯誤！）

**範例（假設查詢 10 個詞）：**

- 符合 10 個詞 ✓（遺漏 0 個）。
- 符合 7 個詞 ✓（遺漏 3 個，符合 > 9 的規則）。
- 符合 6 個詞 ✗（遺漏 4 個，超過限制）。

**範例（假設查詢 5 個詞）：**

- 符合 5 個詞 ✓（遺漏 0%）。
- 符合 4 個詞 ✓（遺漏 1 個，5 × 25% = 1.25 → 無條件捨去為 1，符合最多遺漏 1 個）。
- 符合 3 個詞 ✗（遺漏 2 個，超過限制）。

---

#### fuzziness 參數

模糊符合，允許拼字錯誤。**只適用於 text 欄位。**

**AUTO（建議）**

```json
{
  "query": {
    "match": {
      "title": {
        "query": "Elasticsearc",
        "fuzziness": "AUTO"
      }
    }
  }
}
```

**效果**：自動根據詞長決定允許的編輯距離。

**範例：**

- `Elasticsearch` ✓（差 1 個字元 h）。
- `Elasticsearc` ✓（完全符合查詢詞）。
- `Elasticserch` ✓（差 1 個字元）。
- `Elastix` ✗（差異太大）。

---

**固定編輯距離**

```json
{
  "query": {
    "match": {
      "title": {
        "query": "quikc brown",
        "fuzziness": 1
      }
    }
  }
}
```

**效果**：允許最多 1 個字元的差異（插入、刪除、替換）。

**範例：**

- `quick brown` ✓（quikc → quick，差 1 個字元）。
- `quikc brown` ✓（完全符合查詢詞）。
- `qukc brown` ✗（差 2 個字元）。
- `qick brown` ✓（差 1 個字元）。

---

**相關參數**

```json
{
  "query": {
    "match": {
      "title": {
        "query": "quikc brown fox",
        "fuzziness": "AUTO",
        "prefix_length": 2,
        "max_expansions": 10,
        "fuzzy_transpositions": true
      }
    }
  }
}
```

**參數說明：**

- `prefix_length`：前 N 個字元必須完全符合，預設為 `0`。
- `max_expansions`：模糊匹配時最多擴展幾個候選詞，預設為 `50`。
- `fuzzy_transpositions`：是否允許相鄰字元對調 (ab → ba)，預設為 `true`。

**範例（prefix_length = 2）：**

- `quick brown fox` ✓（qu 開頭，符合前綴）。
- `quikc brown fox` ✓（qu 開頭，符合前綴）。
- `xuick brown fox` ✗（前 2 個字元 xu 不符合 qu）。

---

**範例（max_expansions = 10）：**

假設索引中有這些詞：`quick`、`quit`、`quiz`、`quiet`、`quiche`、`quill`、`quirk`、`quack`、`queue`、`quartz`、`qualify`、`quarrel`...（總共 20+ 個相似詞）。

查詢 `qui` 時：

```json
{
  "query": {
    "match": {
      "title": {
        "query": "qui",
        "fuzziness": 1,
        "max_expansions": 10
      }
    }
  }
}
```

**效果**：

- Elasticsearch 找到所有編輯距離 ≤ 1 的相似詞（可能有 20+ 個）。
- 只取前 10 個候選詞進行搜尋（例如：`qui`、`quit`、`quiz`、`quiet`、`quick`、`quiche`、`quill`、`quirk`、`quack`、`queue`）。
- 其他候選詞（如 `quartz`、`qualify`、`quarrel`...）會被忽略。

**為什麼需要限制？**

- **效能考量**：如果擴展成幾十個候選詞，會消耗大量計算資源，查詢變慢。
- **結果品質**：過多候選詞可能包含不相關的結果。

---

**範例（fuzzy_transpositions = true）：**

- `qiuck` ✓（ui ↔ iu，對調）。
- `qukic` ✓（ki ↔ ik，對調）。

**範例（fuzzy_transpositions = false）：**

```json
{
  "query": {
    "match": {
      "title": {
        "query": "qiuck",
        "fuzziness": 1,
        "fuzzy_transpositions": false
      }
    }
  }
}
```

- `qiuck` ✗（ui ↔ iu 的對調不被允許，需要 2 次編輯：刪除 i、插入 u）。
- `quick` ✓（只需 1 次編輯：替換 i → u）。

---

#### 其他參數

**analyzer**

指定分詞器（預設使用欄位設定的分詞器）：

```json
{
  "query": {
    "match": {
      "content": {
        "query": "Quick Brown",
        "analyzer": "standard"
      }
    }
  }
}
```

---

**lenient**

控制當查詢值與欄位型別不符合時的處理方式，預設為 `false`。

**參數說明：**

- `false`（預設）：當型別不符合時，會拋出錯誤，查詢失敗。
- `true`：當型別不符合時，忽略該欄位的查詢，不會拋出錯誤，但該欄位不會有任何匹配結果。

**範例 1：lenient = false（預設）**

```json
{
  "query": {
    "match": {
      "age": {
        "query": "not a number"
      }
    }
  }
}
```

**效果**：

- 因為 `age` 欄位是數字型別，而查詢值 `"not a number"` 是文字。
- 查詢會**拋出錯誤**。

---

**範例 2：lenient = true**

```json
{
  "query": {
    "match": {
      "age": {
        "query": "not a number",
        "lenient": true
      }
    }
  }
}
```

**效果**：

- 查詢**不會拋出錯誤**。
- 但因為型別不符合，該欄位**不會符合任何文件**（等同於該條件被忽略）。
- 查詢會正常執行完成，只是沒有結果。

---

**boost**

調整相關性分數權重，預設為 `1.0`：

```json
{
  "query": {
    "match": {
      "title": {
        "query": "Elasticsearch",
        "boost": 2.0
      }
    }
  }
}
```

---

**zero_terms_query**

當查詢經過分詞後沒有任何 token（變成空查詢）時的處理方式，預設為 `none`。

**參數說明：**

- `none`（預設）：不回傳任何文件。
- `all`：回傳所有文件（等同於 match_all）。

---

**範例 1：空字串查詢**

```json
{
  "query": {
    "match": {
      "message": {
        "query": "",
        "zero_terms_query": "none"  // 或 "all"
      }
    }
  }
}
```

**效果：**

- `zero_terms_query: "none"`：不回傳任何文件。
- `zero_terms_query: "all"`：回傳所有文件。

---

**範例 2：stop filter 移除所有詞**

假設 `message` 欄位使用了包含 `to`、`be`、`or`、`not` 的 stop filter（需額外設定），查詢 `"to be or not to be"` 時：

```json
{
  "query": {
    "match": {
      "message": {
        "query": "to be or not to be",
        "zero_terms_query": "none"  // 或 "all"
      }
    }
  }
}
```

**處理過程：**

1. 原始查詢：`"to be or not to be"`。
2. stop filter 移除所有停用詞，剩餘 0 個 token（變成空查詢）。
3. `zero_terms_query: "none"`：不回傳任何文件；`zero_terms_query: "all"`：回傳所有文件。

---

**使用場景：**

- `zero_terms_query: "all"`：搜尋框允許空查詢，或使用者可能只輸入停用詞但仍希望有回饋。
- `zero_terms_query: "none"`：不允許空查詢（大多數預設行為）。

---

::: warning
`zero_terms_query` **只在查詢真的變成空的時候才會觸發**。

如果查詢的詞沒有被移除，只是在索引中找不到匹配，會正常回傳 0 筆而不是觸發 `zero_terms_query`。例如欄位沒有設定 stop filter 時，查詢 `"to be or not to be"` 不會觸發 `zero_terms_query`，而是正常搜尋這些詞。
:::

---

### 2. Multi Match Query - 多欄位查詢

在多個欄位中搜尋相同的關鍵字。

```json
{
  "query": {
    "multi_match": {
      "query": "Elasticsearch",
      "fields": ["title^3", "content", "tags"],
      "type": "best_fields"
    }
  }
}
```

**參數說明：**

- `fields`：欄位列表，`^` 後面的數字代表權重。欄位可以使用萬用字元，例如 `"title"` 和 `"*_name"` 會查詢 `title`、`first_name`、`last_name` 等欄位。
- `type`：查詢類型。

---

#### 不同 type 的參數支援

| 參數 | 說明 | best_fields | most_fields | cross_fields | phrase | phrase_prefix | bool_prefix |
|------|------|-------------|-------------|--------------|--------|---------------|-------------|
| `fuzziness` | 模糊符合，允許拼字錯誤（支援 `AUTO`、`0`、`1`、`2`） | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| `prefix_length` | 前 N 個字元必須完全符合（預設為 `0`） | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| `max_expansions` | 模糊匹配時最多擴展幾個候選詞（預設為 `50`） | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| `fuzzy_transpositions` | 是否允許相鄰字元對調（預設為 `true`） | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| `fuzzy_rewrite` | 模糊查詢的重寫方法 | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| `slop` | 片語查詢時允許的詞彙間距 | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |

---

#### lenient 參數

`lenient` 參數在多欄位查詢時特別有用，因為不同欄位可能有不同的資料型別。

假設索引中有以下欄位：

- `title` (text)
- `price` (integer)

```json
{
  "query": {
    "multi_match": {
      "query": "not a number",
      "fields": ["title", "price"],
      "lenient": false
    }
  }
}
```

**效果（lenient = false，預設）：**

- `title` 欄位是 text，可以正常處理 `"not a number"`。
- `price` 欄位是 integer，無法處理 `"not a number"`。
- 查詢會**拋出錯誤**，整個查詢失敗。

---

```json
{
  "query": {
    "multi_match": {
      "query": "not a number",
      "fields": ["title", "price"],
      "lenient": true
    }
  }
}
```

**效果（lenient = true）：**

- `title` 欄位正常搜尋 `"not a number"`。
- `price` 欄位因型別不符合而被**忽略**，不會拋出錯誤。
- 查詢正常執行，只在 `title` 欄位中搜尋。

---

#### 查詢類型說明

為了更好地說明各種查詢類型的差異，我們使用以下測試資料：

**測試資料：**

```json
// 文件 1
{
  "title": "brown fox jumps",
  "subject": "quick animal",
  "message": "The quick brown fox"
}

// 文件 2
{
  "title": "quick brown",
  "subject": "fox hunting",
  "message": "Guide to fox hunting"
}

// 文件 3
{
  "title": "fast animal",
  "subject": "brown bear",
  "message": "The brown bear is slow"
}
```

---

**best_fields（預設）**

取最高分欄位的分數，適合尋找「單一欄位最符合」的情況。

```json
{
  "query": {
    "multi_match": {
      "query": "quick brown fox",
      "type": "best_fields",
      "fields": ["title", "subject", "message"],
      "tie_breaker": 0.3
    }
  }
}
```

**內部執行邏輯（等同於）：**

```json
{
  "query": {
    "dis_max": {
      "queries": [
        { "match": { "title": "quick brown fox" }},
        { "match": { "subject": "quick brown fox" }},
        { "match": { "message": "quick brown fox" }}
      ],
      "tie_breaker": 0.3
    }
  }
}
```

**評分方式：**

- 取最高分欄位的分數。
- 如果設定 `tie_breaker`，則為：最高分 + (其他欄位分數 × tie_breaker)。

**查詢結果分析：**

假設查詢 "quick brown fox"，每個欄位的基礎分數如下（實際分數會受到 BM25 算法、詞頻、文件長度等因素影響）：

| 文件 | title 分數 | subject 分數 | message 分數 | 最終分數計算（tie_breaker=0.3） |
|------|-----------|-------------|-------------|------------------------------|
| 文件 1 | 1.5 (brown, fox) | 1.0 (quick) | 5.0 (quick, brown, fox) | 5.0 + (1.5 + 1.0) × 0.3 = **5.75** |
| 文件 2 | 3.0 (quick, brown) | 1.0 (fox) | 1.0 (fox) | 3.0 + (1.0 + 1.0) × 0.3 = **3.6** |
| 文件 3 | 0 | 1.0 (brown) | 1.0 (brown) | 1.0 + 1.0 × 0.3 = **1.3** |

**計算邏輯：**

- 選擇最高分欄位作為基礎分數。
- 將其他所有符合欄位的分數乘以 tie_breaker 後加總。
- 公式：`最高分 + (其他欄位分數總和 × tie_breaker)`。

**結論**：文件 1 分數最高，因為 `message` 欄位同時包含全部三個詞且為最高分，同時其他兩個欄位也有貢獻。

---

**most_fields**

合併所有欄位的分數，適合「多個相似欄位」的情況（如：同一內容的不同分詞方式）。

```json
{
  "query": {
    "multi_match": {
      "query": "quick brown fox",
      "type": "most_fields",
      "fields": ["title", "subject", "message"]
    }
  }
}
```

**內部執行邏輯（等同於）：**

```json
{
  "query": {
    "bool": {
      "should": [
        { "match": { "title": "quick brown fox" }},
        { "match": { "subject": "quick brown fox" }},
        { "match": { "message": "quick brown fox" }}
      ]
    }
  }
}
```

**評分方式：**

- 將所有欄位的分數相加。

**查詢結果分析：**

| 文件 | title 分數 | subject 分數 | message 分數 | 最終分數（相加） |
|------|-----------|-------------|-------------|--------------|
| 文件 1 | 1.5 (brown, fox) | 1.0 (quick) | 5.0 (quick, brown, fox) | 1.5 + 1.0 + 5.0 = **7.5** |
| 文件 2 | 3.0 (quick, brown) | 1.0 (fox) | 1.0 (fox) | 3.0 + 1.0 + 1.0 = **5.0** |
| 文件 3 | 0 | 1.0 (brown) | 1.0 (brown) | 0 + 1.0 + 1.0 = **2.0** |

**結論**：文件 1 分數最高，因為它在多個欄位都有符合。

**與 best_fields 的差異：**

`best_fields` 和 `most_fields` 的主要差異在於 `tie_breaker` 的預設值：

- `best_fields`：預設 `tie_breaker = 0.0`（只取最高分）。
- `most_fields`：預設 `tie_breaker = 1.0`（加總所有分數）。

當兩者都設定相同的 `tie_breaker` 值時，計算出來的分數會相同。

---

**cross_fields**

跨欄位查詢，將多個欄位視為一個大欄位，適合姓名、地址等需要跨欄位符合的情況。

**測試資料（姓名範例）：**

```json
// 文件 1
{ "first_name": "Wing", "last_name": "Chou" }

// 文件 2
{ "first_name": "Chou", "last_name": "Chen" }

// 文件 3
{ "first_name": "John", "last_name": "Wing" }
```

```json
{
  "query": {
    "multi_match": {
      "query": "Wing Chou",
      "type": "cross_fields",
      "fields": ["first_name", "last_name"],
      "operator": "and"
    }
  }
}
```

**執行邏輯：**

根據官方文件，`cross_fields` 會將查詢字串分析為個別詞彙，然後在任何欄位中尋找每個詞彙，就像它們是一個大欄位一樣。

```text
+blended(terms:[first_name:wing, last_name:wing])
+blended(terms:[first_name:chou, last_name:chou])
```

這表示每個詞可以分散在不同欄位中，只要每個詞在至少一個欄位中出現即可。

**查詢結果分析：**

| 文件 | 是否符合 | 說明 |
|------|---------|------|
| 文件 1 | ✅ | `Wing` 在 first_name，`Chou` 在 last_name（分散在不同欄位） |
| 文件 2 | ❌ | 只有 `Chou` 符合，缺少 `Wing` |
| 文件 3 | ❌ | 只有 `Wing` 符合，缺少 `Chou` |

::: warning
當欄位的 `search_analyzer` 設定不一致時（例如其中一個欄位有設定 analyzer，另一個沒有），`cross_fields` 的查詢行為會改變。例如執行邏輯會變成：

```text
((+first_name:wing +first_name:chou) | (+last_name:wing +last_name:chou))
```

此時所有詞必須在同一個欄位中出現，而不是分散在不同欄位，行為類似 `best_fields`（但欄位順序不同）。

另外，`combined_fields` 查詢在欄位使用不同的 `search_analyzer` 時會無法查詢，因此如果有自訂 analyzer 的需求，需要特別注意這個限制。
:::

**評分方式：**

- 混合所有欄位的詞頻統計，避免單一欄位詞頻過高影響結果。
- 使用 `tie_breaker` 可以調整評分行為（預設為 0.0）。

---

**phrase**

片語查詢，詞彙必須按順序出現。

**測試資料：**

```json
// 文件 1
{ "title": "quick brown fox", "message": "The fox is quick" }

// 文件 2
{ "title": "brown quick fox", "message": "quick brown fox jumps" }

// 文件 3
{ "title": "fast brown fox", "message": "A brown and quick animal" }
```

```json
{
  "query": {
    "multi_match": {
      "query": "quick brown fox",
      "type": "phrase",
      "fields": ["title", "message"]
    }
  }
}
```

**內部執行邏輯（等同於）：**

```json
{
  "query": {
    "dis_max": {
      "queries": [
        { "match_phrase": { "title": "quick brown fox" }},
        { "match_phrase": { "message": "quick brown fox" }}
      ]
    }
  }
}
```

**查詢結果分析：**

| 文件 | title 符合 | message 符合 | 是否回傳 |
|------|-----------|-------------|---------|
| 文件 1 | ✅（順序正確） | ❌（順序不對："fox is quick"） | ✅ |
| 文件 2 | ❌（順序不對："brown quick fox"） | ✅（順序正確） | ✅ |
| 文件 3 | ❌（中間多了 "fast"） | ❌（詞彙分散："brown and quick"） | ❌ |

**結論**：片語查詢要求詞彙必須按順序相鄰出現。

**搭配 slop 參數：**

```json
{
  "query": {
    "multi_match": {
      "query": "quick brown fox",
      "type": "phrase",
      "fields": ["title", "message"],
      "slop": 1
    }
  }
}
```

**查詢結果變化：**

| 文件 | title 符合 | message 符合 | 是否回傳 |
|------|-----------|-------------|---------|
| 文件 1 | ✅ | ❌（需要 slop = 2） | ✅ |
| 文件 2 | ❌（需要 slop = 2） | ✅ | ✅ |
| 文件 3 | ✅（"fast" 算 1 個間隔） | ❌（需要更大的 slop） | ✅ |

---

**phrase_prefix**

片語前綴查詢，最後一個詞可以是前綴符合。

**測試資料：**

```json
// 文件 1
{ "title": "quick brown fox", "message": "quick brown forest" }

// 文件 2
{ "title": "quick brown food", "message": "quick brown" }

// 文件 3
{ "title": "fast brown fox", "message": "quick blue forest" }
```

```json
{
  "query": {
    "multi_match": {
      "query": "quick brown f",
      "type": "phrase_prefix",
      "fields": ["title", "message"]
    }
  }
}
```

**內部執行邏輯（等同於）：**

```json
{
  "query": {
    "dis_max": {
      "queries": [
        { "match_phrase_prefix": { "title": "quick brown f" }},
        { "match_phrase_prefix": { "message": "quick brown f" }}
      ]
    }
  }
}
```

**查詢結果分析：**

| 文件 | title 符合 | message 符合 | 是否回傳 |
|------|-----------|-------------|---------|
| 文件 1 | ✅（f 前綴符合 fox） | ✅（f 前綴符合 forest） | ✅ |
| 文件 2 | ✅（f 前綴符合 food） | ❌（沒有 f 開頭的詞） | ✅ |
| 文件 3 | ❌（缺少 "quick"） | ❌（缺少 "brown"） | ❌ |

**結論**：前 N-1 個詞必須完全符合且順序正確，最後一個詞可以是前綴符合。

---

**bool_prefix**

布林前綴查詢，最後一個詞使用前綴符合，其他詞使用完整符合。

**測試資料：**

```json
// 文件 1
{ "title": "quick brown fox", "message": "forest animals" }

// 文件 2
{ "title": "brown food quick", "message": "quick forest" }

// 文件 3
{ "title": "fast fox", "message": "brown quick forest" }
```

```json
{
  "query": {
    "multi_match": {
      "query": "quick brown f",
      "type": "bool_prefix",
      "fields": ["title", "message"]
    }
  }
}
```

**評分方式：**

- 類似 `most_fields`，但使用 `match_bool_prefix` 查詢。
- 支援模糊查詢參數，但只對非前綴詞有效。

**查詢結果分析：**

| 文件 | title 符合 | message 符合 | 是否回傳 | 說明 |
|------|-----------|-------------|---------|------|
| 文件 1 | ✅（quick，brown，f前綴） | ✅（f前綴符合 forest） | ✅ | 所有詞都符合 |
| 文件 2 | ✅（quick，brown，f前綴符合 food） | ✅（quick，f前綴符合 forest） | ✅ | 詞彙順序不重要 |
| 文件 3 | ✅（f前綴符合 fox） | ✅（brown，quick，f前綴符合 forest） | ✅ | 詞彙可分散在不同欄位 |

**與 phrase_prefix 的差異：**

| 特性 | phrase_prefix | bool_prefix |
|------|--------------|-------------|
| 詞彙順序 | 必須按順序 | 不要求順序 |
| 詞彙位置 | 必須相鄰 | 可以分散 |
| 適用場景 | 精確片語搜尋 | 靈活的自動完成 |

**範例：**

查詢 `"quick brown f"`:

- `phrase_prefix`：必須是 "quick brown f..." 的順序。
- `bool_prefix`：可以是 "brown quick f..." 或 "f... brown quick" 等任意順序。

---

### 3. Combined Fields Query - 跨欄位詞彙查詢

`combined_fields` 查詢採用以詞彙為中心的方式，將多個 text 欄位視為單一組合欄位進行搜尋。它特別適合處理查詢詞可能分散在多個欄位的情況，例如文章的標題、摘要和內文。

**基本查詢：**

```json
{
  "query": {
    "combined_fields": {
      "query": "database systems",
      "fields": ["title", "abstract", "body"],
      "operator": "and"
    }
  }
}
```

**測試資料：**

```json
// 文件 1
{
  "title": "Database Management",
  "abstract": "Modern systems overview",
  "body": "Relational database concepts"
}

// 文件 2
{
  "title": "Information Systems",
  "abstract": "Database architecture",
  "body": "Design patterns"
}

// 文件 3
{
  "title": "NoSQL Solutions",
  "abstract": "Alternative approaches",
  "body": "Non-relational systems"
}
```

**查詢結果分析：**

查詢 `"database systems"` 時：

| 文件 | 符合情況 | 是否回傳 | 說明 |
|------|---------|---------|------|
| 文件 1 | ✅ | ✅ | "database" 在 title 和 body，"systems" 在 abstract |
| 文件 2 | ✅ | ✅ | "database" 在 abstract，"systems" 在 title |
| 文件 3 | ✅ | ✅ | "systems" 在 body（如果 operator 為 "or"） |

---

#### 主要參數

**fields（必填）**

欄位列表，支援萬用字元。**所有欄位必須是 text 型別且使用相同的 search analyzer**。

```json
{
  "query": {
    "combined_fields": {
      "query": "quick search",
      "fields": ["title^2", "content", "*_text"]
    }
  }
}
```

**boost**

可以使用 `^` 符號設定欄位權重（必須 ≥ 1.0，可以是小數），或使用 `boost` 參數調整整個查詢的權重：

```json
{
  "query": {
    "combined_fields": {
      "query": "distributed consensus",
      "fields": ["title^2", "body"],
      "boost": 1.5
    }
  }
}
```

**測試資料：**

```json
// 文件 1
{ "title": "Consensus Algorithms", "body": "Distributed systems basics" }

// 文件 2
{ "title": "Network Protocols", "body": "Distributed consensus mechanisms" }
```

**評分方式：**

- 文件 1：`title` 包含 "consensus"（權重 × 2），`body` 包含 "distributed"，整體分數較高。
- 文件 2：兩個詞都在 `body`（無權重加成），分數較低。

---

**operator**

設定詞彙之間的邏輯關係，預設為 `or`。

- `or`（預設）：任一詞彙符合即可。
- `and`：所有詞彙都必須符合。

```json
{
  "query": {
    "combined_fields": {
      "query": "database systems",
      "fields": ["title", "abstract", "body"],
      "operator": "and"
    }
  }
}
```

---

**minimum_should_match**

最少符合數量，用法與 `match` 查詢相同。支援：

- 正整數：絕對數量（如 `3`）。
- 負整數：允許遺漏數量（如 `-1`）。
- 百分比：`"75%"` 或 `"-25%"`。
- 條件組合：`"3<90%"` 或 `"2<-25% 9<-3"`。

詳細說明請參考「Match Query」章節的 `minimum_should_match` 參數。

```json
{
  "query": {
    "combined_fields": {
      "query": "quick brown fox jumps",
      "fields": ["title", "content"],
      "minimum_should_match": "75%"
    }
  }
}
```

---

**zero_terms_query**

當分詞後沒有任何 token 時的處理方式，預設為 `none`。

- `none`（預設）：不回傳任何文件。
- `all`：回傳所有文件。

詳細說明請參考「Match Query」章節的 `zero_terms_query` 參數。

---

**auto_generate_synonyms_phrase_query**

是否自動為多詞同義詞建立片語查詢，預設為 `true`。

```json
{
  "query": {
    "combined_fields": {
      "query": "quick",
      "fields": ["title", "body"],
      "auto_generate_synonyms_phrase_query": true
    }
  }
}
```

**效果**：如果 "quick" 有同義詞 "fast running"，則會自動建立片語查詢 `"fast running"`。

::: warning
使用同義詞功能需要在欄位的 `search_analyzer` 中設定同義詞過濾器。不過 `combined_fields` 要求所有欄位使用相同的 `search_analyzer`，如果欄位的 analyzer 設定不一致會導致查詢失敗。因此在使用此參數時，需要確保所有查詢欄位都使用相同的同義詞設定。
:::

---

#### 執行邏輯

```json
{
  "query": {
    "combined_fields": {
      "query": "database systems",
      "fields": ["title", "abstract"],
      "operator": "and"
    }
  }
}
```

**實際執行邏輯：**

```text
+(combined("database", fields:["title", "abstract"]))
+(combined("systems", fields:["title", "abstract"]))
```

**意思是**：每個詞必須至少在一個欄位中出現（可分散在不同欄位）。

---

#### 使用限制

1. **欄位型別限制**：只支援 text 欄位，不支援 keyword、數字、日期等型別。
2. **Analyzer 限制**：所有欄位必須使用相同的 search analyzer。
3. **相似度限制**：僅支援 BM25 相似度（Elasticsearch 的預設相似度），不支援自訂相似度或逐欄位相似度設定。
4. **子句數量限制**：查詢子句數量受 `indices.query.bool.max_clause_count` 限制（預設 4096），計算方式為「欄位數 × 詞彙數」。

**範例：**

```json
{
  "query": {
    "combined_fields": {
      "query": "quick brown fox jumps",
      "fields": ["title", "abstract", "body"]
    }
  }
}
```

- 詞彙數：4（quick、brown、fox、jumps）。
- 欄位數：3（title、abstract、body）。
- 子句數量：4 × 3 = 12（遠低於 4096 限制）。

---

### 4. Match Phrase Query - 片語查詢

必須完整符合片語順序，適合搜尋固定詞組。

```json
{
  "query": {
    "match_phrase": {
      "content": {
        "query": "quick brown fox",
        "slop": 1
      }
    }
  }
}
```

**參數說明：**

- `query`：要搜尋的片語。
- `analyzer`：指定分詞器（預設使用欄位設定的分詞器）。
- `boost`：調整相關性分數權重，預設為 `1.0`。
- `slop`：允許詞彙之間的最大間隔數，預設為 `0`（必須完全相鄰）。
- `zero_terms_query`：當分詞後沒有任何 token 時的處理方式（`none` 或 `all`）。

**測試資料：**

```json
// 文件 1
{ "content": "The quick brown fox jumps over the lazy dog" }

// 文件 2
{ "content": "A quick and brown fox in the forest" }

// 文件 3
{ "content": "The brown quick fox runs fast" }
```

**查詢結果（slop = 0）：**

```json
{
  "query": {
    "match_phrase": {
      "content": "quick brown fox"
    }
  }
}
```

| 文件 | 是否符合 | 說明 |
|------|---------|------|
| 文件 1 | ✅ | 詞彙順序正確且相鄰 |
| 文件 2 | ❌ | 中間有 "and"，不相鄰 |
| 文件 3 | ❌ | 順序錯誤（brown quick） |

**查詢結果（slop = 1）：**

```json
{
  "query": {
    "match_phrase": {
      "content": {
        "query": "quick brown fox",
        "slop": 1
      }
    }
  }
}
```

| 文件 | 是否符合 | 說明 |
|------|---------|------|
| 文件 1 | ✅ | 詞彙順序正確且相鄰 |
| 文件 2 | ✅ | 中間有 1 個詞（"and"），符合 slop = 1 |
| 文件 3 | ❌ | 順序錯誤，需要 2 次移動才能符合 |

---

### 5. Term Query - 精確符合

用於精確值查詢，不進行分詞，直接比對索引中的詞彙（term）。

```json
{
  "query": {
    "term": {
      "status": {
        "value": "published"
      }
    }
  }
}
```

**參數說明：**

- `value`：要查詢的精確值。
- `boost`：調整相關性分數權重，預設為 `1.0`。
- `case_insensitive`：是否忽略大小寫，預設為 `false`（只在 Elasticsearch 7.10+ 支援）。

**適用型別：**

- **Keyword 欄位**：完全符合原始值。
- **Text 欄位**：符合分詞後的詞彙（term），而非原始文字。
- **數字、日期、布林值**：精確值比對。

**使用場景：**

- Keyword 欄位的精確符合（狀態、標籤、ID 等）。
- 數字、日期、布林值的精確查詢。
- Text 欄位的特定詞彙查詢（需理解分詞結果）。

**測試資料：**

```json
// 文件 1
{ "status": "published", "title": "Elasticsearch Guide" }

// 文件 2
{ "status": "draft", "title": "Quick Tutorial" }
```

**查詢範例（Keyword 欄位）：**

```json
{
  "query": {
    "term": {
      "status": "published"
    }
  }
}
```

| 文件 | 是否符合 | 說明 |
|------|---------|------|
| 文件 1 | ✅ | status 完全符合 "published" |
| 文件 2 | ❌ | status 是 "draft" |

---

**查詢範例（Text 欄位）：**

假設 `title` 是 text 欄位，使用標準分詞器：

```json
{
  "query": {
    "term": {
      "title": "elasticsearch"
    }
  }
}
```

| 文件 | 是否符合 | 說明 |
|------|---------|------|
| 文件 1 | ✅ | "Elasticsearch Guide" 分詞後包含 "elasticsearch" |
| 文件 2 | ❌ | 分詞後不包含 "elasticsearch" |

::: warning
對 text 欄位使用 `term` 查詢時，查詢值**不會經過分詞**，但會去比對索引中已分詞的詞彙。例如查詢 `"Elasticsearch Guide"` 不會符合任何結果，因為索引中存的是分詞後的 `"elasticsearch"` 和 `"guide"`，而不是完整字串。

**建議**：對 text 欄位進行全文檢索時，應使用 `match` 查詢而非 `term` 查詢。
:::

---

### 6. Terms Query - 多值精確符合

類似 SQL 的 `IN` 查詢。

#### 基本用法

```json
{
  "query": {
    "terms": {
      "status": ["published", "draft", "pending"],
      "boost": 2.0
    }
  }
}
```

**參數說明：**

- `boost`：調整相關性分數權重。
- `index.max_terms_count`：預設最多 65,536 個詞彙，可透過設定調整。

**測試資料：**

```json
// 文件 1
{ "status": "published", "title": "Article 1" }
// 文件 2
{ "status": "draft", "title": "Article 2" }
// 文件 3
{ "status": "archived", "title": "Article 3" }
```

**查詢結果：**

| 文件 | 是否符合 | 說明 |
|------|---------|------|
| 文件 1 | ✅ | status = "published" |
| 文件 2 | ✅ | status = "draft" |
| 文件 3 | ❌ | status = "archived" 不在清單中 |

---

#### Terms Lookup - 從現有文件取值作為搜尋條件

當需要搜尋大量詞彙時，可以從現有文件中取得欄位值作為搜尋條件，避免手動列出大量詞彙。

**使用限制：**

- 必須啟用欄位的 `_source`。
- 不支援 cross-cluster search。
- 同樣受 `index.max_terms_count` 限制（預設 65,536）。

**參數說明：**

- `index`：來源文件所在的 index 名稱。
- `id`：來源文件的 ID。
- `path`：要取值的欄位名稱，支援巢狀物件的點記法。

**範例場景：**
假設有一個 index 儲存文章的狀態，想要找出所有與特定文件具有相同狀態的其他文件。

**測試資料：**

```json
// 文件 1
{ "status": "published", "title": "Article 1" }
// 文件 2
{ "status": "draft", "title": "Article 2" }
// 文件 3
{ "status": "archived", "title": "Article 3" }
```

**查詢：從文件 2 取得 status 欄位值，並搜尋包含這些值的所有文件**

```json
{
  "query": {
    "terms": {
      "status": {
        "index": "my-index",
        "id": "2",
        "path": "status"
      }
    }
  }
}
```

**執行流程：**

1. Elasticsearch 從 `my-index` index 取得 ID 為 `2` 的文件。
2. 讀取該文件的 `status` 欄位值：`["draft"]`。
3. 使用 `["draft"]` 作為搜尋條件，等同於執行：

   ```json
   {
     "query": {
       "terms": {
         "status": ["draft"]
       }
     }
   }
   ```

**查詢結果：**

| 文件 | 是否符合 | 說明 |
|------|---------|------|
| 文件 1 | ❌ | status = "published" 不符合 |
| 文件 2 | ✅ | status = "draft" |
| 文件 3 | ❌ | status = "archived" 不符合 |

---

### 7. Range Query - 範圍查詢

用於數值、日期範圍查詢。

#### 基本用法

```json
{
  "query": {
    "range": {
      "age": {
        "gte": 18,
        "lte": 65,
        "boost": 2.0
      }
    }
  }
}
```

**參數說明：**

- `gt`：大於（greater than）。
- `gte`：大於等於（greater than or equal）。
- `lt`：小於（less than）。
- `lte`：小於等於（less than or equal）。
- `format`：日期格式，覆寫欄位 mapping 的預設格式。
- `relation`：**僅適用於 range 型別欄位**（如 `date_range`、`integer_range` 等），指定範圍比對方式：
  - `INTERSECTS`（預設）：交集比對 - 查詢範圍與文件範圍有任何重疊即符合。
  - `CONTAINS`：包含比對 - 文件範圍完全包含查詢範圍。
  - `WITHIN`：內含比對 - 文件範圍完全在查詢範圍內。
- `time_zone`：時區設定，用於轉換日期值為 UTC。
- `boost`：調整相關性分數權重（預設 1.0）。

**測試資料：**

```json
// 文件 1
{ "age": 25, "name": "Alice" }
// 文件 2
{ "age": 17, "name": "Bob" }
// 文件 3
{ "age": 70, "name": "Charlie" }
```

**查詢結果（age 範圍 18-65）：**

| 文件 | 是否符合 | 說明 |
|------|---------|------|
| 文件 1 | ✅ | 25 在範圍內 |
| 文件 2 | ❌ | 17 < 18 |
| 文件 3 | ❌ | 70 > 65 |

---

#### 日期範圍查詢

**基本日期範例：**

```json
{
  "query": {
    "range": {
      "created_date": {
        "gte": "2024-01-01",
        "lte": "2024-12-31",
        "format": "yyyy-MM-dd"
      }
    }
  }
}
```

**使用 Date Math 的日期範例：**

```json
{
  "query": {
    "range": {
      "created_date": {
        "gte": "now-1d/d",
        "lte": "now/d"
      }
    }
  }
}
```

此查詢會返回 `created_date` 欄位介於昨天到今天之間的文件。

**Date Math 語法說明：**

- `now`：當前時間（UTC）
- `+1h`：加 1 小時
- `-1d`：減 1 天
- `/d`：捨入到當天（日期的開始或結束）
- `/M`：捨入到當月
- `/y`：捨入到當年

**Date Math 運算符 `||` 的使用：**

當固定日期需要搭配日期運算（如捨入）時，必須使用 `||` 連接：

```json
{
  "query": {
    "range": {
      "created_date": {
        "gte": "2024-01-01||/d",  // 使用 || 連接日期和捨入運算
        "lte": "2024-12-31||/d"
      }
    }
  }
}
```

**Date Math 捨入規則：**

| 運算符 | 捨入行為 | 範例 |
|--------|---------|------|
| `gt` | 向上捨入到第一個毫秒（不包含） | `2014-11-18\|\|/M` → `2014-12-01T00:00:00.000Z` |
| `gte` | 向下捨入到第一個毫秒（包含） | `2014-11-18\|\|/M` → `2014-11-01T00:00:00.000Z` |
| `lt` | 向下捨入到最後一個毫秒（不包含） | `2014-11-18\|\|/M` → `2014-10-31T23:59:59.999Z` |
| `lte` | 向上捨入到最後一個毫秒（包含） | `2014-11-18\|\|/M` → `2014-11-30T23:59:59.999Z` |

---

#### format 參數說明

**format 參數的作用：**

- 覆寫欄位 mapping 中定義的日期格式。
- 指定查詢參數（`gte`、`gt`、`lte`、`lt`）的日期格式。

**format 使用規則：**

1. **如果 date 欄位沒有特別指定 format**。
   - 通常可支援多種常見的日期格式。
   - Elasticsearch 會自動嘗試解析。

2. **如果 index mapping 有指定 format**。
   - 查詢參數（`gte`、`lte` 等）必須與 index 的 format 格式相同。
   - 或者在查詢中使用 `format` 參數覆寫。

3. **使用 format 參數時**。
   - 所有查詢參數（`gte`、`gt`、`lte`、`lt`）必須與 `format` 參數指定的格式一致。
   - 格式不一致會導致查詢失敗或結果不符預期。

**範例：**

```json
// Index mapping 定義
{
  "mappings": {
    "properties": {
      "created_date": {
        "type": "date",
        "format": "yyyy-MM-dd'T'HH:mm:ss'Z'"  // 定義格式
      }
    }
  }
}

// ✅ 範例 1：查詢格式與 mapping 完全一致
{
  "query": {
    "range": {
      "created_date": {
        "gte": "2024-01-01T00:00:00Z",
        "lte": "2024-12-31T23:59:59Z"
      }
    }
  }
}

// ❌ 範例 2：查詢格式與 mapping 不一致（只提供年月日）
// 錯誤：格式不符，無法解析
{
  "query": {
    "range": {
      "created_date": {
        "gte": "2024-01-01",
        "lte": "2024-12-31"
      }
    }
  }
}

// ✅ 範例 3：使用 format 參數覆寫 mapping 格式
{
  "query": {
    "range": {
      "created_date": {
        "gte": "2024-01-01",
        "lte": "2024-12-31",
        "format": "yyyy-MM-dd"  // 覆寫 mapping 的格式
      }
    }
  }
}

// ❌ 範例 4：查詢參數格式與 format 參數不一致
// 錯誤：查詢參數的格式與 format 參數不一致
{
  "query": {
    "range": {
      "created_date": {
        "gte": "2024-01-01T00:00:00Z",  // 包含時間
        "lte": "2024-12-31T23:59:59Z",
        "format": "yyyy-MM-dd"  // format 只定義年月日
      }
    }
  }
}
```

---

#### 時區處理

**使用 time_zone 參數：**

```json
{
  "query": {
    "range": {
      "timestamp": {
        "time_zone": "+01:00",
        "gte": "2020-01-01T00:00:00",
        "lte": "now"
      }
    }
  }
}
```

**時區轉換說明：**

- `time_zone` 參數可使用 ISO 8601 UTC offset（如 `+01:00`、`-08:00`）
- 也可使用 IANA 時區 ID（如 `America/Los_Angeles`、`Asia/Taipei`）。
- 範例中 `2020-01-01T00:00:00` 使用 UTC offset `+01:00`，會被轉換為 `2019-12-31T23:00:00 UTC`
- **注意**：`time_zone` 參數不影響 `now` 的值，`now` 永遠是當前系統時間的 UTC

---

#### 缺少的日期元件

當日期格式不完整時，Elasticsearch 會使用以下預設值補齊（年份不會被替換）：

| 元件 | 預設值 |
|------|--------|
| `MONTH_OF_YEAR` | 01 |
| `DAY_OF_MONTH` | 01 |
| `HOUR_OF_DAY` | 23 |
| `MINUTE_OF_HOUR` | 59 |
| `SECOND_OF_MINUTE` | 59 |
| `NANO_OF_SECOND` | 999_999_999 |

**官方文件範例（日期部分）：**

- 如果 format 是 `yyyy-MM`，且 `gt` 值為 `2099-12`。
- Elasticsearch 會轉換為 `2099-12-01T23:59:59.999_999_999Z`。
- 保留提供的年份（2099）和月份（12）。
- 使用預設的日（01）、時（23）、分（59）、秒（59）、奈秒（999_999_999）。

**實際測試結果（時間部分）：**

時間部分的行為與官方文件說明不同，實際測試發現：

**✅ 可以查詢成功的情況：**

```json
{
  "query": {
    "range": {
      "created_date": {
        "gte": "2023-01-15T08",  // 只提供到小時
        "lte": "2023-01-15T08"
      }
    }
  }
}
```

- 可以查詢到 `2023-01-15T08:30:00Z` 的資料。
- 表示 Elasticsearch 會將文件和查詢參數都格式化到相同精度後再比對。

**❌ 查詢不到的情況：**

```json
// 情況 1：使用 gt 和 lte
{
  "query": {
    "range": {
      "joined_date": {
        "gt": "2023-01-15T08",   // 大於（不包含）
        "lte": "2023-01-15T08"
      }
    }
  }
}

// 情況 2：使用 gte 和 lt
{
  "query": {
    "range": {
      "joined_date": {
        "gte": "2023-01-15T08",
        "lt": "2023-01-15T08"   // 小於（不包含）
      }
    }
  }
}
```

- 這兩種情況都查詢不到 `2023-01-15T08:30:00Z`。
- 因為 `gt` 和 `lt` 會排除指定的精度範圍。

**行為推論：**

1. **日期部分**：按照官方文件說明補齊缺少的元件。
2. **時間部分**：會將文件和查詢參數格式化到相同的精度，然後進行比對。
   - 例如：`"2023-01-15T08"` 會將所有 `2023-01-15T08:xx:xx` 的資料視為同一個時間單位。
   - 使用 `gte` 和 `lte` 可以包含整個小時的資料。
   - 使用 `gt` 或 `lt` 會排除該時間單位。

**建議做法：**

為避免因精度問題造成的查詢結果不符預期，建議：

1. **明確指定完整的時間格式**。

   ```json
   {
     "query": {
       "range": {
         "created_date": {
           "gte": "2023-01-15T08:00:00Z",
           "lte": "2023-01-15T08:59:59Z"
         }
       }
     }
   }
   ```

2. **使用 Date Math 捨入功能**。

   ```json
   {
     "query": {
       "range": {
         "created_date": {
           "gte": "2023-01-15T08:00:00Z||/h",  // 捨入到小時開始
           "lte": "2023-01-15T08:59:59Z||/h"   // 捨入到小時結束
         }
       }
     }
   }
   ```

3. **查詢整個時間單位時使用 gte + lte**。

   ```json
   {
     "query": {
       "range": {
         "created_date": {
           "gte": "2023-01-15T08",  // 包含 08:00:00 開始
           "lte": "2023-01-15T08"   // 包含 08:59:59 結束
         }
       }
     }
   }
   ```

---

#### 數值與字串的差異

對 date 欄位使用 range query 時，數值和字串的解析方式不同：

```json
// ❌ 錯誤：數值會被解釋為毫秒時間戳記
{
  "query": {
    "range": {
      "created_date": {
        "gte": 2020  // 被解釋為 1970-01-01T00:00:02.020Z（1970 年之後的 2020 毫秒）
      }
    }
  }
}

// ✅ 正確：字串會根據 format 解析
{
  "query": {
    "range": {
      "created_date": {
        "gte": "2020"  // 被解釋為 2020-01-01T00:00:00.000Z（2020 年）
      }
    }
  }
}
```

**混用數值與字串的陷阱：**

當 `gte`/`gt`/`lte`/`lt` 混用數值和字串時，會產生不同的結果：

```json
// ❌ 錯誤：混用數值和日期格式字串
{
  "query": {
    "range": {
      "created_date": {
        "gte": 2022,              // 數值：被解釋為毫秒
        "lte": "2025-01-01"       // 字串：被解釋為日期格式
      }
    }
  }
}
// 錯誤：字串 "2025-01-01" 無法與數值混用，會被判定格式錯誤

// ✅ 正確：混用數值和純數字字串
{
  "query": {
    "range": {
      "created_date": {
        "gte": 2025,              // 數值：被解釋為毫秒
        "lte": "2025"             // 純數字字串：被解釋為毫秒
      }
    }
  }
}
// 成功：兩者都被當成毫秒時間戳記

// ✅ 正確：統一使用字串
{
  "query": {
    "range": {
      "created_date": {
        "gte": "2022",            // 字串：被解釋為年份
        "lte": "2025-01-01"       // 字串：被解釋為日期
      }
    }
  }
}
```

**重要原則：**

1. **建議統一使用字串格式**，避免數值與字串混用造成的解析問題。
2. 純數字字串（如 `"2025"`）會被當成毫秒時間戳記。
3. 日期格式字串（如 `"2025-01-01"`）會根據 format 解析。
4. 數值永遠被解釋為毫秒時間戳記。

---

### 8. Exists Query - 欄位存在查詢

查詢某欄位是否存在（非 null）。

#### 正向查詢：查詢欄位存在

```json
{
  "query": {
    "exists": {
      "field": "email"
    }
  }
}
```

**測試資料：**

```json
// 文件 1
{ "name": "Alice", "email": "alice@example.com" }
// 文件 2
{ "name": "Bob", "email": null }
// 文件 3
{ "name": "Charlie" }
// 文件 4
{ "name": "David", "email": "" }
// 文件 5
{ "name": "Eve", "email": [] }
```

**查詢結果：**

| 文件 | 是否符合 | 說明 |
|------|---------|------|
| 文件 1 | ✅ | email 欄位存在且有值 |
| 文件 2 | ❌ | email 欄位為 null |
| 文件 3 | ❌ | 沒有 email 欄位 |
| 文件 4 | ✅ | 空字串仍視為存在 |
| 文件 5 | ❌ | 空陣列視為不存在 |

---

#### 反向查詢：查詢欄位不存在

使用 `must_not` 搭配 `exists` 來查詢欄位不存在的文件。

```json
{
  "query": {
    "bool": {
      "must_not": {
        "exists": {
          "field": "email"
        }
      }
    }
  }
}
```

#### 特殊情況說明

在某些情況下，即使原始 JSON 文件中有該欄位的值，exists query 仍會判定為「不存在」：

1. **`index: false` 和 `doc_values: false`**：
   - `index: false`：欄位不會被索引，無法用於搜尋查詢。
   - `doc_values: false`：欄位不會儲存 doc values，無法用於排序、彙總或腳本存取。
   - 當兩者都設為 `false` 時，exists query 會認為該欄位不存在。

2. **超過 `ignore_above` 設定**：keyword 類型欄位值的長度超過 mapping 中設定的 `ignore_above` 限制，該值不會被索引。

   ```json
   // Mapping 設定 ignore_above: 10
   { "tags": "this_is_too_long" }  // 長度 15，不會被索引
   ```

3. **`ignore_malformed` 且格式錯誤**：當欄位類型為數值、日期等，但寫入的資料格式錯誤時，若 mapping 中設定了 `ignore_malformed: true`，該值會被忽略不索引。

   ```json
   // Mapping 設定 price 為 integer 類型，且 ignore_malformed: true
   { "price": "not_a_number" }  // 格式錯誤，不會被索引，但文件寫入成功
   ```

這些設定主要用於提升資料處理的容錯性，但需要注意會影響 exists query 的查詢結果。

---

### 9. Prefix Query - 前綴查詢

查詢以特定字串開頭的文件。

```json
{
  "query": {
    "prefix": {
      "username": {
        "value": "admin"
      }
    }
  }
}
```

**參數說明：**

- `value`：前綴字串。
- `boost`：調整相關性分數權重。
- `case_insensitive`：是否忽略大小寫，預設為 `false`。
- `rewrite`：查詢重寫方法，用於最佳化效能。當前綴匹配到大量詞彙時，可透過此參數控制如何處理匹配結果。常用值包括 `constant_score`（預設，所有匹配給予相同分數）、`top_terms_N`（只取前 N 個詞彙）等。詳細說明請參考[官方文件](https://www.elastic.co/docs/reference/query-languages/query-dsl/query-dsl-multi-term-rewrite)。

**測試資料：**

```json
// 文件 1
{ "username": "admin123" }

// 文件 2
{ "username": "administrator" }

// 文件 3
{ "username": "user456" }
```

**查詢結果：**

| 文件 | 是否符合 | 說明 |
|------|---------|------|
| 文件 1 | ✅ | 以 "admin" 開頭 |
| 文件 2 | ✅ | 以 "admin" 開頭 |
| 文件 3 | ❌ | 不是以 "admin" 開頭 |

---

### 10. Wildcard Query - 萬用字元查詢

使用 `*` 和 `?` 進行模糊查詢（效能較差，謹慎使用）。

```json
{
  "query": {
    "wildcard": {
      "username": {
        "value": "ad*n?",
        "case_insensitive": true
      }
    }
  }
}
```

**萬用字元說明：**

- `*`：符合零個或多個字元。
- `?`：符合單一字元。

**參數說明：**

- `value`：包含萬用字元的查詢字串。
- `wildcard`：`value` 的別名，功能相同。當兩者同時存在時，以最後出現的參數為準。
- `boost`：調整相關性分數權重。
- `case_insensitive`：是否忽略大小寫，預設為 `false`。
- `rewrite`：查詢重寫方法。

---

#### `wildcard` 與 `value` 參數比較

**測試資料：**

```json
// 文件 1
{ "username": "admin" }
// 文件 2
{ "username": "administrator" }
// 文件 3
{ "username": "admins" }
// 文件 4
{ "username": "user456" }
```

**查詢範例：同時使用 `wildcard` 和 `value`**

```json
{
  "query": {
    "wildcard": {
      "username": {
        "wildcard": "admin",
        "value": "ad*n?"
      }
    }
  }
}
```

**參數說明：**

- `wildcard: "admin"`：會精確匹配 "admin"。
- `value: "ad*n?"`：會匹配 "ad" 開頭 + 零個或多個字元 + "n" + 單一字元。

**查詢結果（使用 `value: "ad*n?"` 因為它在後面）：**

| 文件 | 是否符合 | 說明 |
|------|---------|------|
| 文件 1 | ❌ | "admin" 只有 5 個字元，不符合 "ad*n?" 模式（需要 n 後面還有一個字元）|
| 文件 2 | ✅ | "administrator" 符合 "ad*n?" 模式 |
| 文件 3 | ✅ | "admins" 符合 "ad*n?" 模式 |
| 文件 4 | ❌ | 不是以 "ad" 開頭 |

**如果 `wildcard` 在後面：**

```json
{
  "query": {
    "wildcard": {
      "username": {
        "value": "ad*n?",
        "wildcard": "admin"
      }
    }
  }
}
```

**查詢結果（使用 `wildcard: "admin"` 因為它在後面）：**

| 文件 | 是否符合 | 說明 |
|------|---------|------|
| 文件 1 | ✅ | 精確匹配 "admin" |
| 文件 2 | ❌ | 不是精確匹配 "admin" |
| 文件 3 | ❌ | 不是精確匹配 "admin" |
| 文件 4 | ❌ | 不是精確匹配 "admin" |

---

**效能注意事項：**

- 避免使用前導萬用字元（如 `*term` 或 `?term`），會導致全表掃描。
- 萬用字元查詢沒有快取機制，效能較差。

---

### 11. Regexp Query - 正規表達式查詢

使用正規表達式進行複雜符合（效能最差，請謹慎使用）。

```json
{
  "query": {
    "regexp": {
      "phone": {
        "value": "09[0-9]{8}"
      }
    }
  }
}
```

**參數說明：**

- `value`：正規表達式模式。
- `flags`：正規表達式旗標（如 `COMPLEMENT`、`INTERVAL`），用於啟用額外的運算子。
- `case_insensitive`：是否忽略大小寫，預設為 `false`。
- `max_determinized_states`：最大狀態數，預設為 `10000`。此參數用於限制正規表達式引擎的複雜度，防止過於複雜的正規表達式導致效能問題或記憶體耗盡。當正規表達式過於複雜時會拋出例外。
- `rewrite`：查詢重寫方法。

**測試資料：**

```json
// 文件 1
{ "phone": "0912345678" }
// 文件 2
{ "phone": "0987654321" }
// 文件 3
{ "phone": "02-12345678" }
```

**查詢結果（查詢 "09[0-9]{8}"）：**

| 文件 | 是否符合 | 說明 |
|------|---------|------|
| 文件 1 | ✅ | 符合 09 開頭 + 8 位數字 |
| 文件 2 | ✅ | 符合 09 開頭 + 8 位數字 |
| 文件 3 | ❌ | 格式不符合 |

---

#### Flags 參數說明與範例

`flags` 參數用於啟用 Lucene 正規表達式引擎的額外運算子。以下使用同一組測試資料展示不同 flag 的效果。

**注意**：這些符號（`~`、`#`、`<>`、`&`、`@`）是 Lucene 特有的擴充，不是通用的正規表達式標準語法。

**測試資料：**

```json
// 文件 1
{ "code": "abc123" }
// 文件 2
{ "code": "abc456" }
// 文件 3
{ "code": "xyz789" }
// 文件 4
{ "code": "def123" }
// 文件 5
{ "code": "abc" }
```

---

**1. COMPLEMENT - 否定模式**

使用 `~` 運算子來否定後續的模式。

```json
{
  "query": {
    "regexp": {
      "code": {
        "value": "abc~123",
        "flags": "COMPLEMENT"
      }
    }
  }
}
```

**查詢結果：**

| 文件 | 是否符合 | 說明 |
|------|---------|------|
| 文件 1 | ❌ | "abc123" 包含被否定的 "123" |
| 文件 2 | ✅ | "abc456" 符合 "abc" 後面不是 "123" |
| 文件 3 | ❌ | 不是 "abc" 開頭 |
| 文件 4 | ❌ | 不是 "abc" 開頭 |
| 文件 5 | ✅ | "abc" 後面沒有 "123" |

**text 欄位使用注意事項：**

在 text 欄位使用 `~` 否定時需要特別注意分詞的影響。例如：

```json
// 假設 name 欄位為 text 類型
// 資料：{ "name": "Wing Chou" }

// 查詢
{
  "query": {
    "regexp": {
      "name": {
        "value": "~(wing)",
        "flags": "COMPLEMENT"
      }
    }
  }
}
```

乍看之下會以為此查詢會排除 "Wing Chou"，但實際上：

- "Wing Chou" 經過分詞後變成 `["wing", "chou"]`。
- `~(wing)` 會否定 "wing"，但 "chou" 仍然符合。
- 因此 "Wing Chou" 這筆資料還是會出現在查詢結果中。

建議在 keyword 欄位使用否定運算子，避免分詞帶來的非預期結果。

---

**2. INTERVAL - 數值範圍**

使用 `<>` 運算子來匹配數值範圍。

```json
{
  "query": {
    "regexp": {
      "code": {
        "value": "abc<100-200>",
        "flags": "INTERVAL"
      }
    }
  }
}
```

**查詢結果：**

| 文件 | 是否符合 | 說明 |
|------|---------|------|
| 文件 1 | ✅ | "abc123" 符合 abc + 100-200 範圍內的數字 |
| 文件 2 | ❌ | "abc456" 的 456 超出範圍 |
| 文件 3 | ❌ | 不是 "abc" 開頭 |
| 文件 4 | ❌ | 不是 "abc" 開頭 |
| 文件 5 | ❌ | "abc" 後面沒有數字 |

---

**3. INTERSECTION - AND 運算**

使用 `&` 運算子來匹配同時符合兩個模式的字串。

```json
{
  "query": {
    "regexp": {
      "code": {
        "value": "abc.+&.+123",
        "flags": "INTERSECTION"
      }
    }
  }
}
```

**查詢結果：**

| 文件 | 是否符合 | 說明 |
|------|---------|------|
| 文件 1 | ✅ | "abc123" 同時符合 "abc 開頭" 和 "123 結尾" |
| 文件 2 | ❌ | "abc456" 不符合 "123 結尾" |
| 文件 3 | ❌ | "xyz789" 不符合 "abc 開頭" |
| 文件 4 | ❌ | "def123" 不符合 "abc 開頭" |
| 文件 5 | ❌ | "abc" 不符合 "123 結尾" |

---

**4. ANYSTRING - 匹配任意字串**

使用 `@` 運算子來匹配任意整個字串。

**官方範例（搭配排除邏輯）：**

```json
{
  "query": {
    "regexp": {
      "code": {
        "value": "@&~(abc.+)",
        "flags": "ANYSTRING|INTERSECTION|COMPLEMENT"
      }
    }
  }
}
```

此範例會匹配所有不是以 "abc" 開頭的字串。

**注意**：我無法理解 `@&~(abc.+)` 和單純使用 `~(abc.+)` 的實際差異，若有需要使用此運算子，建議參考官方文件或進行實際測試確認行為。

---

**5. EMPTY - 不匹配任何字串**

使用 `#` 運算子來表示「不匹配任何字串」，連空字串都不匹配。

**與空字串的差異：**

```json
// 空字串會匹配空白資料
// ✅ 會匹配 code 欄位為空字串的資料
{
  "query": {
    "regexp": {
      "code": {
        "value": ""
      }
    }
  }
}

// # 不匹配任何資料
// ❌ 不會匹配任何資料（包括空字串）
{
  "query": {
    "regexp": {
      "code": {
        "value": "#",
        "flags": "EMPTY"
      }
    }
  }
}
```

**實際應用場景（.NET 範例）：**

主要用於程式動態組合正規表達式時，避免在沒有查詢條件的情況下意外匹配到空字串資料。

```csharp
// .NET 動態組合查詢條件範例
List<string> conditions = new();

if (searchByAbc) {
    conditions.Add("abc.*");
}

if (searchByXyz) {
    conditions.Add("xyz.*");
}

// 使用 # 避免無條件時匹配空字串
string pattern = conditions.Count > 0 
    ? string.Join("|", conditions)  // "abc.*|xyz.*"
    : "#";                          // 確保不匹配任何資料

SearchRequest searchRequest = new() {
    Query = new RegexpQuery {
        Field = "code",
        Value = pattern,
        Flags = conditions.Count > 0 ? "ALL" : "EMPTY"
    }
};
```

**注意事項：**

`#` 是 Lucene 的特殊運算子，不能用來匹配字面上的 "#" 字元。

```json
// ❌ 錯誤：無法用來查詢包含 "#" 字元的資料
// 查詢資料 { "code": "#" } → 查不到
{
  "query": {
    "regexp": {
      "code": {
        "value": "#",
        "flags": "EMPTY"
      }
    }
  }
}

// ❌ 錯誤：無法用來查詢包含 "#" 字元的資料
// 查詢資料 { "code": "#1" } → 查不到
{
  "query": {
    "regexp": {
      "code": {
        "value": "#1",
        "flags": "EMPTY"
      }
    }
  }
}
```

如需匹配字面上的 "#" 字元，需要使用反斜線跳脫（詳見下方「特殊字元跳脫」章節）。

---

**6. 組合多個 Flags**

可以使用 `|` 分隔符號同時啟用多個運算子。

```json
{
  "query": {
    "regexp": {
      "code": {
        "value": "abc<100-500>",
        "flags": "COMPLEMENT|INTERVAL"
      }
    }
  }
}
```

**Flags 支援選項：**

- `ALL`（預設）：啟用所有選用運算子。
- `NONE`：停用所有選用運算子。
- `COMPLEMENT`：啟用 `~` 否定運算子。
- `INTERVAL`：啟用 `<>` 範圍運算子。
- `INTERSECTION`：啟用 `&` AND 運算子。
- `ANYSTRING`：啟用 `@` 任意字串運算子。
- `EMPTY`：啟用 `#` 空白語言運算子（不匹配任何字串）。

---

#### 特殊字元跳脫

Lucene 正規表達式引擎中，以下字元具有特殊意義，若要作為普通字元使用，需要使用反斜線 `\` 跳脫：

**保留字元：**

```text
. ? + * | { } [ ] ( ) " \ #
```

**跳脫範例：**

```json
// ❌ 錯誤：+ 是特殊字元
// 查詢資料 { "phone": "+886912345678" } → 查不到
{
  "query": {
    "regexp": {
      "phone": {
        "value": "+886.*"
      }
    }
  }
}

// ✅ 正確：使用反斜線跳脫
// 查詢資料 { "phone": "+886912345678" } → 可以找到
{
  "query": {
    "regexp": {
      "phone": {
        "value": "\\+886.*"
      }
    }
  }
}
```

**注意事項：**

因為反斜線在 JSON 字串中本身也需要跳脫，所以在 JSON 查詢中需要使用雙反斜線 `\\`。

```json
// JSON 中需要寫成 "\\" 才能表示一個反斜線
{ "value": "\\+886.*" }  // 實際正規表達式為 "\+886.*"
```

---

#### 錨點運算子限制

> Lucene's regular expression engine does not support anchor operators, such as `^` (beginning of line) or `$` (end of line). To match a term, the regular expression must match the entire string.

Lucene 的正規表達式引擎**不支援錨點運算子**，例如 `^`（行首）或 `$`（行尾）。若要匹配某個詞彙，正規表達式必須匹配整個字串。

這意味著：

- `^` 和 `$` 不具有錨點的特殊意義。
- 正規表達式預設會匹配整個欄位值（等同於已經有錨點效果）。
- 經測試，`^` 和 `$` 應該是被當作普通字元處理，而非錨點運算子（使用時會查不到資料）。

**範例：**

```json
// ✅ 正確：直接匹配模式
{ "value": "abc.*" }      // 匹配以 abc 開頭的完整字串

// ❌ 不建議：查不到 abc 的資料，推測應該嘗試去匹配 ^abc 和 abc$
{ "value": "^abc" }
{ "value": "abc$" }
```

---

**效能注意事項：**

- 正規表達式查詢效能極差，應盡量避免使用。
- 考慮使用其他查詢方式（如 `prefix`、`wildcard`）替代。
- 如果必須使用，請限制查詢範圍並設定合理的 `max_determinized_states`。
- 避免使用過於複雜的正規表達式，以防觸發 `max_determinized_states` 限制。

---

### 13. Fuzzy Query - 模糊查詢

容錯查詢,允許拼字錯誤。可用於 **text** 和 **keyword** 欄位。

**text 欄位範例：**

```json
{
  "query": {
    "fuzzy": {
      "name": {
        "value": "wing",
        "fuzziness": "AUTO"
      }
    }
  }
}
```

**效果**：查詢與 `wing` 編輯距離在允許範圍內的詞項。

**範例：**

- `wing` ✓（完全符合查詢詞）。
- `wang` ✓（差 1 個字元 a）。
- `weng` ✓（差 1 個字元 e）。
- `king` ✗（差異太大）。

**注意**：因為 text 欄位會經過分析器處理（分詞、轉小寫），所以：

- 索引：`Wing Chou` → 分詞後成為 `[wing, chou]`。
- 查詢：`wing` → 可以匹配到 `wing` 這個詞項。

---

**參數說明：**

- `value`：要查詢的詞彙（必填）。
- `fuzziness`：允許的編輯距離（`AUTO`、`0`、`1`、`2`），建議使用 `AUTO`。
  - `AUTO`：根據詞長自動決定編輯距離。
  - `0`：不允許任何錯誤（等同於 term 查詢）。
  - `1`：允許 1 個字元差異。
  - `2`：允許 2 個字元差異。
- `prefix_length`：前 N 個字元必須完全符合，預設為 `0`。
- `max_expansions`：最多擴展幾個候選詞，預設為 `50`。
- `transpositions`：是否允許相鄰字元對調（如 ab → ba），預設為 `true`。

---

**完整範例：**

```json
{
  "query": {
    "fuzzy": {
      "title": {
        "value": "quikc",
        "fuzziness": "AUTO",
        "prefix_length": 2,
        "max_expansions": 10,
        "transpositions": true
      }
    }
  }
}
```

**參數效果：**

**prefix_length = 2（前 2 個字元必須符合）：**

- `quick` ✓（qu 開頭，符合前綴）。
- `quikc` ✓（qu 開頭，符合前綴）。
- `xuick` ✗（xu 開頭，不符合前綴 qu）。

**max_expansions = 10（最多擴展 10 個候選詞）：**

假設索引中有 20+ 個相似詞（`quick`、`quit`、`quiz`、`quiet`、`quiche`...），Elasticsearch 只會取前 10 個候選詞進行搜尋，其餘忽略。

**用途**：限制擴展數量可提升查詢效能，避免過多候選詞消耗資源。

**transpositions = true（允許相鄰字元對調）：**

- `qiuck` ✓（ui ↔ iu，對調算 1 次編輯）。
- `qukic` ✓（ki ↔ ik，對調算 1 次編輯）。

**transpositions = false（不允許對調）：**

```json
{
  "query": {
    "fuzzy": {
      "title": {
        "value": "qiuck",
        "fuzziness": 1,
        "transpositions": false
      }
    }
  }
}
```

- `qiuck` ✗（ui ↔ iu 不被允許，需要 2 次編輯：刪除 i、插入 u）。
- `quick` ✓（只需 1 次編輯：替換 i → u）。

---

**keyword 欄位範例：**

```json
{
  "query": {
    "fuzzy": {
      "name.keyword": {
        "value": "Wing Chow",
        "fuzziness": "AUTO"
      }
    }
  }
}
```

**效果**：對完整的 keyword 值進行模糊匹配。

**範例：**

- `Wing Chou` ✓（差 1 個字元 w → u）。
- `Wing Chow` ✓（完全符合查詢詞）。
- `Wing Zhou` ✓（差 2 個字元）。
- `John Wang` ✗（差異太大）。

---

**使用建議：**

**對於 text 欄位：**

- **建議**使用 `match` 查詢搭配 `fuzziness` 參數，而非直接使用 `fuzzy` 查詢。
- **原因**：`match` 查詢會經過分析器處理（分詞、轉小寫等），更符合實際搜尋需求。

**範例對比：**

**情境：索引中有文件 name = "Wing Chou"（text 欄位）**

→ 經過分析器處理後，索引中的詞項是：`["wing", "chou"]`（已轉小寫、已分詞）

---

**範例 1：fuzziness = 0（必須完全符合）**

```json
// 不建議：直接使用 fuzzy（text 欄位）
{
  "query": {
    "fuzzy": {
      "name": {
        "value": "Wing",  // 不會經過分析器，直接用 "Wing" 比對
        "fuzziness": 0
      }
    }
  }
}
```

- 查詢詞項：`Wing`（大寫 W）。
- 索引詞項：`wing`（小寫 w）。
- fuzziness = 0 表示必須**完全符合**。
- 結果：**✗ 找不到**（`Wing` ≠ `wing`，大小寫不同）。

```json
// 建議：使用 match（text 欄位）
{
  "query": {
    "match": {
      "name": {
        "query": "Wing",  // 會經過分析器處理，轉成 "wing"
        "fuzziness": 0
      }
    }
  }
}
```

- 查詢詞項：`Wing` → 經過分析器 → `wing`（小寫）。
- 索引詞項：`wing`（小寫）。
- fuzziness = 0 表示必須**完全符合**。
- 結果：**✓ 找得到**（完全符合）。

---

**範例 2：fuzziness = 1（允許 1 個字元差異）**

```json
// 不建議：直接使用 fuzzy（text 欄位）
{
  "query": {
    "fuzzy": {
      "name": {
        "value": "wing chuo",  // 不會分詞，查詢 "wing chuo" 這個完整詞項
        "fuzziness": 1
      }
    }
  }
}
```

- 查詢詞項：`wing chuo`（完整字串）。
- 索引詞項：`wing`、`chou`（已分詞）。
- 結果：**✗ 找不到**（索引中沒有 "wing chuo" 這個完整詞項）。

```json
// 建議：使用 match + fuzziness（text 欄位）
{
  "query": {
    "match": {
      "name": {
        "query": "wing chuo",  // 會分詞成 ["wing", "chuo"]，並對每個詞進行模糊匹配
        "fuzziness": 1
      }
    }
  }
}
```

- 查詢詞項：`wing chuo` → 經過分析器 → `["wing", "chuo"]`。
- 索引詞項：`wing`、`chou`。
- 結果：**✓ 找得到**（`wing` 完全符合，`chuo` 與 `chou` 差 1 個字元）。

**對於 keyword 欄位：**

- 可以直接使用 `fuzzy` 查詢。
- 因為 keyword 欄位本身就不經過分析器，直接對完整值進行模糊匹配是合理的。

**使用時機總結：**

- **text 欄位**：優先使用 `match` + `fuzziness`。
- **keyword 欄位**：可以使用 `fuzzy` 查詢。
- **需要對詞項直接匹配**（不需分析）：使用 `fuzzy` 查詢。

---

**編輯距離說明：**

編輯距離（Levenshtein Distance）是指將一個字串轉換成另一個字串所需的最少操作次數。允許的操作包括：

- **插入**一個字元：`quic` → `quick`（插入 k）。
- **刪除**一個字元：`quickk` → `quick`（刪除 k）。
- **替換**一個字元：`quikc` → `quick`（替換 k → c）。
- **對調**相鄰字元（需要 `transpositions = true`）：`qiuck` → `quick`（對調 iu）。

詳細的 `fuzziness` 參數說明請參考「Match Query」章節。

### 14. IDs Query - 根據文件 ID 查詢

直接根據文件 `_id` 查詢。

```json
{
  "query": {
    "ids": {
      "values": ["1", "2", "3"]
    }
  }
}
```

**使用場景：**

- 根據已知的文件 ID 查詢。
- 批次查詢特定文件。
- 與其他查詢組合使用。

---

### 15. Nested Query - 巢狀物件查詢

用於查詢 **nested 型別**的欄位。**只能用於 nested 型別，不能用於 object 型別。** 可以保留陣列元素內部欄位的關聯性。

**Mapping 定義：**

```json
{
  "mappings": {
    "properties": {
      "title": { "type": "text" },
      "comments": {
        "type": "nested",
        "properties": {
          "author": { "type": "keyword" },
          "rating": { "type": "integer" },
          "text": { "type": "text" }
        }
      }
    }
  }
}
```

**基本查詢：**

```json
{
  "query": {
    "nested": {
      "path": "comments",
      "query": {
        "bool": {
          "must": [
            { "match": { "comments.author": "John" }},
            { "range": { "comments.rating": { "gte": 4 }}}
          ]
        }
      }
    }
  }
}
```

**參數說明：**

- `path`：巢狀物件的路徑（必填）。
- `query`：在巢狀物件中執行的查詢（必填）。
- `score_mode`：如何計算巢狀物件的分數，預設為 `avg`。
  - `avg`：平均分數（預設）。
  - `sum`：總和。
  - `max`：最高分。
  - `min`：最低分。
  - `none`：不計算分數（設為 0）。
- `ignore_unmapped`：如果欄位不存在，是否忽略錯誤，預設為 `false`。

**測試資料：**

```json
// 文件 1
{
  "title": "Product A",
  "comments": [
    { "author": "John", "rating": 5, "text": "Great!" },
    { "author": "Jane", "rating": 3, "text": "OK" }
  ]
}

// 文件 2
{
  "title": "Product B",
  "comments": [
    { "author": "John", "rating": 2, "text": "Poor" },
    { "author": "Bob", "rating": 5, "text": "Excellent" }
  ]
}
```

**查詢結果（author = "John" AND rating >= 4）：**

| 文件 | 是否符合 | 說明 |
|------|---------|------|
| 文件 1 | ✅ | John 的評分是 5 (>= 4) |
| 文件 2 | ❌ | John 的評分是 2 (< 4) |

---

**為什麼需要 Nested Query？**

**問題：object 型別會扁平化陣列**

如果 `comments` 是 object 型別（預設），Elasticsearch 會將陣列扁平化，**失去元素之間的關聯性**：

```json
// 原始資料
{
  "title": "Product A",
  "comments": [
    { "author": "John", "rating": 5 },
    { "author": "Jane", "rating": 3 }
  ]
}

// 扁平化後（失去關聯）
{
  "title": "Product A",
  "comments.author": ["John", "Jane"],
  "comments.rating": [5, 3]
}
```

**範例：錯誤的查詢結果（使用 object 型別）**

查詢「John 給 3 分」的產品：

```json
{
  "query": {
    "bool": {
      "must": [
        { "term": { "comments.author": "John" }},
        { "term": { "comments.rating": 3 }}
      ]
    }
  }
}
```

結果：**✓ 會找到文件 1**（❌ 但這是錯的！John 給的是 5 分，不是 3 分）

**原因**：Elasticsearch 只知道 `author` 有 "John"，`rating` 有 3，但不知道「John 對應的是 5 分」。

---

**解決方法：使用 nested 型別 + nested 查詢**

將 `comments` 定義為 nested 型別，Elasticsearch 會在內部將每個陣列元素儲存為獨立的子文件（但對使用者來說仍是一筆資料）：

```json
// 你看到的：一筆文件
{
  "title": "Product A",
  "comments": [
    { "author": "John", "rating": 5 },
    { "author": "Jane", "rating": 3 }
  ]
}

// Elasticsearch 內部儲存結構（隱藏的，使用者看不到）：
// ├─ 主文件：{ "title": "Product A" }
// ├─ 子文件 1：{ "author": "John", "rating": 5 }
// └─ 子文件 2：{ "author": "Jane", "rating": 3 }
```

**重點：**

- 對你來說還是**一筆文件**。
- Elasticsearch 內部會自動處理子文件的關聯。
- 查詢時使用 nested 查詢，可以確保在「同一個子文件內」匹配條件。

查詢「John 給 3 分」的產品：

```json
{
  "query": {
    "nested": {
      "path": "comments",
      "query": {
        "bool": {
          "must": [
            { "term": { "comments.author": "John" }},
            { "term": { "comments.rating": 3 }}
          ]
        }
      }
    }
  }
}
```

結果：**✗ 找不到**（✓ 正確！John 給的是 5 分，不是 3 分）

---

**score_mode 參數範例：**

當一個文件有多個巢狀物件符合查詢時，`score_mode` 決定如何計算該文件的最終分數。

**測試資料：**

```json
// 文件 1
{
  "title": "Product A",
  "comments": [
    { "author": "Alice", "rating": 5, "text": "Excellent" },
    { "author": "Bob", "rating": 4, "text": "Good" },
    { "author": "Charlie", "rating": 3, "text": "Average" }
  ]
}

// 文件 2
{
  "title": "Product B",
  "comments": [
    { "author": "David", "rating": 5, "text": "Perfect" }
  ]
}
```

**查詢：**

```json
{
  "query": {
    "nested": {
      "path": "comments",
      "score_mode": "max",
      "query": {
        "range": { "comments.rating": { "gte": 3 }}
      }
    }
  }
}
```

**結果對比（假設每個匹配的 comment 評分為 1.0）：**

| 文件 | 匹配的 comment 數 | max | avg | sum | min |
|------|-----------------|-----|-----|-----|-----|
| 文件 1 | 3 個 | 1.0 | 1.0 | 3.0 | 1.0 |
| 文件 2 | 1 個 | 1.0 | 1.0 | 1.0 | 1.0 |

**說明：**

- 使用 `sum` 時，文件 1 的分數會更高（因為有 3 個匹配的 comment）。
- 使用 `max` 或 `avg` 時，兩個文件分數相同。
- 這會影響排序結果。

**用途：**

- 使用 `sum` 可以讓「符合條件的 comment 越多」的文件排序越前面。
- 使用 `max` 則只看「最相關的那個 comment」。

---

**進階：使用 inner_hits 取得匹配的巢狀物件**

有時候你不只想知道「哪個文件符合」，還想知道「文件中的哪個巢狀物件符合」。

```json
{
  "query": {
    "nested": {
      "path": "comments",
      "query": {
        "bool": {
          "must": [
            { "term": { "comments.author": "John" }},
            { "range": { "comments.rating": { "gte": 4 }}}
          ]
        }
      },
      "inner_hits": {}
    }
  }
}
```

**說明：**

- `inner_hits` 是一個物件型別的參數。
- 使用空物件 `{}` 表示採用預設設定。
- `inner_hits` 支援多種參數（如 `size`、`from`、`_source` 等），但不在本次筆記範圍內。

**回傳結果：**

```json
{
  "hits": {
    "hits": [
      {
        "_source": {
          "title": "Product A",
          "comments": [
            { "author": "John", "rating": 5, "text": "Great!" },
            { "author": "Jane", "rating": 3, "text": "OK" }
          ]
        },
        "inner_hits": {
          "comments": {
            "hits": {
              "hits": [
                {
                  "_source": {
                    "author": "John",
                    "rating": 5,
                    "text": "Great!"
                  }
                }
              ]
            }
          }
        }
      }
    ]
  }
}
```

**用途**：可以清楚看到**具體是哪個 comment 符合條件**，而不是整個 comments 陣列。

---

**object vs nested 快速比較：**

| 特性 | object（預設） | nested |
|------|---------------|--------|
| **陣列處理** | 扁平化（失去關聯） | 保持獨立（維持關聯） |
| **查詢方式** | 一般查詢（match, term, bool...） | 必須用 nested 查詢 |
| **適用情境** | 單一物件或不需關聯的陣列 | 需要保持陣列元素關聯性 |
| **效能** | 較好 | 較差（有額外開銷） |

---

**使用建議：**

**使用 nested 當：**

- 欄位是**陣列**。
- 需要在「同一個陣列元素內」查詢多個條件。
- 需要保持陣列元素之間的關聯性。

**範例情境：**

- 訂單的商品列表（商品名稱 + 價格必須對應）。
- 員工的專案經驗（專案名稱 + 角色必須對應）。
- 產品的評論（評論者 + 評分必須對應）。

**使用 object 當：**

- 欄位不是陣列。
- 陣列元素之間不需要保持關聯性。
- 追求更好的查詢效能。

---

## 異動歷程

- 2025-11-04 初版文件建立。
