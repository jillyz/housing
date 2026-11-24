<!-- 最新資料說明：列表保留原 8 筆篩選情境及 5 筆原頁案件，共 13 筆；檢視頁只使用原頁 5 筆範例，不自行補造明細。 -->
# 後臺模板版儀表板

## 查調工作臺：依原始模板重新製作（目前版本）

- 原頁完整備份於 `backend/enquiry-hub-copy.html`，備份 HTML 未更動。
- `backend/enquiry-hub.html` 先以 `後臺模板/application-query.html` 原檔複製覆蓋，再修改機關識別、系統名稱、查詢條件與列表內容。
- 正式頁保留原模板外框與選單階層、查詢區、表格、分頁元件；不載入前版 shell.css、theme.css 或 shell.js。
- `assets/css/enquiry-template.css` 僅負責藍綠換色，以及直式署徽與機關名稱適配。文字輸入框維持模板 type="text" 的白底；表格沿用模板中性灰表頭。
- 關鍵字與機關查詢、三項結果（未查調為空白）、示意資料、每頁 5 筆與換頁行為依備份保留。查看詳細已連至 enquiry-detail.html，以 case 查詢參數開啟對應案件。
- 其餘選單保留模板展示內容，連到相應模板頁；原模板缺少檔案的項目標為停用。
- 以下其他查調列表的舊版樣式記錄對應備份頁；正式頁以本節說明為準。


開啟 `backend/home-admin.html`；`backend/index.html` 會導向同一頁。

以 `admin/home-admin.html` 為功能來源，沿用 `後臺模板/index-manager.html` 的前端框架與外框結構，配色採藍綠色系。頁首左側將指定署徽與「內政部國土管理署」組成機關識別區；右側以大字顯示「全國社會住宅資料整合暨共同查調管理平臺」。

## 模板對應

- 本版直接以 `後臺模板/index-manager.html` 的原始 HTML 外框重建，不沿用先前自訂儀表板外觀。
- 內容使用模板的 `content.bg-transparent > vstack.gap-5 > section.bg-white.rounded.p-4`。
- 三個主要區塊均採模板的 `collapse-wrap / collapse-title / collapse-btn / collapse.show`，保留底線標題及收合操作。
- 社宅與監控統計使用模板 `table.table-list.table-bordered`；圖表配置使用 `row / col-*`，移除先前的自訂彩色 KPI 卡片。
- 查詢條件採 `後臺模板/application-query.html` 的 `search / search-top-form / row.g-3 / search-bottom-buttons` 結構；表單、按鈕、表格的尺寸與間距由模板及 Bootstrap 控制。
- 保留 `wrapper > top / center / bottom`，以及 `header`、`logo > img-wrap + h2`、`aside`、`right`、`breadcrumb-wrapper`、`content`、`footer`。
- 選單採模板的 `ul.menu.menu-vertical.js-menu-vertical`、`li`、`a.has-children`、`ul.sub-menu`；桌機收合與子選單動畫直接使用原始 `menu.js`。
- 手機使用模板 `nav-collapse.collapse.js-nav-collapse` 與 Bootstrap Collapse；下拉選單與提示視窗使用 Bootstrap Dropdown / Modal。
- 提示視窗直接採 `後臺模板/components/modal.html` 的「警告彈窗 -文字」結構：`modal.fade`、固定背景遮罩、可捲動且置中的對話框、無底線關閉列、置中訊息，以及 `btn-cta-group` 內的 `btn-pill-primary` 確定按鈕。彈窗外觀完全使用模板 `main.css`，不另覆寫標題背景或按鈕形狀。
- 回到頁首使用模板 `.go-top.js-go-top > a` 與 `customJS.js`。載入其 `photoLightbox.js` 相依，避免模板初始化缺少函式。
- `shell.js` 僅補充目前導覽項目、鍵盤與 ARIA 狀態、頁面示意操作；不重作模板選單開闔。
- `theme.css` 僅覆寫色彩；`home-admin.css` 僅保留圓餅圖與熱區圖；`shell.css` 提供共用署徽、長名稱適配及巢狀選單狀態修正。模板原始檔不修改。

- 保留社宅 KPI、兩組房型分布、案件日期與機關查詢、重設、統計與各機關表格。
- 保留服務監控指標、六都及國家住都中心與九個跨機關服務的熱區圖、滑鼠提示、時段查詢與切換、異常表格。
- 保留角色首頁切換與使用者選單，新增桌機選單收合、手機選單及回到頁首。
- 案件查詢使用原頁示意資料；監控查詢、粒度切換、明細及帳號操作仍為示意提示，沒有新增 API 或登入驗證。
- 尚未搬移的承辦首頁連至 `../admin/`；查調工作臺連至 `enquiry-hub.html`；原本未建置選項維持停用。

## 資源

- `assets/css/home-admin.css`：新頁專屬樣式。
- `assets/css/theme.css`：藍綠色彩覆寫。
- `assets/js/home-admin.js`：自原頁抽出的案件查詢與監控行為。
- `assets/js/shell.js`：新模板導覽、選單及可及性補強。
- 共用 `../後臺模板/assets/` 的 jQuery 3.7.1、Bootstrap 5.3.3、Font Awesome 6.5.2、`main.css`、`menu.js`、`customJS.js`、`photoLightbox.js` 與本機中文字型。部署時保留此相對目錄。
- `assets/img/nlma-seal.svg`：使用者指定的[國土管理署署徽](https://zh.wikipedia.org/wiki/File:ROC_National_Land_Management_Agency_Seal.svg)，原始檔取自 [Wikimedia 圖片網址](https://upload.wikimedia.org/wikipedia/zh/2/29/ROC_National_Land_Management_Agency_Seal.svg)，保留原圖形與色彩。

原始 `admin/` 與 `後臺模板/` 檔案不需變更。資料更新日期與監控數值沿用來源頁，並非即時資訊。

## 查調工作臺列表

開啟 `backend/enquiry-hub.html`，或由側欄「資料共同查調 → 查調工作臺」進入。

- 共用現有機關識別、模板外框、選單、藍綠配色與模板彈窗；沒有新增自訂表格或表單 CSS。
- 查詢表單與響應式表格使用 `後臺模板/application-query.html` 的 search、search-top-form、search-bottom-buttons、table-list、table-rwd、table-bordered。
- 關鍵字可部分比對統一案件編號、申請人或身分證字號（英文字母不分大小寫），並與權責機關條件交集篩選。支援 Enter 查詢、重設、筆數及查無結果提示。
- 三項查調結果只顯示「符合」「不符合」；未查調的儲存格為空白。
- 8 筆資料涵蓋全部 7 個機關及 4 種房型，均為虛構示意；測試字號為 A000000001 至 A000000008，依列表順序對應，未接真實資料服務。
- 詳細頁尚待需求，暫以停用的「查看詳細」按鈕預留入口。
- `assets/js/enquiry-list.js` 負責本頁篩選；共用 shell.js 已處理非儀表板頁面不存在熱區圖控制項的情況。

查調列表依 application-query.html 的欄位網格、提示文字、表格上方 start/end 資訊列排列。查詢底色、表頭及主要按鈕由 theme.css 改為藍綠色；表單與表格沒有自訂尺寸或間距。列表只載入共用 shell.css，不載入儀表板圖表樣式。

查調列表分頁使用模板 pagination > li > a、圓形頁碼與左右箭頭，僅換藍綠色。每頁 5 筆，現有 8 筆示意資料分為 2 頁；支援頁碼、上一頁／下一頁、邊界停用、頁數較多時省略號、顯示筆數範圍。查詢與重設回第一頁；無結果時隱藏分頁。

## 查調案件詳細頁

- 入口：`backend/enquiry-detail.html?case=CH-115-00000001`，列表的 5 筆「查看詳細」均可使用；沒有 case 參數時顯示第一筆，無效編號顯示查無案件。
- 外框沿用正式列表的模板外框與藍綠配色，內容使用 collapse、row、table-list、table-rwd、btn-cta-group 等模板元件。所有明細表不加入 table-responsive 捲動容器。
- 內容參考 admin/enquiry-hub.html：案件資料、三項判定、申請人、分戶家庭成員／共居者、胎兒人數與所得彙總、不動產及動產。
- 家庭成員基本資料與所得／資格分為兩張表，保留全部欄位並避免過寬；桌機固定表寬、手機沿用模板逐列顯示。
- enquiry-cases.js 的案件識別與判定對應列表；家庭與財產資料從原頁 defaults() 及 referenceHouseholds 擷取，enquiry-detail.js 僅負責呈現，未串接查調 API。沒有實作正式審查或修改案件狀態。
- 每人每月平均所得示意計算採年所得 ÷ 12 ÷ 計算人數（含胎兒），未沿用參考頁漏除 12 的寫法。
- 已檢查全部案件入口、判定一致、未查調顯示、無效編號、HTML 結構與資源路徑；尚未進行瀏覽器畫面驗證。

## 原頁範例資料校正

正式列表與內頁使用 assets/enquiry-model.js、assets/admin-enquiry-hub.js 的原始 defaults() 結果，主案為 CH-115-00000001／張忠政。完整保留兩戶七人、五位案件成員與一名胎兒、戶籍記事、所得及財產資料；另四案亦沿用原頁。未提供的房型與資格判定留白，不自行補值。已逐筆比對 result、caseMemberIds 與 referenceHouseholds 一致。

## 檢視頁樣式（目前版本）

檢視頁改依 後臺模板/apply-03.html：content.sticky-top-scroll 頁首、pill-state 狀態、vstack.gap-5、item > head.title-border-bottom + body、title-name、table.table-list.table-rwd、表格末列 grid-right-auto 合計區及 btn-cta-group.pb-4。不動產、所得、動產分為獨立區塊；原橘色標題線與合計列底色改為藍綠色。保留檢視用途、原頁資料與無表格捲動容器；沒有加入申請流程步驟、上傳或編輯操作。

列表已恢復原 8 筆展示情境，另保留 5 筆可開啟原頁明細的案件，共 13 筆、每頁 5 筆、共 3 頁。未提供原頁明細的 8 筆以停用「無明細」標示；列表版型及檢視頁樣式、資料不變。

## 左側選單（依使用者架構圖）

home-admin.html、enquiry-hub.html、enquiry-detail.html 統一為首頁、家戶案件追蹤查詢、資料共同查調、監控中心、查詢及統計、系統營運管理六組；資料交換紀錄及帳號權限管理保留第三層。沿用模板 menu.js 開闔，navigation.css 補齊第三層縮排與狀態；查調兩頁由 navigation.js 同步鍵盤及 ARIA。已建置功能接現有頁面，未建置項目停用。備份 enquiry-hub-copy.html 保持原樣；列表 13 筆與內頁資料未修改。

## 查調狀態與全案件檢視（最新）

十三筆均可開啟對應檢視頁，不再停用入口。列表新增查調狀態欄及篩選：查調中、查調完成；與關鍵字及機關取交集，查詢／重設回第一頁。完成才顯示判定，不需查調項目由 requiredChecks 標記並顯示 --；查調中的必要項目保留空白。enquiryStatus 與原頁人工作業 status 分開，原頁五筆缺資格判定的案例維持查調中；原始回傳明細未改動。新增八筆資料僅含既有列表內容，檢視頁顯示案件資訊、判定及尚無回傳明細提示，不生成家庭／財產。當前範例為七筆完成、六筆查調中。十欄寬度合計 100%，未加入捲動容器。

## 五項查調結果與三列比較（最新）

列表新增動產價值、租金級距（第X級），維持 13 筆及分頁。檢視頁比較表依序為本案數值、標準值、符合／不符合；共用 enquiry-results.js 控制顯示，不需查調顯示 --，查調中維持灰色。查調基準日預設申請日期，資料完成時間獨立使用 completedAt，完成時間晚於申請；查調中為尚未完成。

使用者已授權模擬：標準值為年所得 1,500,000 元、每人每月 30,000 元、不動產 2,000,000 元、動產 500,000 元（皆 ≤）；租金按每人每月所得 ≤15,000 第1級、≤25,000 第2級、≤30,000 第3級、其餘第4級，示意合格範圍第1～3級。原頁家庭／財產明細不變；缺少明細案件另以 simulatedValues 保存模擬數值。介面標示模擬規則。主案動產 361,280 元、租金第2級，基準日 2026/10/08、完成時間 2026/10/08 21:35:55。

## 檢視頁分區與授權查調

案件資料新增查調對象表：姓名、身分證字號、授權查調是／否、胎兒數。授權以 authorizations 獨立記錄，示範主案五位案件成員為是、兩位寄居者為否；不以 caseMemberIds 直接判斷是否授權。戶政表將申請人／配偶、案件成員、戶籍稱謂分為獨立欄位，移除弱勢資格及星點標記。弱勢資格另列衛福部表，只列有資格資料者。所得（財政部）、不動產（地政司）、動產（財政部）只呈現已授權者；資產透過 assetOwnerIds 連到人員 ID。摘要金額同樣受授權限制，案件成員所得未齊時不產出完整平均及判定。原始回傳結果不修改，列表十三筆與版型不動。已驗證撤除配偶授權後，其三類財務明細及金額會被排除，戶籍資料仍保留。
