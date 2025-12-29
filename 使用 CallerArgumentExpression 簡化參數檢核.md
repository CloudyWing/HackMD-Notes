# 使用 CallerArgumentExpression 簡化參數檢核

在開發套件的時候，為了確保建構子或方法的參數符合預期，通常會進行 `null` 或空字串等參數檢核，為了簡化操作與統一錯誤訊息，我通常會寫個 `ExceptionUtils` 的靜態類別來進行檢查，範例如下：

```csharp
public static class ExceptionUtils {
    public static void ThrowIfNull<T>(Expression<Func<T?>> expression) {
        _ = expression.Compile().Invoke()
            ?? throw new ArgumentNullException(GetMemberName(expression));
    }

    public static void ThrowIfNullOrWhiteSpace(Expression<Func<string?>> expression) {
        string? value = expression.Compile().Invoke();
        if (string.IsNullOrWhiteSpace(value)) {
            throw new ArgumentException("不得為 Null 或空白字元。", GetMemberName(expression));
        }
    }

    private static string GetMemberName<T>(Expression<Func<T>> expression) {
        if (expression.Body is not MemberExpression expressionBody) {
            throw new ArgumentException("Expression 表達式錯誤。", nameof(expression));
        }
        return expressionBody.Member.Name;
    }
}
```

這樣就可以用以下方式進行參數檢查，使用 `Expression` 是為了不需要同時傳入參數值和參數名稱，以簡化使用：

```csharp
public void Method(string str) {
    ExceptionUtils.ThrowIfNullOrWhiteSpace(() => str);   
}
```

但在 .NET 6 引入了 [Nullable reference type](https://learn.microsoft.com/zh-tw/dotnet/csharp/nullable-references) 的檢查機制。通常當我們執行 `null` 檢查後，編譯器就能辨識該變數不會是 `null`：

```csharp
string ToLower(string? str) {
    if (str is null) {
        throw new ArgumentNullException(nameof(str));
    }

    // 由於已經檢查過 null，編譯器不會再針對 str 發出 null 警告
    return str.ToLower();
}
```

但由於我的 `ExceptionUtils` 使用的是 `Expression`，而非直接檢查參數，因此無法在參數上加上 `[NotNull]` 來讓編譯器認知檢查後的參數不為 `null`。因此，我調整了程式碼如下：

```csharp
public static class ExceptionUtils {
    public static void ThrowIfNull<T>(Expression<Func<T>> expression, [DoesNotReturnIf(true)] bool isNull = true) {
        _ = expression.Compile().Invoke()
            ?? throw new ArgumentNullException(GetMemberName(expression));
    }
    
    public static void ThrowIfNullOrWhiteSpace(Expression<Func<string?>> expression, [DoesNotReturnIf(true)] bool isNull = true) {
        string? value = expression.Compile().Invoke();
        if (string.IsNullOrWhiteSpace(value)) {
            throw new ArgumentException("不得為 Null 或空白字元。", GetMemberName(expression));
        }
    }

    private static string GetMemberName<T>(Expression<Func<T>> expression) {
        return expression.Body is not MemberExpression expressionBody
            ? throw new ArgumentException("Expression 表達式錯誤。", nameof(expression))
            : expressionBody.Member.Name;
    }
}
```

當中的參數 `isNull` 只是因為直接使用 `[DoesNotReturn]` 會出現`標記 [DoesNotReturn] 的方法不應傳回。` 的警告。只好使用 `［DoesNotReturnIf(true)]` 搭配 `isNull` 這個無意義的參數來處理。
當然以上解法我一直不是很滿意，而在 .NET 6 和 .NET 7 之後，官方提供了一些簡化的靜態檢查方法：

```csharp
// .NET 6 增加
ArgumentNullException.ThrowIfNull(object? argument, string? paramName = null);

// .NET 7 增加
ArgumentNullException.ThrowIfNullOrEmpty(string? argument, string? paramName = null);
ArgumentNullException.ThrowIfNullOrWhiteSpace(string? argument, string? paramName = null);

// .NET 7 增加
ArgumentException.ThrowIfNullOrEmpty(string? argument, string? paramName = null);
ArgumentException.ThrowIfNullOrWhiteSpace(string? argument, string? paramName = null);
```

最近我看了 `ThrowIfNull` 的原始碼如下，當中的 `[CallerArgumentExpression]` 讓我想到之前和後輩借的書有提到它好像是用來自動取得參數名稱。

```csharp
public static void ThrowIfNull([NotNull] object? argument, [CallerArgumentExpression(nameof(argument))] string? paramName = null) {
    if (argument is null) {
        Throw(paramName);
    }
}
```

因此，我就寫了以下程式進行測試：

```csharp
string? str = "";
Console.Write("未傳入 paramName 時，");
TestCallerArgumentExpression(str);

Console.Write("有傳入 paramName 時，");
TestCallerArgumentExpression(str, "str2");

void TestCallerArgumentExpression(object? argument, [CallerArgumentExpression(nameof(argument))] string? paramName = null) {
    Console.WriteLine("paramName:" + paramName);
}
```

結果如下：

```text
未傳入 paramName 時，paramName:str
有傳入 paramName 時，paramName:str2
```

當未傳入 `paramName` 時，會自動使用傳入 `argument` 這個引數的變數名稱作為 `paramName` 的值。這種方式比我原先使用 `Expression` 的解法更簡潔，並且還能使用 `[NotNull]` 來支援 Nullable reference 的檢查。

## 異動歷程

* 2024-10-13 初版文件建立。

---

###### tags: `.NET` `.NET Core & .NET 5+` `C#`