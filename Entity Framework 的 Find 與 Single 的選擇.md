# Entity Framework 的 Find 與 Single 的選擇

上個月我和同事提起在使用 Entity Framework 時，不應該一味地使用 `First()` 方法。即使是使用主鍵取得資料時，`First()` 和 `Single()` 結果相同，且 `First()` 效能上可能稍微好一點（TOP 1 和 TOP 2 的得差異），但取得第一筆資料（`First()`)和取得單一資料（`Single()`)兩者在語意上還是有所區別。

當時有同事詢問我關於 `Find()` 方法的使用差異，但由於這方法我並不常用，當時我的回答並不完整，現在重新整理相關內容。

## `Find` 與 `Get` 的語意差異

在大多數情況下，`Find` 和 `Get` 方法的使用情境有所不同。使用以 `Find` 開頭的方法時，如果找不到對應資料，通常會返回 `default` 值；而使用以 `Get` 開頭的方法則多數情況下會拋出異常。

但是說實話，這個定義並不是絕對，我自己有時也會混淆這兩者的差異。

## `Find()` 方法說明

首先，我們來看一下 `Find()` 方法的定義：

```csharp
public virtual TEntity? Find (params object?[]? keyValues);
```

這裡的參數是一個 `object[]`，因此如果對資料表不熟悉的話，在編譯階段無法確定輸入參數的型別是否正確。特別是在處理複合主鍵時，若不清楚 `ColumnAttribute` 或使用 Fluent API 來設定的順序，則可能不清楚如何正確的傳入參數。

`Find()` 具有以下特性：

* 首先會搜尋已經存在於本地快取中的 Entity。本地快取包括：
  * 通過 `Load()` 載入的資料。
  * 使用 `ToList()` 或 `Single()` 等方法查詢過的 Entity。
  * 通過 `Add()` 加入 `DbSet` 的 Entity。
* 如果在本地快取中找不到對應的 Entity，則會向資料庫發送查詢。
* 使用 `ToList()` 或 `Single()` 方法查詢資料時如果使用了 `AsNoTracking()`，則查詢結果不會存入本地快取。且 `DbSet` 在使用 `AsNoTracking()` 後無法使用 `Find()` 方法。
* `Find()` 方法只能查詢單一 Entity，不支援像 `Include()` 這樣的關聯資料預加載功能。

## 結論

具體使用哪個方法應視需求而定。但我更偏好使用 `Single()` 和 `SingleOrDefault()` 等方法，因為它們具有更明確的語意，且不像 `Find()` 在使用上有諸多限制。

## 異動歷程

* 2024-07-16 初版文件建立。

---

###### tags: `.NET` `Database` `Entity Framework`