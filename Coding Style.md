# Coding Style

[![hackmd-github-sync-badge](https://hackmd.io/XvZqJY25SI-RGznt1yoirw/badge)](https://hackmd.io/XvZqJY25SI-RGznt1yoirw)


幾年前有在網路上找一些 C# 的 Coding Style，但後續要找時常常找不到，原因可能是 Blog 關閉，或是微軟修訂版本，搞得一些不常用的要怎麼定義常不確定，乾脆就開始隨筆記錄在此篇文章，自身要翻閱比較方便。

微軟有提供一個套件來做 Coding Style 檢查，檢查規則可以參考在 Github 上的文件 [StyleCopAnalyzers](https://github.com/DotNetAnalyzers/StyleCopAnalyzers/tree/master/documentation)，但我本身只是大致照這規則走，有部分還是會依照早年寫程式的習慣，或是以前看到的規則為主。
舉例來說，雖然在其他文章，我會把左括弧放在新行，但實際上我撰寫自身程式會放在同行，這主要是因為早期開發的 PHP 程式排版規則是參考 Java，而 Java 左括弧是放在同行。

:::warning
此篇文章定義的 Style 只是我自身偏好，並不代表是好的，最好依團隊的定義或自身習慣為主。
:::

## Naming Rules
命名上，我是完全參考 C# 的大小寫規則，大致上可以參考以下兩篇文章：
* [StyleCopAnalyzers](https://github.com/DotNetAnalyzers/StyleCopAnalyzers/tree/master/documentation)：我直接做以下總結：
    * 除了 Variables 是 Camel Case，Fields 看情況外，其他都是 Pascal Case。
    * Fields 除了以下情況外，都是 Camel Case。
        * Public 和 Internal Fields 因為有提供外部存取，所以用 Pascal Case。
        * Constants 和 Static Readonly Fields 因為表示常數，所以用 Pascal Case。
    * Fields 不須加上「_」、「m_」或「s_」等前綴詞。
    * Interface 開頭要加上「I」。
    * 泛型裡的類型參數，只有一個的話使用「T」，多個的話；使用「T」開頭，e.g. `List<T>` 和 `Dictionary<TKey,TValue>`。
* [縮略字的大小寫規則](https://learn.microsoft.com/zh-tw/previous-versions/dotnet/netframework-4.0/ms229043(v=vs.100)?redirectedfrom=MSDN#%E7%B8%AE%E7%95%A5%E5%AD%97%E7%9A%84%E5%A4%A7%E5%B0%8F%E5%AF%AB%E8%A6%8F%E5%89%87)：
    * 縮寫有分兩種：
        * 縮略字（Acronym）：縮略字由數個單字或片語取第一個字母組成 e.g. 神盾局(SHIELD)就是 Strategic Homeland Intervention, Enforcement and Logistics Division 組成的縮略字。
        * 縮寫（Abbreviation）：由單字取幾個字母做為代表組成。
    * 縮寫的大小寫規則第一個字母大小寫是看是用 Pascal Case 或是 Camel Case 來決定，後續字母依以下狀況處理。
        * 三個單字以上，不管是縮略字還縮寫，第二個字母開始都是小寫，e.g. 「Sql」或「sql」。
        * 兩個單字的縮略字全大寫或全小寫，e.g. 「IO」或「io」。
        * 兩個單字的縮寫，第二個字母開始都是小寫，e.g. 「Id」或「ID」。

    也可以參考黑暗執行緒的文章「[縮略字大小寫之惑：LINQHelper還是LinqHelper？](https://blog.darkthread.net/blog/acronym-capital-convention/)」。

    :::warning
    * 雖然 MSDN 後續版本將縮寫的大小寫規則拿掉，但實際上他們還是依照這個規則開發。
    * 這邊的縮寫規則只適用於 C#，實際上也有不少語言在縮略字的定義，不管幾個字母都是全大寫或全小寫。
    :::

## Ordering Rules
[StyleCopAnalyzers](https://github.com/DotNetAnalyzers/StyleCopAnalyzers/blob/master/documentation/OrderingRules.md) 在 SA12 開頭的都是排序相關規則，我除了 Method 以外，基本上大致照這規則走。
* [SA1201](https://github.com/DotNetAnalyzers/StyleCopAnalyzers/blob/master/documentation/SA1201.md)：Members 排序。 
* SA1202：Access Modifiers 排序：
    1. public
    2. internal
    3. protected internal
    4. protected
    5. private protected
    6. private
* SA1203：Constant Field 必需在 Non-constant Field 前面。
* SA1204：Static 必需放在相同類型的 Non-static 上方。
* SA1206、SA1207：DeclarationKeywords 排序：
    1. Access Modifiers
        1. protected
        2. internal
    2. static
    3. Other Keywords
* SA1208、SA1210：在 Using Namespace 時，`System.` 開頭的要放在前面，其餘照字母排序。
* SA1208、SA1210、SA1209、SA1211、SA1216、SA1217：Using 排序規則如下：
    1. Using Namespaces：Namespaces 之間將`System.` 開頭放最前面其餘照字母排列。
    2. Using Static：之間使用 Full Type 的排序。
    3. Using Alias：Alias 之間用 Alia 的字母排序。
*  Alias 必需要放在 Using Namespace 後面，Using Alias 之間用 Alia 的字母排序。
* SA1212：Property 和 Indexer 的 Getter 必需放在 Setter 前面。
* SA1213：Event 的 Add Accessor 必需放在 Remove Accessor 前面。
* SA1214：Readonly Field 必需要放在 Non-readonly Fields 前面。

## 完整範例
```csharp
using Namespace;
using static Namespace.StaticClassName;
using Namespace = Alias;

public class ClassName {
    // 只列這些是因為我不會設定 Protected Field 和 Public Non-static(Const) Field
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
:::info
* 上述程式碼只是為了看 Sample 閱讀方便才用 `region`，實際我不會特意用 `region` 幫程式碼分類，`region` 我只會用在隱藏我覺得不需要讓開發者看到的細節，讓開發者可以關注在其他該注意的程式碼上。
* Methods 的排序上，我不會照 SA1202(Access Modifiers)的規則排序，而是照我以前看到的某篇規則來排，將同質性的 Method 排在一起，而不會，這樣當我看到一個 Method 裡有呼叫其他 Method 時，只需程式碼下移就可看到相關實作，範例如下：
    * Method 只會被呼叫一次的排序。
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

    * Method 會重複被呼叫的排序，Private Method 放在第一個呼叫的 Method 下方，如果多個相似性的 Methods 都會呼叫，則考慮放在最後一個呼叫的 Method 下方。
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
* Private Method 我不會照 SA1204(Static 和 Non-static) 規則排序，原因在於上述有提到過我會將相關的 Methods 放在一起，而 Private Method 我是否會標註 Static 很大部分只是取決於它是否有用到 Instance Members，所以有可能我原先 Private Method 有使用其他 Private Method 所以沒有標註 Static，後續改成用參數傳入後就標註了。
:::

###### tags: `C#` `Coding Style`
