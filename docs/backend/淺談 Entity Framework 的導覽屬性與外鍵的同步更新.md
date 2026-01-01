---
title: "淺談 Entity Framework 的導覽屬性與外鍵的同步更新"
date: 2024-08-12
lastmod: 2024-08-12
description: "驗證 EF Core 中修改 Foreign Key (如 `MainId`) 是否會自動同步 Navigation Property (如 `Main` 物件)，以及反之修改 Navigation Property 是否會同步 Foreign Key 的行為差異。"
tags: [".NET","C#","Entity Framework"]
---

# 淺談 Entity Framework 的導覽屬性與外鍵的同步更新

最近請可愛的後輩幫忙處理的需求會用到相關的觀念，為了避免我講錯翻車，所以先自行驗證一下。

本篇文章使用「Microsoft.EntityFrameworkCore 8」來測試主表與子表之間的關聯行為。若未特別說明，以下結果均為未呼叫 `SaveChanges()` 前的狀態。請注意，不同版本的 Entity Framework 可能結果會有略微不同。

## Entity 結構定義

```csharp
public partial class Main {
    public long Id { get; set; }

    public virtual ICollection<Sub> Subs { get; set; } = new List<Sub>();
}

public partial class Sub {
    public long Id { get; set; }

    public long MainId { get; set; }

    public virtual Main Main { get; set; }
}

public partial class TestEFContext : DbContext {
    public TestEFContext(DbContextOptions<TestEFContext> options)
        : base(options) {
    }

    public virtual DbSet<Main> Mains { get; set; }

    public virtual DbSet<Sub> Subs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder) {
        modelBuilder.Entity<Main>(entity => {
            entity.ToTable("Main");

            entity.Property(e => e.Id).ValueGeneratedNever();
        });

        modelBuilder.Entity<Sub>(entity => {
            entity.ToTable("Sub");

            entity.Property(e => e.Id).ValueGeneratedNever();

            entity.HasOne(d => d.Main).WithMany(p => p.Subs)
                .HasForeignKey(d => d.MainId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Sub_Main");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
```

## 主表使用導覽屬性關聯子表

### 範例 1：主表與子表未追蹤

如果 `main` 和 `sub` 都未加入追蹤，`sub.Main` 為 `null`。

```csharp
using TestEFContext context = new(options);
Main main = new();
Sub sub = new();
main.Subs.Add(sub);
```

結果：

![ef sync result 1](images/%E6%B7%BA%E8%AB%87%20Entity%20Framework%20%E7%9A%84%E5%B0%8E%E8%A6%BD%E5%B1%AC%E6%80%A7%E8%88%87%E5%A4%96%E9%8D%B5%E7%9A%84%E5%90%8C%E6%AD%A5%E6%9B%B4%E6%96%B0/ef-sync-result-1.png)

EntityState：

```text
Main State:Detached
Sub State:Detached
```

### 範例 2：僅主表加入追蹤

當 `main` 加入追蹤後，會同步追蹤 `sub`，`sub.Main` 會同步更新為 `main`。

```csharp
using TestEFContext context = new(options);
Main main = new();
Sub sub = new();
main.Subs.Add(sub);
context.Mains.Add(main);
```

結果：

![ef sync result 2](images/%E6%B7%BA%E8%AB%87%20Entity%20Framework%20%E7%9A%84%E5%B0%8E%E8%A6%BD%E5%B1%AC%E6%80%A7%E8%88%87%E5%A4%96%E9%8D%B5%E7%9A%84%E5%90%8C%E6%AD%A5%E6%9B%B4%E6%96%B0/ef-sync-result-2.png)

EntityState：

```text
Main State:Added
Sub State:Added
```

### 範例 3：僅子表加入追蹤

若僅追蹤 `sub` 而不追蹤 `main`，`sub.Main` 不會同步更新。

```csharp
using TestEFContext context = new(options);
Main main = new();
Sub sub = new();
main.Subs.Add(sub);
context.Subs.Add(sub);
```

結果：

![ef sync result 3](images/%E6%B7%BA%E8%AB%87%20Entity%20Framework%20%E7%9A%84%E5%B0%8E%E8%A6%BD%E5%B1%AC%E6%80%A7%E8%88%87%E5%A4%96%E9%8D%B5%E7%9A%84%E5%90%8C%E6%AD%A5%E6%9B%B4%E6%96%B0/ef-sync-result-3.png)

EntityState：

```text
Main State:Detached
Sub State:Added
```

### 範例 4：先追蹤主表後再設置導覽屬性

先追蹤 `main`，再執行 `main.Subs.Add(sub)`，`sub.Main` 為 `null`，但呼叫 SaveChanges() 後會同步更新。

```csharp
using TestEFContext context = new(options);
Main main = new();
Sub sub = new();
context.Mains.Add(main);
main.Subs.Add(sub);

context.SaveChanges();
```

呼叫 `SaveChanges()` 前的結果。

![ef sync before save 1](images/%E6%B7%BA%E8%AB%87%20Entity%20Framework%20%E7%9A%84%E5%B0%8E%E8%A6%BD%E5%B1%AC%E6%80%A7%E8%88%87%E5%A4%96%E9%8D%B5%E7%9A%84%E5%90%8C%E6%AD%A5%E6%9B%B4%E6%96%B0/ef-sync-before-save-1.png)

呼叫 `SaveChanges()` 後的結果。

![ef sync after save 1](images/%E6%B7%BA%E8%AB%87%20Entity%20Framework%20%E7%9A%84%E5%B0%8E%E8%A6%BD%E5%B1%AC%E6%80%A7%E8%88%87%E5%A4%96%E9%8D%B5%E7%9A%84%E5%90%8C%E6%AD%A5%E6%9B%B4%E6%96%B0/ef-sync-after-save-1.png)

EntityState：

```text
SaveChanges 執行前：
Main State:Added
Sub State:Added
SaveChanges 執行後：
Main State:Unchanged
Sub State:Unchanged
```

::: info
Sub State 會是 `Added` 的原因，應該是我使用 `context.Entry(sub).State` 查看 Sub State時，觸發導覽屬性的異動追蹤。
:::

## 子表使用導覽屬性關聯主表

測試子表設定導覽屬性的不同場景：

### 範例 5：主表與子表未追蹤

如果直接設置 `sub.Main = main`，但兩者都不追蹤，`main.Subs` 仍為空集合。

```csharp
using TestEFContext context = new(options);
Main main = new();
Sub sub = new();
sub.Main = main;
```

結果：

![ef sync result 4](images/%E6%B7%BA%E8%AB%87%20Entity%20Framework%20%E7%9A%84%E5%B0%8E%E8%A6%BD%E5%B1%AC%E6%80%A7%E8%88%87%E5%A4%96%E9%8D%B5%E7%9A%84%E5%90%8C%E6%AD%A5%E6%9B%B4%E6%96%B0/ef-sync-result-4.png)

EntityState：

```text
Main State:Detached
Sub State:Detached
```

### 範例 6：主表加入追蹤

當 `main` 加入追蹤但 `sub` 未加入追蹤時，`main.Subs` 仍然為空集合。

```csharp
using TestEFContext context = new(options);
Main main = new();
Sub sub = new();
sub.Main = main;
context.Mains.Add(main);
```

結果：

![ef sync result 5](images/%E6%B7%BA%E8%AB%87%20Entity%20Framework%20%E7%9A%84%E5%B0%8E%E8%A6%BD%E5%B1%AC%E6%80%A7%E8%88%87%E5%A4%96%E9%8D%B5%E7%9A%84%E5%90%8C%E6%AD%A5%E6%9B%B4%E6%96%B0/ef-sync-result-5.png)

EntityState：

```text
Main State:Added
Sub State:Detached
```

### 範例 7：僅子表加入追蹤

僅子表加入追蹤，仍會同步追蹤 `main`，`main.Subs` 會包含 `sub`。

```csharp
using TestEFContext context = new(options);
Main main = new();
Sub sub = new();
sub.Main = main;
context.Subs.Add(sub);
```

結果：

![ef sync result 6](images/%E6%B7%BA%E8%AB%87%20Entity%20Framework%20%E7%9A%84%E5%B0%8E%E8%A6%BD%E5%B1%AC%E6%80%A7%E8%88%87%E5%A4%96%E9%8D%B5%E7%9A%84%E5%90%8C%E6%AD%A5%E6%9B%B4%E6%96%B0/ef-sync-result-6.png)

EntityState：

```text
Main State:Added
Sub State:Added
```

## 使用外鍵屬性設定關聯

### 範例 8：僅追蹤子表

若只追蹤 `sub` 並在 `sub` 設置外鍵屬性 `MainId`，`main` 和 `sub` 的導覽屬性都不會同步更新。

```csharp
using TestEFContext context = new(options);
Main main = new() {
    Id = 1L
};
Sub sub = new (){
    Id = 2L,
    MainId = 1L
};
context.Subs.Add(sub);
```

結果：

![ef sync result 7](images/%E6%B7%BA%E8%AB%87%20Entity%20Framework%20%E7%9A%84%E5%B0%8E%E8%A6%BD%E5%B1%AC%E6%80%A7%E8%88%87%E5%A4%96%E9%8D%B5%E7%9A%84%E5%90%8C%E6%AD%A5%E6%9B%B4%E6%96%B0/ef-sync-result-7.png)

EntityState：

```text
Main State:Detached
Sub State:Added
```

### 範例 9：主表與子表都加入追蹤

在追蹤 `main` 和 `sub` 的情況下，導覽屬性會自動同步。

```csharp
using TestEFContext context = new(options);
Main main = new() {
    Id = 1L
};
Sub sub = new () {
    Id = 2L,
    MainId = 1L
};
context.Mains.Add(main);
context.Subs.Add(sub);
```

結果：

![ef sync result 8](images/%E6%B7%BA%E8%AB%87%20Entity%20Framework%20%E7%9A%84%E5%B0%8E%E8%A6%BD%E5%B1%AC%E6%80%A7%E8%88%87%E5%A4%96%E9%8D%B5%E7%9A%84%E5%90%8C%E6%AD%A5%E6%9B%B4%E6%96%B0/ef-sync-result-8.png)

EntityState：

```text
Main State:Added
Sub State:Added
```

### 範例 10：追蹤後設置外鍵屬性

如果在加入追蹤後才設置外鍵，導覽屬性不會自動同步，但呼叫 `SaveChanges()` 後會更新。

```csharp
using TestEFContext context = new(options);
Main main = new() {
    Id = 1L
};
Sub sub = new () {
    Id = 2L
};

context.Mains.Add(main);
context.Subs.Add(sub);
sub.MainId = 1L;

context.SaveChanges();
```

呼叫 `SaveChanges()` 前的結果。

![ef sync before save 2](images/%E6%B7%BA%E8%AB%87%20Entity%20Framework%20%E7%9A%84%E5%B0%8E%E8%A6%BD%E5%B1%AC%E6%80%A7%E8%88%87%E5%A4%96%E9%8D%B5%E7%9A%84%E5%90%8C%E6%AD%A5%E6%9B%B4%E6%96%B0/ef-sync-before-save-2.png)

呼叫 `SaveChanges()` 後的結果。

![ef sync after save 2](images/%E6%B7%BA%E8%AB%87%20Entity%20Framework%20%E7%9A%84%E5%B0%8E%E8%A6%BD%E5%B1%AC%E6%80%A7%E8%88%87%E5%A4%96%E9%8D%B5%E7%9A%84%E5%90%8C%E6%AD%A5%E6%9B%B4%E6%96%B0/ef-sync-after-save-2.png)

EntityState：

```text
SaveChanges 執行前：
Main State:Added
Sub State:Added
SaveChanges 執行後：
Main State:Unchanged
Sub State:Unchanged
```

### 範例 11：使用 Find() 取得已追蹤的主表

先建立並追蹤 `sub`，再使用 `Find()` 取得關聯的 `Main` 資料，`main.Subs` 會包含 `sub`。

```csharp
using TestEFContext context = new(options);
Sub sub = new() {
    Id = 3L
};

context.Subs.Add(sub);
sub.MainId = 1L;

Main main = context.Mains.Find(1L);
```

結果：

![ef sync result 9](images/%E6%B7%BA%E8%AB%87%20Entity%20Framework%20%E7%9A%84%E5%B0%8E%E8%A6%BD%E5%B1%AC%E6%80%A7%E8%88%87%E5%A4%96%E9%8D%B5%E7%9A%84%E5%90%8C%E6%AD%A5%E6%9B%B4%E6%96%B0/ef-sync-result-9.png)

EntityState：

```text
Main State:Unchanged
Sub State:Added
```

### 範例 12：使用 Find() 取得未追蹤的主表

如果先追蹤 `sub`，再用 `Find()` 取得與本機已追蹤 Entity 無關聯的 `Main` 資料，導覽屬性不會自動同步。

```csharp
using TestEFContext context = new(options);
Main main2 = new() {
    Id = 2L
};
Sub sub = new() {
    Id = 4L
};

context.Mains.Add(main2);
context.Subs.Add(sub);
sub.MainId = 2L;

Main main1 = context.Mains.Find(1L);
```

結果：

![ef sync result 10](images/%E6%B7%BA%E8%AB%87%20Entity%20Framework%20%E7%9A%84%E5%B0%8E%E8%A6%BD%E5%B1%AC%E6%80%A7%E8%88%87%E5%A4%96%E9%8D%B5%E7%9A%84%E5%90%8C%E6%AD%A5%E6%9B%B4%E6%96%B0/ef-sync-result-10.png)

EntityState：

```text
Main1 State:Unchanged
Main2 State:Added
Sub State:Added
```

## 其他操作

### 範例 13：`SaveChanges()` 失敗

即便 `SaveChanges()` 執行失敗，導覽屬性仍會進行同步。

```csharp
using TestEFContext context = new(options);
// 故意寫入 ID 已存在的資料
Main main = new() {
    Id = 1L
};
Sub sub = new() {
    Id = 2L
};

try {
    context.Mains.Add(main);
    context.Subs.Add(sub);
    sub.MainId = 1L;
    context.SaveChanges();
} catch {
}
Console.ReadLine();
```

結果：

![ef sync result 11](images/%E6%B7%BA%E8%AB%87%20Entity%20Framework%20%E7%9A%84%E5%B0%8E%E8%A6%BD%E5%B1%AC%E6%80%A7%E8%88%87%E5%A4%96%E9%8D%B5%E7%9A%84%E5%90%8C%E6%AD%A5%E6%9B%B4%E6%96%B0/ef-sync-result-11.png)

EntityState：

```text
SaveChanges 執行前：
Main State:Added
Sub State:Added
SaveChanges 執行後：
Main State:Added
Sub State:Added
```

### 範例14：使用 `Entry()` 取得 `EntityEntry`

當執行 `Entry()` 同樣會同步已追蹤 Entity 的導覽屬性。

```csharp
using TestEFContext context = new(options);
Main main = new() {
    Id = 1L
};
Sub sub = new() {
    Id = 2L
};

context.Mains.Add(main);
context.Subs.Add(sub);
sub.MainId = 1L;

context.Entry(main);
context.Entry(sub);
```

結果：

![ef sync result 12](images/%E6%B7%BA%E8%AB%87%20Entity%20Framework%20%E7%9A%84%E5%B0%8E%E8%A6%BD%E5%B1%AC%E6%80%A7%E8%88%87%E5%A4%96%E9%8D%B5%E7%9A%84%E5%90%8C%E6%AD%A5%E6%9B%B4%E6%96%B0/ef-sync-result-12.png)

## 結論

1. 追蹤與導覽屬性同步：

    導覽屬性同步的前提是兩邊的 Entity 都必須處於追蹤狀態。任何會導致 Entity 狀態改變的操作，例如新增、刪除、或手動設定 Entity 狀態等，均會觸發追蹤狀態的檢核，進而自動同步更新導覽屬性。

2. 資料庫更新與導覽屬性：

    導覽屬性的同步與否不會影響資料庫的實際更新。即使導覽屬性未同步，當執行 `SaveChanges()` 時，系統仍會進行 Entity 的異動追蹤檢核，並自動觸發導覽屬性的同步。

3. 外鍵屬性與同步：

    當 Entity 觸發異動追蹤檢核時，不僅導覽屬性會同步更新，外鍵屬性也會參與到同步過程中，因此可以使用外鍵屬性來影響導覽屬性的值。

4. 從資料庫取得資料的影響：

    當從資料庫中讀取資料並將其加入追蹤時，相關的本機 Entity 導覽屬性會自動同步更新。

## 補充說明

* 使用導覽屬性新增資料：當使用 `main.Subs.Add(sub)` 來設定導覽屬性時，會同步追蹤 `sub` 資料，這種方法的目的是在新增主表資料時能夠同時新增關聯的子表資料。
* 刪除資料：如果需要刪除子表資料，應該使用 `context.Subs.Remove(sub)`，這樣才能將子表資料從資料庫中刪除。相反，如果使用 `main.Subs.Remove(sub)`，這只會解除主表與子表之間的關聯，並不會刪除子表資料，子表的資料仍然保留在資料庫中。
* 刪除關聯：以下兩種情境，應使用 `main.Subs.Remove(sub)`。
  * 多對多關聯：
    在多對多的關聯中，兩個實體之間的關係是通過一個聯結表來實做的。當你使用 `main.Subs.Remove(sub)` 來解除關聯時，僅僅是從聯結表中刪除一條關聯記錄，而不會影響到主表或子表的資料。

  * 外鍵屬性允許 `null`：

    如果外鍵屬性允許 `null`，那麼解除關聯時，系統會將該外鍵屬性設為 `null`，而不會刪除關聯的子表資料。

## 異動歷程

* 2024-08-12 初版文件建立。
