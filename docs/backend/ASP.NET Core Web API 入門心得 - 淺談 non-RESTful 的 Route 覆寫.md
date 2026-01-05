---
title: "ASP.NET Core Web API 入門心得 - 淺談 non-RESTful 的 Route 覆寫"
date: 2024-04-16
lastmod: 2024-04-16
description: "探討 ASP.NET Core Web API 在非 RESTful 架構下的路由（Route）覆寫技巧。說明如何透過繼承 `BasicController` 統一路由設定，並利用 `[Route]` 屬性與特殊前綴符號（`/` 或 `~`）靈活調整個別 Controller 或 Action 的 URL 路徑。"
tags: [".NET","ASP.NET","ASP.NET Core","Web API"]
---

# ASP.NET Core Web API 入門心得 - 淺談 non-RESTful 的 Route 覆寫

在使用 non-RESTful 風格的 Web API 中，通常會使用 Controller/Action 的格式來定義大部分的 URL。為了避免在每個 Controller 或 Action 中都重複設定路由，可以建立一個 BasicController 來統一設定路由，如下所示：

```csharp
[ApiController]
[Route("[controller]/[action]")]
public abstract class BasicController : ControllerBase {
}

public class TestRouteController : BasicController {
    // URL:/TestRoute/TestAction
    [HttpPost]
    public void TestAction() {
    
    }
}
```

透過這種方式，就不需要在每個 Controller 或 Action 中再次指定路由。但如果遇到像我這種白目、第一次參與前後端分離的專案、對公司專案架構不熟，最後開發出來的 API URL 與現有架構差異過大，導致被前端拿刀來砍的情況下，雖然可以使用 `[jsonPropertyName]` 來處理輸入和輸出的屬性名稱，但對於路由定義在 `BasicController` 上的情況，如果不想要走回每個 Action 個別設定，就只能透過覆寫不同路由來解決這個問題(~~當然像我這種幾乎都不一樣就另一回事~~)。

在 ASP.NET Core 中，`[Route]` 屬性在 Controller 和 Action 上的處理效果有所不同。若加在 Controller 上，將覆寫 `BasicController` 的路由設定；若加在 Action 上，則會與 Controller 的設定進行串接。以下提供了幾種使用情境的範例：

```csharp
[ApiController]
[Route("[controller]/[action]")]
public abstract class BasicController : ControllerBase {
}

[Route("Override/[action]")]
public class TestRouteController : BasicController {
    // 情境：Controller 覆寫 Route，Action 不處理
    // URL：/Override/OverrideController
    [HttpPost]
    public void OverrideController() {
    }

    // 常見誤用情境：Controller 和 Action 都覆寫 Route，導致 Action 的 URL 是兩者 Route 的串接
    // URL：/Override/OverrideAction/Action/OverrideAction
    [HttpPost]
    [Route("Action/[action]")]
    public void OverrideAction() {
    }

    // 情境：Action 不想使用 Controller 設定的 Route，在 Route 最前面加上 "/"
    // URL：/Action/OnlyAction
    [HttpPost]
    [Route("/Action/[action]")]
    public void OnlyAction() {
    }

    // 情境：Action 不想使用 Controller 設定的 Route，在 Route 最前面加上 "~"，效果同上
    // URL：/Action/OnlyAction2
    [HttpPost]
    [Route("~/Action/[action]")]
    public void OnlyAction2() {
    }

    // 情境：單純只想要修改 Action 名稱
    // URL：/Override/Rename
    [HttpPost]
    [ActionName("Rename")]
    public void RenameAction() {
    }
}
```

## 異動歷程

- 2024-04-16 初版文件建立。
