---
title: "淺談處置模式模式和 using 陳述式"
date: 2024-08-08
lastmod: 2024-08-08
description: "深入解析 .NET `IDisposable` 介面與 Dispose Pattern。說明 `using` 語法的底層運作原理，以及如何正確實作 Finalizer 以確保非託管資源 (Unmanaged Resources) 能被安全釋放。"
tags: [".NET","C#"]
---

# 淺談處置模式模式和 using 陳述式

使用 `using` 陳述式來釋放 `IDisposable` 物件算是 .NET 程式設計中的基本操作。我以前也曾向客戶說明過，但仔細想想，儘管我知道它怎麼使用，但對於一些細節可能不夠了解。因此，打算一邊寫筆記一邊查資料，看看自己的認知是否有遺漏的部分。

## 處置模式

### 非託管資源

託管資源指的是由 .NET 運行時的 Common Language Runtime (CLR) 管理的資源，這些資源的記憶體管理由垃圾回收器 (Garbage Collector, GC) 自動處理，開發者不需要手動釋放。而非託管資源如資料庫連線、檔案存取等，則需要通過特定的方式釋放。雖然 .NET 可以追蹤封裝非託管資源的物件，但需要手動釋放非託管資源，因為垃圾回收器無法自動處理非託管資源的釋放。具體細節可以參考「[清除 Unmanaged 資源](https://learn.microsoft.com/zh-tw/dotnet/standard/garbage-collection/unmanaged)」。

釋放非託管資源的方法有兩種：

* 實作處置模式：實作 `IDisposable` 介面，並在 `Dispose()` 方法中釋放非託管資源。
* 宣告完成項 (Finalizer)：以前稱為解構式 (Destructor)，無法主動呼叫，而是在垃圾回收 (GC) 時自動呼叫，用於釋放非託管資源。但在實作 `IDisposable` 的時候，應該優先使用 `Dispose` 方法釋放資源。詳細內容可以參考此文章「[完成項 (C# 程式設計手冊)](https://learn.microsoft.com/zh-tw/dotnet/csharp/programming-guide/classes-and-structs/finalizers)」。

### 實作範例

```csharp
public class ResourceHandle : IDisposable {
    // 避免重複釋放的註記
    private bool disposed = false;
    // 模擬非托管資源
    private IntPtr unmanagedResource;
    // 模擬托管資源，內部包含了非託管資源
    private ManagedResource managedResource;

    public ResourceHandle() {
        unmanagedResource = IntPtr.Zero; // 示範初始化，實際應分配資源
        managedResource = new ManagedResource();
    }

    // 實作 IDisposable 介面的 Dispose 方法
    public void Dispose() {
        // 釋放非託管資源和托管資源
        Dispose(true);
        // 因為已經釋放資源了，阻止 GC 再次呼叫解構式
        GC.SuppressFinalize(this);
    }

    // 受保護虛擬方法提供子類別覆寫
    protected virtual void Dispose(bool disposing) {
        if (!disposed) {
            if (disposing) {
                // 釋放托管資源
                managedResource?.Dispose();
                managedResource = null;
            }

            // 釋放非托管資源
            if (unmanagedResource != IntPtr.Zero) {
                // 假設這是一個釋放非托管資源的方法
                FreeUnmanagedResource(unmanagedResource);
                unmanagedResource = IntPtr.Zero;
            }

            disposed = true;
        }
    }

    // 解構式（完成項）
    ~ResourceHandle() {
        // 解構式在垃圾回收時自動呼叫，用於釋放非託管資源。
        // 托管資源由垃圾回收器自動處理，因此這裡不需要處理托管資源
        Dispose(false);
    }
}
```

一些延伸的做法可以參考 MSDN 範例「[實作 Dispose 方法](https://learn.microsoft.com/zh-tw/dotnet/standard/garbage-collection/implementing-dispose)」。

### 非同步處置模式

在 .NET Core 3.0 中新增了 `IAsyncDisposable` 介面。我在寫這篇文章時才知道這個介面，因此對它的了解還不夠深入，所以不多說。只從「[實作 DisposeAsync 方法](https://learn.microsoft.com/zh-tw/dotnet/standard/garbage-collection/implementing-disposeasync)」節錄我覺得重要的內容。

1. 一般建議當實作 `IAsyncDisposable` 時，同時實作 `IDisposable`。雖非必要，但這樣做是建議的最佳實作。原因等後續說明看完範例後再說明。
2. 在 ASP.NET Core 中，大部分物件會使用依賴注入（DI）進行注入。如果使用 DI 產生的物件實作了 `IAsyncDisposable` 或 `IDisposable`，則會在該生命週期結束呼叫 `DisposeAsync()` 或 `Dispose()` 來釋放非託管資源。根據 [RequestServicesFeature](https://github.com/dotnet/aspnetcore/blob/main/src/Http/Http/src/Features/RequestServicesFeature.cs) 的程式碼顯示，當物件同時實作兩者時，會優先呼叫  `DisposeAsync()`。

程式碼的部分我偷懶直接拿 MSDN 程式碼來改。

```csharp
class ExampleConjunctiveDisposableusing : IDisposable, IAsyncDisposable {
    IDisposable? disposableResource = new MemoryStream();
    IAsyncDisposable? asyncDisposableResource = new MemoryStream();

    public void Dispose() {
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }

    public async ValueTask DisposeAsync() {
        await DisposeCoreAsync().ConfigureAwait(false);

        Dispose(disposing: false);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing) {
        if (disposing) {
            disposableResource?.Dispose();
            disposableResource = null;

            if (asyncDisposableResource is IDisposable disposable) {
                disposable.Dispose();
                asyncDisposableResource = null;
            }
            
            // 如果有非託管資源的釋放寫在這
        }
    }

    protected virtual async ValueTask DisposeCoreAsync() {
        if (asyncDisposableResource is not null) {
            await asyncDisposableResource.DisposeAsync().ConfigureAwait(false);
        }

        if (disposableResource is IAsyncDisposable disposable) {
            await disposable.DisposeAsync().ConfigureAwait(false);
        } else {
            disposableResource?.Dispose();
        }

        asyncDisposableResource = null;
        disposableResource = null;
    }
}
```

這個範例有幾個需要注意的地方：

* `DisposeAsync()` 的實現：
  `DisposeAsync()` 在呼叫 `DisposeAsync(bool disposing)` 時傳入 `false`，這是因為 `Dispose(bool disposing)` 和 `DisposeCoreAsync()` 都會針對可同步釋放和非同步釋放資源的物件進行處理，呼叫 `DisposeAsync(bool disposing)` 僅是為了處理其他非託管資源。

* `Dispose(bool disposing)` 的處理邏輯：
  在 `Dispose(bool disposing)` 方法中，通常不會呼叫非同步的 `DisposeCoreAsync` 方法，這樣做是為了避免引發同步同步與異步之間的死結的可能性。因此只檢查是否實作了 `IDisposable`。如果實作了，才會呼叫 `Dispose()`。這代表，如果該非同步物件型別未實作 `IDisposable`，資源可能不會被正確釋放。

* 同時實作 `IDisposable` 的原因：
  `IAsyncDisposable` .NET Core 3.0 中新增的介面，主要用於支援非同步資源釋放。但有可能有些現有的程式和資源管理框架在 `IAsyncDisposable` 出現之前已經實作了 `IDisposable`。因此，這些程式可能只檢查物件是否實作 `IDisposable`，而忽略 `IAsyncDisposable`。因此實作 `IDisposable` 可以相容在不支援非同步釋放的上下文中，資源也能夠被正確釋放。

* `ConfigureAwait(false)` 的用途：
  關於 `ConfigureAwait(false)` 的用途，MSDN 文章是直接說參考「[ConfigureAwait FAQ](https://devblogs.microsoft.com/dotnet/configureawait-faq/)」。
根據我的理解，`ConfigureAwait(false)` 是讓程式在 `await` 操作結束後，不強制回到原來的 SynchronizationContext。SynchronizationContext 可能是 UI 執行緒（如視窗應用程式中的主執行緒）或 Web 請求處理執行緒。這通常用於背景執行的非同步處理中，當不需要回到原來的上下文時，以提高性能並避免不必要的上下文切換或死結。但說實話，我自己也不是很理解，所以自行看原文。

關於使用 `IAsyncDisposable` 的時機，由於通常我只處理包含非託管資源的物件，而不會直接操作非託管資源（事實上我也不懂），而且 .NET 中越來越多包含非託管資源的物件已經有實作 `IAsyncDisposable`。因此，當實作處置模式並涉及這些物件時，可以實作 `IAsyncDisposable` 來提升效能。

## using 陳述式

### 確保釋放資源的基本方式

當遇到需要管理非託管資源的物件時，為了避免忘記呼叫 `Dispose()`，通常會使用 `try...finally` 結構，這樣做可以保證無論是否發生異常，`Dispose()` 都會被呼叫。以下是相關的程式碼範例：
程式碼如下：

```csharp
ResourceHandle handle;
try {
    handle = new ResourceHandle();
    // handle 執行其他方法
} finally {
    // 不論是否發生 Exception 都會釋放資源，可簡化成 handle?.Dispose();
    if (handle is not null) {
        handle.Dispose();
    }
}
```

當處理實作了 `IDisposable` 的物件時，可以使用 `using` 陳述式來自動釋放資源。編譯器會將 using 陳述式轉換為 `try...finally` 結構。這樣不僅使程式比較簡潔，也減少了手動管理資源釋放時可能出現的錯誤。以下是使用 `using` 的範例：

```csharp
using (ResourceHandle handle = new ResourceHandle()) {
    // handle 執行其他方法
}
```

當然需要針對 Exception 進行特殊處理，可以考慮改回使用 `try...catch...finally` 結構。

### 巢狀的 `using` 陳述式

對於多個需要釋放的物件，可以使用巢狀 `using` 陳述式。

```csharp
using (ResourceHandle handle1 = new ResourceHandle()) {
    using (ResourceHandle handle2 = new ResourceHandle()) {
        // handle1 和 handle2 執行其他方法
    }
}
```

當 `using` 陳述式之間沒有其他程式碼，可以簡化成如下，以避免過多的縮排。

```csharp
using (ResourceHandle handle1 = new ResourceHandle())
using (ResourceHandle handle2 = new ResourceHandle()) {
    // handle1 和 handle2 執行其他方法
}
```

如果宣告型別相同，則可以將多個變數合併到一個 `using` 陳述式中：

```csharp
using (ResourceHandle handle1 = new ResourceHandle(), handle2 =new ResourceHandle()) {
    // handle1 和 handle2 執行其他方法
}
```

### C# 8.0 的新語法

C# 8.0 引入了更簡潔的 `using` 語法，這種新語法可用於方法內的大括弧或是獨立的範圍內的大括弧，並在離開範圍時自動呼叫 `Dispose()` 方法。範例如下：

```csharp
{
    using ResourceHandle handle = new ResourceHandle();
    // handle
}
```

### 非同步處理

而如果是實作 `IAsyncDisposable` 的物件，則可以使用 `await using`，範例如下：

```csharp
await using (AsyncDisposableObject resource = new AsyncDisposableObject()) {
    // Use the resource
}

// 或是
{
    await using AsyncDisposableObject resource = new AsyncDisposableObject();
}
```

## 異動歷程

* 2024-08-08 初版文件建立。
