# 淺談 Entity Framework 中的預設值行為

[![hackmd-github-sync-badge](https://hackmd.io/dsKavEibTKGfN58w1L3DJA/badge)](https://hackmd.io/dsKavEibTKGfN58w1L3DJA)


## 前言
事情的起因是，我發現專案中大家對於字串型別空值的處理方式不一致，因此決定統一為 `NOT NULL` 並存空字串。不久之後，我看到同事寫了一段類似這樣的程式碼：`entity.other = input.item == 3 ? input.other : null;`。這讓我感到疑惑，因為早上才決定統一存空字串，為什麼他存的是 `null`？

我問了我同事，他回覆說他有測試過，資料庫欄位設置為 `NOT NULL Default ''`，即使 Entity 的 Property 存的是 `null`，在新增的時候，資料庫會寫入空字串。如果是更新操作，他會明確設置為空字串。

我當時回應他，應該是要看有沒有觸發設值行為才對。他說他要下班，隔天會再測給我看。不過其實我也不確定我的認知是否正確，因為我知道 Entity Framework 在更新資料時，如果新值與舊值相同，`SaveChanges()` 的回傳值會是 `0`。所以，有可能不是依靠 Entity 屬性是否設值來判定是否有變更，而是通過新值與舊值是否相同來判定。

後來我也進行了測試，結果和他相同，但最終還是告訴他，不管怎樣，他的程式碼還是需要調整。否則，其他人看程式碼會以為存的是 `null`，實際上靠 Entity Framework 和資料庫特性存成了空字串，這樣太不直觀了。

## 實際測試
以 SQL Server 來測試，先使用以下 SQL 來初始化資料表。
```sql
CREATE TABLE [dbo].[Test](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[Name] [varchar](50) NOT NULL, -- 為了測試不給值的情境而建立的無用欄位
	[TestVarchar] [varchar](50) NULL,
	[TestInt] [int] NULL,
    CONSTRAINT [PK_Test] PRIMARY KEY CLUSTERED (
	    [Id] ASC
    ) WITH (
        PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF
    ) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[Test] ADD  CONSTRAINT [DF_Test_TestVarchar]  DEFAULT ('TestVarchar') FOR [TestVarchar]
GO

ALTER TABLE [dbo].[Test] ADD  CONSTRAINT [DF_Test_TestInt]  DEFAULT ((1234)) FOR [TestInt]
GO
```

### SQL 測試
執行以下 SQL 指令：
```sql
INSERT INTO Test (Name, TestVarchar, TestInt) VALUES ('Name', default, default);
INSERT INTO Test (Name, TestVarchar, TestInt) VALUES ('Name', null, null);
INSERT INTO Test (Name) VALUES ('Name');
```

產生 SQL 如下：
| Name | TestVarchar | TestInt |
| --- | --- | --- |
| Name | TestVarchar | 1234 |
| Name | NULL | NULL |
| Name | TestVarchar | 1234 |

由以上結果可以看出當 SQL 未給值，或是給予 `default` 時，會給予 SQL 預設值，但直接給 `null` 則不會，因此不會是 SQL 的機制造成的。


### Entity Framework 測試
使用 .NET 8，安裝 Microsoft.EntityFrameworkCore 8.06，並使用反向工程建立 Entity Framework。產生的程式如下：
```csharp
public partial class TestContext : DbContext {
    public TestContext(DbContextOptions<TestContext> options)
        : base(options) {
    }

    public virtual DbSet<Test> Tests { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder) {
        modelBuilder.Entity<Test>(entity =>
        {
            entity.ToTable("Test");

            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.TestInt).HasDefaultValue(1234);
            entity.Property(e => e.TestVarchar)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasDefaultValue("TestVarchar");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}

public partial class Test {
    public int Id { get; set; }

    public string Name { get; set; }

    public string TestVarchar { get; set; }

    public int? TestInt { get; set; }
}
```

執行以下程式。
```csharp
using (TestContext context = new(dbContextOptions)) {
    context.Tests.Add(new() {
        Name = "Name"
    });
    context.SaveChanges();

    context.Tests.Add(new() {
        Name = "Name",
        TestVarchar = null,
        TestInt = null
    });
    context.SaveChanges();
}
```

產生 SQL 如下：
```sql
INSERT INTO [Test] ([Name])
OUTPUT INSERTED.[Id], INSERTED.[TestInt], INSERTED.[TestVarchar]
VALUES (@p0);

INSERT INTO [Test] ([Name])
OUTPUT INSERTED.[Id], INSERTED.[TestInt], INSERTED.[TestVarchar]
VALUES (@p0);
```

執行結果如下：
| Name | TestVarchar | TestInt |
| --- | --- | --- |
| Name | TestVarchar | 1234 |
| Name | TestVarchar | 1234 |

由以上結果可以發現，不論是沒有設值，還是給予 `null`，最終產生的 INSERT 語法都會忽略該欄位。推測原因是 Entity Framework 不是用 Property 設值的行為來判定異動，而是比對新舊值。而 `string` 和 `int?` 的預設值都是 `null`，所以不管是沒設值還是設為 `null`，初始值都沒變，因此INSERT 語法忽略此欄位。

當時測到這邊，馬上想到一件很可怕的事，C# `int` 的預設值是 `0`，`bool` 的預設值是 `false`，如果初始值設定別的值，不就會造成設值與結果不相符的情況？

### struct 型別測試
使用以下 SQL 建立第二張資料表來測試結果。
```sql
CREATE TABLE [dbo].[Test2](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[TestInt] [int] NOT NULL,
	[TestBit] [bit] NOT NULL,
	[TestDateTime] [datetime2](7) NOT NULL,
	[TestGuid] [uniqueidentifier] NOT NULL,
    CONSTRAINT [PK_Test2] PRIMARY KEY CLUSTERED (
	    [Id] ASC
    ) WITH (
        PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON,
            OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF
    ) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[Test2] ADD  CONSTRAINT [DF_Test2_TestInt]  DEFAULT ((1234)) FOR [TestInt]
GO

ALTER TABLE [dbo].[Test2] ADD  CONSTRAINT [DF_Test2_TestBit]  DEFAULT ((1)) FOR [TestBit]
GO

ALTER TABLE [dbo].[Test2] ADD  CONSTRAINT [DF_Test2_TestDateTime]  DEFAULT ('2024-01-01 12:00:00') FOR [TestDateTime]
GO

ALTER TABLE [dbo].[Test2] ADD  CONSTRAINT [DF_Test2_TestGuid]  DEFAULT ('21EC2020-3AEA-1069-A2DD-08002B30309D') FOR [TestGuid]
GO
```

Entity 相關程式碼如下：
```csharp
// DbContext
modelBuilder.Entity<Test2>(entity =>
{
    entity.ToTable("Test2");

    entity.Property(e => e.TestBit).HasDefaultValue(true);
    entity.Property(e => e.TestDateTime).HasDefaultValue(new DateTime(2024, 1, 1, 12, 0, 0, 0, DateTimeKind.Unspecified));
    entity.Property(e => e.TestGuid).HasDefaultValue(new Guid("21ec2020-3aea-1069-a2dd-08002b30309d"));
    entity.Property(e => e.TestInt).HasDefaultValue(1234);
});

// Entity
public partial class Test2 {
    public int Id { get; set; }

    public int TestInt { get; set; }

    public bool TestBit { get; set; }

    public DateTime TestDateTime { get; set; }

    public Guid TestGuid { get; set; }
}
```

執行以下程式：
```csharp
using (TestContext context = new(dbContextOptions)) {
    context.Test2s.Add(new Test2());
    context.SaveChanges();

    context.Test2s.Add(new() {
        TestInt = default,
        TestBit = default,
        TestDateTime = default,
        TestGuid = default,
    });
    context.SaveChanges();
}
```

產生 SQL 如下：
```sql
INSERT INTO [Test2] ([TestBit])
OUTPUT INSERTED.[Id], INSERTED.[TestDateTime], INSERTED.[TestGuid], INSERTED.[TestInt]
VALUES (@p0);

 INSERT INTO [Test2] ([TestBit])
OUTPUT INSERTED.[Id], INSERTED.[TestDateTime], INSERTED.[TestGuid], INSERTED.[TestInt]
VALUES (@p0);
```

執行結果如下：
| Name | TestInt | TestBit | TestDateTime | TestGuid |
| --- | --- | --- | --- | --- |
| Name | 1234 | 0 | 2024-01-01 12:00:00.0000000 | 21EC2020-3AEA-1069-A2DD-08002B30309D |
| Name | 1234 | 0 | 2024-01-01 12:00:00.0000000 | 21EC2020-3AEA-1069-A2DD-08002B30309D |

看了以上結果稍微鬆了一口氣，至少 `TestBit` 並沒有被忽略，這代表新增時，是否會忽略欄位，還是會根據型別來判定。不然如果遇到預設值 為`true` 的 SQL 欄位，要寫入 `false`，結果實際寫成 `true`，那這個畫面太美，我不敢看。

不過測到這時，我有另一個疑惑，`TestInt` 會寫入 `1234`，是因為 SQL 有給預設值 `1234`，那如果沒給預設值，是會寫入 `0`，還是無法寫入資料呢？

這邊我把 SQL Server 資料表 `Test2` 欄位的預設值都拿掉，執行反向工程後，重新執行寫入程式，產生 SQL 如下：
```csharp
INSERT INTO [Test2] ([TestBit], [TestDateTime], [TestGuid], [TestInt])
OUTPUT INSERTED.[Id]
VALUES (@p0, @p1, @p2, @p3);

INSERT INTO [Test2] ([TestBit], [TestDateTime], [TestGuid], [TestInt])
OUTPUT INSERTED.[Id]
VALUES (@p0, @p1, @p2, @p3);
```

執行結果如下：
| Name | TestInt | TestBit | TestDateTime | TestGuid |
| --- | --- | --- | --- | --- |
| Name | 0 | 0 | 0001-01-01 00:00:00.0000000 | 00000000-0000-0000-0000-000000000000 |
| Name | 0 | 0 | 0001-01-01 00:00:00.0000000 | 00000000-0000-0000-0000-000000000000 |

由以上結果可以得知，當未設定 SQL 預設值時，當 Entity 屬性或給值，或是給與 C# 初始值相同的值時，產生的 INSERT 語法，並***不會***忽略該欄位。

:::warning
後續有測試，如果有使用 EF Core Power Tools 來做反向工程，當選擇 .NET 6 和 .NET 7 的版本，針對 `bit` 欄位產生結果不同，Entity 屬性型別會是 `bool?`，然後指定 `Required`。
```csharp
// DbContext
modelBuilder.Entity<Test2>(entity => {
    entity.ToTable("Test2");

    entity.Property(e => e.TestBit)
        .IsRequired()
        .HasDefaultValueSql("((1))");
    entity.Property(e => e.TestDateTime).HasDefaultValueSql("('2024-01-01 12:00:00')");
    entity.Property(e => e.TestGuid).HasDefaultValueSql("('21EC2020-3AEA-1069-A2DD-08002B30309D')");
    entity.Property(e => e.TestInt).HasDefaultValueSql("((1234))");
});

public partial class Test2 {
    public int Id { get; set; }

    public int TestInt { get; set; }

    public bool? TestBit { get; set; }

    public DateTime TestDateTime { get; set; }

    public Guid TestGuid { get; set; }
}
```

產生出來的 SQL 會發現，`TestBit` 也被忽略了...
```sql
INSERT INTO [Test2]
OUTPUT INSERTED.[Id], INSERTED.[TestBit], INSERTED.[TestDateTime], INSERTED.[TestGuid], INSERTED.[TestInt]
DEFAULT VALUES;

INSERT INTO [Test2]
OUTPUT INSERTED.[Id], INSERTED.[TestBit], INSERTED.[TestDateTime], INSERTED.[TestGuid], INSERTED.[TestInt]
DEFAULT VALUES;
```
:::

## 結論
* 當 SQL Server 欄位有設定預設值時，Entity Framework 在新增資料時，如果 Entity 屬性值與該型別的預設值一致，某些型別的欄位在產生 INSERT 語法時會被忽略。
* 使用 Entity Framework 時，盡量不要使用 SQL 預設值，如果使用，也應確保 SQL 預設值與 C# 預設值一致，以避免發生預期外結果。但對於字串型別，可將其設為 `NOT NULL Default ''`，以統一處理 `null` 和空字串。

## 同場加映

### 更新 Entity 但其值不變
前言有提到，當更新資料時，即使 Entity 屬性已設值但其值不變，`SaveChanges()` 的回傳值會是 `0`。以下是測試範例：

首先使用以下 SQL 建立新的資料表
```sql
CREATE TABLE [dbo].[Test3](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[TestVarchar] [varchar](50) NOT NULL,
	[TestInt] [int] NOT NULL,
	[TestBit] [bit] NOT NULL,
    CONSTRAINT [PK_Test3] PRIMARY KEY CLUSTERED (
	    [Id] ASC
    ) WITH (
        PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF
    ) ON [PRIMARY]
) ON [PRIMARY]
GO
```

建立三筆一樣的資料，資料值如下：
TestVarchar | TestInt | TestBit |
| --- | --- | --- |
TestVarchar | 1234 | 1 |
TestVarchar | 1234 | 1 |
TestVarchar | 1234 | 1 |

```csharp
using (TestContext context = new(dbContextOptions)) {
    Test3 entity = context.Test3s.Single(x => x.Id == 1);
    entity.TestVarchar = entity.TestVarchar;
    entity.TestInt = entity.TestInt;
    entity.TestBit = entity.TestBit;

    int changedCount = context.SaveChanges();
    Console.WriteLine("EntityState:" + context.Entry(entity).State);
    Console.WriteLine("ChangedCount:" + changedCount);
}
```

Console 結果如下：
```
info: Microsoft.EntityFrameworkCore.Database.Command[20101]
      Executed DbCommand (18ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
      SELECT TOP(2) [t].[Id], [t].[TestBit], [t].[TestInt], [t].[TestVarchar]
      FROM [Test3] AS [t]
      WHERE [t].[Id] = 1
EntityState:Unchanged
ChangedCount:0
```

從以上結果可以看到，即使 Entity 有設值，`EntityState` 仍然保持為 `Unchanged`，且並未執行任 Update 語法，導致 `SaveChanges()` 的結果為 `0`。因此，在 Business Service 的 Update 方法中，判斷執行結果應使用 `context.Entry(entity).State == EntityState.Unchanged || context.SaveChanges() > 0`，避免當其值不變時，導致誤判。

### 正確使用 AsNoTracking() 避免 EntityState 不必要修改
在我目前的公司，有些同事常常犯的錯誤是沒弄清楚 `AsNoTracking()` 的正確使用時機，導致在執行UPDATE 前，使用 SELECT 取得資料時，也使用了 `AsNoTracking()`，這就要求額外設置 `context.Entry(entity).State = EntityState.Modified;` 才能正確執行更新操作。雖然最終結果是一致的，但產生的 SQL 語法卻有所不同。

這裡使用以下程式碼進行了測試，這三筆資料的 `Name` 欄位值都為 `Name`，並使用以下程式改為 `NewName`。

```csharp
using (TestContext context = new(dbContextOptions)) {
    Test entity1 = context.Tests.Single(x => x.Id == 1);
    entity1.Name = "NewName";
    context.SaveChanges();

    Test entity2 = context.Tests.Single(x => x.Id == 2);
    entity2.Name = "NewName";
    context.Entry(entity2).State = EntityState.Modified;
    context.SaveChanges();

    Test entity3 = context.Tests.AsNoTracking().Single(x => x.Id == 3);
    entity3.Name = "NewName";
    context.Entry(entity3).State = EntityState.Modified;
    context.SaveChanges();
}
```

這些程式碼所產生的 SQL 語法如下：
```sql
-- 沒有使用 AsNoTracking()，且沒手動設置 EntityState.Modified
SELECT TOP(2) [t].[Id], [t].[Name], [t].[TestInt], [t].[TestVarchar]
FROM [Test] AS [t]
WHERE [t].[Id] = 1

UPDATE [Test] SET [Name] = @p0
OUTPUT 1
WHERE [Id] = @p1;

-- 沒有使用 AsNoTracking()，但手動設置 EntityState.Modified
SELECT TOP(2) [t].[Id], [t].[Name], [t].[TestInt], [t].[TestVarchar]
FROM [Test] AS [t]
WHERE [t].[Id] = 2

UPDATE [Test] SET [Name] = @p0, [TestInt] = @p1, [TestVarchar] = @p2
OUTPUT 1
WHERE [Id] = @p3;

-- 使用了 AsNoTracking()，並手動設置 EntityState.Modified
SELECT TOP(2) [t].[Id], [t].[Name], [t].[TestInt], [t].[TestVarchar]
FROM [Test] AS [t]
WHERE [t].[Id] = 3

UPDATE [Test] SET [Name] = @p0, [TestInt] = @p1, [TestVarchar] = @p2
OUTPUT 1
WHERE [Id] = @p3;
```

從這些結果可以看出，正常的 UPDATE 語法只會更新已設定值的欄位，然而當手動設置 `context.Entry(entity).State = EntityState.Modified;` 時，則會導致所有欄位被更新。

###### tags `.NET` `.NET Core & .NET 5+` `Entity Framework`