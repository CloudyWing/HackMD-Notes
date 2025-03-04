# 使用應用程式密碼透過 IMAP 存取 Gmail

最近負能量太大了，檢討一下，決定寫筆記轉移一下注意力，順便來給徒弟留個紀錄。

## 前言
在現代網路安全環境下，越來越多的郵件伺服器已不再支援使用直接的使用者帳號和密碼透過 IMAP 協議來讀取電子郵件。
例如：[淘汰 Exchange Online 中的基本驗證](https://learn.microsoft.com/zh-tw/exchange/clients-and-mobile-in-exchange-online/deprecation-of-basic-authentication-exchange-online?WT.mc_id=DOP-MVP-37580#when-will-this-change-take-place) 和 [Gmail 控管低安全性應用程式的存取權](https://support.google.com/a/answer/6260879?hl=zh-Hant)。

Microsoft Exchange 我沒機會接觸到，所以就針對 Gmail 進行研究。

## IMAP 服務啟動
如果搜尋網路上的文章，可能會看到需要在 Gmail 設定中啟動 IMAP 服務，但是根據 [在其他電子郵件用戶端中新增 Gmail](https://support.google.com/mail/answer/7126229?hl=zh-Hant) 的官方說明：

> 2025 年 1 月起，系統將不再提供「啟用 IMAP」或「停用 IMAP」選項。Gmail 一律會啟用 IMAP 存取功能，目前與其他電子郵件用戶端的連結不會受到影響。您無須採取任何行動。

所以現在不需要再額外設定 IMAP 服務了。

## 啟用兩步驗證
在建立應用程式密碼之前，必須先啟用 Google 帳戶的兩步驗證：
1. 前往 [Google 帳戶 / 安全性](https://myaccount.google.com/security)。
2. 在「登入 Google 的方式」區塊中找到「兩步驗證」。
3. 設定第二個步驟驗證選項，目前有提供以下方式：
   * **密碼金鑰與安全金鑰**：在目前裝置上建立密碼金鑰，可以使用指紋、臉孔、螢幕鎖定或安全金鑰安全地登入 Google 帳戶。
   * **Google 提示**：登入新裝置時，Google 可以傳送確認提示到所有已登入帳戶的手機。需要輕觸提示確認是本人要登入帳戶。
   * **驗證器**：您可以透過驗證器應用程式取得驗證碼，不用再等待驗證碼訊息。
   * **電話號碼**：Google 會透過簡訊或語音通話傳送驗證碼到所設定的電話號碼。
   * **備用碼**：可以產生一組備用碼進行登入，每組備用碼只能使用一次。

如果都沒設定，Google 應該會引導使用電話號碼的方式設定第二步驟，實際上這也是最方便的方式。

## 建立應用程式密碼

1. 透過 [應用程式密碼](https://myaccount.google.com/apppasswords) 建立應用程式密碼。
2. 系統會透過帳號的第二驗證方式來驗證帳號權限，例如若你設定了電話號碼，Google 就會寄送簡訊到你的手機，然後你需要輸入收到的驗證碼。
3. 驗證完成後，就會進入管理應用程式密碼的頁面。
4. 在「如要設定新的應用程式密碼，請在下方輸入…」下方的輸入框中輸入自定義的應用程式名稱，這僅做識別用途。
5. 點選「建立」，Google 會提供一個 16 位數的密碼作為應用程式密碼，並提供以下說明訊息：
> **使用方式**  
> 在您想設定 Google 帳戶的應用程式或裝置上前往帳戶的「設定」頁面，然後將您的密碼替換成上方的 16 字元密碼。  
> 這個應用程式密碼就如同您平常使用的密碼，可授予完整的 Google 帳戶存取權限。您不需要記住這組密碼，因此，請勿將密碼寫下或透露給任何人知道。
6. 複製這個密碼（請注意，此密碼只會顯示一次，請務必保存）。

## Gmail IMAP 設定基本資訊
以下是連接 Gmail IMAP 協議所需的基本資訊：
* **IMAP 伺服器**：imap.gmail.com
* **連接埠**：993
* **加密方式**：SSL/TLS
* **使用者名稱**：你的完整 Gmail 地址（例如：your.email@gmail.com）
* **密碼**：應用程式密碼（不是你的 Gmail 密碼）

###### tags: `Email` `Gmail` `IMAP`