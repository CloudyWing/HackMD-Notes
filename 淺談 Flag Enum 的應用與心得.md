# 淺談 Flag Enum 的應用與心得

[![hackmd-github-sync-badge](https://hackmd.io/0uvELxyqTKG0SgwOf-_IVg/badge)](https://hackmd.io/0uvELxyqTKG0SgwOf-_IVg)

## 什麼是 Enum
在談論 Flag Enum 之前，先來了解一下什麼是 Enum（列舉型別）。Enum 是一種由整數常數組成的實值型別，預設列舉項目型別為 `int`，但也可以指定為其他整數型別。若未指定列舉項目值，則從 `0` 開始，依序加一。

在程式開發中，經常需要使用一組常數來表示特定狀態、類型或操作，尤其是作為方法參數。雖然使用數值可以減少輸入錯誤的可能性，但卻無法直觀辨識各項數值的具體含意。儘管使用有意義的字串可以減少字串輸入錯誤的可能性，然而，針對每個值單獨定義常數雖然有助於改善此問題，但仍無法阻止使用其他未定義的值。

透過 Enum，我們可以為每個列舉項目指定有意義的名稱，提高了程式碼的可讀性，同時防止了使用未定義值的可能性，增加了程式的穩定性。即便是對於不熟悉英文的開發者，看不懂 Enum 列舉項目的命名，但透過編輯器顯示的註解，仍可清楚了解每個項目的含義。

以下為 Enum 範例：

```csharp
enum Action : ushort { // 指定成員型別為 ushort，未指定則為 int
    /// <summary>
    /// 無(0)
    /// </summary>
    None, // 沒設值，從 0 開始

    /// <summary>
    /// 查詢(1)
    /// </summary>
    Query, // 值為 1

    /// <summary>
    /// 建立(10)
    /// </summary>
    Create = 10,

    /// <summary>
    /// 更新(11)
    /// </summary>
    Update, // 因為前一個項目設為 10，所以值為 11

    /// <summary>
    /// 刪除(12)
    /// </summary>
    Dalete // 值為 12
}

Action action = Action.Update;
string name =  action.ToString(); // name = "Update"
ushort value = (ushort)action; // value = 11
```

## Flag Enum 的介紹
Flag Enum 可以被視為一組支援位元運算的 Enum，其中每個列舉值都代表一個獨立的旗標。透過組合這些旗標，可以有效地表示多個狀態或選項。

### Flag Enum 的定義方式
Flag Enum 的定義方式為在 Enum 上加上 `FlagsAttribute`，並且使用 2 的 N 次方來定義各項列舉值，其他值則為複合值，也可自行定義複合的列舉項目。

以下為範例：
```csharp
[Flags]
enum Permissions {
    None = 0,
    CanQuery = 1,
    CanCreate = 2,
    CanUpdate = 4,
    CanDelete = 8,
    CanUpsert = CanCreate | CanUpdate, // 值為 6
    ExcludeDelete = ~CanDelete, // 值為 -9
    All = CanQuery | CanCreate | CanUpdate | CanDelete
}

// 直接使用已定義的複合值，ToString() 結果為該值的名稱
Permissions permission = Permissions.CanUpsert;
string name = permission.ToString(); // name = "CanUpsert"
int value = (int)permission; // value = 6

// 使用位元運算，結果為已定義的複合值，ToString() 結果為該值的名稱
permission = Permissions.CanCreate | Permissions.CanUpdate;
name = permission.ToString(); // name = "CanUpsert"
value = (int)permission; // value = 6

// 使用位元運算，結果為非已定義的複合值，ToString() 結果為各項列舉值的名稱
permission = Permissions.CanCreate | Permissions.CanDelete;
name = permission.ToString(); // name = "CanCreate, CanDelete"
value = (int)permission; // value = 10

// 使用 ~ 位元運算，結果為已定義的複合值，ToString() 結果為該值的名稱
permission = ~Permissions.CanDelete;
name = permission.ToString(); // name = "ExcludeDelete"
value = (int)permission; // value = -9

// 使用 ~ 位元運算，結果為非已定義的複合值，ToString() 結果為數值
permission = ~Permissions.CanCreate;
name = permission.ToString(); // name = "-3"
value = (int)permission; // value = -3
```

或使用位元運算的方式來定義值：
```csharp
enum Permissions {
    None = 0,
    CanQuery = 1 << 0,
    CanCreate = 1 << 1,
    CanUpdate = 1 << 2,
    CanDelete = 1 << 3
}
```

Microsoft 建議 Flag Enum 型別使用複數命盟，例如：`RegexOptions`；一般 Enum 型別使用複數命名，例如：`DayOfWeek`。

### Flag Enum 的使用方式
Flag Enum 可以有效地簡化方法的參數，使其更具可讀性，以下案例就很適合使用 Flag Enum 改寫：
```csharp
void Execute(bool canQuery, bool canCreate, bool canUpdate, bool canDelete) {
    // 實際執行行為
}
```

使用 Flag Enum 的作法：
```csharp
void Execute(Permissions permiss) {
    // 實際執行行為
}
```
這樣的改寫使得方法的參數更為清晰，同時消除了使用多個布林值時可能的混淆。使用 Flag Enum 不僅提高了可讀性，還使得未來擴充權限時更加方便。

### 位元運算
以下將使用集合的概念來說明有關 Flag Enum 的位元運算。
* OR (`|`) 運算符：將兩個列舉值進行 OR 運算，形成一個包含兩者的列舉項目的集合，即聯集。   
![](https://i.imgur.com/FJMpHJU.png)
* AND (`&`) 運算符：將兩個列舉值進行 AND 運算，形成一個包含兩者重複列舉項目的集合，即交集。  
![](https://i.imgur.com/ccNuycY.png)
* XOR (`^`) 運算符：將兩個列舉值進行 XOR 運算，形成一個不包含兩者重複項目的集合，即對稱差集。  
![](https://i.imgur.com/YEzQTNq.png)
* NOT (`~`) 運算符：將列舉值使用 NOT 運算，產生一個不包含該列舉值項目的列舉值集合，即補集。  
![](https://i.imgur.com/0VM6VvL.png)

位元運算並沒有差集的運算符，所以無法簡單完成去除指定列舉項目的行為，但可以使用以下方式達到相同效果：
* 先取得移除項目的補集，再與原項目取得交集，程式碼寫法為 `Permissions.CanUpsert & ~Permissions.CanCreate`。
* 先與移除項目組成聯集後，再與移除項目取對稱差集，程式碼寫法為 `(Permissions.CanUpsert | Permissions.CanCreate) ^ Permissions.CanCreate`。

### 判斷是否包含特定列舉值
如果要判斷是否包含特定列舉項目，可使用以下作法：
* 與要判斷的列舉項目取交集後，再判斷是否相等。
```csharp
// has1 = true
bool has1 = (Permissions.CanUpsert & Permissions.CanCreate) == Permissions.CanCreate; 

// has2 = false
bool has2 = (Permissions.CanUpsert & Permissions.CanDelete) == Permissions.CanDelete;

// has3 = true
bool has3 = (Permissions.CanUpsert & Permissions.None) == Permissions.None;

// has4 = false
bool has4 = (Permissions.ExcludeDelete & Permissions.CanDelete) == Permissions.CanDelete; 

// has5 = true
bool has5 = (Permissions.ExcludeDelete & Permissions.CanCreate) == Permissions.CanCreate;

// has6 = false
bool has6 = (Permissions.All & Permissions.ExcludeDelete) == Permissions.ExcludeDelete;
```
* `HasFlag`：在 .NET Framework 4.0 時，為 Enum 新增的方法，內部仍然使用上述程式進行判斷，使用結果如下：
```csharp
// has1 = true
bool has1 = Permissions.CanUpsert.HasFlag(Permissions.CanCreate);

// has2 = false
bool has2 = Permissions.CanUpsert.HasFlag(Permissions.CanDelete);

// has3 = true
bool has3 = Permissions.CanUpsert.HasFlag(Permissions.None);

// has4 = false
bool has4 = Permissions.ExcludeDelete.HasFlag(Permissions.CanDelete);

// has5 = true
bool has5 = Permissions.ExcludeDelete.HasFlag(Permissions.CanCreate);

// has6 = false
bool has6 = Permissions.All.HasFlag(Permissions.ExcludeDelete);
```

### 位元運算的疑慮
以上範例中，可能會對 `Permissions.CanUpsert.HasFlag(Permissions.None)` 和 `Permissions.All.HasFlag(Permissions.ExcludeDelete)` 以上範例中，可能會對

首先，從位元運算來看 `Permissions.CanUpsert & Permissions.None == Permissions.None` 為 `true` 是正確的。而從從集合的觀點來看，`None` 代表空集合，而空集合是任何集合的子集。即使已經定義了 `None`，結果仍然如下圖所示：  
![](https://i.imgur.com/FYvkwG6.png)

而非是下圖：  
![](https://i.imgur.com/yw9BpQA.png)

對於 `Permissions.All.HasFlag(Permissions.ExcludeDelete)` 的疑慮主要來自於 `All` 的命名以及對 `ExcludeDelete`  的理解可能有所偏差。儘管被命名為 `All`，實際上只包含已定義的列舉項目。換句話說，如果定義了新的列舉項目，但未更新 `All` 的值，它就不包含新的定義值。因此，對於可能擴充的 Enum，應謹慎使用 `All` 的命名。而 `ExcludeDelete` 使用 NOT (~) 運算符來定義，它由已定義不包含`Delete` 的列舉項目和未定義的值所組成。具體如下圖橘色範圍：  
![](https://i.imgur.com/28QB0jn.png)

因此 `Permissions.All.HasFlag(Permissions.ExcludeDelete)` 的結果為 `false`。這也解釋了為什麼前述`(~Permissions.CanCreate).ToString()` 得到的是數值，而非包含的列舉項目名稱，所以建議避免使用 NOT (~) 運算符來定義複合列舉項目。

###### tags: `C#`