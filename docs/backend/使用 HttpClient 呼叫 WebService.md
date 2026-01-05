---
title: "使用 HttpClient 呼叫 WebService"
date: 2023-02-13
lastmod: 2023-02-13
description: "記錄在無法加入 Web 參考的環境下，如何使用 .NET Framework 的 `WebClient` 搭配 `ServiceDescriptionImporter` 與 Reflection 動態編譯 WSDL，實現動態呼叫 WebService 的方法。"
tags: [".NET"]
---

# 使用 HttpClient 呼叫 WebService

.NET 在 WebService 有提供完整的支援，通常只需要使用 Visual Studio 加入「Web 參考」就能完成呼叫。然後，有時因為某些因素，如開發環境無法連接到 WebService，因此無法加入參考，此時可能會嘗試在不加入 Web 參考的情況下呼叫 WebService。

.NET Framework 中常見的作法是使用 WebClient 和 Reflection 的組合來動態產生 WebService 服務的程式碼，程式碼如下：

```csharp
public class InvokeWebService {
    public object InvokeWebservice(string url, string @namespace, string classname, string methodname, object[] args) {
        try {

            if ((classname == null) || (classname == "")) {
                classname = GetWsClassName(url);
            }
            System.Net.WebClient wc = new System.Net.WebClient();
            System.IO.Stream stream = wc.OpenRead(url + "?WSDL");
            System.Web.Services.Description.ServiceDescription sd = System.Web.Services.Description.ServiceDescription.Read(stream);
            System.Web.Services.Description.ServiceDescriptionImporter sdi = new System.Web.Services.Description.ServiceDescriptionImporter();
            sdi.AddServiceDescription(sd, "", "");
            System.CodeDom.CodeNamespace cn = new System.CodeDom.CodeNamespace(@namespace);
            System.CodeDom.CodeCompileUnit ccu = new System.CodeDom.CodeCompileUnit();
            ccu.Namespaces.Add(cn);
            sdi.Import(cn, ccu);

            Microsoft.CSharp.CSharpCodeProvider csc = new Microsoft.CSharp.CSharpCodeProvider();
            System.CodeDom.Compiler.ICodeCompiler icc = csc.CreateCompiler();
            System.CodeDom.Compiler.CompilerParameters cplist = new System.CodeDom.Compiler.CompilerParameters();
            cplist.GenerateExecutable = false;
            cplist.GenerateInMemory = true;
            cplist.ReferencedAssemblies.Add("System.dll");
            cplist.ReferencedAssemblies.Add("System.XML.dll");
            cplist.ReferencedAssemblies.Add("System.Web.Services.dll");
            cplist.ReferencedAssemblies.Add("System.Data.dll");

            System.CodeDom.Compiler.CompilerResults cr = icc.CompileAssemblyFromDom(cplist, ccu);
            if (true == cr.Errors.HasErrors) {
                System.Text.StringBuilder sb = new StringBuilder();
                foreach (System.CodeDom.Compiler.CompilerError ce in cr.Errors) {
                    sb.Append(ce.ToString());
                    sb.Append(System.Environment.NewLine);
                }
                throw new Exception(sb.ToString());
            }

            System.Reflection.Assembly assembly = cr.CompiledAssembly;
            Type t = assembly.GetType(@namespace + "." + classname, true, true);
            object obj = Activator.CreateInstance(t);
            System.Reflection.MethodInfo mi = t.GetMethod(methodname);
            return mi.Invoke(obj, args);
        } catch (Exception ex) {
            throw new Exception(ex.InnerException.Message, new Exception(ex.InnerException.StackTrace));
        }
    }

    private string GetWsClassName(string wsUrl) {
        string[] parts = wsUrl.Split('/');
        string[] pps = parts[parts.Length - 1].Split('.');

        return pps[0];
    }
}
```

但是在 .NET Core 之後，因為沒有「System.Web.Services」這個相關的 Library，所以我參考了這篇文章「[.Net core 调用WebService](https://www.cnblogs.com/hnwl0507/p/16886108.html)」，使用 HttpClient 以 SOAP 訊息格式來呼叫 WebService。

有關 WebService SOAP 訊息格式內容，可以找一個 C# 寫的 WebService，在網址「{httpUrl}?op={method}」查看此 Method 的 Request 和 Response 格式，一般會有提供「SOAP 1.1」、「SOAP 1.2」和「HTTP POST」三種格式，以下是本次使用的「SOAP 1.2」格式範例。

![soap 1.2 format example](images/%E4%BD%BF%E7%94%A8%20HttpClient%20%E5%91%BC%E5%8F%AB%20WebService/soap-1.2-format-example.png)

放大顯示。

![soap envelope details](images/%E4%BD%BF%E7%94%A8%20HttpClient%20%E5%91%BC%E5%8F%AB%20WebService/soap-envelope-details.png)

當然，我對文章中的解法並不太滿意，因為實際輸入和輸出的型別不一定是簡單型別，所以我使用 `XmlSerializer` 來進行 Object 與 XML 相互轉換，最終的程式碼如下：

```csharp
public static class WebServiceUtils {
    private static readonly HttpClient httpClient = new HttpClient();

    public static async Task<TResponse> ExecuteAsync<TResponse>(string uri, string method, IDictionary<string, string> arguments, string @namespace = "http://tempuri.org/") {
        XmlSerializerNamespaces serializerNamespaces = new XmlSerializerNamespaces(new[] { XmlQualifiedName.Empty });
        XmlWriterSettings settings = new XmlWriterSettings {
            Indent = true,
            OmitXmlDeclaration = true
        };

        string argsXml = string.Join("", arguments.Select(x => {
            Type type = x.Value.GetType();
            XmlSerializer _serializer = new XmlSerializer(type);
            StringBuilder sb = new StringBuilder();
            using (XmlWriter writer = XmlWriter.Create(sb, settings)) {
                _serializer.Serialize(writer, x.Value, serializerNamespaces);
                // 原本 Serializer 後，Root 會是 Type Name，所以要替換成 Dictionary Key
                // 至於正規式不用 Type Name 達到比較精準替換原因為遇到別名的會有問題
                // 例如：Int32 會變成 <int></int> 而非 <Int32></Int32>
                return Regex.Replace(sb.ToString(), $@"((?<=^<)(\w*)(?=>))|(?<=</)\w*(?=>$)", x.Key);
            }
        }));

        string soapXml = $@"
            <soap12:Envelope xmlns:xsi=""http://www.w3.org/2001/XMLSchema-instance"" xmlns:xsd=""http://www.w3.org/2001/XMLSchema"" xmlns:soap12=""http://www.w3.org/2003/05/soap-envelope"">
              <soap12:Body>
                <{method} xmlns=""{@namespace}"">
                    {argsXml}
                </{method}>
              </soap12:Body>
            </soap12:Envelope>
        ";

        StringContent content = new StringContent(soapXml, Encoding.UTF8, "text/xml");
        using (HttpResponseMessage message = await httpClient.PostAsync(uri, content).ConfigureAwait(false)) {
            if (!message.IsSuccessStatusCode) {
                throw new HttpRequestException($"HTTP request failed with status code {message.StatusCode}: {message.ReasonPhrase}");
            }

            string result = await message.Content.ReadAsStringAsync().ConfigureAwait(false);

            XDocument xdoc = XDocument.Parse(result);
            XNamespace ns = @namespace;
            string resultTag = method + "Result";

            XElement xelement = xdoc.Descendants(ns + resultTag).Single();

            XmlSerializer serializer = new XmlSerializer(typeof(TResponse), new XmlRootAttribute(resultTag) { Namespace = @namespace });

            using (XmlReader reader = xelement.CreateReader()) {

                return (TResponse)serializer.Deserialize(reader);
            }
        }
    }
}
```

## 實際測試

這邊先定義巢狀的 `Request` 和 `Response` 來作為 WebService 的參數和回傳值，嘗試看是否能支援較複雜的型別。

```csharp
public class Request {
    public int Id { get; set; }

    public string Name { get; set; }

    public List<string> Strings { get; set; }

    public List<InnerRequest> InnerRequests { get; set; }
}

public class InnerRequest {
    public int Id { get; set; }

    public string Name { get; set; }
}

public class Response {
    public int Id { get; set; }

    public string Name { get; set; }

    public List<string> Strings { get; set; }

    public List<InnerResponse> InnerResponse { get; set; }
}

public class InnerResponse {
    public int Id { get; set; }

    public string Name { get; set; }
}
```

WebService 刻意使用多個參數。

```csharp
[WebService(Namespace = "http://tempuri.org/")]
[WebServiceBinding(ConformsTo = WsiProfiles.BasicProfile1_1)]
[System.ComponentModel.ToolboxItem(false)]
// 若要允許使用 ASP.NET AJAX 從指令碼呼叫此 Web 服務，請取消註解下列一行。
// [System.Web.Script.Services.ScriptService]
public class TestWebService : System.Web.Services.WebService {

    [WebMethod]
    public Response HelloWorld(Request request1, Request request2) {
        return new Response {
            Id = 31,
            Name = "32",
            Strings = new List<string> {
                "331",
                "332"
            },
            InnerResponse = new List<InnerResponse> {
                new InnerResponse { Id = 3411, Name = "3412" },
                new InnerResponse { Id = 3421, Name = "3422" }
            }
        };
    }
}
```

```csharp
string uri = "https://localhost:44399/TestWebService.asmx";
string method = "HelloWorld";
IDictionary<string, object> arguments = new Dictionary<string, object>();
Request request1 = new Request {
    Id = 11,
    Name = "12",
    Strings = new List<string> {
        "131",
        "132"
    },
    InnerRequests = new List<InnerRequest> {
        new InnerRequest { Id = 1411, Name = "1412" },
        new InnerRequest { Id = 1421, Name = "1422" }
    }
};

Request request2 = new Request {
    Id = 21,
    Name = "22",
    Strings = new List<string> {
        "231",
        "232"
    },
    InnerRequests = new List<InnerRequest> {
        new InnerRequest { Id = 2411, Name = "2412" },
        new InnerRequest { Id = 2421, Name = "2422" }
    }
};
arguments.Add("request1", request1);
arguments.Add("request2", request2);

Response response = await WebServiceUtils.ExecuteAsync<Response>(uri, method, arguments);
```

從監看式看 WebService 有正確接收參數。

![webservice received request](images/%E4%BD%BF%E7%94%A8%20HttpClient%20%E5%91%BC%E5%8F%AB%20WebService/webservice-received-request.png)

從監看式看執行結果和 WebService 回傳的一致。

![client received response](images/%E4%BD%BF%E7%94%A8%20HttpClient%20%E5%91%BC%E5%8F%AB%20WebService/client-received-response.png)

## 異動歷程

- 2023-02-13 初版文件建立。
