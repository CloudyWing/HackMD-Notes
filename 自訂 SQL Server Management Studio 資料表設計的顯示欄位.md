# 自訂 SQL Server Management Studio 資料表設計的顯示欄位

[![hackmd-github-sync-badge](https://hackmd.io/kwFgYksDSDq7eN_C_ZQwTw/badge)](https://hackmd.io/kwFgYksDSDq7eN_C_ZQwTw)


網路上已有許多相關文章，為了避免未來這些網站消失，所以還是自己寫一篇筆記做紀錄。

在 SSMS 中，資料表設計預設顯示的欄位如下，僅包括「資料行名稱」、「資料類型」和「允許 Null」：  
![](https://github.com/CloudyWing/HackMD-Notes/blob/main/Images/%E8%87%AA%E8%A8%82%20SQL%20Server%20Management%20Studio%20%E8%B3%87%E6%96%99%E8%A1%A8%E8%A8%AD%E8%A8%88%E7%9A%84%E9%A1%AF%E7%A4%BA%E6%AC%84%E4%BD%8D/ssms-table-design-default.png)

實際上，常用的欄位不僅限於這些。不幸的是，在現今 SSMS 20.2 及更早的版本中都並未提供編輯顯示欄位的 UI，必須通過修改註冊表來客製化欄位。

## 自訂顯示欄位的方法
1. 執行「regedit.exe」開啟登入編輯程式。
2. 移至以下路徑（`20.0_IsoShell` 對應 SSMS 20 的位置，舊版可能為 `{版號}_IsoShell` 或 `{版號}`）：「\HKEY_CURRENT_USER\SOFTWARE\Microsoft\SQL Server Management Studio\20.0_IsoShell\DataProject」。
```
HKEY_CURRENT_USER\SOFTWARE\Microsoft\SQL Server Management Studio\20.0_IsoShell\DataProject
```
3. 修改 `SSVPropViewColumnsSQL80` 的設定，預設值為 `1,2,6`。各設定值如下：

| 值 | 顯示欄位 | 說明 |
| --- | --- | --- |
| 1 | Column Name | 資料行名稱 |
| 2 | Data Type | 資料類型 |
| 3 | Length | 長度 | 
| 4 | Precision | 整數位數 |
| 5 | Scale | 小數位數 |
| 6 | Allow Nulls | 允許 Null，用 Checkbox 顯示 |
| 7 | Default Value | 預設值 |
| 8 | Identity | 識別 |
| 9 | Identity Seed | 識別值種子 |
| 10 | Identity Increment | 識別值增量 |
| 11 | Row GUID | RowGuid，設定此來欄位是否為這張表的 RowGuidCol |
| 12 | Nullable | 可為 Null，用下拉選單「是/否」顯示 |
| 13 | Condensed Type | 資料類型扼要 |
| 14 | Not for Replication | 不可複寫 |
| 15 | Formula | 公式 |
| 16 | Collation | 定序 |
| 17 | Description | 描述 |

根據我的使用習慣，會選擇以下欄位：
* `1`: Column Name
* `2`: Data Type
* `6`: Allow Nulls
* `7`: Default Value
* `8`: Identity
* `17`: Description

原因如下：
* 欄位 `2`（Data Type）在相應的型別，會一併顯示 `3`（Length）、`4`（Precision）、`5`（Scale）。
* 大部分情況下，欄位 `8`（Identity）設定後，`9`（Identity Seed）和 `10`（Identity Increment）都會是 `1`。
* 其餘大部分的欄位並不常用。

設定結果如下：  
![](https://github.com/CloudyWing/HackMD-Notes/blob/main/Images/%E8%87%AA%E8%A8%82%20SQL%20Server%20Management%20Studio%20%E8%B3%87%E6%96%99%E8%A1%A8%E8%A8%AD%E8%A8%88%E7%9A%84%E9%A1%AF%E7%A4%BA%E6%AC%84%E4%BD%8D/ssms-registry-settings.png)

修改後顯示結果如下：  
![](https://github.com/CloudyWing/HackMD-Notes/blob/main/Images/%E8%87%AA%E8%A8%82%20SQL%20Server%20Management%20Studio%20%E8%B3%87%E6%96%99%E8%A1%A8%E8%A8%AD%E8%A8%88%E7%9A%84%E9%A1%AF%E7%A4%BA%E6%AC%84%E4%BD%8D/ssms-table-design-customized.png)

除了 `SSVPropViewColumnsSQL80`，還有另一個 `SSVPropViewColumnsSQL70`，這主要是為了相容 SQL Server 7.0 的版本，一般情況下不需修改。

:::warning
設定機碼時，請確保 SSMS 未開啟，否則修改不會生效。當重新點擊編輯時，發現值會是舊的，重開機後，機碼就會被還原了。
:::

## 參考資料
* [SQL Server Management Studio 資料表設計模式顯示欄位描述](https://blog.focal.world/2017/04/sql-server-management-studio.html)。

###### tags: `Database` `Microsoft SQL Server`