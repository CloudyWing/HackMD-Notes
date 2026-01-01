---
title: "在 ASP.NET 使用 Autofac 實作 DI"
date: 2022-11-05
lastmod: 2022-11-05
description: "介紹在 ASP.NET 中使用 Autofac 進行依賴注入 (DI) 的方法。說明 Container 建立、型別註冊 (`RegisterType`)、Lifetime Scope 管理以及如何利用 Reflection 進行大量自動註冊。"
tags: [".NET",".NET Framework","ASP.NET","Autofac","Dependency Injection"]
---

# 在 ASP.NET 使用 Autofac 實作 DI

## Autofac

[Autofac](https://autofac.readthedocs.io/en/latest/index.html) 是 ASP.NET 比較有名的 DI 套件，早期還有其他的套件，但後續因與 ASP.NET Core 相容問題，很多都淘汰掉了 (雖然 ASP.NET Core 有内建 DI 工具，但因為功能相對較為陽春，所以很多人還是會裝其他套件來擴充使用)。

最初選擇 Autofac 的原因是因為它的型別註冊功能很強大，且官方文件也滿詳細的，又有提供多個框架的支援，結果剛好這套套件也順利活到 ASP.NET Core 時代。

Autofac 的使用方式如下面範例，其中如果是在 Web 使用時，Autofac 會幫忙在每個 Request 建立一個 Lifetime Scope。

```csharp
var builder = new ContainerBuilder();

// 註冊型別
builder.RegisterType<Service>();

// 建立一個 Autofac Container
var container = builder.Build();

// 建立一個 Lifetime Scope
using(var scope = container.BeginLifetimeScope()) {
   Service service = scope.Resolve<Service>();
}
```

### Register Type

Autofac 註冊型別使用的 Method 為 `RegisterType<{Instance Type}>().As({Declare Type})`，也就是說當 Autofac 遇到一個取得 Service Type 的請求時，會建立一個 Instance Type 的物件回傳。

#### 使用 Reflection 大量註冊型別

由於每個型別都要個別進行註冊過於繁雜，Autofac 有提供使用 Reflection 去搜尋 Assembly 底下的特定型別進行註冊，官網本身也提供一些[範例](https://autofac.readthedocs.io/en/latest/register/scanning.html)可以參考。

```csharp
builder.RegisterAssemblyTypes(Assembly.GetExecutingAssembly())
    .Where(x => typeof(IAppService).IsAssignableFrom(x));
```

#### 自行設定 Instance 的建立方法

當 Class 裡有多個 Constructor 時，會找出全部能透過 Autofac 建立的 Constructor (意思是全部參數都能用 DI 設值)，選擇參數最多的來使用，詳情參閱[黑暗執行緒 - Autofac 筆記 4 - 建構參數與建構式選擇](https://blog.darkthread.net/blog/autofac-notes-4-constructor/)，但如果我們希望能自行決定物件建立方法，可以用以下程式碼設定。

```csharp
builder.Register(c => new TypeA(c.Resolve<TypeB>()));
```

### 指定註冊型別給哪些型別使用

| Method                    | 描述                                                        |
| ------------------------- | ----------------------------------------------------------- |
| As()                      | 註冊型別給指定型別使用                                      |
| AsImplementedInterfaces() | 註冊型別給自身所實作的 Interface（不包含IDisposable）使用。 |
| AsClosedTypesOf(open)     | 註冊給可分配給開放泛型型別的封閉實例的型別使用。            |
| AsSelf()                  | 將型別註冊給自身使用。                                      |

::: info
如果未設定使用型別，預設使用 `AsSelf()`，但如果有指定時，就不會自動增加 `AsSelf()`，可多項指定一起使用。

```csharp
// 自動設定 AsSelf()
builder.RegisterType<Service>();

// 有指定 AsImplementedInterfaces()，所以不會自動設定 AsSelf()
builder.RegisterType<Service>()
    .AsImplementedInterfaces();

// 要在使用其他指定的情況下使用 AsSelf()，必須手動增加
builder.RegisterType<Service>()
    .AsImplementedInterfaces()
    .AsSelf();
```

:::

### Instance Scope

Autofac 提供以下 Instance Scope：

| Instance Scope              | 描述                                         | .NET Core 的 對應 |
| --------------------------- | -------------------------------------------- | ----------------- |
| Instance Per Dependency     | 每一次呼叫都是一個新的 Instance，為預設值。  | Transient         |
| Instance Per Lifetime Scope | 每個 Scope 都只會產生一個 Instance。         | Scoped            |
| Single Instance             | 整個 Autofac Container 都是同一個 Instance。 | Singleton         |

```csharp
var builder = new ContainerBuilder();

// 註冊型別
builder.RegisterType<Worker>()
    // 宣告 Instance Scope
    .InstancePerDependency();
    //.InstancePerLifetimeScope()

// 建立一個 Autofac Container
var container = builder.Build();

// 建立一個 Lifetime Scope
using(var scope1 = container.BeginLifetimeScope()) {
   for(var i = 0; i < 100; i++) {
     // 每一次呼叫
     var w1 = scope1.Resolve<Worker>();
   }
}

// 建立一個 Web Request Scope
using(var scope2 = container.BeginLifetimeScope("AutofacWebRequest")) {
   for(var i = 0; i < 100; i++) {
     // 每一次呼叫
     var w1 = scope2.Resolve<Worker>();
   }
}

+----------------------------------------------------+
|                 Autofac Container                  |
|                                                    |
| +------------------------------------------------+ |
| |                 Lifetime Scope                 | |
| |                                                | |
| | +--------------------+  +--------------------+ | |
| | |    Get Instance    |  |    Get Instance    | | |
| | +--------------------+  +--------------------+ | |
| +------------------------------------------------+ |
|                                                    |      
| +------------------------------------------------+ |
| |                 Lifetime Scope                 | |
| |                                                | |
| | +--------------------+  +--------------------+ | |
| | |    Get Instance    |  |    Get Instance    | | |
| | +--------------------+  +--------------------+ | |
+----------------------------------------------------+
```

::: info
`InstancePerMatchingLifetimeScope({Tag})` 和 `InstancePerRequest()` 皆為 `InstancePerLifetimeScope()` 的變種。
當在呼叫 `container.BeginLifetimeScope({Tag})` 建立 Scope 時，可以設定 Tag，而宣告 `InstancePerMatchingLifetimeScope({Tag})` 的型別，只能建立在標記該 Tag 的 Scope 底下。
Autofac 在 Web 的每個 Request 裡，都會建立一個 Tag 為 「AutofacWebRequest」 的 Scope，而 `InstancePerRequest()` 大致等同於 `InstancePerMatchingLifetimeScope("AutofacWebRequest")`。
:::

#### 官網文件

* [Instance Scope](https://autofac.readthedocs.io/en/latest/lifetime/instance-scope.html)
* [How do I work with per-request lifetime scope?](https://autofac.readthedocs.io/en/latest/faq/per-request-scope.html)
*

### 設定允許使用 Property Injection

* 一般會建議盡量使用 Constructor Injection，但有些情況下不得不使用 Property Injection，如框架本身沒支援 Constructor Injection，或是有循環依賴的情況發生。
* 循環依賴指的是 Main Class 裡包含 Sub Class，Sub Class 裡也包含 Main Class，此時設計如下：

```csharp
class Main {
    private readonly Sub sub;
    
    public Main(Sub sub) {
        this.sub = sub;
    }
}

class Sub {
    public Main Main { get; set; }
}

//......

builder.RegisterType<Main>()
    .InstancePerLifetimeScope();
builder.RegisterType<Sub>()
    .InstancePerLifetimeScope()
    .PropertiesAutowired(PropertyWiringOptions.AllowCircularDependencies);
```

::: warning

* 兩個型別註冊都不可使用 InstancePerDependency()。
* 如果沒有要使用循環依賴，則不需要傳入 `PropertyWiringOptions.AllowCircularDependencies`。
:::

#### 官網文件

* [Circular Dependencies](https://autofac.readthedocs.io/en/latest/advanced/circular-dependencies.html)

## 在 MVC 上使用 Autofac

### NuGet 套件

* Autofac
* Autofac.Mvc5

### 程式碼範例

#### Global.asax.cs

以下程式碼來自官網範例，`RegisterControllers()` 為必要，要設定後，才可以將 Instance Injection 到 Controller。
註解被標註「OPTIONAL」視情況是否添加，例如要使用 `HttpContextBase` 等型別注入，則需要 Register `AutofacWebTypesModule`。

```csharp
public class MvcApplication : System.Web.HttpApplication {
    protected void Application_Start() {
        //...實作 MVC 設定...
        // 靘? RouteConfig.RegisterRoutes(RouteTable.Routes);

        // 以下為 Autofac 相關程式碼
        var builder = new ContainerBuilder();

        // Register your MVC controllers. (MvcApplication is the name of
        // the class in Global.asax.)
        builder.RegisterControllers(typeof(MvcApplication).Assembly);

        // OPTIONAL: Register model binders that require DI.
        builder.RegisterModelBinders(typeof(MvcApplication).Assembly);
        builder.RegisterModelBinderProvider();

        // OPTIONAL: Register web abstractions like HttpContextBase.
        builder.RegisterModule<AutofacWebTypesModule>();

        // OPTIONAL: Enable property injection in view pages.
        builder.RegisterSource(new ViewRegistrationSource());

        // OPTIONAL: Enable property injection into action filters.
        builder.RegisterFilterProvider();
            
        builder.RegisterType<AppService>()
            .As<IAppService>()
            .InstancePerLifetimeScope();

        // Set the dependency resolver to be Autofac.
        var container = builder.Build();
        DependencyResolver.SetResolver(new AutofacDependencyResolver(container));
    }
}
```

#### HomeController

```csharp
 public class HomeController : Controller {
    private readonly IAppService appService;

    public HomeController(IAppService appService) {
        this.appService = appService ?? throw new ArgumentNullException(nameof(appService));
    }
    
    //...實作 HomeController Action...
}
```

### 在 View 使用 DI

#### WebViewPageBase

```csharp
// 沒有使用 Model 的 View
public abstract class WebViewPageBase : WebViewPage {
    // 靠 builder.RegisterSource(new ViewRegistrationSource()) 的設定 Injection
    public IAppService AppService { get; set; }
    
    public IAppService AppService2 => GetDependencyService<IAppService>

    public TService GetDependencyService<TService>() {
        return DependencyResolver.Current.GetService<TService>();
    }
}

// 有使用 Model 的 View
public abstract class WebViewPageBase<T> : WebViewPage<T> {
    // 靠 builder.RegisterSource(new ViewRegistrationSource()) 的設定 Injection
    public IAppService AppService { get; set; }
    
    public IAppService AppService2 => GetDependencyService<IAppService>

    public TService GetDependencyService<TService>() {
        return DependencyResolver.Current.GetService<TService>();
    }
}
```

#### Index.cshtml

設定 Index.cshtml 繼承 WebViewPageBase，此時有三種方法可以使用 IAppService：

1. 使用屬性 AppService。
2. 使用屬性 AppService2。
3. 使用 `GetDependencyService<IAppService>()`，其實等同於直接在 View 使用`DependencyResolver.Current.GetService<TService>()`，只是在父類別簡化呼叫。

就個人偏好，每個 View 都有機會用到的使用方法 2，個別 View 用到的使用方法 3。
如果沒使用方法 1，Global 就不需要設定 `builder.RegisterSource(new ViewRegistrationSource())`。

無使用 Model 寫法如下：

```html
@inherits DISample.MVC.WebViewPageBase
@{
    IAppService appService = GetDependencyService<IAppService>();
}
```

有使用 Model 寫法如下：

```html
@inherits DISample.MVC.WebViewPageBase<ViewModel>
@{
    IAppService appService = GetDependencyService<IAppService>();
}
```

如果希望可以和原來一樣不使用 Model 就不用特別宣告，使用 Model 則使用 `@model ViewModel` 宣告的作法，請參考此篇[文章](https://github.com/autofac/Autofac/issues/349)修改 `\View\Web.config` 內容。

```xml
<configuration>
  <system.web.webPages.razor>
    <pages pageBaseType="MyNamespace.WebViewPageBase">
    </pages>
  </system.web.webPages.razor>
</configuration>
```

::: info

* 需注意修改的「Web.config」是資料夾「View」底下的，而非專案根目錄底下的。
* MyNamespace 請替換成實際專案的 Namespace。
:::

### 模擬 ASP.NET Core 的 `FromServicesAttribute` Injection 至 Action Parameter

#### ServicesModelBinder

```csharp
public class ServicesModelBinder : IModelBinder {
    public object BindModel(ControllerContext controllerContext, ModelBindingContext bindingContext) {
        return bindingContext is null
            ? throw new ArgumentNullException(nameof(bindingContext))
            : DependencyResolver.Current.GetService(bindingContext.ModelType);
    }
}
```

#### FromServicesAttribute

```csharp
[AttributeUsage(AttributeTargets.Parameter)]
public sealed class FromServicesAttribute : CustomModelBinderAttribute {
    public override IModelBinder GetBinder() => new ServicesModelBinder();
}
```

#### Controller Action

```csharp
public ActionResult Index([FromServices] IAppService appService) {
    //...Action...
    return View();
}
```

### 封裝 AppSettings 來作 Injection

一般取得 AppSettings 都是使用 `WebConfigurationManager.AppSettings` 來取得設定值，但直接使用它有兩個缺點：

1. AppSettings 值只有 `string`，如果有 `bool` 或數值型別需求時，每次使用都要進行型別轉換，所以最好是可以在進一步進行封裝處理。
2. `WebConfigurationManager` 是 Static Class，但有些情況下(靘? 單元測試)，會希望值能用參數的方式傳入，所以有些人會用 Singleton 進行封裝。

以下程式碼是基於一個原則進行設定，如果有其他需求，可自行調整，AppSetting Key 必需為 `{Options Class Name(不包含 Options)}:{Constructor Parameter Name}`，大小寫隨意，例如有一個 Options 名為 `TestOptions`，Constructor 參數名為 `isTest`，那 AppSetting Key 為 `Test:IsTest`

##### Web.config

```xml
<appSettings>
  <add key="Path:Upload" value="C:\Upload\" />
  <add key="Test:IsTest" value="true" />
  <add key="Test:TestName" value="Test" />
</appSettings>
```

#### Global.asax.cs

```csharp
public class MvcApplication : System.Web.HttpApplication {
    protected void Application_Start() {
        var builder = new ContainerBuilder();
        
        builder.RegisterModule<AutofacWebTypesModule>();
        
        // 設定 Options DI
        builder.RegisterModule<OptionsModule>();

        var container = builder.Build();
        DependencyResolver.SetResolver(new AutofacDependencyResolver(container));
    }
}
```

#### OptionsModule

實際設定 Option DI 的地方

```csharp
public class OptionsModule : Module {
    protected override void Load(ContainerBuilder builder) {
        // 如果會需要執行中的才能決定的參數使用這個 Register
        RegisterOptions<PathOptions>(builder);
        // 如果會純 AppSettings 的設定就使用這個  Register
        RegisterOptionsInstance<TestOptions>(builder);
    }

    private void RegisterOptionsInstance<T>(ContainerBuilder builder)
        where T : class {
        builder.RegisterInstance(OptionUtils.CreateInstance<T>())
            .AsImplementedInterfaces()
            .AsSelf()
            .SingleInstance();
    }

    private void RegisterOptions<T>(ContainerBuilder builder)
        where T : class {
        string optionsName = typeof(T).Name.Replace("Options", "");
        var registrationBuilder = builder.RegisterType<T>()
            .AsSelf()
            .InstancePerLifetimeScope();

        foreach (string key in WebConfigurationManager.AppSettings.AllKeys.Where(x => x.StartsWith(optionsName))) {
            registrationBuilder.WithParameter(new ResolvedParameter(
                (pi, ctx) => pi.Name.Equals(
                                Regex.Replace(key, $@"^{optionsName}:", "", RegexOptions.IgnoreCase),
                                StringComparison.OrdinalIgnoreCase
                            ),
                (pi, ctx) => FixValue(pi.ParameterType, WebConfigurationManager.AppSettings[key])));
        }

        object FixValue(Type type, string value) {
            return Convert.ChangeType(value, type);
        }
    }
}
```

#### PathOptions

```csharp
public class PathOptions {
    private readonly HttpServerUtilityBase httpServer;

    // HttpServerUtilityBase 是在 AutofacWebTypesModule 裡作 DI 設定;
    public PathOptions(HttpServerUtilityBase httpServer, string upload) {
        this.httpServer = httpServer ?? throw new ArgumentNullException(nameof(httpServer));
        Upload = upload ?? throw new ArgumentNullException(nameof(upload));
    }

    public string Upload { get; }

    private string GetRealPath(string path) {
        return IsVirtualDirectory(path)
            ? httpServer.MapPath(path)
            : path;
    }

    private static bool IsVirtualDirectory(string path) {
        return path.Length < 2 || path[1] != Path.VolumeSeparatorChar;
    }
}
```

#### TestOptions

```csharp
public class TestOptions {
    public TestOptions(bool isTest, string testName) {
        IsTest = isTest;
        TestName = testName ?? throw new ArgumentNullException(nameof(testName));
    }

    public bool IsTest { get; }

    public string TestName { get; }
}
```

### 官網文件

[MVC](https://autofac.readthedocs.io/en/latest/integration/mvc.html)

## 在 Web API 上使用 Autofac

### NuGet 套件

* Autofac
* Autofac.WebApi2

### 程式碼範例

#### Global.asax.cs

以下程式碼來自官網範例，`RegisterApiControllers()` 為必要，要設定後，才可以將 Instance Injection 到 ApiController。
註解被標註「OPTIONAL」視情況是否添加。

```csharp
public class WebApiApplication : HttpApplication {
    protected void Application_Start() {
        //...實作 Web API 設定...
        //靘? GlobalConfiguration.Configure(WebApiConfig.Register);
    
        // 以下為 Autofac 相關程式碼
ContainerBuilder builder = new ContainerBuilder();
        HttpConfiguration config = GlobalConfiguration.Configuration;

        // Register your Web API controllers.
        builder.RegisterApiControllers(Assembly.GetExecutingAssembly());

        // OPTIONAL: Register the Autofac filter provider.
        builder.RegisterWebApiFilterProvider(config);

        // OPTIONAL: Register the Autofac model binder provider.
        builder.RegisterWebApiModelBinderProvider();

        builder.RegisterType<AppService>()
            .As<IAppService>()
            .InstancePerLifetimeScope();

        // Set the dependency resolver to be Autofac.
        IContainer container = builder.Build();
        config.DependencyResolver = new AutofacWebApiDependencyResolver(container);
    }
}
```

#### ValuesController

```csharp
public class ValuesController : ApiController {
    private readonly IAppService appService;

    public ValuesController(IAppService appService) {
        this.appService = appService ?? throw new ArgumentNullException(nameof(appService));
    }
    
    //...實作 ValuesController Action...
}
```

### 官網文件

[Web API](https://autofac.readthedocs.io/en/latest/integration/webapi.html)

## 在 Web Form 上使用 Autofac

由於 Web Form 不支援 Constructor Injection，所以需要用 Property Injection。

### NuGet 套件

* Autofac
* Autofac.Web

### 程式碼範例

Web.config

```xml
<configuration>
  <system.web>
    <httpModules>
      <!-- This section is used for IIS6 -->
      <add
        name="ContainerDisposal"
        type="Autofac.Integration.Web.ContainerDisposalModule, Autofac.Integration.Web"/>
      <add
        name="PropertyInjection"
        type="Autofac.Integration.Web.Forms.PropertyInjectionModule, Autofac.Integration.Web"/>
    </httpModules>
  </system.web>
  <system.webServer>
    <!-- This section is used for IIS7 -->
    <modules>
      <add name="ContainerDisposal" type="Autofac.Integration.Web.ContainerDisposalModule, Autofac.Integration.Web" preCondition="managedHandler" />
      <add name="PropertyInjection" type="Autofac.Integration.Web.Forms.PropertyInjectionModule, Autofac.Integration.Web" preCondition="managedHandler" />
    </modules>
  </system.webServer>
</configuration>
```

::: warning
官網建議兩種寫法都寫，來相容不同的 IIS 版本，但實際上兩個都寫有可能會有 Error。
:::

#### Global.asax.cs

```csharp
public class Global : HttpApplication, IContainerProviderAccessor {
    private static IContainerProvider containerProvider;

    public IContainerProvider ContainerProvider {
        get {
            return containerProvider;
        }
    }

    protected void Application_Start(object sender, EventArgs e) {
        containerProvider = new ContainerProvider(CreateContainer());
    }

    public static IContainer CreateContainer() {
        ContainerBuilder builder = new ContainerBuilder();

        builder.RegisterType<AppService>()
            .As<IAppService>()
            .InstancePerLifetimeScope()
            .PropertiesAutowired(PropertyWiringOptions.AllowCircularDependencies);

        IContainer container = builder.Build();
        
        return container;
    }
}
```

#### Default.aspx.cs

```csharp
public partial class _Default : Page {
    public IAppService AppService { get; set; }

    protected void Page_Load(object sender, EventArgs e) {
        //...實作...
    }
}
```

### 官網文件

[Web Forms](https://autofac.readthedocs.io/en/latest/integration/webforms.html)

## 在 Web Service 上使用 Autofac

* Web Service 不支援 Constructor Injection，所以需要用 Property Injection。
* Web.config 裡的 Xml 設定是提供給 Web Form 使用的，Web Service 無法用它來設定 Property Injection，所以需要藉由 `WebServiceBase` 來實作這部分。

### NuGet 套件

* Autofac
* Autofac.Web

### 程式碼範例

#### Global.asax.cs

同 Web Form。

#### WebServiceBase

```csharp
public abstract class WebServiceBase : System.Web.Services.WebService {
    public WebServiceBase() {
        IContainerProviderAccessor cpa = (IContainerProviderAccessor)HttpContext.Current.ApplicationInstance;
        // 為自身進行 Property Injection
        cpa.ContainerProvider.RequestLifetime.InjectProperties(this);
    }
}
```

#### WebService

```csharp
[WebService(Namespace = "http://tempuri.org/")]
[WebServiceBinding(ConformsTo = WsiProfiles.BasicProfile1_1)]
[System.ComponentModel.ToolboxItem(false)]
// 若要允許使用 ASP.NET AJAX 從指令碼呼叫此 Web 服務，請取消註解下列一行。
// [System.Web.Script.Services.ScriptService]
public class WebService : WebServiceBase {
    public IAppService AppService { get; set; } // 注入成功
    
    //...WebService 實作...
    // 靘? 如下
    [WebMethod]
    public DateTime GetNow() {
        return AppService.GetNow();
    }
}
```

## 異動歷程

* 2022-11-05 初版文件建立。
