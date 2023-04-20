# MemoryCache 在 ASP.NET MVC 上的應用

[![hackmd-github-sync-badge](https://hackmd.io/18kOSQfqQhS0KVi4uTAzXw/badge)](https://hackmd.io/18kOSQfqQhS0KVi4uTAzXw)


## 使用 ActionFilter 來快取 Action 內容
[`OutputCacheAttribute`](https://learn.microsoft.com/zh-tw/dotnet/api/system.web.mvc.outputcacheattribute?view=aspnet-mvc-5.2&WT.mc_id=DOP-MVP-37580) 為 MVC 所提供的一個 `ActionFilter`，用來將 Action Method 標註要使用快取，如果未特別設定 `OutputCache`， `OutputCacheAttribute` 的 Server 端的快取是使用 `MemoryCache` 來實作。

### Properties
* Duration：快取期間 (秒鐘)。
* Location：
快取儲存位置，設定值請參考 「[OutputCacheLocation](https://learn.microsoft.com/zh-TW/dotnet/api/system.web.ui.outputcachelocation?view=netframework-4.8&WT.mc_id=DOP-MVP-37580)」，以下簡略說明：
    * None：停用快取。
    * Client：瀏覽器用戶端。
    * Server：Web Server。
    * Downstream：Client 和 Proxy Server。
    * ServerAndClient：Client 和 Web Server。
    * Any：Web Server、Client 和 Proxy Server。
* NoStore：設定是否不允許快取。
* VaryByXXX：依Header、Form 和 Query 參數等來區分快取內容，例如報表查詢時，應該要針對不同的查詢條件設定快取。
* CacheProfile：設定 Config 定義的快取方案的 Name，通常專案上會有幾個固定的快取方案，為避免當方案內容異動時，要修改全部使用該方案的程式碼，所以會在 Config 定義各方案的快取設定，各 Action Method 再使用 CacheProfile 來指定快取方案。

:::info
NoStore 和 Location.None 看起來很類似，但實際作用不一樣，具體行為如下：
* NoStore：將 Header 的 `Cache-Control` 設為 `no-store`，不影響 Web Server 的快取。
* Location.None：將 Header 的 `Cache-Control` 設為 `no-cache`，且不儲存 Web Server 的快取。

`Cache-Control` 的行為可參考「[Cache-Control](https://pjchender.dev/webdev/note-http-cache/#cache-control)」，節錄 `no-store` 和 `no-cache` 的內容如下：
`no-store`:不要讓瀏覽器快取。
`no-cache`：使用快取，但每次請求前都先向伺服器檢查是否有新的內容。
:::

有關各項 `Location` 設定值的執行結果，可以參考黑暗執行緒的這篇文章「[ASP.NET OutputCache 快取行為深入觀察](https://blog.darkthread.net/blog/aspnet-outputcache-experiment)」。

### 具體的使用案例
當有純資料查詢的功能頁面(不能含可連至編輯頁面的連結，曾遇過快取只有 30 秒，結果客戶很快速的到編輯頁修改資料返回，然後疑惑資料怎麼沒有變)，如果有些資料查詢比較花時間，就可使用 `OutputCacheAttribute` 來建立快取資料。

有關查詢功能的快取，可以使用 `VaryByParam="*"` 來針對不同的 QueryString 或 POST 的參數來建立不同的快取版本，但如果是有針對不同的使用者設定權限的話，會導致不同權限的使用者快取到相同的結果，所以需要在額外針對此進行處理，以下是實作範例。

#### Web.config
`duration` 請依專案狀況設定秒數。
```xml
<system.web>
  <caching>
    <outputCacheSettings>
      <outputCacheProfiles>
        <add name="Default" duration="30" varyByParam="*" varyByCustom="Cookie" noStore="true" />
      </outputCacheProfiles>
    </outputCacheSettings>
  </caching>
</system.web>
```

#### Global.asax.cs
利用 Override `GetVaryByCustomString()`，來針對不同使用者產生不同的 Key，以下提供使用 Cookie 和 Session 兩種方式，如果是使用 Session，須將「Web.config」的 `varyByCustom` 的值 改為 `Session`。
```csharp
public class MvcApplication : HttpApplication
{
    public override string GetVaryByCustomString(HttpContext context, string custom)
    {
        const string OutputCacheKey = "OutputCacheId";
        
        if (custom.Equals("Cookie", StringComparison.OrdinalIgnoreCase))
        {
            if (Request.Cookies[OutputCacheKey] == null)
            {
                string cacheId = Guid.NewGuid().ToString();
                Response.Cookies.Add(new HttpCookie(OutputCacheKey) {
                    Value = cacheId,
                    HttpOnly = true,
                    Expires = DateTime.Now.AddHours(1),
                    Secure = false // 請依是否有使用 SSL 設定
                });

                return cacheId;
            }
            
            return Request.Cookies[OutputCacheKey].Value;
        }
        
        // UserId 請替換成實際登入帳號的 Session Key
        if (custom.Equals("Session", StringComparison.OrdinalIgnoreCase)
            && Session["UserId"] != null)
        {
            string userId = Session["UserId"].ToString();
            
            if (Session[OutputCacheKey] == null
                || !(Session[OutputCacheKey] is VaryByCustomInfo customInfo)
                    || customInfo.UserId == userId)
                {
                    Guid value = Guid.NewGuid();
                    Session[OutputCacheKey] = new VaryByCustomInfo(userId, value);
                    return value.ToString();
                }

                return customInfo.Value.ToString();
        }
        
        return base.GetVaryByCustomString(context, custom);
    }
    
    private class VaryByCustomInfo
    {
        public VaryByCustomInfo(string userId, Guid value)
        {
                UserId = userId ?? throw new ArgumentNullException(nameof(userId));
        }

        public string UserId { get; }

        public Guid Value { get; }
    }
}
```

#### Controller
可以在 Index 裡面設定中斷點測試，可以發現只要 `model` 內容相同，且同個人瀏覽頁面，那麼一定時間內，只有第一次瀏覽會觸發中斷點。
```csharp
public class TestController : Controller {
    [OutputCache(CacheProfile = "Default")]
    [HttPost]
    public ActionResult Index(IndexViewModel model)
    {
        //...實作使用 model 產生 ActionResult 回傳...
    }
}
```

## 更新資料庫時，清除快取資料
有些資料量不大且不常異動的資料，可以存放到快取，減少與資料庫連線次數，例如：縣市資料和資料庫的網站設定等。
為避免異動資料時，資料快取仍是舊的，必須要在異動資料的在 API 裡，清除快取或更新快取資料，但如果遇到去改資料庫資料的情況，仍會有快取到舊資料的可能，所以最好的作法是直接監聽資料庫資料，當資料變更時，清空快取資料。

### ChangeMonitor
`MemoryCache` 可使用 `ChangeMonitor` 來偵測資料來源是否變更，.NET Framework 提供了以下兩個實作 Class：
* [HostFileChangeMonitor](https://learn.microsoft.com/zh-tw/dotnet/api/system.runtime.caching.hostfilechangemonitor)：用來監測主機上的檔案異動。
* [SqlChangeMonitor](https://learn.microsoft.com/zh-tw/dotnet/api/system.runtime.caching.sqlchangemonitor)：用來偵測 SQL Server 上的資料異動。
`SqlChangeMonitor` 使用「[SqlDependency](https://learn.microsoft.com/zh-tw/dotnet/framework/data/adonet/sql/detecting-changes-with-sqldependency)」來監測資料庫的資料異動，當 `SqlDependency` 加入 `SqlCommand` 時，會建立一個 「[SqlNotificationRequest](https://learn.microsoft.com/zh-tw/dotnet/framework/data/adonet/sql/sqlcommand-execution-with-a-sqlnotificationrequest)」 指派給 `SqlCommand` 來與 SQL Server 建立通知要求，而當資料進行異動時，`SqlChangeMonitor` 就會通知 `MemoryCache` 清除快取資料。

### 範例
#### Global.asax.cs
```csharp
public class MvcApplication : System.Web.HttpApplication
{
    protected void Application_Start()
    {
        //...其他在 Application_Start 的實作...

       // 增加此行
       SqlDependency.Start(WebConfigurationManager.ConnectionStrings["MyDB"].ConnectionString);
    }

    protected void Application_End()
    {
        // 增加此行
        SqlDependency.Stop(WebConfigurationManager.ConnectionStrings["MyDB"].ConnectionString);
    }
}
```

#### HomeController
```csharp
public class HomeController : Controller
{
    private static DateTime lastChangedTime;

    private const string CacheKey = "CacheKey";

    public ActionResult TestDependency()
    {
        // 判斷沒 Cache 資料，就建立
        if (MemoryCache.Default[CacheKey] is null)
        {
            CreateCache();
        }
        ViewBag.Key1 = MemoryCache.Default[CacheKey] as string;
        ViewBag.LastChangedTime = lastChangedTime;

        return View();
    }

    private void CreateCache()
    {
        string connectionStr = WebConfigurationManager.ConnectionStrings["MyDB"].ConnectionString;

        CacheItemPolicy policy = new CacheItemPolicy();
        using (SqlConnection conn = new SqlConnection(connectionStr))
        using (SqlCommand cmd = new SqlCommand("SELECT Key1 FROM dbo.Config", conn))
        {
            SqlDependency dependency = new SqlDependency(cmd);
            // 可用 OnChange 來在資料異動時，更新其他資料
            dependency.OnChange += SqlDependencyOnChange;

            conn.Open();
            // 需要執行一次 SQL Command，監聽才可以生效，可以視情況看是否順便取得資料
            string key1 = cmd.ExecuteScalar().ToString();

            SqlChangeMonitor monitor = new SqlChangeMonitor(dependency);
            policy.ChangeMonitors.Add(monitor);

            // 設定快取資料，當資料異動時，清除快取資料
            MemoryCache.Default.Set(CacheKey, key1, policy);
        }
    }

    private void SqlDependencyOnChange(object sender, SqlNotificationEventArgs e)
    {
        lastChangedTime = DateTime.Now;
        (sender as SqlDependency).OnChange -= SqlDependencyOnChange;
    }
}
```

:::warning
* 為啟用資料監聽，需要在資料庫中啟用 Service Broker 功能。
* 用來監聽資料的 SQL 語法，必須要指定到具體要監聽的欄位，且資料表名稱必須要涵蓋 Schema(e.g. `dbo`)，否則無法正確建立快取資料。
* `SqlDependency` 設定 `SqlCommand` 後，必需執行一次 `SqlCommand` 才可生效。
:::

#### 啟用 Service Broker
如果尚未啟用 Service Broker，可以使用以下語法啟用：
```sql
ALTER DATABASE {資料庫名稱} SET ENABLE_BROKER;
```

如果將已經啟用了 Service Broker 的資料庫卸載再重新掛載，執行此語法，則可能會遇到以下錯誤訊息：
```
無法在資料庫 "<DBName>" 中啟用 Service Broker，因為資料庫 (<GUID>) 中的 Service Broker GUID 與 sys.databases (<GUID>) 中的不相符。
```

此時，需要使用以下語法重新設定 Service Broker：
```sql
ALTER DATABASE {資料庫名稱} SET NEW_BROKER;
```

由於啟用 Service Broker 必須要在其他使用者連線的情況下進行，因此如果是運行中的資料庫，需要在執行上述語法時加上 WITH ROLLBACK IMMEDIATE，以回復未完成的交易並中斷其他使用者對資料庫的連線。因此，完整的語法如下所示：
```sql
ALTER DATABASE {資料庫名稱} SET NEW_BROKER WITH ROLLBACK IMMEDIATE;
```

###### tags: `.NET` `.NET Framework` `ASP.NET` `MemoryCache`
