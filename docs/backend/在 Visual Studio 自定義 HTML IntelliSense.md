---
title: "在 Visual Studio 自定義 HTML IntelliSense"
date: 2022-11-11
lastmod: 2022-11-11
description: "解決 Visual Studio 無法正確提示自定義 HTML 屬性 (如 data-*) 的問題。說明如何編輯 `SchemaCatalog.xml` 並引用自定義 XSD 檔案來擴充 HTML IntelliSense 功能。"
tags: ["Visual Studio","IntelliSense"]
---

# 在 Visual Studio 自定義 HTML IntelliSense

## 用途

當專案有自定義 HTML Attribute，且有 JavaScript 有針對這些特定自定義的 Attribute 進行處理時，為避免開發時忘記這些 Attribute 或是不小心打錯，可以擴充 Visual Studio 的HTML IntelliSense。

## 目前問題點

- 只能針對電腦的 Visual Studio 設定，而無法針對專案進行設定。
- 每次更新 Visual Studio，設定會失效。

## 設定方法

1. 先至 Visual Studio 的 HTML IntelliSense 範本存放位置，開啟檔案「SchemaCatalog.xml」，位置參考如下：
    - 2019 Community：`C:\Program Files (x86)\Microsoft Visual Studio\2019\Community\Common7\IDE\Extensions\Microsoft\Web Tools\Languages\Schemas\HTML\`。
    - 2022 Community：`C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\IDE\Extensions\Microsoft\Web Tools\Languages\Schemas\HTML`。

2. 在「SchemaCatalog.xml」新增 `<schema />` 來引用自定義的 [XSD(XML Schema Definition)](https://zh.wikipedia.org/zh-tw/XML_Schema) 檔案，`<schema />` 屬性如下：
    - File：要擴充的 XSD 檔名。
    - IsSupplemental：要設定 `true`，HTML IntelliSense 才會生效
    - CustomPrefix：觸發 `IntelliSense` 的關鍵字，這邊要與自定義屬性的 Prefix 一致，才不會有問題。

    範例如下：

    ```xml
    <?xml version="1.0" encoding="utf-8"?>
    <schemas>
      <schema File="html.xsd" FriendlyName="HTML" Uri="http://schemas.microsoft.com/intellisense/html" />
      <schema File="jQuery_mobile.xsd" FriendlyName="jQuery Mobile" Uri="http://schemas.microsoft.com/intellisense/jquery-mobile" IsSupplemental="true" CustomPrefix="data-" />
      <schema File="windows.xsd" FriendlyName="Windows App" Uri="http://schemas.microsoft.com/intellisense/windows" IsSupplemental="true" CustomPrefix="data-" />
      <schema File="aria.xsd" FriendlyName="WIA-ARIA" Uri="http://schemas.microsoft.com/intellisense/aria" IsSupplemental="true" CustomPrefix="aria-" />
      <schema File="angular.xsd" FriendlyName="AngularJS" Uri="http://schemas.microsoft.com/intellisense/angular" IsSupplemental="true" CustomPrefix="ng-" />
      <schema File="svg.xsd" Uri="http://www.w3.org/2000/svg" IsXml="true" />
      <schema File="xml.xsd" Uri="http://www.w3.org/XML/1998/namespace" />
      <schema File="xlink.xsd" Uri="http://www.w3.org/1999/xlink" />
      <!--增加下面這行，Wing 請自行替換要用的程式碼-->
      <schema File="Wing.xsd" FriendlyName="Wing" IsSupplemental="true" CustomPrefix="data-" />
      <!-- Visual Studio 2022 後面還有一堆程式碼，這邊因為版面問題省略-->
    </schemas>
    ```

::: info

- 更新 Visual Studio 就會造成自定義的 HTML IntelliSense 失效，就是因為檔案「SchemaCatalog.xml」被重置了。
  - 如果你覺得 AngularJS 或 Aria 的 IntelliSense 很礙眼，就把引用的 XML 給註解掉，這樣至少下次更新 Visual Studio 前都不會再出現了。
:::

1. 同層資料夾建立 XSD 檔案，如檔案儲存有權限問題，則在別處撰寫完再複製過來。
2. 如果 Visual Studio 已經開啟，請重啟才會生效。

## XSD 檔案說明

### 結構說明

```xml
<xsd:schema
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns:vs="http://schemas.microsoft.com/Visual-Studio-Intellisense"
  vs:ishtmlschema="true">

  <xsd:annotation>
    <xsd:documentation>
      Microsoft Visual Studio schema for Wing
    </xsd:documentation>
  </xsd:annotation>
  <!--上方就宣告 XML 格式，documentation 裡面自行調整描述-->

  <!--這邊節錄 aria.xsd 內容，簡單修改一下來說明，「aria-」是CustomPrefix 所設定的-->
  <!--當 input 輸入「aria-」會列出「aria-invalid」和「aria-activedescendant」-->
  <!--若選擇「aria-invalid」，屬性值會列出「false」和「true」提供選擇-->
  <xsd:element name="input">
    <xsd:complexType>
      <xsd:attribute name="aria-invalid">
        <xsd:simpleType>
          <xsd:restriction base="xsd:NMTOKEN">
            <xsd:enumeration value="false" />
            <xsd:enumeration value="true" />
          </xsd:restriction>
        </xsd:simpleType>
      </xsd:attribute>
      <xsd:attribute name="aria-activedescendant" />
    </xsd:complexType>
  </xsd:element>
</xsd:schema>
```

### 節點說明

由於各個節點的作用是我參考現成的檔案試出來的結果，所以我只能大概說明一下，XSD 結構可以參考「[XML Schema Tutorial](https://www.w3schools.com/xml/schema_intro.asp)」，但具體那些是有效果的我不確定。

- `<xsd:element />`：設定要觸發 IntelliSense 的 HTML 元素，XML 屬性如下：
  - name：設定 HTML TAG，如果要任意 TAG 都觸發則填入「\_\_\_all\_\_\_」。
- `<xsd: complexType />`：內層可以包含多個 `<xsd:attribute />` 或 `<xsd:attributeGroup />`。
- `<xsd:attribute />`：用來定義 HTML 的自定義屬性，XML 屬性如下：
  - name：自定義屬性名稱。
- `<xsd:attributeGroup />`：用來將多個`<xsd: complexType />` 定義成群組，XML 屬性如下：
  - name：群組名稱。
  - ref：藉由填入已定義的 `<xsd:attributeGroup />` 的 name 來引用該群組。
- `<xsd:restriction />`：用來限制 HTML 的屬性值，搭配`<xsd:enumeration />` 來列舉能填入的值。

### 實作範例

以下是配合我曾經使用 jQuery 撰寫的 [Unobtrusive JavaScript](https://en.wikipedia.org/wiki/Unobtrusive_JavaScript) API，所使用的 XSD 檔案內容。

```xml
<?xml version="1.0" encoding="utf-8" ?>
<xsd:schema
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns:vs="http://schemas.microsoft.com/Visual-Studio-Intellisense"
  vs:ishtmlschema="true">

  <xsd:annotation>
    <xsd:documentation>
      Microsoft Visual Studio schema for Wing
    </xsd:documentation>
  </xsd:annotation>
  
  <xsd:attributeGroup name="formatAttributeGroup">
    <xsd:attribute name="data-format">
      <xsd:simpleType>
        <xsd:restriction base="xsd:NMTOKEN">
           <xsd:enumeration value="trim" />
           <xsd:enumeration value="trim|lowerCase" />
           <xsd:enumeration value="trim|upperCase" />
           <xsd:enumeration value="lowerCase" />
           <xsd:enumeration value="upperCase" />
        </xsd:restriction>
      </xsd:simpleType>
    </xsd:attribute>
  </xsd:attributeGroup>

  <xsd:attributeGroup name="copyAttributeGroup">
    <xsd:attribute name="data-copy-target" />
    <xsd:attribute name="data-copy-always">
      <xsd:simpleType>
        <xsd:restriction base="xsd:NMTOKEN">
          <xsd:enumeration value="true" />
        </xsd:restriction>
      </xsd:simpleType>
    </xsd:attribute>
  </xsd:attributeGroup>

  <xsd:attributeGroup name="checkAttributeGroup">
    <xsd:attribute name="data-check-target" />
 <xsd:attribute name="data-check-parant" />
  </xsd:attributeGroup>

  <xsd:attributeGroup name="resetAttributeGroup">
    <xsd:attribute name="data-reset-target" />
  </xsd:attributeGroup>

  <xsd:attributeGroup name="resetValueAttributeGroup">
    <xsd:attribute name="data-reset-value" />
  </xsd:attributeGroup>

  <xsd:attributeGroup name="buttonAttributeGroup">
    <xsd:attribute name="data-alert-message" />
    <xsd:attribute name="data-confirm-message" />
    <xsd:attribute name="data-route-url" />
    <xsd:attribute name="data-window-url" />
    <xsd:attribute name="data-window-name" />
    <xsd:attribute name="data-window-features" />
    <xsd:attribute name="data-action-url" />
    <xsd:attribute name="data-action-confirm" />
    <xsd:attribute name="data-action-ignore-error">
      <xsd:simpleType>
        <xsd:restriction base="xsd:NMTOKEN">
          <xsd:enumeration value="true" />
        </xsd:restriction>
      </xsd:simpleType>
    </xsd:attribute>
    <xsd:attribute name="data-action-callback" />
    <xsd:attribute name="data-query-url" />
    <xsd:attribute name="data-query-condition" />
    <xsd:attribute name="data-query-list" />
    <xsd:attribute name="data-query-auto">
      <xsd:simpleType>
        <xsd:restriction base="xsd:NMTOKEN">
          <xsd:enumeration value="true" />
        </xsd:restriction>
      </xsd:simpleType>
    </xsd:attribute>
    <xsd:attribute name="data-query-confirm" />
    <xsd:attribute name="data-query-ignore-error">
      <xsd:simpleType>
        <xsd:restriction base="xsd:NMTOKEN">
          <xsd:enumeration value="true" />
        </xsd:restriction>
      </xsd:simpleType>
    </xsd:attribute>
    <xsd:attribute name="data-query-callback" />
  </xsd:attributeGroup>

  <xsd:element name="input">
    <xsd:complexType>
      <xsd:attributeGroup ref="formatAttributeGroup" />
      <xsd:attributeGroup ref="copyAttributeGroup" />
      <xsd:attributeGroup ref="checkAttributeGroup" />
      <xsd:attributeGroup ref="resetAttributeGroup" />
      <xsd:attributeGroup ref="resetValueAttributeGroup" />
      <xsd:attributeGroup ref="buttonAttributeGroup" />
    </xsd:complexType>
  </xsd:element>
  <xsd:element name="textarea">
    <xsd:complexType>
      <xsd:attributeGroup ref="formatAttributeGroup" />
      <xsd:attributeGroup ref="copyAttributeGroup" />
      <xsd:attributeGroup ref="resetValueAttributeGroup" />
    </xsd:complexType>
  </xsd:element>
  <xsd:element name="select">
    <xsd:complexType>
      <xsd:attributeGroup ref="resetValueAttributeGroup" />
    </xsd:complexType>
  </xsd:element>
  <xsd:element name="button">
    <xsd:complexType>
      <xsd:attributeGroup ref="resetAttributeGroup" />
      <xsd:attributeGroup ref="buttonAttributeGroup" />
    </xsd:complexType>
  </xsd:element>
</xsd:schema>
```

使用結果如下：

- 輸入「data-」列出相關屬性。

    ![html intellisense data attribute](images/%E5%9C%A8%20Visual%20Studio%20%E8%87%AA%E5%AE%9A%E7%BE%A9%20HTML%20IntelliSense/html-intellisense-data-attribute.png)

- 選擇「data-format」後列出可選擇的屬性值。

    ![html intellisense data format](images/%E5%9C%A8%20Visual%20Studio%20%E8%87%AA%E5%AE%9A%E7%BE%A9%20HTML%20IntelliSense/html-intellisense-data-format.png)

::: info
Unobtrusive JavaScript 可以理解就像是 Bootstrap 或是「jquery.validate.unobtrusive.js」那樣，藉由定義大量的自定義屬性，及針對這些屬性綁定事件或拿屬性值來作為事件會用到的變數值，來達到只要在 HTML 裡設定該些屬性就可以觸發 JavaScript 事件，算是在前端 Framework 流行前的一種主流寫法。
:::

## 異動歷程

- 2022-11-11 初版文件建立。
