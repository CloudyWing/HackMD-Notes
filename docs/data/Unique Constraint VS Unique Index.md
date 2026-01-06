---
title: "Unique Constraint VS Unique Index"
date: 2024-07-25
lastmod: 2024-07-25
description: "比較 SQL Server 中 Unique Constraint 與 Unique Index 的異同。指兩者在資料唯一性與查詢效能上功能相似，且建立 Unique Constraint 時會自動建立 Unique Index，主要差異在於語意與 Foreign Key 的關聯限制。"
tags: ["SQL Server"]
---

# Unique Constraint VS Unique Index

最近在回顧之前寫的 [SQL Server 效能調教](SQL%20Server%20%E6%95%88%E8%83%BD%E8%AA%BF%E6%95%99.md) 文章時，發現有關索引的前綴詞寫得不完整。參考這篇文章「[你需要明白的索引和约束的前缀（AK,PK,IX,CK,FK,DF,UQ）](https://www.cnblogs.com/flysun0311/archive/2013/02/28/2936588.html)」後，補充如下：

- Primary Key：PK_TableName。
- Clustered Index：CX_TableName_Column1_Column2。
- Non-Clustered Index：IX_TableName_Column1_Column2。
- Unique Index (Alternate Key)：AK_TableName_Column1_Column2。
- Unique Constraint：UQ_TableName_Column1_Column2。
- Check Constraint：CK_TableName_Column1_Column2。
- Default Constraint：DF_TableName_Column1_Column2。
- Foreign Key：FK_TableName1_Column1_Column2_TableName2。

補充後，發現與資料唯一性相關的有 Unique Constraint（唯一約束）和 Unique Index（唯一索引）。

從命名上來看，Constraint 是用於確保資料完整性，而 Index 是用於查詢效能上。但實際上，Unique Index 也能確保資料的唯一性。

根據文章「[建立唯一的條件約束](https://learn.microsoft.com/zh-tw/sql/relational-databases/tables/create-unique-constraints?view=sql-server-ver16)」，當建立 Unique Constraint 時，會同時建立 Unique Index。

那麼，建立 Unique Constraint 的意義何在？
網路上有一說法是 Foreign Key 只能關聯到 Unique Constraint。畢竟 Foreign Key 有一個建立失敗的錯誤訊息是「資料表中的資料行與現有主索引鍵或 UNIQUE 條件約束不相符」。

Constraint 還是 Unique Index 都可以成功。

```sql
CREATE TABLE [dbo].[Main](
 [Id] [uniqueidentifier] NOT NULL,
 [SeqNo] [bigint] IDENTITY(1,1) NOT NULL,
 [UQ] [bigint] NULL,
 [AK] [bigint] NULL,
    CONSTRAINT [PK_Main] PRIMARY KEY NONCLUSTERED (
     [Id] ASC
    ) WITH (
     PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF
    ) ON [PRIMARY],
    CONSTRAINT [UQ_Main] UNIQUE NONCLUSTERED (
     [UQ] ASC
    ) WITH (
        PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF
    ) ON [PRIMARY]
) ON [PRIMARY]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Ref](
 [Id] [bigint] IDENTITY(1,1) NOT NULL,
 [MainId] [uniqueidentifier] NOT NULL,
 [RefSeqNo] [bigint] NOT NULL,
 [RefUQ] [bigint] NULL,
 [RefAK] [bigint] NULL
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[Ref]  WITH CHECK ADD  CONSTRAINT [FK_Ref_Main] FOREIGN KEY([MainId])
REFERENCES [dbo].[Main] ([Id])
GO
ALTER TABLE [dbo].[Ref] CHECK CONSTRAINT [FK_Ref_Main]
GO
ALTER TABLE [dbo].[Ref]  WITH CHECK ADD  CONSTRAINT [FK_Ref_Main_AK] FOREIGN KEY([RefAK])
REFERENCES [dbo].[Main] ([AK])
GO
ALTER TABLE [dbo].[Ref] CHECK CONSTRAINT [FK_Ref_Main_AK]
GO
ALTER TABLE [dbo].[Ref]  WITH CHECK ADD  CONSTRAINT [FK_Ref_Main_UQ] FOREIGN KEY([RefUQ])
REFERENCES [dbo].[Main] ([UQ])
GO
ALTER TABLE [dbo].[Ref] CHECK CONSTRAINT [FK_Ref_Main_UQ]
GO
```

然後再節錄此篇文章「[建立唯一索引](https://learn.microsoft.com/zh-tw/sql/relational-databases/indexes/create-unique-indexes?view=sql-server-ver16)」，在 SQL Server 中，Unique Constraint 主要是是在語意上更為明確。

> 建立 UNIQUE 條件約束與建立獨立於條件約束之外的唯一索引，兩者並無明顯差異。 資料驗證的方式相同，而且查詢最佳化工具不會區分由條件約束建立或由手動建立的唯一索引。 不過，在資料行上建立 UNIQUE 條件約束，會使索引目標更明確。

## 建立 Unique Constraint 與 Unique Index

### 使用 SQL 建立

使用 SQL 建立 Unique Constraint，請把 `{}` 替換成相應內容。

```sql
ALTER TABLE {TableName} ADD CONSTRAINT {IndexName} UNIQUE {ColumnName});   
CREATE UNIQUE INDEX {IndexName} ON {TableName} ({ColumnName});

-- 例如：ALTER TABLE Main ADD CONSTRAINT UQ_Main_UQ UNIQUE (UQ);
```

使用 SQL 建立 Unique Index，請把 `{}` 替換成相應內容。

```sql
CREATE UNIQUE INDEX {IndexName} ON {TableName} ({ColumnName});

-- 例如：CREATE UNIQUE INDEX AK_Main_AK ON Main (AK);
```

### 使用 SSMS 建立

1. 開啟資料表設計，右鍵選\[索引/索引鍵\]。
2. 根據需要選擇設定：
   - Unique Constraint：
      - 型別：唯一索引鍵。
      - 是唯一：是（會自動幫你選擇，並會顯示灰底不能變更)。
   - Unique Index：
      - 型別：索引。
      - 是唯一：是。

::: tip
如果只是單純建立索引，也可以在「索引」資料夾，按右鍵選「新增索引」，需注意如果開啟設計，「新增索引」會是反灰無法選擇。
:::

### SSMS 顯示

如何知道自己建立的是 Unique Constraint 還是 Unique Index？

從 SSMS 顯示上來看，「索引鍵」資料夾會顯示 Primary Key、Unique Constraint 和 Foreign Key 這幾個和條件約束相關的索引。而「索引」資料夾會顯示除了 Foreign Key 以外的索引。

## 異動歷程

- 2024-07-25 初版文件建立。
