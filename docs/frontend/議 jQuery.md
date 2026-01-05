---
title: "議 jQuery"
date: 2022-09-30
lastmod: 2022-09-30
description: "分析 jQuery 在現代 Web 開發中的地位與優缺點。比較 .NET MVC 架構下使用 jQuery 與轉向 Vue.js 或 Blazor 的選擇，探討前端技術選型的考量。"
tags: ["jQuery"]
---

# 議 jQuery

## 前言

現今 .NET Web 的網路架構，大概可分為以下兩種：

1. 使用 .NET 框架的 MVC 或 Razor Pages。
2. 前端框架與 Web API 搭配使用。

對於一個側重後端的 Web 工程師而言，如果想獨立開發一個網站一般都是選擇第一種。
至於學習前端框架，光是 Google 一下，對於它們的更新速度，以及一些相關的建構工具和新的技術名詞，還沒入門就直接先選放棄 (誤)。
而在前端框架尚未出現前，過往第一種方式的主流前端工具就是 jQuery 了。

### jQuery 的優缺點分析

優點如下：

| 優點 | 描述 | 現今狀況 |
| -------- | -------- | -------- |
| 跨瀏覽器的語法整合 | 早期 JavaScript 在各家瀏覽器實作方式不同，常常需要針對瀏覽器版本做判斷來撰寫不同語法，特別是 IE 與其他家語法落差最大，jQuery 提供一系列的 API 幫你處理不同瀏覽器間的實作，在當時為 JavaScript 的入門降低不少門檻。     | 現今有主流瀏覽器皆會配合 W3C 規範實作，在 IE 退出歷史的現今，瀏覽器差異影響越來越小。 |
| 提供簡單豐富的 API 來操作 DOM | 早期的 API 相當少，像是要尋找 DOM 的 API，只有 getElementById() 之類的，而 jQuery 提供 Selector 表達式 可用各種方式找到 DOM。 | jQuery 所提供的 API 後續大部分有回流至瀏覽器原生 API 裡 | jQuery 所提供的 API 後續大部分有回流至瀏覽器原生 API 裡 |
| 豐富的相關套件 | 早期因為瀏覽器相容問題以及原生 API 的貧瘠，導致後續很多套件都是依附 jQuery 產生 | 目前已經開始有新版套件不依附 jQuery，靘? Bootstrap 5。 |

缺點如下：

1. jQuery 4 遙遙無期：
    去查 jQuery 歷史，可以發現 2019 年 4 月 發佈 3.4 版後，後續的更新大多為因應安全性處理居多，難以期待未來功能是否會有重大加強。
不過至目前 3.6 版為止仍有人持續在維護中，應暫時不用擔心資安問題。

2. 結構化很鬆散難控管：
    jQuery 畢竟只是個套件，而非一個完整性的框架，寫得好壞很仰賴開發者功力。

從 2011 年來至今 2022 年，不可否認 jQuery 在過往工作中有很重要的地位，但近幾年會思考在對 jQuery 的依賴性越來越小的情況下，是否仍要繼續使用。

## 取代 jQuery 的選擇

1. Vue
    前端框架的主流為 React、Angular 和 Vue，其中 Vue 屬於漸進式框架，目前只有它可以藉由引用 JS 檔案的方式來使用，可以避開 webpack 那些前端相關工具的學習門檻，並且可以將使用範圍只聚焦在畫面呈現，較容易與其他 Library 整合。

2. [ASP.NET Core Blazor](https://learn.microsoft.com/zh-tw/aspnet/core/blazor/?view=aspnetcore-6.0)
    使用 C# 而不是 JavaScript 來建立豐富的互動式 UI。

## 結語

以目前開發上來說，使用 Vue 來取代 jQuery 會是我的選擇，畢竟直接改用 ASP.NET Core Blazor 跨度有點太大。不過 Vue 3 改用 Component API 開始讓我感到適應不良，畢竟當前端框架開始盛行時，除了研究 Vue 2 以外，我已經開始漸少在前端的精進，而 Component API 對我而言有點像是另一個世界。
為了可以延續使用 .NET 的 Model Validation，目前是選擇用舊版的 Vue 2 和 VeeValidate 2 來開發網站，但在後續版本和寫法的演進下，如果仍是無法適應後續新寫法，且找不到適用 Validate JS 的情況 (找不到替代 VeeValidate 2 的原因比較大)，有開始思考是否轉投 ASP.NET Core Blazor 發展。

## 異動歷程

- 2022-09-30 初版文件建立。
