# HTML5 的自定義屬性

## 前言

無意間翻到 2016/8/1 時寫得文章，直接拿上來備份湊文章數，看內容差不多是 jQuery 1.8 時期的東西(現在 jQuery 4 都快要出了 XD)，由於隔了 7 年多了，內容不保證完全符合現況。

## 說明

如果有使用別人寫得一些 JavaScript、jQuery套件或是框架，會發現有些 HTML Tag 裡面存在著一些 `data-` 開頭的屬性(HTML Attribute)，這些 `data-` 開頭的屬性就是自定義屬性，也就是非w3c(World Wide Web Consortium)規範所預先定義的屬性(HTML Attribute)。

其實早期如果要在 HTML Tag 裡面增加其他非 w3c 定義的屬性也是可以，雖然會看到類似這樣的警告「驗證({所使用的html文件規範}): 屬性'{自定義屬性}'不是'{html元素}'元素的有效屬性，但實際上在網頁執行時，還是會將這些自定義屬性給建立至 HTML Attribute 裡面，所以可以使用 jQuery 的 `attr()` 或是 JavaScript 的 `setAttribute()` 和 `getAttribute()` 來進行存取。
需要注意這些自定義的屬性並不會被同步至 DOM Property，所以不可以使用 jQuery 的 `prop()`、JavaScript的 `{DOM}.{Property} = {Value}` 或是 `{DOM}["{Property}"] = {Value}` 的方式存取。
至於 HTML Attribute 和 DOM Property 的差異，詳情請自行google，這邊就不提起了。

HTML5 的規範裡，允許在 HTML 元素裡使用 `data-{屬性}` 值的方式，也就是說如果今天 HTML 文件是宣告 `<!DOCTYPE html>(HTML5的文件宣告)`，所使用的屬性又是 `data-` 開頭，就不會看到上面提及的警告。HTML 既然有了了自定義屬性，JavaScript 和 jQuery 自然也會有針對其產生的語法。

## 自定義屬性的使用方式

### JavaScript

#### 以下內容適用瀏覽器版本：

1. Internet Explorer: 11+
2. Chrome: 8+
3. Firefox: 6+
4. Opera: 11.1+
5. Safari: 6+
6. Android Browser: 4+

#### dataset

在 JavaScript 除了可以使用 `setAttribute()` 和 `getAttribute()` 存取 HTML 的自定義屬性以外，網頁執行時，這些自定義屬性也會被轉換成型別為 `DOMStringMap` 的 object，存至該DOM 的 `dataset` 屬性(DOM Property)裡面，也就是說可以使用 `{DOM object}.dataset.{自定義屬性}`、`{DOM object}.dataset["{自定義屬性}"]`或是`{DOM  object }["dataset"]["{自定義屬性}"]`等方式來進行存取。

#### 屬性名稱規則

`setAttribute()` 和 `getAttribute()` 在存取 `data-` 開頭的自定義屬性時，仍是打完整屬性名稱(HTML Attribute)，但是 `dataset` 在存取這些自定義屬性時名稱就會經過一些規則轉換，以下是屬性名稱的轉換規則。

1. 刪除 `data-`。
2. 刪除屬性名稱裡的每一個 `-`。
3. 屬命名稱以 `-` 來拆解成多個單字以小駝峰式命名法（lower camel case）組合以來。
舉例來說，如果今天屬性命名方式為 `data-cloudy-wing`，JavaScript存取則為 `{DOM object}.dataset.cloudyWing`。

### jQuery

#### 以下內容適用 jQuery 版本：

1. `jQuery.data(element, key, value)`：version added: 1.2.3
2. `.data(key, value)`：version added: 1.2.3
3. `.data(obj)`：version added: 1.4.3
4. 支援 HTML5 `data-` 屬性：version added: 1.4.3

#### `attr()`、`prop()` 和 `data()`

由 `data()` 的起源比支援 HTML5 早可以看出 `data()` 一開始不是為了自定義屬性而產生，而是 HTML5 公佈了自定義屬性後，才拿來與之相容，所以他的機制自然就和 JavaScript 的 dataset 不同了。
在 1.6 版之前還沒有 `prop()` 時，當我們想要使用 jQuery 存值至 DOM 時，如果使用 `attr()` 設定值，其值的會反應在 HTML Tag(開發者模式可以看到HTML程式碼異動)。但如果有時我們想要存的資料比較敏感時，就不適合使用 `attr()`；再來 HTML Attribute 的值是字串，所以當我們想存 boolean 和 number 時用 `attr()` 取值需額外再轉換，此時用 `data()` 就是很好的選擇(不過我很納悶怎不直接使用 JavaScript DOM Property)就好…)。

`data()` 雖然看起來和 `prop()` 一樣是對 DOM 物件附加資料，但實際上他是將資料存放在jQuery.cache，而非DOM Property裡面。

基本上 jQuery 從 HTML Tag 取得 `value` 以外的屬性值可分為三種狀況，`disabled` 等簡單屬性使用 `prop()`，`data-` 開頭的自定義屬性使用 `data()`，其餘額使用 `attr()`。

設定值的話非簡單屬性的 HTML Attribute 使用 `attr()`，`data-` 開頭的自定義屬性使用`data()`(不過這只是為了取值設值從一而終而已，實際上也不會回寫至 HTML Tag 裡)，簡單屬性使用 `prop()`，至於其餘情況，雖然 `prop()`和 `data()` 用途看起來很像，但 `prop()` 效能優於 `data()`，除非資料不想讓人從 DOM上 看到(針對 DOM 使用 `foreach` 或是 `console.log()`)，不然使用 `prop()`。

#### 屬性名稱規則

當使用 `attr()` 取得自定義屬性時，屬性名稱是完整名稱，但使用 `data()` 取得時，屬性名稱仍不太一樣，ver. 1.5 以前規則如下：

1. 移除 `data-`。
2. 全部單字小寫。
也許是因為與 JavaScript 的 dataset 命名規則不同造成使用困擾，var. 1.6 以後也相容 `dataset` 的屬性名稱，也就是說 `data-cloudy-wing`，可以寫成 `data('cloudyWing')` 也可以寫成 `data('cloudyWing')`。

#### 注意事項：

從 HTML Tag 取得自定義屬性時要使用 `data(key)` 或 `data(obj)`，`jQuery.data(element, key)` 是前兩者的底層方法，無法取得自定義屬性，不過正常來說 jQuey 的底層方法通常也不建議直接使用就是。

`data()` 取得自定義屬性時，會依照屬性值而決定資料型別，但如果值是整數位 `0` 開頭，或是小數位 `0`結尾，例如 `012.050`，ver. 1.7 之前認定型別為 number，得到的值是 `12.05`；ver. 1.8 後認定為 string，得到的值會是 `012.050`。

HTML Tag 的自定義屬性值如果要使用 json 格式時，json 字串要使用單引號，json 屬性則是要使用雙引號，例如 `data-wing='{"name": "wing","heigh": 177}'`，`data(obj)` 才會將這段 json 字串正常轉換成 object。

### jQuery `data()` 與 JavaScript `dataset` 比較

這兩樣東西基本上是不同的東西，無法進行混用，`data()` 它只有在尚未設定值時，所取得的值會去比對自定義屬性，之後的全部存取都在 `jQuery.cache` 裡面，和自定義屬性沒有關聯；`dataset` 則是每次使用都會存取自定義屬性，如果使用開發者模式去看 `HTML` 程式碼就以可以看出它的差別。

使用上來說，我會比較建議使用 jQuery `data()`，原因如下：

1. `data()` 對瀏覽器支援度比較高，`dataset` 遇到 IE10 以下就死了。
2. `data()` 它會依照妳給予的而有不同的資料型別，`dataset` 只有字串，當自定義屬性想用布林值時，`data()` 比較方便。
3. `data()` 有支援 json 屬性，`dataset` 沒有。

:::warning
這個建議是 7 年前的事了，現在前端 Framework 盛行，很多網站已經沒再使用 jQuery 了。
:::

## 異動歷程

* 2024-03-09 初版文件建立。

---

###### tags: `jQuery`