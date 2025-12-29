# 淺談 C# 的 GetHashCode()

上個星期看到同事在分享 Bloom Filter 時，讓我想到 `Dictionary` 的鍵比較，因為它們都依賴於雜湊值來快速判斷元素是否存在。當然兩者只是都使用一個陣列結構，並使用雜湊值來當索引，但具體用法還是不同。

## `GetHashCode()`

`GetHashCode()` 是一個用來產生整數型雜湊值的方法，這個值主要用來比對物件值是否相等。實作 `GetHashCode()` 要遵守以下原則：

* 如果兩個物件被認為相等（`Equals()` 回傳 `true`）， `GetHashCode()` 必須回傳相同的值。
* 如果兩個物件不相等，則 `GetHashCode()` 不需要回傳不同的值。
* `GetHashCode()` 不應該拋出例外狀況。

`GetHashCode()` 方法常用於以下情況：

* `IDictionary<TKey, TValue>`、`Dictionary` 的實作類別：如 `Dictionary<TKey, TValue>` 和 `HashTable`，這類類別使用 `GetHashCode()` 進行鍵的快速比對。
* `ISet<T>` 的實作類別：如 `HashSet<T>`，使用 `GetHashCode()` 來判斷元素唯一性。
* LINQ 的 `Distinct()` 方法：使用 `GetHashCode()` 來去除重複的元素。

如果覆寫了 `Equals()` 卻未覆寫 `GetHashCode()`，即使物件在 `Equals()` 下相等，這些類別仍可能認為它們不相等，導致錯誤行為。實際上，當只覆寫 `Equals()`，Visual Studio 會出現以下警告。

![](https://github.com/CloudyWing/HackMD-Notes/blob/main/Images/%E6%B7%BA%E8%AB%87%20C%20Sharp%20%E7%9A%84%20GetHashCode%28%29/gethashcode-overwrite-warning.png?raw=true)

使用以下程式碼測試：

```csharp
Test test1 = new() {
    Name = "王大明",
    Age = 10
};

Test test2 = new() {
    Name = "王大明",
    Age = 10
};

Dictionary<Test, string> dic = new() {
    [test1] = "測試"
};

Console.WriteLine(test1.Equals(test2));
Console.WriteLine(dic.ContainsKey(test2));


public class Test {
    public string Name { get; set; }

    public int Age { get; set; }

    public override bool Equals(object obj) => obj is Test test && Name == test.Name && Age == test.Age;
}
```

得到結果如下：

```text
True
False
```

### `GetHashCode()` 的實作

最簡單的實作方式是使用 Visual Studio 的重構功能來產生。使用以下程式碼為例：

```csharp
public class Test {
    public string Name { get; set; }

    public int Age { get; set; }
}
```

點擊 `Test` 類別，按 ALT + Enter 開啟重構選項，並選擇「產生 Equals 和 GetHashCode...」。

![](https://github.com/CloudyWing/HackMD-Notes/blob/main/Images/%E6%B7%BA%E8%AB%87%20C%20Sharp%20%E7%9A%84%20GetHashCode%28%29/vs-generate-equals-menu.png?raw=true)

選擇要作為 `Equals()` 判斷的成員，也可以選擇一同實作 `IEquatable<T>` 和 運算子（`＝=` 和 `！=`），這邊先不勾選這些額外專案：

![](https://github.com/CloudyWing/HackMD-Notes/blob/main/Images/%E6%B7%BA%E8%AB%87%20C%20Sharp%20%E7%9A%84%20GetHashCode%28%29/vs-generate-equals-dialog.png?raw=true)

產生程式碼如下：

```csharp
public class Test {
    public string Name { get; set; }

    public int Age { get; set; }

    public override bool Equals(object obj) => obj is Test test && Name == test.Name && Age == test.Age;
    public override int GetHashCode() => HashCode.Combine(Name, Age);
}
```

不過由於 `HashCode.Combine()` 是 .NET Core 2.1 才加入的，.NET Framework 並沒有支援。對於 .NET Framework 版本，產生的程式碼可能如下：

```csharp
 public class Test {
    public string Name { get; set; }

    public int Age { get; set; }

    public override bool Equals(object obj) => obj is Test test && Name == test.Name && Age == test.Age;

    public override int GetHashCode() {
        int hashCode = -1360180430;
        hashCode = hashCode * -1521134295 + EqualityComparer<string>.Default.GetHashCode(Name);
        hashCode = hashCode * -1521134295 + Age.GetHashCode();
        return hashCode;
    }
}
```

程式碼說明：

* `-1360180430` 和 `-1521134295` 是常數，用來初始化和組合雜湊碼，以產生更均勻分布的雜湊值。這些常數通常是大質數，因為質數在雜湊函式中有助於減少碰撞的機率。
  * -1360180430：這是初始雜湊碼值。透過使用一個非零的起始值（通常是質數），可以確保物件的雜湊碼不同於預設值，並且即使物件沒有任何屬性，也不會回傳零作為雜湊碼。
  * -1521134295：這是用來組合雜湊值的乘數。使用一個質數乘數來混合各個欄位的雜湊值，可以增加結果的隨機性，從而減少雜湊碰撞的機率。
* 參考物件使用 `EqualityComparer<T>.Default` 來計算雜湊值的原因：
  * 避免 `null` 值的情況，當值 `null` 時，會回傳 `0`。
  * 確保在不同類別的物件上使用相同的雜湊運算規則。

當然這 .Framework 的版本，不太好記，對於不支援 `HashCode.Combine()` 的 .NET Framework，部分開發者可能會使用匿名物件來取得 `GetHashCode()`，當然這個作法可能會因為建立臨時的匿名物件，而稍微影響效能。

```csharp
public override int GetHashCode() => new { Name, Age }.GetHashCode();
```

## `ContainsKey(TKey key)` 的實作

這邊簡略的說明一下，如果想知道完整作法，底下有節錄 .NET 8 的實作，有興趣可以自己研究。

`ContainsKey()` 方法內部使用 `FindValue()` 方法來搜尋是否存在指定的 `TKey`。若找到對應的值，則表示 `TKey` 存在於 `Dictionary<TKey, TValue>` 中。
`Dictionary` 有兩個主要的陣列欄位，分別是：

* `_entries`：型別為 `Entry[]`，`Entry` 幫包含了 `TKey`、`TValue` 以及下一個具有相同 bucket 值的 entry 索引。
* `_buckets`：型別為 `int[]`，儲存了各個 bucket 值（`TKey` 的 HashCode 經過模除等運算計算的值）和對應的 entry 索引的對照表。

而 `FindValue()` 實作流程如下：

1. 計算傳入參數 `key` 的 HashCode。這個 HashCode 用來快速定位 `_buckets` 陣列中對應的 entry 索引。透過這個索引，可以直接從 `_entries` 陣列中取得對應的 entry，避免逐筆搜尋，從而提升搜尋效率。
2. 先比較 `TKey` 的 HashCode 與 entry 中儲存的 HashCode。這樣可以先快速篩選出不匹配的專案，減少 `Equals()` 方法的呼叫次數。在大部分的情況下 `Equals()` 的計算成本都比 Hash 比較要高，因此可以進一步提升效能。
3. 由於不同的物件可能具有相同的 HashCode，加上 `_buckets` 中的索引是經過運算的結果，所以從 _buckets 取得的 `entry` 索引可能指向的並不一定是所需的專案。若發現不匹配，會利用 `entry.next` 來指向下一個具有相同 bucket 的專案索引，繼續比對，直到找到匹配的專案或逐一檢查所有可能的專案。

以下是節錄 `FindValue()` 在 .NET 8 的實作程式碼：

```csharp
internal ref TValue FindValue(TKey key) {
    if (key == null) {
        ThrowHelper.ThrowArgumentNullException(ExceptionArgument.key);
    }

    ref Entry entry = ref Unsafe.NullRef<Entry>();
    if (_buckets != null) {
        Debug.Assert(_entries != null, "expected entries to be != null");
        IEqualityComparer<TKey>? comparer = _comparer;
        if (typeof(TKey).IsValueType && // comparer can only be null for value types; enable JIT to eliminate entire if block for ref types
            comparer == null) {
            uint hashCode = (uint)key.GetHashCode();
            int i = GetBucket(hashCode);
            Entry[]? entries = _entries;
            uint collisionCount = 0;

            // ValueType: Devirtualize with EqualityComparer<TKey>.Default intrinsic
            i--; // Value in _buckets is 1-based; subtract 1 from i. We do it here so it fuses with the following conditional.
            do {
                // Should be a while loop https://github.com/dotnet/runtime/issues/9422
                // Test in if to drop range check for following array access
                if ((uint)i >= (uint)entries.Length) {
                    goto ReturnNotFound;
                }

                entry = ref entries[i];
                if (entry.hashCode == hashCode && EqualityComparer<TKey>.Default.Equals(entry.key, key)) {
                    goto ReturnFound;
                }

                i = entry.next;

                collisionCount++;
            } while (collisionCount <= (uint)entries.Length);

            // The chain of entries forms a loop; which means a concurrent update has happened.
            // Break out of the loop and throw, rather than looping forever.
            goto ConcurrentOperation;
        } else {
            Debug.Assert(comparer is not null);
            uint hashCode = (uint)comparer.GetHashCode(key);
            int i = GetBucket(hashCode);
            Entry[]? entries = _entries;
            uint collisionCount = 0;
            i--; // Value in _buckets is 1-based; subtract 1 from i. We do it here so it fuses with the following conditional.
            do {
                // Should be a while loop https://github.com/dotnet/runtime/issues/9422
                // Test in if to drop range check for following array access
                if ((uint)i >= (uint)entries.Length) {
                    goto ReturnNotFound;
                }

                entry = ref entries[i];
                if (entry.hashCode == hashCode && comparer.Equals(entry.key, key)) {
                    goto ReturnFound;
                }

                i = entry.next;

                collisionCount++;
            } while (collisionCount <= (uint)entries.Length);

            // The chain of entries forms a loop; which means a concurrent update has happened.
            // Break out of the loop and throw, rather than looping forever.
            goto ConcurrentOperation;
        }
    }

    goto ReturnNotFound;

ConcurrentOperation:
    ThrowHelper.ThrowInvalidOperationException_ConcurrentOperationsNotSupported();
ReturnFound:
    ref TValue value = ref entry.value;
Return:
    return ref value;
ReturnNotFound:
    value = ref Unsafe.NullRef<TValue>();
    goto Return;
}
```

## 異動歷程

* 2024-09-01 初版文件建立。

---

###### tags: `C#`