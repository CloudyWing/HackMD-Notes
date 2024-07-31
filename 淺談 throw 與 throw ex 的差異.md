# 淺談 throw 與 throw ex 的差異

[![hackmd-github-sync-badge](https://hackmd.io/ygUGsiWUTC24IEU5b_87CQ/badge)](https://hackmd.io/ygUGsiWUTC24IEU5b_87CQ)


這在早期比較多人搞錯，但近幾年應該算是比較基本的知識，但好像還是有同事不知道，所以還是就簡單整理一篇。主要也是有時想挑一些比較簡單的內容來寫。

一般在處理 Exception 時，我們會使用 `try...catch`來捕捉 Exception 並進行處理。而在 `catch` 區塊內，有時會看到 `throw;` 和 `throw ex;` 這兩句語法。雖然看起來很相似，但它們在實際運行中的效果有重要的區別。

## throw 和 throw ex 的使用方式
### 使用 throw 來重新拋出 Exception
使用 `throw` 可以重新拋出捕捉到的 Exception，並保留原始的 Exception 堆疊資訊。這對於除錯非常重要，因為它能夠提供正確的 Exception 發生路徑。

```csharp=
try　{
    try　{
        int result = Divide(1, 0);
    } catch　{
        throw;
    }
} catch (Exception e) {
    Console.WriteLine(e.ToString());
}

static int Divide(int numerator, int denominator) {
    return numerator / denominator;
}
```

產生的錯誤訊息如下，可以明確地知道是第 3 行發生錯誤。
```!
System.DivideByZeroException: Attempted to divide by zero.
   at Program.<<Main>$>g__Divide|0_0(Int32 numerator, Int32 denominator) in D:\Programming\Projects\TestThrow\TestThrow\Program.cs:line 12
   at Program.<Main>$(String[] args) in D:\Programming\Projects\TestThrow\TestThrow\Program.cs:line 3
```

### 使用 throw ex 會導致的問題
使用 `throw ex` 則會建立一個新的 Exception 並拋出，這會重置 Exception 的堆疊資訊，使得追蹤 Exception 變得更加困難。

```csharp
try　{
    try　{
        int result = Divide(1, 0);
    } catch (Exception ex)　{
        throw ex;
    }
} catch (Exception e) {
    Console.WriteLine(e.ToString());
}

static int Divide(int numerator, int denominator) {
    return numerator / denominator;
}
```

顯示的錯誤訊息如下，可以發現堆疊資訊裡，錯誤發生變成是第 5 行 `throw ex` 的位置，導致無法找到真正出錯的行數。
```csharp!
System.DivideByZeroException: Attempted to divide by zero.
   at Program.<Main>$(String[] args) in D:\Programming\Projects\TestThrow\TestThrow\Program.cs:line 5
```

:::info
其實這篇文章的主要目的是測試使用 `throw ex` 重新拋出的 Exception，其 `InnerException` 是否為原來的 Exception。我原本以為可能會是，但實際測試結果顯示 `InnerException` 為 `null`，這代表了原本的堆疊資訊確實會遺失。
:::

也許是 `throw ex` 太多人誤用了，從 .NET 5 開始，增加的 `CA2200` 的檢核規則，當偵測到 `throw ex` 的程式碼，會出現警告 `CA2200:重新擲回攔截到的例外狀況變更堆疊資訊`，有關 `CA2200` 的說明請參考 [重大變更：CA2200：重新擲回以保存堆疊詳細資料](https://learn.microsoft.com/zh-tw/dotnet/core/compatibility/code-analysis/5.0/ca2200-rethrow-to-preserve-stack-details) 和 [CA2200:必須重新擲回以保存堆疊詳細資料](https://learn.microsoft.com/zh-tw/dotnet/fundamentals/code-analysis/quality-rules/ca2200)。

### 正確的 Exception 處理方式
在某些情境下，我們可能需要拋出新的 Exception，以便對原始 Exception 進行更進一步的封裝。這時，我們應該重新拋出一個新的 Exception，並將原始 Exception 作為內部 Exception 傳遞。這樣做能夠保留原始 Exception 的資訊，同時增加新的上下文資訊。

```csharp
public class CustomException : Exception {
    public CustomException(string message, Exception innerException)
        : base(message, innerException) {
    }
}

try {
    // 可能發生 Exception 的程式碼...
} catch (Exception ex) {
    // ex 要作為 InnerException 傳入，才能保留資訊
    throw new CustomException("額外的資訊", ex);
}

```

### 避免不必要的 try...catch
如果在 `catch` 區塊內沒有任何處理僅僅是 `throw` 的話，如以下程式碼所示，實際上可以省略 `try...catch`，因為這樣的 `catch` 區塊並沒有任何意義。

```csharp
try {
    // 可能發生 Exception 的程式碼...
} catch {
    // 沒做任何處理，只有 throw
    throw;
}
```
###### tags: `.NET`
