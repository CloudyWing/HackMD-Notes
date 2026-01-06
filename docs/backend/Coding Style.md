---
title: "Coding Style"
date: 2022-11-06
lastmod: 2022-11-06
description: "整理個人慣用的 C# Coding Style 規範與經驗分享。涵蓋命名規則（Naming Rules）、程式碼排序（Ordering Rules）、註解風格、排版格式（如左大括弧位置、空格與運算子換行），並整合 StyleCop 與 Microsoft 官方建議。"
tags: ["C#","Coding Style"]
---

# Coding Style

幾年前，我曾尋找過一些關於 C# Coding Style 的資源。然而，隨著時間推移，這些資源常常變得難以找到，可能是因為相關網誌已關閉，或是 Microsoft 已經修訂了版本，造成了一些不常用的定義無法確定。因此，我開始在這篇文章中隨筆記錄，方便自己查閱。

Microsoft 提供了一個套件用於程式碼風格檢查，檢查規則可以參考 GitHub 上的 [StyleCopAnalyzers](https://github.com/DotNetAnalyzers/StyleCopAnalyzers/tree/master/documentation)，不過，我自己在寫程式時，只是大致遵循這些規則，仍然會按照我早期寫程式的習慣或者是以前看到的規則為主。例如，雖然在其他文章中我會把左括弧放在新行，但實際上我撰寫程式時會將左括弧放在同一行，這是因為早期開發的 PHP 程式排版規則參考了 Java，而 Java 的左括弧是放在同一行。

::: warning
此篇文章中定義的程式碼風格只是我個人的偏好，並不代表一定是好的。最好還是依據團隊定義或自己的習慣為主。
:::

## Naming Rules

命名上，我是完全參考 C# 的大小寫規則，大致上可以參考以下兩篇文章：

- [StyleCopAnalyzers](https://github.com/DotNetAnalyzers/StyleCopAnalyzers/tree/master/documentation)：我直接做以下總結：
  - 除了 Variables 是 Camel Case，Fields 看情況外，其他都是 Pascal Case。
  - Fields 除了以下情況外，都是 Camel Case。
    - Public 和 Internal Fields 因為有提供外部存取，所以用 Pascal Case。
    - Constants 和 Static Readonly Fields 因為表示常數，所以用 Pascal Case。
    - Fields 不須加上「\_」、「m_」或「s_」等前綴詞。
  - Interface 開頭要加上「I」。
  - 泛型裡的類型參數，只有一個的話且可以為任意型別使用「T」即可，多個的話，或是有較為具體的要求型別；使用「T」開頭的單字，靘? `List<T>` 和 `Dictionary<TKey, TValue>`。
- [縮略字的大小寫規則](https://learn.microsoft.com/zh-tw/previous-versions/dotnet/netframework-4.0/ms229043(v=vs.100)?redirectedfrom=MSDN#%E7%B8%AE%E7%95%A5%E5%AD%97%E7%9A%84%E5%A4%A7%E5%B0%8F%E5%AF%AB%E8%A6%8F%E5%89%87)：
  - 縮寫有分兩種：
    - 縮略字（Acronym）：縮略字由數個單字或片語取第一個字母組成 靘? 神盾局 (SHIELD) 就是 Strategic Homeland Intervention, Enforcement and Logistics Division 組成的縮略字。
    - 縮寫（Abbreviation）：由單字取幾個字母做為代表組成。
    - 縮寫的大小寫規則第一個字母大小寫是看是用 Pascal Case 或是 Camel Case 來決定，後續字母依以下狀況處理。
    - 三個單字以上，不管是縮略字還縮寫，第二個字母開始都是小寫，靘? 「Sql」或「sql」。
    - 兩個單字的縮略字全大寫或全小寫，靘? 「IO」或「io」。
    - 兩個單字的縮寫，第二個字母開始都是小寫，靘? 「Id」或「id」。

    也可以參考黑暗執行緒的文章「[縮略字大小寫之惑：LINQHelper還是LinqHelper？](https://blog.darkthread.net/blog/acronym-capital-convention/)」。

::: warning
雖然 MSDN 後續版本將縮寫的大小寫規則拿掉，但他們在開發時仍然會依照這個規則進行。值得一提的是，這個縮寫規則只適用於 C#，實際上也有許多語言在縮寫的定義上有所不同。舉例來說，在 JavaScript 的 DOM 中，略縮字一律全大寫或全小寫，靘? `innerHTML`。
:::

## Ordering Rules

[StyleCopAnalyzers](https://github.com/DotNetAnalyzers/StyleCopAnalyzers/blob/master/documentation/OrderingRules.md) 在 SA12 開頭的都是排序相關規則，我除了 Method 以外，基本上大致照這規則走。

- [SA1201](https://github.com/DotNetAnalyzers/StyleCopAnalyzers/blob/master/documentation/SA1201.md)：Members 排序。
- SA1202：Access Modifiers 排序：
    1. public
    2. internal
    3. protected internal
    4. protected
    5. private protected
    6. private
- SA1203：Constant Field 必需在 Non-constant Field 前面。
- SA1204：Static 必需放在相同類型的 Non-static 上方。
- SA1206、SA1207：DeclarationKeywords 排序：
    1. Access Modifiers
      1. protected
      2. internal
    2. static
    3. Other Keywords
- SA1208、SA1210：在 Using Namespace 時，`System.` 開頭的要放在前面，其餘照字母排序。
- SA1208、SA1210、SA1209、SA1211、SA1216、SA1217：Using 排序規則如下：
    1. Using Namespaces：Namespaces 之間將`System.` 開頭放最前面其餘照字母排列。
    2. Using Static：之間使用 Full Type 的排序。
    3. Using Alias：Alias 之間用 Alias 的字母排序。
- Alias 必需要放在 Using Namespace 後面，Using Alias 之間用 Alias 的字母排序。
- SA1212：Property 和 Indexer 的 Getter 必需放在 Setter 前面。
- SA1213：Event 的 Add Accessor 必需放在 Remove Accessor 前面。
- SA1214：Readonly Field 必需要放在 Non-readonly Fields 前面。

## 完整範例

```csharp
using Namespace;
using static Namespace.StaticClassName;
using Namespace = Alias;

public class ClassName {
    // 只列這些是因為我不會設定 Protected Field 和 Public Non-static (Const) Field
    #region Fields
    public const int ConstantName = 0;
    internal const int InternalConstantName = 0;
    private const int PrivateConstantName = 0;
    public readonly static int ReadonlyStaticFieldName = 0;
    private static int StaticFieldName = 0;
    private int fieldName = 0;
    #endregion
    
    #region Constructors
    static ClassName() { }
    
    public ClassName() { }
    
    protected ClassName() { }
    
    private ClassName() { }
    #endregion
        
    ~ClassName() { }
    
    // 我只會設計 Public Delegate
    public delegate int Delegate(int x);
    
    // 我只會設計 Public Event
    public event EventHandler Event;
    
    // 我不會設計 private Property
    #region Properties
    public int PropertyName { get; set; }
    
    internal int InternalPropertyName { get; set; }
    
    protected internal int ProtectedInternalPropertyName { get; set; }
    
    protected int ProtectedPropertyName { get; set; }
    #endregion
    
    // 我不會設計 private Indexer
    #region Indexers
    public int this[byte i] { get; set; }
    internal int this[short i] { get; set; }
    protected internal int this[int i] { get; set; }
    protected int this[long i] { get; set; }
    #endregion
    
    // 以下列的是在正常未有關連情況下的排序
    #region Methods
    public static void StaticMethodName() { }
    
    internal static void InternalStaticMethodName() { }
    
    public void MethodName() { }
    
    internal void InternalMethodName() { }
    
    protected internal void ProtectedInternalMethodName() { }
    
    protected void ProtectedMethodName() { }
    
    private void PrivateMethodName() { }
    #endregion
    
    public static bool operator ==(ClassName left, ClassName right) {
        return left == right;
    }
}
```

::: tip

- 上述程式碼只是為了看 Sample 閱讀方便才用 `region`，實際我不會特意用 `region` 幫程式碼分類，`region` 我只會用在隱藏我覺得不需要讓開發者看到的細節，讓開發者可以關注在其他該注意的程式碼上。
- Methods 的排序上，我不會照 SA1202 (Access Modifiers) 的規則排序，而是照我以前看到的某篇規則來排，將同質性的 Method 排在一起，這樣當我看到一個 Method 裡有呼叫其他 Method 時，只需程式碼下移就可看到相關實作，範例如下：
  - Method 只會被呼叫一次的排序。

    ```csharp
    public void Method() {
        MethodA();
        MethodB();
    }

    private void MethodA() {
        MethodA1();
    }

    private void MethodA1() { }

    private void MethodB() { }
    ```

  - Method 會重複被呼叫的排序，Private Method 放在第一個呼叫的 Method 下方，如果多個相似性的 Methods 都會呼叫，則考慮放在最後一個呼叫的 Method 下方。

    ```csharp
    public void MethodA() {
        SubMethod();
    }

    private void SubMethod() { }

    public void MethodB() {
        SubMethod();
    }

    public void MethodC() {
        SubMethod();
    }

    // OR
    public void MethodA1() {
        SubMethod1();
    }

    public void MethodB1() {
        SubMethod1();
    }

    public void MethodC1() {
        SubMethod1();
    }

    private void SubMethod1() { }
    ```

- Private Method 我不會照 SA1204 (Static 和 Non-static) 規則排序，原因在於上述有提到過我會將相關的 Methods 放在一起，而 Private Method 我是否會標註 Static 很大部分只是取決於它是否有用到 Instance Members，所以有可能我原先 Private Method 有使用其他 Private Method 所以沒有標註 Static，後續改成用參數傳入後就標註了。
:::

## 註解

### 單行註解

- 格式：以「//」開頭並在後面空一格，再寫註解，靘? `// Your Comment`。

::: tip
雖然這種註解格式是我早期剛開始寫程式時接觸到的某個程式碼規範，但現在看到的規範大部分都沒有特別要求使用這種格式。然而，在 Microsoft 內部，他們仍然使用這種格式，在他們的 Source Code 或 MSDN 上的範例可以看到這種格式的使用。
:::

- 位置：可以出現在程式碼上方或後方。
- 用途：由於我是 Clean Code 派的，所以我更傾向於將註解用在說明為什麼要做這件事，而非紀錄程式碼正在做什麼。

### 文件註解

使用 Visual Studio 時，在 Class、Struct、Interface 或其 Member 上按三個「/」，可以產生 XML 結構的文件註解。該文件註解包含特定 XML 標籤，可用於解釋程式碼和提供 API 文件。有關詳細資訊，可以參考 [文件註解](https://learn.microsoft.com/zh-tw/dotnet/csharp/language-reference/language-specification/documentation-comments#d31-general)。

如果需要標記泛型型別，可以使用 "{}" 取代 "<>"，因為在 XML 結構中，"<" 和 ">" 可能會被誤判。以下是範例：

```csharp
/// <seealso cref="Dictionary{TKey, TValue}"/>
```

Private 成員不需要加文件註解，因為它們不是 API 的一部分，並且不會公開給其他程式。

### 工作清單

編譯器通常會對一些特殊的註解關鍵字進行處理，例如在 Visual Studio 中，預設提供「HACK」、「TODO」、「UNDONE」和「UnresolvedMergeConflict」。這些註解中含有這些關鍵字的註解將顯示在 Visual Studio 的工作清單視窗中，以提醒開發人員還需要完成的任務。以下是這些關鍵字的使用時機：

- TODO： 用來標示需要完成或實現的功能或事項。通常是在撰寫程式碼時遇到一些需要完成但暫時沒有時間處理的事情，可以用 TODO 來提醒自己之後需要完成的工作。
- UNDONE：用來標示尚未完成的功能或任務。通常是在撰寫程式碼時遇到一些需要完成但還未完成的工作，可以用 UNDONE 來提醒自己需要繼續進行開發。
- HACK：是一個用來標示需要修改或修正的程式碼區塊的關鍵字。通常是暫時性的解決方案，為了在短時間內快速解決問題而添加的程式碼。當問題解決後，必須盡快修改程式碼，並移除這個關鍵字。
- UnresolvedMergeConflict：和版控衝突有關，通常不需要手動添加，由版本控制系統自動處理。

::: tip
「TODO」和「UNDONE」這兩個關鍵字時，它們的含義稍有不同，具體來說，「TODO」通常表示將來需要做的工作，而「UNDONE」通常表示正在進行但尚未完成的工作。
:::

## 排版

### 左大括弧

先前提到我一開始寫 PHP 時是偏好放到同行，所以對於 C# 也一樣，放到新行反而覺得不順手，而像 `else`、`catch` 和 `finally` 的關鍵字則放在同一行，以下為範例：

```csharp
if () {
} else if () {
} else {
}

try {
} catch {
} finally {
}
```

## 空格

我在程式碼中使用的空格，大致與 Visual Studio 預設相同。通常是在以下幾種情況下會插入空格：

- 「,」後方插入空格，如果「,」在行末不加。
- 在控制流程陳述式的關鍵字後方加入空格。
- 在類別宣告中的父類別或介面冒號前後加入空格。
- 在 `for` 陳述式中的「;」後面加入空格。
- 在運算子前後加入空格，「\+\+」和「\-\-」除外，使用「\+\+」和「\-\-」時，與變數之間不加空格。

以下為範例：

```csharp
for (int i = 0; i < 10; i++) {
}

Math.Max(1, 2);
```

### 運算子換行

在寫作文時，通常建議不要將標點符號放在文章開頭。相反地，應該讓末行最後一格空著，把字留在新行開頭再加標點符號。同樣地，數學運算式的二元運算子放在最後面會更容易閱讀。這是我最初的排版風格，但後來在某篇文章中，我看到有人提出排版數學公式時將二元運算符號放在新行的開頭會更好閱讀。根據ChatGPT 所說，這種風格被稱為「out-of-line style」，但現在我已經找不到相關文章，~~不知道是不是黨爭失敗~~。值得注意的是，程式語言也有類似的規範，例如 [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html#s4.5.1-line-wrapping-where-to-break)，以下引用相關文章：

> The prime directive of line-wrapping is: prefer to break at a higher syntactic level. Also:
>
> 1. When a line is broken at a non-assignment operator the break comes before the symbol. (Note that this is not the same practice used in Google style for other languages, such as C++ and JavaScript.)
>
>    This also applies to the following "operator-like" symbols:
>    * the dot separator (.)
>    * the two colons of a method reference (::)
>    * an ampersand in a type bound (<T extends Foo & Bar>)
>    * a pipe in a catch block (catch (FooException | BarException e)).
> 2. When a line is broken at an assignment operator the break typically comes after the symbol, but either way is acceptable.

> This also applies to the "assignment-operator-like" colon in an enhanced for ("foreach") statement.
> 3. A method or constructor name stays attached to the open parenthesis (() that follows it.
> 4. A comma (,) stays attached to the token that precedes it.
> 5. A line is never broken adjacent to the arrow in a lambda, except that a break may come immediately after the arrow if the body of the lambda consists of a single unbraced expression.

總體而言，我的排版風格將賦值符號(=)和二元運算子的排版方式與文章一致，即賦值符號在換行處不換行，二元運算子在換行處換行。但是，當 Lambda 的箭頭在換行處時，我會換到新行(與引文中提到的第 5 點不同)。一方面是因為我看到的程式碼排版都是這樣做的，另一方面是為了和「=」做區隔，讓我更容易分辨是 Field 還是寫成 Lambda 的 Get Property。

以下是排版範例：

```csharp
class Test {
    // 「=」在換行處，不跟著換行
    private string field =
        "Field";
    
    // 「=>」在換行處，跟著換行，方便區隔
    public string Property
        => "Property";
    
    public void Method() {
        // 「||」在換行處，跟著換行
        if (condition1
           || condition1
        ) {
            
        }
        
        // 二元運算子在換行處，跟著換行
        int a = b
            + c;
    }
}
```

::: tip
需注意，以上只是示範，實際上以範例的程式碼長度和複雜度，並不需要換行。
:::

### 三元運算子

對於短的非巢狀三元運算子，可以保持在單行，例如：

```csharp
bool result = condition ? result1 : result2;
```

如果過長的話，則需要換行，換行的方式可以採用以下兩種方式之一：

```csharp
bool result = condition1
    ? result1 : result2;
    
bool result = condition1
    ? result1
    : result2;
```

巢狀的話，請一定要換行，可參考以下方式：

```csharp
// 盡量將子條件放在「:」的部分，可以提高程式碼的閱讀性
bool result = condition1
    ? result1
    : condition2
        ? result2
        : condition3
            ? result3
            : result4;

// 在 ASP.NET Core 的 Source Code 看到的另一種巢狀三元運算子的排版法
bool result = condition1 ? result1
    : condition2 ? result2
    : condition3 ? result3
    : result4;
```

兩種巢狀的三元運算子寫成 if-else 大致如下：

```csharp
if (condition1) {
    result = result1;
} else {
    if (condition2) {
        result = result2;
    } else {
        if (condition3) {
            result = result3;
        } else {
            result = result4;
        }
    }
}

if (condition1) {
    result = result1;
} else if (condition2) {
    result = result2;
} else if (condition3) {
    result = result3;
} else {
    result = result4;
}
```

::: tip
題外話，有些程式語言如 PHP 確實有提供 `elseif` 的關鍵字，但 C# 的 `else if` 只是排版的結果。
:::

### 縮排

不解釋，我是空格派，一般使用 4 個空格，XML 使用 2 個空格。

### 空行

- Fields 之間不加空行，其他 Members 之間加一行空行，這樣不僅提高了閱讀性，也使得 Visual Studio 可以開設定讓它們中間顯示分隔線。
- 區塊內部開頭和結尾不加空行。
- 每次最多一個空行。
- 程式碼結束後留一空行。

範例如下：

```csharp
namespace namespace1 {
    // Namespace 和 Class 之間不加空行
    public class Class1 {
        // Class 和 Field 之間不加空行
        private string field;
        
        public string Property1 { get; set; }
        
        public string Property2 { get; set; }
        
        public void Method() {
            
        }
    }
}
// 程式碼結束後，加一個空行
```

::: tip
在 Unix/Linux 環境下，檔案內容是以換行符號 (LF) 作為行的結尾。而當編輯器開啟一個以換行符號為行結尾的檔案時，若最後一行沒有換行符號，編輯器就會把最後一行當作一個未完成的行。這可能會導致一些問題，例如在某些編輯器中，最後一行的文本會被隱藏起來，或者在某些版本控制系統中，最後一行可能無法正確地被標示出來。為了避免這些問題，所以 Visual Studio 預設排版和一些程式碼規範，會在檔案末端加入一個空行。
:::

### 程式碼長度

我習慣在 Visual Studio 中設定 80、100 和 120 字符的分隔線，這些位置可以幫助我評估程式碼是否需要換行以增強可讀性。

::: tip
早期，由於許多終端機和文字編輯器的限制，程式碼長度通常被限制在 80 個字元以內。然而，隨著現代螢幕的變大和文字編輯器的進步，程式碼長度已經不再受到硬性限制。儘管如此，為了增加程式碼的可讀性，我仍然會盡量避免寫太長的程式碼。這也有助於避免在使用筆記型電腦等小型螢幕開發時，需要不斷捲動才能閱讀整段程式碼。
:::

## 異動歷程

- 2022-11-06 初版文件建立。
