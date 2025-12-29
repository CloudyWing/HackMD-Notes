# 淺談 SQL Server WHERE 子句的 NULL 判斷

最近上班聽到一件很訝異的事情，同事不知道 SQL `WHERE` 子句判斷是否為 `NULL` 時，要用 `IS NULL` 而不是 `= NULL`。畢竟這件事這對我來說是基本常識，就我的認知，不論是跟老師學資料庫，或是買一本 SQL 的書來自學，當學到 `WHERE` 子句時，就該知道這件事。只能說單就這方面而言，ORM 養壞了一些人。

更讓我驚訝的是，有位年資比我高的同事也不清楚這件事。不過仔細想想，可能是我在會議中沒有聽清楚，導致會錯意，也許他只是檢查別人的錯誤，而不是自己不了解。

因此，就先把可愛的後輩找來，幫她補充一些基礎知識，~~順便再寫一篇筆記給她看~~，實際上是我想順便確認一下細節。

## NULL 的比較結果

首先，許多人誤以為 SQL 的邏輯比較結果只有 `TRUE` 和 `FALSE`，但實際上還有 `UNKNOWN`。雖然我在剛學 SQL 時，就知道 `NULL` 判斷要用 `IS NULL` 或 `IS NOT NULL`，但 `UNKNOWN` 的概念我也是近幾個月才知道。

因為 `NULL` 表示未知的值，所以除了使用 `IS NULL` 或 `IS NOT NULL` 外，任何值（包含 `NULL`) 與 `NULL` 比較的結果都會是 `UNKNOWN`，而當 `WHERE` 子句中，只有結果為 `TRUE` 的資料才會包含在查詢結果中。

### UNKNOWN 的邏輯運算

以下列出 `運算式 1 AND 運算式 2` 的結果，其中一個運算式值為 `UNKNOWN`。
| 運算式 1 | 運算式 2 | 結果 |
| --- | --- | --- |
| TRUE | UNKNOWN | UNKNOWN |
| UNKNOWN | UNKNOWN | UNKNOWN |
| FALSE | UNKNOWN | FALSE |

以下列出 `運算式 1 OR 運算式 2` 的結果，其中一個運算式值為 `UNKNOWN`。
| 運算式 1 | 運算式 2 | 結果 |
| --- | --- | --- |
| TRUE | UNKNOWN | TRUE |
| UNKNOWN | UNKNOWN | UNKNOWN |
| FALSE | UNKNOWN | UNKNOWN |

說實在有點不好記，所以建議判斷上還是盡量不要涉及到 `UNKNOWN`。

## SQL 標準和不等於運算子

這段內容和主題無關，只是順便記錄在此。

### SQL 標準

常見的 SQL 標準包括：

* ANSI SQL：由美國國家標準學會（ANSI）訂立的 SQL 標準。
* T-SQL：Microsoft SQL Server 對 ANSI SQL 標準的實作，並加入了額外功能和擴充。
* PL/SQL：Oracle 對 ANSI SQL 標準的實作，並加入了額外功能和擴充。

### 不等於運算子

在早期的 ANSI SQL 標準中，`<>` 是唯一明確定義的不等於運算子。從 SQL-92 開始，一些資料庫系統陸續支援將 `!=` 作為可選的不等於運算子。推測可能是因為其他程式語言是用 `!=` 作為不等於的運算子的關係，但後續是否有在列入 SQL 標準，我並不確定。目前仍有極少數的資料庫，如 Microsoft Access，不支援 `!=`。

而雖然 SQL Server 有支援 `!=`，但[官方文件](https://learn.microsoft.com/zh-tw/sql/t-sql/language-elements/not-equal-to-transact-sql-traditional?view=sql-server-ver16) 仍然使用 `<>` 作為標準的不等於運算子。

## 參考資料

* [NULL 和 UNKNOWN (Transact-SQL)](https://learn.microsoft.com/zh-tw/sql/t-sql/language-elements/null-and-unknown-transact-sql?view=sql-server-ver16)

## 異動歷程

* 2024-07-24 初版文件建立。

---

###### tags: `Database` `Microsoft SQL Server`