---
title: "Entity Framework 中 DateTime 時區問題與解決方案"
date: 2024-08-15
lastmod: 2024-08-15
description: "解決 Entity Framework 處理 `DateTime` 時區（UTC）的常見問題。探討 `DateTimeKind` 為 `Unspecified` 導致的時間偏差，並教學如何透過 `ValueConverter` 自動處理資料庫讀寫時的 UTC 時間轉換，確保前後端時間一致性。"
tags: [".NET","C#","Entity Framework"]
---

# Entity Framework 中 DateTime 時區問題與解決方案

雖然許多專案僅在台灣環境中運行，不需要考慮時區問題，但隨著雲端環境的普及，而很多雲端時區都是定在國際標準時間（UTC +0 時區），所以也開始需要注意這個問題。

我一直知道 `DateTime` 的 UTC 格式 可能存在陷阱，因此在處理時區問題時，我通常會盡量使用 `DateTimeOffset`。由於這幾天遇到了一個相關的情境，所以就稍微查資料，並記錄一下。

有同事向我反映，他的專案已經和前端約定使用 UTC 的時間，但在將從資料庫取得的 `DateTime` 資料傳給前端時，發現時間少了 8 個小時。為了解決這個問題，他使用 `ToString()` 方法將時間格式化為 `yyyy-MM-ddTHH:mm:ssZ`。

我當時疑惑地問他，為什麼要在時間字串的末尾加上 `Z`。他回應說這樣時間才不會少 8 小時。我去查一下，根據 Wiki 上的「[ISO 8601](https://zh.wikipedia.org/zh-tw/ISO_8601) 」說明，`Z` 表示 UTC +0 時區。

本來想要幫他優化這部分處理，認為應該要在 `JsonSerializerOptions.Converters`，裡變更 `DateTime` 型別的處理。但後來想想，使用 `DateTime` 做 UTC +0 的專案肯定不少，像知名框架 [ABP.IO](https://abp.io/)，就是使用 `DateTime` 型別，ASP.NET Core 應該不至於在處理格式時，沒注意到這點。上網查一下，`DateTime` 如果是 UTC 格式 的話，會有 `Z` 結尾沒錯，就做以下測試：

```csharp
DateTime localTime = new DateTime(2024, 8, 14, 8, 0, 0, DateTimeKind.Local);
DateTime utcTime = new DateTime(2024, 8, 14, 8, 0, 0, DateTimeKind.Utc);
DateTime unspecifiedTime = new DateTime(2024, 8, 14, 8, 0, 0, DateTimeKind.Unspecified);

Console.WriteLine("Local:" + localTime.ToString("O"));
Console.WriteLine("UTC:" + utcTime.ToString("O"));
Console.WriteLine("Unspecified:" + unspecifiedTime.ToString("O"));
```

產生結果如下：

```text
Local:2024-08-14T08:00:00.0000000+08:00
UTC:2024-08-14T08:00:00.0000000Z
Unspecified:2024-08-14T08:00:00.0000000
```

再對比我同事的這句話，感覺破案了。
> 但在將***從資料庫取得***的 `DateTime` 資料傳給前端時，發現時間少了 8 小時。

## DateTime 的時區格式問題

`DateTime` 這個型別有一個 `Kind` 屬性，用於表示時間的來源，共有以下列舉值：

| 值 | 屬性名稱 | 說明 |
| --- | --- | --- |
| 0 | Unspecified | 未指定 |
| 1 | Utc | Coordinated Universal Time (UTC)  |
| 2 | Local | 本機時間 |

而不清楚 `Kind` 格式的情況下，使用 `ToLocalTime()` 或 `ToUniversalTime()` 來切換時間，產生來的時間就會不如預期。

以下是測試程式碼：

```csharp
DateTime utcNow = DateTime.UtcNow;
DateTime now = DateTime.Now;

Print("原始時間:");
PrintNow("Local", now);
PrintNow("Utc", utcNow);
Console.WriteLine();

Print("切換 Kind 為 Local");
PrintTime(DateTime.SpecifyKind(now, DateTimeKind.Local));
Console.WriteLine();

Print("切換 Kind 為 Utc:");
PrintTime(DateTime.SpecifyKind(now, DateTimeKind.Utc));
Console.WriteLine();

Print("切換 Kind 為 Unspecified:");
PrintTime(DateTime.SpecifyKind(now, DateTimeKind.Unspecified));

void Print(string str) {
    Console.WriteLine(str);
}

void PrintNow(string title, DateTime dateTime) {
    Print($"{title}:{dateTime:O}, Kind:{dateTime.Kind}");
}

void PrintTime(DateTime dateTime) {
    Print($"Original:{dateTime:O}, Kind:{dateTime.Kind}");

    DateTime local = dateTime.ToLocalTime();
    Print($"Local:{local:O}, Kind:{local.Kind}");

    DateTime utc = dateTime.ToUniversalTime();
    Print($"Utc:{utc:O}, Kind:{utc.Kind}");
}
```

產生結果如下：

```text
原始時間:
Local:2024-08-15T10:35:48.8422172+08:00, Kind:Local
Utc:2024-08-15T02:35:48.8421977Z, Kind:Utc

切換 Kind 為 Local
Original:2024-08-15T10:35:48.8422172+08:00, Kind:Local
Local:2024-08-15T10:35:48.8422172+08:00, Kind:Local
Utc:2024-08-15T02:35:48.8422172Z, Kind:Utc

切換 Kind 為 Utc:
Original:2024-08-15T10:35:48.8422172Z, Kind:Utc
Local:2024-08-15T18:35:48.8422172+08:00, Kind:Local
Utc:2024-08-15T10:35:48.8422172Z, Kind:Utc

切換 Kind 為 Unspecified:
Original:2024-08-15T10:35:48.8422172, Kind:Unspecified
Local:2024-08-15T18:35:48.8422172+08:00, Kind:Local
Utc:2024-08-15T02:35:48.8422172Z, Kind:Utc
```

從結果可以看到：

* 當 `Kind` 為 `Local` 時，呼叫 `ToLocalTime()` 不會改變時間。
* 當 `Kind` 為 `Utc` 時，呼叫 `ToUniversalTime()` 也不會改變時間。
* 當 `Kind` 為 `Unspecified` 時，由於無法確定時間的類型，呼叫 `ToLocalTime()` 時，系統會假設原本是 UTC 時間，並轉換為本機時間，因而增加時區偏移。相反地，呼叫 `ToUniversalTime()` 時，系統會假設原本是本機時間，並減去時區偏移。

也因此，ABP.IO 在使用 `DateTime` 時，有定義 `IClock` 介面，來將的`Kind` 進行修正，來避免預期外問題，以下節錄他的 `Clock` 程式碼，藉由比對設定的 `Kind` 與要標準化的時間的 `Kind`，來決定轉換結果，更具體的說明可參考官方文件「[Timing](https://abp.io/docs/latest/framework/infrastructure/timing)」。

```csharp
public virtual DateTime Normalize(DateTime dateTime) {
    if (Kind == DateTimeKind.Unspecified || Kind == dateTime.Kind) {
        return dateTime;
    }

    if (Kind == DateTimeKind.Local && dateTime.Kind == DateTimeKind.Utc) {
        return dateTime.ToLocalTime();
    }

    if (Kind == DateTimeKind.Utc && dateTime.Kind == DateTimeKind.Local) {
        return dateTime.ToUniversalTime();
    }

    return DateTime.SpecifyKind(dateTime, Kind);
}
```

## Entity Framework 使用 DateTime 的時區問題

如果資料表欄位使用 `datetime`、`datetime2` 等不包含時區的資料庫類型，在儲存資料時，由於這些型別無法儲存時區資訊，因此存進資料庫的時間並不包含時區資訊。但是，當 Entity Framework 將資料取出並對應到 `DateTime` 型別時，由於無法確定時間的 `Kind`，這時的 `Kind` 會是 `Unspecified`。因此，回傳給前端的時間值末尾不會包含 `Z`。

此時，正確的處理方式不是在回傳值時補上 `Z`，而是在從資料庫取出資料時，將 `DateTime` 型別的 `Kind` 轉換為 `Utc`。雖然 `DateTime` 在進行值比較時不會考慮 `Kind`，但在程式內的 `DateTime.Kind` 有多種可能的情況下，呼叫 `ToLocalTime()` 或 `ToUniversalTime()` 時，可能會導致預期外的結果。

### 解決方案

如果有在使用 Code First 的話，就會知道這時候是 `ValueConverter` 出馬的時候了。使用 Fluent API 在 `OnModelCreating()` 中定義 Entity 結構時，可以透過 `HasConversion()` 來處理資料寫入和讀取時的轉換。常見的用途包括 Enum、Enum Object 和時間的時區處理。詳細資訊可參考 Microsoft 的文件「[值轉換](https://learn.microsoft.com/zh-tw/ef/core/modeling/value-conversions?tabs=data-annotations)」，這篇先針對此問題來說明。

可以藉由 `HasConversion()` 來進行以下處理：

* 在資料寫入時，若 `DateTime` 的 `Kind` 不是 `Utc`，則呼叫 `ToUniversalTime()` 進行轉換。
* 在取出資料時，將 `DateTime` 的 `Kind` 設定為 `Utc`。

具體程式碼如下：

```csharp
modelBuilder.Entity<Test>(entity => {
    entity.Property(x => x.TestDateTime)
        .HasConversion(
            v => v.Kind == DateTimeKind.Utc ? v : v.ToUniversalTime(),
            v => DateTime.SpecifyKind(v, DateTimeKind.Utc)
        );
});
```

也可以定義一個 `UtcDateTimeValueConverter` 類別來重複使用，具體程式碼如下：

```csharp
public class UtcDateTimeValueConverter : ValueConverter<DateTime, DateTime> {
    public UtcDateTimeValueConverter()
        : base(v => ToDb(v), v => FromDb(v)) {
    }

    private static DateTime ToDb(DateTime dateTime) {
        return dateTime.Kind == DateTimeKind.Utc ? dateTime : dateTime.ToUniversalTime();
    }

    private static DateTime FromDb(DateTime dateTime) {
        return DateTime.SpecifyKind(dateTime, DateTimeKind.Utc);
    }
}
```

使用 `UtcDateTimeValueConverter` 進行轉換：

```csharp
modelBuilder.Entity<Test>(entity => {
    entity.Property(x => x.TestDateTime)
        .HasConversion<UtcDateTimeValueConverter>();
});
```

如果不想要每一個屬性都個別設定，可以用使用以下方式統一處理：

```csharp
foreach (IMutableEntityType entityType in modelBuilder.Model.GetEntityTypes()) {
    foreach (IMutableProperty property in entityType.GetProperties()) {
        if (property.ClrType == typeof(DateTime) || property.ClrType == typeof(DateTime?)) {
            property.SetValueConverter(typeof(UtcDateTimeValueConverter));
        }
    }
}
```

使用 Code First，DbContext 內容可以隨意定義，可以使用以上的作法。但如果是使用反向工程來產生 Entity 和 DbContext 的話，通常 DbContext 應該會包含以下程式碼：

```csharp
public partial class MyDbContext : DbContext {
    // 省略中...
    
    protected override void OnModelCreating(ModelBuilder modelBuilder) {
        // 省略 Entity 定義

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
```

此時，可以寫一個 Partial 類別來增加自定義設定，需注意 Namespace 必須與反向工程產生的 `MyDbContext` 的 Namespace 一致：

```csharp
public partial class MyDbContext {
    partial void OnModelCreatingPartial(ModelBuilder modelBuilder) {
        foreach (IMutableEntityType entityType in modelBuilder.Model.GetEntityTypes()) {
            foreach (IMutableProperty property in entityType.GetProperties()) {
                if (property.ClrType == typeof(DateTime) || property.ClrType == typeof(DateTime?)) {
                    property.SetValueConverter(typeof(UtcDateTimeValueConverter));
                }
            }
        }
    }
}
```

當然不寫 Partial 類別，而是另寫一個 DbContext 去繼承，然後程式使用自定義的 DbContext，我也不反對阿。

而在 .NET 6，又有一個更簡單的設定方式，`ConfigureConventions()`，詳請可參考 Microsoft 的 [文件](https://learn.microsoft.com/zh-tw/dotnet/api/microsoft.entityframeworkcore.dbcontext.configureconventions?view=efcore-6.0)：

```csharp
public partial class MyDbContext {
    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder) {
        ArgumentNullException.ThrowIfNull(configurationBuilder);

        configurationBuilder.Properties<DateTime>().HaveConversion<UtcDateTimeValueConverter>();
    }
```

由於 `ConfigureConventions()` 會在 `OnModelCreating()` 前執行，所以可用來定義預設值和設定慣例，如果想要覆蓋設定的部分，則適合定義在 `OnModelCreatingPartial()` 裡。

## 異動歷程

* 2024-08-15 初版文件建立。
