---
title: "如何在 Entity Framework 中增加 WITH (NOLOCK) 和 Parameter Sniffing 的處理"
date: 2024-07-18
lastmod: 2024-07-18
description: "探討為何現代 EF Core 開發較少提及 `WITH (NOLOCK)`，並教學如何透過 `DbCommandInterceptor` 攔截 SQL Command，動態注入 `NOLOCK` 提示或處理 Parameter Sniffing 效能問題。"
tags: [".NET","Entity Framework","SQL Server"]
---

# 如何在 Entity Framework 中增加 WITH (NOLOCK) 和 Parameter Sniffing 的處理

前幾天在面試時被問到 SQL Server 的 `WITH (NOLOCK)`，因為太久沒用，一時想不起來，導致回答錯誤。明明一年前的筆記中有相關內容「[SQL Server 效能調教](../database/SQL%20Server%20%E6%95%88%E8%83%BD%E8%AA%BF%E6%95%99.md)」。

為什麼在 SQL Server 中 `WITH (NOLOCK)` 很重要，卻很久沒用了呢？主要原因是現在大部分開發都直接使用 Entity Framework，而不再像過去手刻 Library 產生 SQL 語句，直接讓 Library 在執行 Command 前修正 SQL 就好。

現在我們來看看如何在 Entity Framework 中實現相同的行為。

## Interceptor（攔截器）

Microsoft.EntityFrameworkCore 的 Interceptor 在 3.0 版中加入，而 .NET Framework 的 EntityFramework 則是在 6.0 版中加入。其主要功能是允許在 Entity Framework 執行低階資料庫操作或 `SaveChanges()` 時，修改或攔截正在進行的操作。更具體的內容請參考 MSDN 的「[攔截器](https://learn.microsoft.com/zh-tw/ef/core/logging-events-diagnostics/interceptors#database-interception)」。本篇文章以 Microsoft.EntityFrameworkCore 版本作為範例。

### Interceptor 介面

* IDbCommandInterceptor：處理 Command 的相關方法，本文將使用此介面。
* IDbConnectionInterceptor：處理連線與關閉連線的相關方法。
* IDbTransactionInterceptor：處理交易相關的方法。
* ISaveChangesInterceptor：處理 `SaveChanges()` 相關方法。

## 實作方法

關於 `WITH (NOLOCK)` 的處理，網路上大部分的解法都無法處理子查詢。不過，有一篇文章「[给 EF Core 查询增加 With NoLock](https://blog.csdn.net/puzi0315/article/details/133018791)」有更一步處理，所以我就參考這篇來修改。

```csharp
public class FixDbCommandInterceptor : DbCommandInterceptor {
    private static readonly RegexOptions regexOptions = RegexOptions.Multiline | RegexOptions.IgnoreCase;
    private static readonly Regex cudRegex = new(@"\b(INSERT|UPDATE|DELETE)\b", regexOptions);
    private static readonly Regex tableAliasRegex = new(
        @"(?<tableAlias>(FROM|JOIN)\s+\[\w+\]\s+AS\s+\[\w+\])",
        regexOptions
    );

    public override InterceptionResult<DbDataReader> ReaderExecuting(
        DbCommand command, CommandEventData eventData,
        InterceptionResult<DbDataReader> result) {
        FixCommand(command);
        return base.ReaderExecuting(command, eventData, result);
    }

    public override async ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(
        DbCommand command, CommandEventData eventData,
        InterceptionResult<DbDataReader> result,
        CancellationToken cancellationToken = default
    ) {
        FixCommand(command);
        return await base.ReaderExecutingAsync(command, eventData, result, cancellationToken);
    }

    public override InterceptionResult<object> ScalarExecuting(
       DbCommand command, CommandEventData eventData,
       InterceptionResult<object> result
    ) {
        FixCommand(command);
        return base.ScalarExecuting(command, eventData, result);
    }

    public override ValueTask<InterceptionResult<object>> ScalarExecutingAsync(
        DbCommand command, CommandEventData eventData,
        InterceptionResult<object> result, CancellationToken cancellationToken = default
    ) {
        FixCommand(command);
        return base.ScalarExecutingAsync(command, eventData, result, cancellationToken);
    }

    private static void FixCommand(IDbCommand command) {
        string commandText = command.CommandText;

        // 部分異動情境，例如先查詢後異動，EF 也有可能是呼叫 ExecuteReader，而非 ExecuteNonQuery
        // 所以要排除此情況
        if (cudRegex.IsMatch(commandText)) {
            return;
        }

        // 如果是呼叫 Single 或是 First，那可能是追求比較精確的資料，例如取得資料做異動，就不該加 NOLOCK
        if (!commandText.Contains("TOP(1)") && !commandText.Contains("TOP(2)")) {
            commandText = tableAliasRegex.Replace(commandText, "${tableAlias} WITH (NOLOCK)");
        }

        // 雖然 EF 產生的 Select 語句沒有分號結尾，只有異動語句有，但為了預防萬一，還是需要處理一下
        commandText = commandText.TrimEnd(';') + " OPTION (OPTIMIZE FOR UNKNOWN);";

        command.CommandText = commandText;
    }
}
```

### 程式碼說明

1. `DbCommandInterceptor` 已經實作了 `IDbCommandInterceptor` 的所有方法，所以只需繼承它並覆寫需要的方法。
2. 與查詢相關的方法有 `ExecuteReader()` 和 `ExecuteScalar()`，因此針對這兩個方法的同步與非同步版本來覆寫 `IDbCommandInterceptor` 所對應的執行前方法。
3. `CommandText` 修正：
    * 部分包含回傳值的異動語法，可能會使用 `ExecuteScalar()` 執行，因此遇到 `INSERT`、`UPDATE` 和 `DELETE` 的語法不處理。
    * `WITH (NOLOCK)` 是為了在資料被鎖定時不被阻塞，但如果是撈取資料來做異動，就不適合使用，因此遇到包含 `TOP(1)` (例如：`First()` 或 `Find()`) 和 `TOP(2)` (例如：`Single()`) 的語法不處理。
    * 增加 `OPTION (OPTIMIZE FOR UNKNOWN);` 來處理 Parameter Sniffing。

::: warning
以上處理缺乏實際使用的驗證，請依照自身實際情況調整。
:::

## 加入 Interceptor

可以使用以下兩種方法加入 Interceptor：

* 在 DbContext 中加入以下程式碼：

```csharp
 protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        => optionsBuilder.AddInterceptors(new FixDbCommandInterceptor());
```

* 在 DI 中注入 `DbContext` 時，從 `DbContextOptionsBuilder` 設定：

```csharp
services.AddDbContext<TestDbContext>(options => {
    options
        .UseSqlServer(DbConnectionString)
        .AddInterceptors(new FixDbCommandInterceptor());
});
```

## 實際執行結果

使用以下 SQL 建立資料表，並用反向工程建立 EF：

```sql
CREATE TABLE [dbo].[Test](
    [Id] [int] IDENTITY(1,1) NOT NULL,
    [TestInt] [int] NOT NULL,
    [TestBit] [bit] NOT NULL,
    [TestDateTime] [datetime2](7) NOT NULL,
    [TestGuid] [uniqueidentifier] NOT NULL,
    CONSTRAINT [PK_Test] PRIMARY KEY CLUSTERED (
 [Id] ASC
) WITH (
    PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[SubTest](
    [Id] [int] IDENTITY(1,1) NOT NULL,
    [TestId] [int] NOT NULL,
    CONSTRAINT [PK_SubTest] PRIMARY KEY CLUSTERED (
 [Id] ASC
) WITH (
    PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[SubTest]  WITH CHECK ADD  CONSTRAINT [FK_SubTest_Test] FOREIGN KEY([TestId])
REFERENCES [dbo].[Test] ([Id])
GO
```

執行以下程式：

```csharp
context.Tests.Find(1);

context.Tests
    .Include(x => x.SubTests)
    .SingleOrDefault(x => x.Id == 1);

context.Tests
    .Include(x => x.SubTests)
    .ToList();
```

產生的 SQL 語法如下：

```sql
-- Find()
SELECT TOP(1) [t].[Id], [t].[TestBit], [t].[TestDateTime], [t].[TestGuid], [t].[TestInt]
FROM [Test] AS [t]
WHERE [t].[Id] = @__p_0 OPTION (OPTIMIZE FOR UNKNOWN);

-- SingleOrDefault()
SELECT [t0].[Id], [t0].[TestBit], [t0].[TestDateTime], [t0].[TestGuid], [t0].[TestInt], [s].[Id], [s].[TestId]
FROM (
    SELECT TOP(2) [t].[Id], [t].[TestBit], [t].[TestDateTime], [t].[TestGuid], [t].[TestInt]
    FROM [Test] AS [t]
    WHERE [t].[Id] = 1
) AS [t0]
LEFT JOIN [SubTest] AS [s] ON [t0].[Id] = [s].[TestId]
ORDER BY [t0].[Id] OPTION (OPTIMIZE FOR UNKNOWN);

-- ToList()
SELECT [t].[Id], [t].[TestBit], [t].[TestDateTime], [t].[TestGuid], [t].[TestInt], [s].[Id], [s].[TestId]
FROM [Test] AS [t] WITH (NOLOCK)
LEFT JOIN [SubTest] AS [s] WITH (NOLOCK) ON [t].[Id] = [s].[TestId]
ORDER BY [t].[Id] OPTION (OPTIMIZE FOR UNKNOWN);
```

## 異動歷程

* 2024-07-18 初版文件建立。
