---
title: "淺談 Entity Framework 中 SaveChanges() 的異常處理與狀態還原"
date: 2024-08-17
lastmod: 2024-08-17
description: "整理 EF Core 常見例外 (DbUpdateException, DbUpdateConcurrencyException) 的處理方式。說明如何在發生錯誤時，透過 `Reload()` 或重置 Entity State 來還原 `ChangeTracker` 狀態，避免後續寫入受阻。"
tags: [".NET","C#","Entity Framework"]
---

# 淺談 Entity Framework 中 SaveChanges() 的異常處理與狀態還原

這應該是近期最後一篇 Entity Framework 的相關筆記，明明最近在研究 WSL，結果筆記都是 Entity Framework，搞得我好像我近期和 Entity Framework 槓上一樣。

這本來是要拆兩篇寫，但內容相關性較高，我又有點懶，就併到同一篇寫。

## Entity Framework 的 Exception 訊息

Entity Framework 常見的 Exception 有以下三個：

- DbUpdateException：
當儲存至資料庫時發生錯誤 (例如違反資料庫約束或其他儲存操作失敗) 時，所拋出的 Exception。這個 Exception 通常用來封裝更底層的 Exception，如資料庫連線錯誤或 SQL 執行錯誤。

- DbUpdateConcurrencyException：
當儲存至資料庫時發生並發問題時，所拋出的 Exception。通常會在 Entity 類型中設定了 `RowVersion` 或 `ConcurrencyCheck` 特性時發生，這些特性用於實現並發控制。當 EF 發現資料庫中的資料已被其他操作修改，而當前操作的資料版本與之不符合時，就會拋出這個 Exception。

- DbEntityValidationException：
當呼叫 `SaveChanges()` 且 Entity 的驗證失敗時，所拋出的 Exception。這個 Exception 通常用於捕捉 Entity 的資料驗證錯誤，例如屬性值不符合資料註釋（如 `[Required]`、`[MaxLength]`）的要求。已於在 Entity Framework Core 中被移除。

::: tip
之前在處理 Entity Framework 的錯誤訊息時，我發現找不到 `DbEntityValidationException`，剛剛查才發現這個例外已經被移除，說實話有點意外。至於被移除的可能原因，可以參考保哥的「[EF Core 已經不會在 SaveChanges() 的時候對實體模型進行額外驗證](https://blog.miniasp.com/post/2022/04/23/EF-Core-has-no-ValidateOnSaveEnabled-anymore)」。
雖然我認為 Model Binding 的驗證和 Entity 的驗證應該要分開來看，但仔細想想，Entity 的驗證的好處是在寫入資料庫前進行檢核，這樣可以減少一些開銷。但在實務上 Model Binding 和 Service Layer 的驗證已經能夠擋掉大部分情境，因此用到 Entity 驗證的機會確實不多。
:::

說一句老實話，每次看到 EF Exception 的訊息都會很困擾，例如可能會看到以下訊息：

- EF Core 的 `DbUpdateException` 訊息：

> An error occurred while saving the entity changes. See the inner exception for details.

- EF 的 `DbEntityValidationException` 訊息：

> 一個或多個實體的驗證失敗。如需詳細資料，請參閱 'EntityValidationErrors' 屬性。

鬼才知道是什麼原因，變成需要針對這幾個 Exception 做特別處理。
如何處理 Entity Exception，主要取決於發生 Exception（這裡指的是全部的 Exception）時，前端是否會看到 Exception 的錯誤訊息：

- 當系統會直接將原始的 Exception 訊息回傳給前端時。為了避免前端看到過多詳細資訊，應選擇在寫入 Exception Log 時，從 `InnerException` 或 `EntityValidationErrors` 中提取完整的錯誤訊息並記錄到 Log 中。這樣既能保證 Log 中有詳細的錯誤資訊，也能讓前端僅看到原本的攏統訊息。
- 前端無法看到 Exception 訊息：
在這種情況下，可以直接在 DbContext 中覆寫 `SaveChanges()` 方法來捕獲 Entity Exception，並重新拋出一個相同類型的 Exception，將 `Message` 設為完整的錯誤訊息。這樣 Exception Log 也不需要額外處理，讓錯誤處理和權責劃分更為清楚。

## SaveChanges() 失敗時，還原 Entity 狀態

在資料處理過程中，通常會藉由資料庫的資料檢核來確保不會寫入異常資料，或依賴預設值來避免因為資料遺漏而導致的錯誤。但以為的想法來說，不應過度依賴資料庫檢核或預設值，因為這可能引發預期外的問題。這小節的內容正是源自於我多年前犯下的一個錯誤經驗。

當時的排程程式使用 ADO.NET 進行資料寫入，開發人員為了省事，在寫入資料前並未檢查是否有重複資料，而是依賴主鍵來阻擋重複資料。當我將這段程式碼翻寫成 Entity Framework 時，也延續了這種處理方式。根據之前的「[淺談 Entity Framework 的導覽屬性與外鍵的同步更新](淺談 Entity Framework 的導覽屬性與外鍵的同步更新.md#%E7%AF%84%E4%BE%8B-13savechanges-%E5%A4%B1%E6%95%97)」中提到，`SaveChanges()` 執行失敗時，Entity 狀態會保留。這代表，如果第一次資料的 `SaveChanges()` 失敗，當嘗試新增第二筆資料並再次呼叫 `SaveChanges()` 時，產生的 SQL 語句會包含第一次的資料。因此，一旦發生一次失敗，後續的所有變更也將一同失敗。

當然 `SaveChanges()` 失敗後保留 Entity 狀態時，這在某些情況下會有幫助的，例如因網路不穩定導致的失敗，允許重試 `SaveChanges()`。我曾見過一些專案中，當 `SaveChanges()` 失敗時會自動重試最多三次，直到成功或放棄。但如果在特定情境下不希望失敗的變更被保留，可以考慮覆寫 `SaveChanges()`，並在捕捉到 `DbUpdateException` 時，還原 Entity 的狀態，以忽略該次異動。

::: tip
在是否應該設定預設值這個問題上，業界有不同的觀點，主要可以分為兩種：

- 支援設定預設值的：
設定預設值有助於在資料遺漏或未存值時避免錯誤，這樣可以降低應用程式出現問題的機率，並確保資料的完整性。

- 反對設定預設值的：
支援將欄位設為 `NOT NULL` 並且不設定預設值，這樣在資料未正確存值時，程式會立即報錯，幫助開發者及早發現並修正潛在的問題，避免隱藏錯誤的風險。

兩種作法的設計思路不同，也不能說誰對誰錯，但如果團隊沒特別要求，我個人傾向於第二種做法。
:::

::: warning
需注意，`SaveChanges()` 失敗後還原 Entity State 的方法僅適用於不含外鍵的 Entity 結構。具體原因將在後續說明。
:::

## 程式碼實作

這邊我就偷懶，把兩個小節的程式碼合併寫在一起。由於 EF Core 已經移除了 `DbEntityValidationException`，因此這部分我就不再處理了。
Entity State 的處理如以下表格：

| State | 狀態說明 | 處理方式 |
| --- | --- | --- |
| Detached | 未加入追蹤。 | 不需處理。 |
| Unchanged | 從資料庫取得且未異動的資料。 | 不需處理。 |
| Deleted | 從資料庫取得，且使用 `Remove 移除`。 | 把 `State` 改為 `Unchanged`。 |
| Modified | 從資料庫取得，且有異動過屬性。 | 把 `State` 改為 `Unchanged`，且使用 `entry.CurrentValues.SetValues(entry.OriginalValues)` 還原資料。 |
| Added | 僅存在本機端的資料。 | 把 `State` 改為 `Detached`。 |

```csharp
public partial class TestEFContext {
    public override int SaveChanges() {
        return SaveChanges(true);
    }

    public override int SaveChanges(bool acceptAllChangesOnSuccess) {
        try {
            return base.SaveChanges(acceptAllChangesOnSuccess);
        } catch (DbUpdateException ex) {
            throw ResetEntityStateAndFixMessage(ex);
        }
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) {
        return SaveChangesAsync(true, cancellationToken);
    }

    public override async Task<int> SaveChangesAsync(
        bool acceptAllChangesOnSuccess,
        CancellationToken cancellationToken = default
    ) {
        try {
            return await base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
        } catch (DbUpdateException ex) {
            throw ResetEntityStateAndFixMessage(ex);
        }
    }

    private DbUpdateException ResetEntityStateAndFixMessage(DbUpdateException ex) {
        ResetEntityStates(ChangeTracker.Entries());

        return new DbUpdateException(ex.InnerException.Message, ex);
    }

    private static void ResetEntityStates(IEnumerable<EntityEntry> entries) {
        foreach (EntityEntry entry in entries) {
            ResetEntityState(entry);
        }
    }

    private static void ResetEntityState(EntityEntry entry) {
        switch (entry.State) {
            case EntityState.Added:
                entry.State = EntityState.Detached;
                break;
            case EntityState.Modified:
                entry.CurrentValues.SetValues(entry.OriginalValues);
                entry.State = EntityState.Unchanged;
                break;
            case EntityState.Deleted:
                // 正常情況下，應該將已刪除的EntityState 設為 Unchanged
                // 但實際情況中，不管設 Unchanged 或是 Detached，當無法把透過 Remove() 移除的 Entity 加回導覽屬性
                // 反而將 EntityState 設為 Unchanged，可能會造成後續重新查詢資料時，導覽屬性仍然缺少之前 Remove() 的 Entity
                // 因此遇到關聯的 EntityEntry.State 設為 EntityState.Detached
                // 這樣至少導覽屬性在重新查詢資料時可以正常
                entry.State = entry.Entity is Dictionary<string, object>
                    ? EntityState.Detached
                    : EntityState.Unchanged;
                break;
        }
    }
}

```

### 測試結果

如果透過導覽屬性加入 Entity 時，該 Entity 也會被加入追蹤。所以問題比較有可能出現在移除關聯的情況下。因此，使用以下測試程式來測試移除關聯的情境：

Entity 結構如下：

```csharp
modelBuilder.Entity<Table1>(entity => {
    entity.ToTable("Table1");

    entity.Property(e => e.Id).ValueGeneratedNever();

    entity.HasMany(d => d.Table2s)
        .WithMany(p => p.Table1s)
        .UsingEntity<Dictionary<string, object>>(
            "TableRef",
            l => l.HasOne<Table2>().WithMany().HasForeignKey("Table2Id").OnDelete(DeleteBehavior.ClientSetNull).HasConstraintName("FK_TableRef_Table2"),
            r => r.HasOne<Table1>().WithMany().HasForeignKey("Table1Id").OnDelete(DeleteBehavior.ClientSetNull).HasConstraintName("FK_TableRef_Table1"),
            j => {
                j.HasKey("Table1Id", "Table2Id").HasName("PK_Table_3");

                j.ToTable("TableRef");
            });
});

modelBuilder.Entity<Table2>(entity => {
    entity.ToTable("Table2");

    entity.Property(e => e.Id).ValueGeneratedNever();
});

public partial class Table1 {
    public Table1() {
        Table2s = new HashSet<Table2>();
    }

    public long Id { get; set; }

    public virtual ICollection<Table2> Table2s { get; set; }
}

public partial class Table2 {
    public Table2() {
        Table1s = new HashSet<Table1>();
    }

    public long Id { get; set; }

    public virtual ICollection<Table1> Table1s { get; set; }
}
```

資料庫現存資料如下：
Table1

| Id |
| --- |
| 1 |
| 2 |
| 3 |

Table2

| Id |
| --- |
| 1 |
| 2 |

TableRef

| Table1Id | Table2Id |
| --- | --- |
| 1 | 1 |
| 2 | 2 |

使用以下程式碼進行測試：

```csharp
using TestEFContext dbContext = new(dbContextOptions);
// 取得 Table1 和 Table2 中的記錄，並包含相關的導覽屬性
Table1 table11 = dbContext.Table1s.Include(x => x.Table2s).Single(x => x.Id == 1);
Table1 table12 = dbContext.Table1s.Include(x => x.Table2s).Single(x => x.Id == 2);
Table2 table21 = dbContext.Table2s.Include(x => x.Table1s).Single(x => x.Id == 1);
Table2 table22 = dbContext.Table2s.Include(x => x.Table1s).Single(x => x.Id == 2);

PrintLog();

table11.Table2s.Remove(table21);

PrintLog();

table12.Table2s.Add(table21);

PrintLog();

try {
    // 故意引發主鍵衝突錯誤，嘗試插入一個已有的 Table1 記錄
    dbContext.Add(new Table1 {
        Id = 3
    });

    dbContext.SaveChanges();
} catch (Exception) {
}

PrintLog();

table11 = dbContext.Table1s.Include(x => x.Table2s).Single(x => x.Id == 1);
Console.WriteLine($"table11 的 Table2s 關聯數量: {table11.Table2s.Count}");

void PrintLog() {
    foreach (EntityEntry entry in dbContext.ChangeTracker.Entries()) {
        Console.WriteLine(entry.ToString());
    }

    // 輸出各 Table1 和 Table2 間的關聯數量
    Console.WriteLine($"table11 的 Table2s 關聯數量: {table11.Table2s.Count}");
    Console.WriteLine($"table12 的 Table2s 關聯數量: {table12.Table2s.Count}");
    Console.WriteLine($"table21 的 Table1s 關聯數量: {table21.Table1s.Count}");
    Console.WriteLine($"table22 的 Table1s 關聯數量: {table22.Table1s.Count}");

    Console.WriteLine();
}
```

執行結果如下：

```text
Table1 {Id: 1} Unchanged
Table2 {Id: 1} Unchanged
Table1 {Id: 2} Unchanged
Table2 {Id: 2} Unchanged
TableRef (Dictionary<string, object>) {Table1Id: 1, Table2Id: 1} Unchanged FK {Table1Id: 1} FK {Table2Id: 1}
TableRef (Dictionary<string, object>) {Table1Id: 2, Table2Id: 2} Unchanged FK {Table1Id: 2} FK {Table2Id: 2}
table11 的 Table2s 關聯數量: 1
table12 的 Table2s 關聯數量: 1
table21 的 Table1s 關聯數量: 1
table22 的 Table1s 關聯數量: 1

Table1 {Id: 1} Unchanged
Table2 {Id: 1} Unchanged
Table1 {Id: 2} Unchanged
Table2 {Id: 2} Unchanged
TableRef (Dictionary<string, object>) {Table1Id: 1, Table2Id: 1} Deleted FK {Table1Id: 1} FK {Table2Id: 1}
TableRef (Dictionary<string, object>) {Table1Id: 2, Table2Id: 2} Unchanged FK {Table1Id: 2} FK {Table2Id: 2}
table11 的 Table2s 關聯數量: 0
table12 的 Table2s 關聯數量: 1
table21 的 Table1s 關聯數量: 0
table22 的 Table1s 關聯數量: 1

Table1 {Id: 1} Unchanged
Table2 {Id: 1} Unchanged
Table1 {Id: 2} Unchanged
Table2 {Id: 2} Unchanged
TableRef (Dictionary<string, object>) {Table1Id: 2, Table2Id: 1} Added FK {Table1Id: 2} FK {Table2Id: 1}
TableRef (Dictionary<string, object>) {Table1Id: 1, Table2Id: 1} Deleted FK {Table1Id: 1} FK {Table2Id: 1}
TableRef (Dictionary<string, object>) {Table1Id: 2, Table2Id: 2} Unchanged FK {Table1Id: 2} FK {Table2Id: 2}
table11 的 Table2s 關聯數量: 0
table12 的 Table2s 關聯數量: 2
table21 的 Table1s 關聯數量: 1
table22 的 Table1s 關聯數量: 1

Exception 錯誤

Table1 {Id: 1} Unchanged
Table2 {Id: 1} Unchanged
Table1 {Id: 2} Unchanged
Table2 {Id: 2} Unchanged
TableRef (Dictionary<string, object>) {Table1Id: 2, Table2Id: 2} Unchanged FK {Table1Id: 2} FK {Table2Id: 2}
table11 的 Table2s 關聯數量: 0
table12 的 Table2s 關聯數量: 1
table21 的 Table1s 關聯數量: 0
table22 的 Table1s 關聯數量: 1
```

從結果來看，當從導覽屬性增加或刪除關聯時，並不會影響到 Entity State，但是實際上還是會產生一筆關聯的 `EntityEntry`，但是將關聯的 `EntityEntry.State` 還原時，僅會還原 `Add()` 的異動，而不會處理 `Remove()` 的部分。

有關 `TestEFContext` 的第 50 行處理 `EntityState.Deleted` 情境，以下針對 TableRef 的 Entity State 的處理方式不同來說明結果差異。

- TableRef 筆數：
  - `EntityState.Unchanged`：
  TableRef 中將有兩筆資料，這與 `Remove()` 前的狀況相同，這結果才是正確的。

  - `EntityState.Detached`：
  TableRef 只有一筆，缺少 `TableRef (Dictionary<string, object>) {Table1Id: 1, Table2Id: 1} Unchanged FK {Table1Id: 1} FK {Table2Id: 1}`。

- `table11.Table2s.Count`：兩者皆為 0。
- 當重新從資料庫取得 `Table1.Id` 為 `1` 的資料：
  - `EntityState.Unchanged`：
  `Table2s.Count` 仍然是 0。推測是和「[EF Core DbContext 快取特性實驗](https://blog.darkthread.net/blog/efcore-scoped-dbcontext-cache/)」、「[查詢的運作方式](https://learn.microsoft.com/zh-tw/ef/core/querying/how-query-works#the-life-of-a-query)」所提到的 DbContext 快取機制有關。雖然會從資料庫查詢資料，但因為 DbContext 已存在該資料且已追蹤，因此直接回傳 DbContext 裡的 Entity。話說這我怎看都覺得像 Bug...。

  - `EntityState.Detached`：`Table2s.Count` 會是 1，導覽屬性成功從資料庫重新取得資料。

雖然使用上來看，設為 `EntityState.Detached` 結果會一好點，但實際上都有問題，因此不建議在有外鍵的情況下使用 Entity 狀態還原。

::: warning
使用 `DbSet.Add()` 加入與已查詢資料具有相同 PK 的 Entity 時，會拋出 `InvalidOperationException`。由於 Exception 是在 `Add()` 時拋出，而非在 `SaveChanges()`，因此不會被現有的錯誤處理機制捕獲。
:::

## 異動歷程

- 2024-08-17 初版文件建立。
