---
title: "使用 Dapper 和 ODAC Managed Driver 無法寫入 Unicode 的問題"
date: 2023-06-15
lastmod: 2023-06-15
description: "排查使用 Dapper 搭配 Oracle Managed Driver (ODAC) 寫入 Unicode 字符 (如簡體中文) 出現亂碼的問題。分析原因為 `DbType.String` 未正確對應至 `OracleDbType.NVarchar2`，需手動修正對應關係。"
tags: [".NET","Oracle"]
---

# 使用 Dapper 和 ODAC Managed Driver 無法寫入 Unicode 的問題

## 前言

在使用 ADO.NET 的過程中，正常情況下我不會特別去設定參數的 `DbType`，除非是在自己撰寫的架構中有掃描資料庫結構並自動生成程式碼。不過，最近我在使用 Oracle 資料庫時遇到了亂碼的問題。

當客戶向我反應資料寫入簡體中文時出現亂碼的時候，一開始我還疑惑是哪邊有問題。後來客戶認為是因為沒有設定 `OracleDbType` 的關係，而 Dapper 為了支援多種資料庫，使用的是 `DbType`。於是我試著設定對應的 `DbType.String`，希望能解決問題，結果還是一樣是亂碼。我檢查了之前成功寫入簡體中文的資料，證實資料庫的編碼設定應該是正確的。我還懷疑是連線字串或其他設定的問題，於是上網查詢了一下相關資訊。

我發現 Oracle 資料庫的亂碼問題似乎滿常見的，但找到的資訊都不太符合我的情況。在查了一堆資料和被 ChatGPT 欺騙大量感情後。終於在***黑暗執行序***大神那看到相關的文章「[Hacking樂無窮：修正Dapper＋ODP.NET無法寫入Unicode問題](https://blog.darkthread.net/blog/dapper-odpnet-unicode-issue/)」。這個問題是 ODP.NET 的一個 Bug，導致 `DbType.String` 沒有成功對應到 `OracleDbType.NVarchar2`。但這已經是六年前的文章，而我目前使用的套件是「Oracle.ManagedDataAccess.Core」，怎還有一樣的問題？

## 對應關係檢查

透過使用 Visual Studio 內建的反組譯功能，我們可以觀察到以下三個 enum 的對應值：

* `DbType.String`：16
* `OracleDbType.NVarchar2`：119
* `OracleDbType.Varchar2`：126

    ![oracle unicode insert issue 1](images/%E4%BD%BF%E7%94%A8%20Dapper%20%E5%92%8C%20ODAC%20Managed%20Driver%20%E7%84%A1%E6%B3%95%E5%AF%AB%E5%85%A5%20Unicode%20%E7%9A%84%E5%95%8F%E9%A1%8C/oracle-unicode-insert-issue-1.png) ![oracle unicode insert issue 2](images/%E4%BD%BF%E7%94%A8%20Dapper%20%E5%92%8C%20ODAC%20Managed%20Driver%20%E7%84%A1%E6%B3%95%E5%AF%AB%E5%85%A5%20Unicode%20%E7%9A%84%E5%95%8F%E9%A1%8C/oracle-unicode-insert-issue-2.png)

    不過，根據目前最新版本（3.21.100）的「Oracle.ManagedDataAccess.Core」程式碼來看，仍然是將 `DbType.String`對應到 `OracleDbType.Varchar2`...。

    ![oracle parameter type code](images/%E4%BD%BF%E7%94%A8%20Dapper%20%E5%92%8C%20ODAC%20Managed%20Driver%20%E7%84%A1%E6%B3%95%E5%AF%AB%E5%85%A5%20Unicode%20%E7%9A%84%E5%95%8F%E9%A1%8C/oracle-parameter-type-code.png)

## 自訂 `DynamicParameters`

由於 Dapper 不直接支援使用 `IDbDataParameter` 作為參數，所以無法直接建立具有正確 `OracleDbType` 的 `OracleParameter`。所以，我只好自訂一個 `DynamicParameters` 的類別來處理這個問題。

```csharp
public class MyDynamicParameters : SqlMapper.IDynamicParameters {
    private readonly Dapper.DynamicParameters dynamicParameters = new();
    private readonly List<IDbDataParameter> dbDataParameters = new();

    // 使用轉發方式將 Dapper.DynamicParameters 相關的 API 實作一份，以下示範了一個方法
    public void Add(string name, object value, DbType? dbType, ParameterDirection? direction, int? size) {
        dynamicParameters.Add(name, value, dbType, direction, size);
    }

    // ...其他 API 的轉發...

    // 增加對 IDbDataParameter 參數的支援
    public void Add(IDbDataParameter paramerter) {
        dbDataParameters.Add(paramerter);
    }

    // 使Dapper.DynamicParameters 是用明確實作，這段程式通常也不應該被外部直接呼叫
    void SqlMapper.IDynamicParameters.AddParameters(IDbCommand command, SqlMapper.Identity identity) {
        AddParameters(command, identity);
    }

    // 增加參數並轉發至 Dapper.DynamicParameters，並將 IDbDataParameter 參數加入到 IDbCommand 的參數集合中
    // 本來想 override Dapper.DynamicParameters.AddParameters 就不用寫轉發，結果不支援 override...
    protected void AddParameters(IDbCommand command, SqlMapper.Identity Identity) {
        // 因為原本是明確實作，所以要轉型成 SqlMapper.IDynamicParameters 才可呼叫 AddParameters
        ((SqlMapper.IDynamicParameters)dynamicParameters).AddParameters(command, Identity);

        foreach (IDbDataParameter p in dbDataParameters) {
            command.Parameters.Add(p);
        }
    }
}
```

使用方法如下，將原本傳入的 `DynamicParameters` 改為使用 `MyDynamicParameters`。

```csharp
using (IDbConnection conn = new OracleConnection(connStr)) {
    conn.Open();
    
    MyDynamicParameters parameters = new();
    parameters.Add(new OracleParameter {
        ParameterName = "Name",
        Value = value,
        OracleDbType = OracleDbType.NVarchar2
    });
    conn.Query(sql, parameters);
}
```

## 異動歷程

* 2023-06-15 初版文件建立。
