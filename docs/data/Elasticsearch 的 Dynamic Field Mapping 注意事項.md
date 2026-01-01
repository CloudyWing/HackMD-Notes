---
title: "Elasticsearch 的 Dynamic Field Mapping 注意事項"
date: 2025-10-04
lastmod: 2025-10-04
description: "提醒在生產環境中應避免過度依賴 Elasticsearch 的 Dynamic Mapping。分析自動對應可能導致的儲存空間浪費 (text + keyword) 及 Mapping Explosion 問題，建議明確定義 Schema。"
tags: ["Elastic Stack","Elasticsearch"]
---

# Elasticsearch 的 Dynamic Field Mapping 注意事項

在今年底前，我估計都會和 Elasticsearch 死磕，除非寫膩了，才會找其他比較簡單的東西來寫，不過應該也不會花太多時間，因為 9 月的減重效果不如前兩個月，可能會再多增加運動的時間。

## 動態欄位對應的誤區

一直以來我都對關聯式資料庫需要預先建立 Schema，而 NoSQL 則不需要建立 Schema、可以動態儲存資料有刻板印象，結果在剛接觸 Elasticsearch 就翻車了。

首先 Elasticsearch 雖然支援動態對應(Dynamic Mapping)，但實際上並**不建議**在正式環境中這樣做。實際原因如下：

### 1. 字串型別會造成儲存空間膨脹

當使用動態對應時，字串型別預設會同時儲存成 `text` 型別和 `keyword` 型別的子欄位。

`text` 型別會進行分詞和建立倒排索引，而 `keyword` 型別會儲存完整字串用於精確比對、排序和聚合。這種雙重索引會大幅增加儲存空間的使用。

當然，如果儲存空間充足，使用 multi-fields 將同一個欄位以多種型別分別索引，以因應不同的查詢需求，也是一種常見的應用技巧。這是一種以儲存空間換取功能性彈性的設計，具體可以參考 [Multi-fields](https://www.elastic.co/guide/en/elasticsearch/reference/current/multi-fields.html)。

### 2. 並非所有功能都支援動態對應

不是全部的型別都能透過動態對應自動處理。例如：

* **地理位置欄位**：
    如果想要使用 `geo_point` 或 `geo_shape` 相關的地理查詢 API，必須預先在 mapping 中定義。即使你存入了符合地理位置結構的 JSON 資料(如 `{"lat": 25.03, "lon": 121.56}`)，如果沒有預先定義為 `geo_point` 型別，Elasticsearch 只會將其視為普通的 `object`，無法使用 `geo_distance` 之類的地理查詢功能。

* **巢狀物件(Nested)**：
    如果需要對陣列中的物件進行獨立查詢，必須使用 `nested` 型別。動態對應只會將其建立為 `object` 型別，導致陣列中的物件欄位會被扁平化，無法正確查詢。

* **自訂分析器**：
    如果需要特定的文字分析方式(如中文分詞、同義詞處理等)，必須在 mapping 中明確指定 analyzer，動態對應只會使用預設的 standard analyzer。

相關資訊可參考 [Field data types](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-types.html)。

### 3. Mapping Explosion 的風險

Elasticsearch 官方文件特別警告了 [Mapping explosion](https://www.elastic.co/docs/troubleshoot/elasticsearch/mapping-explosion) 的問題。如果使用動態對應，且資料來源包含大量不同的欄位名稱(例如：使用者自訂欄位、動態產生的 key)，可能會導致：

* Index 中的欄位數量爆炸性成長。
* 記憶體使用量大幅增加。

預設情況下，一個 index 最多只能有 1000 個欄位，超過後會拒絕新增文件。

### 4. 官方建議使用明確對應

Elasticsearch 官方文件建議使用明確對應(Explicit mapping)來為每個欄位指定資料型別。這是正式環境的推薦作法，因為你可以完全控制資料如何被索引以符合特定使用情境。相關說明可參考 [Mapping](https://www.elastic.co/docs/manage-data/data-store/mapping)。

## Dynamic Mapping 的型別對應規則

以下是 Elasticsearch 在不同 `dynamic` 設定下的型別對應表，詳細說明可參考 [Dynamic field mapping](https://www.elastic.co/docs/manage-data/data-store/mapping/dynamic-field-mapping)：

| **JSON 資料型別** | **Elasticsearch 型別** (`"dynamic":"true"`) | **Elasticsearch 型別** (`"dynamic":"runtime"`) |
|---|---|---|
| `null` | 不新增欄位 | 不新增欄位 |
| `true` 或 `false` | `boolean` | `boolean` |
| `double` | `float` | `double` |
| `long` | `long` | `long` |
| `object` | `object` | 不新增欄位 |
| `array` | 取決於陣列中第一個非 `null` 值 | 取決於陣列中第一個非 `null` 值 |
| 通過日期檢測的 `string` | `date` | `date` |
| 通過數字檢測的 `string` | `float` 或 `long` | `double` 或 `long` |
| 未通過 `date` 或 `numeric` 檢測的 `string` | `text` 並帶有 `.keyword` 子欄位 | `keyword` |

## Dynamic 參數的設定選項

`dynamic` 參數控制是否動態新增欄位，接受以下參數：

**`true`** (預設值)

新欄位會自動加入到 mapping 中。適合開發階段快速測試，但不建議用於正式環境。

**`runtime`**

新欄位會以 runtime fields 的形式加入 mapping。這些欄位不會被索引，而是在查詢時從 `_source` 載入並即時計算。優點是不佔用索引空間，缺點是查詢效能較差，適合不常查詢但偶爾需要的欄位。

**`false`**

新欄位會被忽略。這些欄位不會被索引或可搜尋，但仍會出現在回傳結果的 `_source` 欄位中。這些欄位不會被加入 mapping，必須手動明確新增。這個設定可以避免 mapping explosion，同時保留原始資料的完整性。

**`strict`**

如果偵測到新欄位，會拋出例外並拒絕該文件。新欄位必須明確加入 mapping 才能使用。這是最嚴格的設定，適合需要嚴格控制資料結構的場景。

更詳細的說明可參考 [Dynamic mapping](https://www.elastic.co/guide/en/elasticsearch/reference/current/dynamic-mapping.html)。

## 結論

雖然 Elasticsearch 的動態對應功能看似方便，但在正式環境中，建議還是事先規劃好 Schema，明確定義各個欄位的型別。這能讓你在儲存空間、查詢效能和功能需求之間做出最適合的權衡，避免日後需要重新索引的麻煩。

## 異動歷程

* 2025-10-04 初版文件建立。
