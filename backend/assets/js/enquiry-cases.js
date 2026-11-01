/* 家庭／財產回傳明細沿用原頁。標準值、租金級距、缺少的案件數值／時間依使用者要求模擬，非正式審查標準。
   示意門檻：年所得150萬、月平均3萬、不動產200萬、動產50萬。租金級距：月均≤1.5萬第1級、≤2.5萬第2級、≤3萬第3級，其餘第4級。 */
/* authorizations 為獨立示範授權紀錄；資產以 assetOwnerIds 對應人員，不用姓名判斷授權。 */
/* 主案案件成員與已授權者：張大富、張忠政（申請人）、張曉雯、劉欣慧（配偶）。 */
window.EnquiryCases = [
  {
    "caseId": "CH-115-00000001",
    "name": "張忠政",
    "idNumber": "B134567890",
    "agency": "國家住都中心",
    "housing": "世大運選手村D區",
    "room": "三房型",
    "appliedAt": "2026/10/08 21:34:55",
    "movedAt": "2012/04/23",
    "address": "新北市OO區OO路100號5樓",
    "results": {
      "totalIncome": "符合",
      "monthlyIncome": "符合",
      "propertyValue": "符合",
      "movableValue": "符合",
      "rentTier": "第2級"
    },
    "status": "查調中",
    "lastQuery": "2026/10/08 21:34",
    "caseMemberIds": [
      "E123456789",
      "B134567890",
      "B234567890",
      "A287654329"
    ],
    "result": {
      "applicant": {
        "id": "B134567890",
        "name": "張忠政",
        "title": "長子",
        "birth": "1980/02/05",
        "father": "張大富",
        "mother": "張陳梅",
        "income": 700000,
        "identity": "9.平地原住民 阿美族",
        "role": "申請人",
        "relation": "本人",
        "fetus": 0,
        "household": true,
        "cohabiting": true
      },
      "people": [
        {
          "id": "B134567890",
          "name": "張忠政",
          "title": "長子",
          "birth": "1980/02/05",
          "father": "張大富",
          "mother": "張陳梅",
          "income": 700000,
          "identity": "9.平地原住民 阿美族",
          "role": "申請人",
          "relation": "本人",
          "fetus": 0,
          "household": true,
          "cohabiting": true
        },
        {
          "id": "E123456789",
          "name": "張大富",
          "title": "戶長",
          "birth": "1951/09/10",
          "father": "張勇",
          "mother": "張鄭平",
          "income": 0,
          "identity": "5.65歲以上老人\n7.身心障礙（輕度）",
          "notes": "經法院裁定受輔助宣告，選定張忠政為張大富之輔助人。",
          "relation": "戶長",
          "fetus": 0,
          "source": "戶籍查得",
          "household": true,
          "cohabiting": false
        },
        {
          "id": "B234567890",
          "name": "張曉雯",
          "title": "孫",
          "birth": "2012/12/23",
          "father": "張忠政",
          "mother": "劉欣慧",
          "income": 0,
          "identity": "",
          "relation": "孫",
          "fetus": 0,
          "source": "戶籍查得",
          "household": true,
          "cohabiting": false
        },
        {
          "id": "A287654329",
          "name": "劉欣慧",
          "title": "戶長",
          "birth": "1989/05/07",
          "father": "劉OO",
          "mother": "林OO",
          "income": 600000,
          "identity": "",
          "role": "配偶",
          "fetus": 1,
          "relation": "配偶",
          "source": "戶籍查得",
          "household": false,
          "cohabiting": false
        },
        {
          "id": "B123456789",
          "name": "張曉晨",
          "title": "兒子",
          "birth": "2014/12/23",
          "father": "張忠政",
          "mother": "劉欣慧",
          "income": 0,
          "identity": "",
          "relation": "兒子",
          "fetus": 0,
          "source": "戶籍查得",
          "household": false,
          "cohabiting": false
        }
      ],
      "marriage": "married",
      "marriageSource": "lookup",
      "targetType": "family",
      "realEstate": [
        {
          "owner": "張忠政",
          "category": "房屋",
          "address": "新北市／三重段／00123-000",
          "household": true,
          "share": "5 分之 2",
          "area": "36 平方公尺",
          "value": 1200000,
          "common": true
        },
        {
          "owner": "劉欣慧",
          "category": "土地",
          "address": "南投縣／南投段／0427-0013",
          "household": false,
          "share": "100 分之 5",
          "area": "18.5 平方公尺",
          "value": 320000,
          "common": false
        }
      ],
      "movable": [
        {
          "name": "張忠政",
          "interest": 2000,
          "preferred": true,
          "prize": 2000,
          "other": 0,
          "subtotal": 121760
        },
        {
          "name": "劉欣慧",
          "interest": 4000,
          "preferred": false,
          "prize": 0,
          "other": 0,
          "subtotal": 239520
        }
      ],
      "documents": [
        [
          "戶籍資料證明",
          "B134567890_戶政查調_戶籍資料證明.pdf"
        ],
        [
          "婚姻關係資料",
          "B134567890_戶政查調_婚姻關係資料.pdf"
        ],
        [
          "所得資料清單",
          "家庭成員_財稅查調_所得資料清單.pdf"
        ],
        [
          "全國財產稅總歸戶清單",
          "家庭成員_財稅查調_財產歸戶清單.pdf"
        ],
        [
          "警消人員職務列等資料",
          "B134567890_警政查調_職務列等資料.pdf"
        ]
      ],
      "lastQuery": "2026/10/08 21:34",
      "received": {
        "applicant": true,
        "family": true,
        "property": true,
        "documents": true
      }
    },
    "households": [
      {
        "number": "B2567895",
        "label": "申請人戶",
        "address": "新北市OO區OO路100號5樓",
        "members": [
          {
            "id": "E123456789",
            "name": "張大富",
            "title": "戶長",
            "birth": "1951/09/10",
            "father": "張勇",
            "mother": "張鄭平",
            "income": 0,
            "identity": "5.65歲以上老人\n7.身心障礙（輕度）",
            "notes": "經法院裁定受輔助宣告，選定張忠政為張大富之輔助人。"
          },
          {
            "id": "B134567890",
            "name": "張忠政",
            "title": "長子",
            "birth": "1980/02/05",
            "father": "張大富",
            "mother": "張陳梅",
            "income": 700000,
            "identity": "9.平地原住民 阿美族",
            "role": "申請人"
          },
          {
            "id": "B234567890",
            "name": "張曉雯",
            "title": "孫",
            "birth": "2012/12/23",
            "father": "張忠政",
            "mother": "劉欣慧",
            "income": 0,
            "identity": ""
          },
          {
            "id": "N123456789",
            "name": "陳OO",
            "title": "寄居",
            "birth": "2013/11/12",
            "father": "陳OO",
            "mother": "莊OO",
            "income": 0,
            "identity": ""
          },
          {
            "id": "N222567828",
            "name": "廖OO",
            "title": "寄居",
            "birth": "2018/04/06",
            "father": "廖OO",
            "mother": "賴OO",
            "income": 0,
            "identity": ""
          }
        ]
      },
      {
        "number": "B2011378",
        "label": "配偶戶",
        "address": "新北市OO區OO街8巷11-1號",
        "members": [
          {
            "id": "A287654329",
            "name": "劉欣慧",
            "title": "戶長",
            "birth": "1989/05/07",
            "father": "劉OO",
            "mother": "林OO",
            "income": 600000,
            "identity": "",
            "role": "配偶",
            "fetus": 1
          },
          {
            "id": "B123456789",
            "name": "張曉晨",
            "title": "兒子",
            "birth": "2014/12/23",
            "father": "張忠政",
            "mother": "劉欣慧",
            "income": 0,
            "identity": ""
          }
        ]
      }
    ],
    "enquiryStatus": "查調完成",
    "requiredChecks": {
      "totalIncome": true,
      "monthlyIncome": true,
      "propertyValue": true,
      "movableValue": true,
      "rentTier": true
    },
    "rentTier": 2,
    "standards": {
      "totalIncome": 1500000,
      "monthlyIncome": 30000,
      "propertyValue": 2000000,
      "movableValue": 500000,
      "rentTier": "第1～3級"
    },
    "referenceDate": "2026/10/08",
    "completedAt": "2026/10/08 21:35:55",
    "standardsAreSimulated": true,
    "authorizations": [
      {
        "personId": "E123456789",
        "authorized": true
      },
      {
        "personId": "B134567890",
        "authorized": true
      },
      {
        "personId": "B234567890",
        "authorized": true
      },
      {
        "personId": "N123456789",
        "authorized": false
      },
      {
        "personId": "N222567828",
        "authorized": false
      },
      {
        "personId": "A287654329",
        "authorized": true
      },
      {
        "personId": "B123456789",
        "authorized": false
      }
    ],
    "authorizationIsSimulated": true,
    "assetOwnerIds": {
      "realEstate": [
        "B134567890",
        "A287654329"
      ],
      "movable": [
        "B134567890",
        "A287654329"
      ]
    }
  },
  {
    "caseId": "CH-115-00000002",
    "name": "陳怡君",
    "idNumber": "A000000001",
    "agency": "國家住都中心",
    "housing": "安居示範社宅",
    "room": "套房",
    "results": {
      "totalIncome": "符合",
      "monthlyIncome": "符合",
      "propertyValue": "符合",
      "movableValue": "符合",
      "rentTier": "符合"
    },
    "enquiryStatus": "查調完成",
    "requiredChecks": {
      "totalIncome": true,
      "monthlyIncome": true,
      "propertyValue": true,
      "movableValue": true,
      "rentTier": true
    },
    "result": null,
    "households": [],
    "caseMemberIds": [
      "A000000001"
    ],
    "rentTier": 2,
    "standards": {
      "totalIncome": 1500000,
      "monthlyIncome": 30000,
      "propertyValue": 2000000,
      "movableValue": 500000,
      "rentTier": "第1～3級"
    },
    "referenceDate": "2026/10/08",
    "completedAt": "2026/10/08 10:30:00",
    "standardsAreSimulated": true,
    "simulatedValues": {
      "totalIncome": 1200000,
      "monthlyIncome": 16667,
      "propertyValue": 1200000,
      "movableValue": 300000
    },
    "appliedAt": "2026/10/08 09:30:00",
    "authorizations": [
      {
        "personId": "A000000001",
        "authorized": true
      }
    ],
    "authorizationIsSimulated": true,
    "assetOwnerIds": {
      "realEstate": [],
      "movable": []
    }
  },
  {
    "caseId": "LF-115-00000001",
    "name": "林志明",
    "idNumber": "A000000002",
    "agency": "新北市政府",
    "housing": "新北示範社宅",
    "room": "一房型",
    "results": {
      "totalIncome": "不符合",
      "monthlyIncome": "符合",
      "propertyValue": "符合",
      "movableValue": "符合",
      "rentTier": "符合"
    },
    "enquiryStatus": "查調完成",
    "requiredChecks": {
      "totalIncome": true,
      "monthlyIncome": true,
      "propertyValue": true,
      "movableValue": true,
      "rentTier": true
    },
    "result": null,
    "households": [],
    "caseMemberIds": [
      "A000000002"
    ],
    "rentTier": 2,
    "standards": {
      "totalIncome": 1500000,
      "monthlyIncome": 30000,
      "propertyValue": 2000000,
      "movableValue": 500000,
      "rentTier": "第1～3級"
    },
    "referenceDate": "2026/10/08",
    "completedAt": "2026/10/08 10:30:00",
    "standardsAreSimulated": true,
    "simulatedValues": {
      "totalIncome": 1800000,
      "monthlyIncome": 25000,
      "propertyValue": 1200000,
      "movableValue": 300000
    },
    "appliedAt": "2026/10/08 09:30:00",
    "authorizations": [
      {
        "personId": "A000000002",
        "authorized": true
      }
    ],
    "authorizationIsSimulated": true,
    "assetOwnerIds": {
      "realEstate": [],
      "movable": []
    }
  },
  {
    "caseId": "LA-115-00000001",
    "name": "王雅婷",
    "idNumber": "A000000003",
    "agency": "臺北市政府",
    "housing": "臺北示範社宅",
    "room": "二房型",
    "results": {
      "totalIncome": "符合",
      "monthlyIncome": "不符合",
      "propertyValue": "符合",
      "movableValue": "符合",
      "rentTier": "不符合"
    },
    "enquiryStatus": "查調完成",
    "requiredChecks": {
      "totalIncome": true,
      "monthlyIncome": true,
      "propertyValue": true,
      "movableValue": true,
      "rentTier": true
    },
    "result": null,
    "households": [],
    "caseMemberIds": [
      "A000000003"
    ],
    "rentTier": 4,
    "standards": {
      "totalIncome": 1500000,
      "monthlyIncome": 30000,
      "propertyValue": 2000000,
      "movableValue": 500000,
      "rentTier": "第1～3級"
    },
    "referenceDate": "2026/10/08",
    "completedAt": "2026/10/08 10:30:00",
    "standardsAreSimulated": true,
    "simulatedValues": {
      "totalIncome": 1200000,
      "monthlyIncome": 33333,
      "propertyValue": 1200000,
      "movableValue": 300000
    },
    "appliedAt": "2026/10/08 09:30:00",
    "authorizations": [
      {
        "personId": "A000000003",
        "authorized": true
      }
    ],
    "authorizationIsSimulated": true,
    "assetOwnerIds": {
      "realEstate": [],
      "movable": []
    }
  },
  {
    "caseId": "LH-115-00000001",
    "name": "張家豪",
    "idNumber": "A000000004",
    "agency": "桃園市政府",
    "housing": "桃園示範社宅",
    "room": "三房型",
    "results": {
      "totalIncome": "符合",
      "monthlyIncome": "符合",
      "propertyValue": "不符合",
      "movableValue": "不符合",
      "rentTier": "符合"
    },
    "enquiryStatus": "查調完成",
    "requiredChecks": {
      "totalIncome": true,
      "monthlyIncome": true,
      "propertyValue": true,
      "movableValue": true,
      "rentTier": true
    },
    "result": null,
    "households": [],
    "caseMemberIds": [
      "A000000004"
    ],
    "rentTier": 2,
    "standards": {
      "totalIncome": 1500000,
      "monthlyIncome": 30000,
      "propertyValue": 2000000,
      "movableValue": 500000,
      "rentTier": "第1～3級"
    },
    "referenceDate": "2026/10/08",
    "completedAt": "2026/10/08 10:30:00",
    "standardsAreSimulated": true,
    "simulatedValues": {
      "totalIncome": 1200000,
      "monthlyIncome": 16667,
      "propertyValue": 2500000,
      "movableValue": 600000
    },
    "appliedAt": "2026/10/08 09:30:00",
    "authorizations": [
      {
        "personId": "A000000004",
        "authorized": true
      }
    ],
    "authorizationIsSimulated": true,
    "assetOwnerIds": {
      "realEstate": [],
      "movable": []
    }
  },
  {
    "caseId": "LB-115-00000001",
    "name": "李佳蓉",
    "idNumber": "A000000005",
    "agency": "臺中市政府",
    "housing": "臺中示範社宅",
    "room": "二房型",
    "results": {
      "totalIncome": "符合",
      "monthlyIncome": "",
      "propertyValue": "符合",
      "movableValue": "符合",
      "rentTier": ""
    },
    "enquiryStatus": "查調完成",
    "requiredChecks": {
      "totalIncome": true,
      "monthlyIncome": false,
      "propertyValue": true,
      "movableValue": true,
      "rentTier": false
    },
    "result": null,
    "households": [],
    "caseMemberIds": [
      "A000000005"
    ],
    "rentTier": 2,
    "standards": {
      "totalIncome": 1500000,
      "monthlyIncome": 30000,
      "propertyValue": 2000000,
      "movableValue": 500000,
      "rentTier": "第1～3級"
    },
    "referenceDate": "2026/10/08",
    "completedAt": "2026/10/08 10:30:00",
    "standardsAreSimulated": true,
    "simulatedValues": {
      "totalIncome": 1200000,
      "monthlyIncome": 16667,
      "propertyValue": 1200000,
      "movableValue": 300000
    },
    "appliedAt": "2026/10/08 09:30:00",
    "authorizations": [
      {
        "personId": "A000000005",
        "authorized": true
      }
    ],
    "authorizationIsSimulated": true,
    "assetOwnerIds": {
      "realEstate": [],
      "movable": []
    }
  },
  {
    "caseId": "LD-115-00000001",
    "name": "黃柏翰",
    "idNumber": "A000000006",
    "agency": "臺南市政府",
    "housing": "臺南示範社宅",
    "room": "一房型",
    "results": {
      "totalIncome": "",
      "monthlyIncome": "符合",
      "propertyValue": "",
      "movableValue": "",
      "rentTier": "符合"
    },
    "enquiryStatus": "查調完成",
    "requiredChecks": {
      "totalIncome": false,
      "monthlyIncome": true,
      "propertyValue": false,
      "movableValue": false,
      "rentTier": true
    },
    "result": null,
    "households": [],
    "caseMemberIds": [
      "A000000006"
    ],
    "rentTier": 2,
    "standards": {
      "totalIncome": 1500000,
      "monthlyIncome": 30000,
      "propertyValue": 2000000,
      "movableValue": 500000,
      "rentTier": "第1～3級"
    },
    "referenceDate": "2026/10/08",
    "completedAt": "2026/10/08 10:30:00",
    "standardsAreSimulated": true,
    "simulatedValues": {
      "totalIncome": 1200000,
      "monthlyIncome": 16667,
      "propertyValue": 1200000,
      "movableValue": 300000
    },
    "appliedAt": "2026/10/08 09:30:00",
    "authorizations": [
      {
        "personId": "A000000006",
        "authorized": true
      }
    ],
    "authorizationIsSimulated": true,
    "assetOwnerIds": {
      "realEstate": [],
      "movable": []
    }
  },
  {
    "caseId": "LE-115-00000001",
    "name": "吳欣怡",
    "idNumber": "A000000007",
    "agency": "高雄市政府",
    "housing": "高雄示範社宅",
    "room": "套房",
    "results": {
      "totalIncome": "",
      "monthlyIncome": "",
      "propertyValue": "",
      "movableValue": "",
      "rentTier": ""
    },
    "enquiryStatus": "查調中",
    "requiredChecks": {
      "totalIncome": true,
      "monthlyIncome": true,
      "propertyValue": true,
      "movableValue": true,
      "rentTier": true
    },
    "result": null,
    "households": [],
    "caseMemberIds": [
      "A000000007"
    ],
    "rentTier": 2,
    "standards": {
      "totalIncome": 1500000,
      "monthlyIncome": 30000,
      "propertyValue": 2000000,
      "movableValue": 500000,
      "rentTier": "第1～3級"
    },
    "referenceDate": "2026/10/08",
    "completedAt": null,
    "standardsAreSimulated": true,
    "simulatedValues": {
      "totalIncome": 1200000,
      "monthlyIncome": 16667,
      "propertyValue": 1200000,
      "movableValue": 300000
    },
    "appliedAt": "2026/10/08 09:30:00",
    "authorizations": [
      {
        "personId": "A000000007",
        "authorized": true
      }
    ],
    "authorizationIsSimulated": true,
    "assetOwnerIds": {
      "realEstate": [],
      "movable": []
    }
  },
  {
    "caseId": "CH-115-00000003",
    "name": "陳建宏",
    "idNumber": "A000000008",
    "agency": "國家住都中心",
    "housing": "安居示範社宅",
    "room": "三房型",
    "results": {
      "totalIncome": "不符合",
      "monthlyIncome": "不符合",
      "propertyValue": "",
      "movableValue": "",
      "rentTier": "不符合"
    },
    "enquiryStatus": "查調完成",
    "requiredChecks": {
      "totalIncome": true,
      "monthlyIncome": true,
      "propertyValue": false,
      "movableValue": false,
      "rentTier": true
    },
    "result": null,
    "households": [],
    "caseMemberIds": [
      "A000000008"
    ],
    "rentTier": 4,
    "standards": {
      "totalIncome": 1500000,
      "monthlyIncome": 30000,
      "propertyValue": 2000000,
      "movableValue": 500000,
      "rentTier": "第1～3級"
    },
    "referenceDate": "2026/10/08",
    "completedAt": "2026/10/08 10:30:00",
    "standardsAreSimulated": true,
    "simulatedValues": {
      "totalIncome": 1800000,
      "monthlyIncome": 50000,
      "propertyValue": 1200000,
      "movableValue": 300000
    },
    "appliedAt": "2026/10/08 09:30:00",
    "authorizations": [
      {
        "personId": "A000000008",
        "authorized": true
      }
    ],
    "authorizationIsSimulated": true,
    "assetOwnerIds": {
      "realEstate": [],
      "movable": []
    }
  },
  {
    "caseId": "LF-115-00000002",
    "name": "王怡君",
    "idNumber": "A123456789",
    "agency": "新北市政府",
    "housing": "新北示範社宅",
    "room": "一房型",
    "appliedAt": "2026/10/08 20:30:00",
    "movedAt": "",
    "address": "",
    "results": {
      "totalIncome": "",
      "monthlyIncome": "",
      "propertyValue": "",
      "movableValue": "",
      "rentTier": ""
    },
    "status": "查調資料申請中",
    "lastQuery": "2026/10/08 20:30",
    "caseMemberIds": [
      "A123456789"
    ],
    "result": {
      "applicant": {
        "name": "王怡君",
        "birth": "1985/06/15",
        "income": 480000,
        "identity": "",
        "id": "A123456789",
        "relation": "本人",
        "fetus": 0,
        "household": true,
        "cohabiting": true
      },
      "people": [
        {
          "name": "王怡君",
          "birth": "1985/06/15",
          "income": 480000,
          "identity": "",
          "id": "A123456789",
          "relation": "本人",
          "fetus": 0,
          "household": true,
          "cohabiting": true
        }
      ],
      "marriage": "single",
      "marriageSource": "lookup",
      "targetType": "family",
      "realEstate": [],
      "movable": [],
      "documents": [],
      "lastQuery": "2026/10/08 20:30",
      "received": {
        "applicant": true,
        "family": true,
        "property": false,
        "documents": false
      }
    },
    "households": [
      {
        "number": "",
        "label": "案件成員",
        "address": "",
        "members": [
          {
            "name": "王怡君",
            "birth": "1985/06/15",
            "income": 480000,
            "identity": "",
            "id": "A123456789",
            "relation": "本人",
            "fetus": 0,
            "household": true,
            "cohabiting": true
          }
        ]
      }
    ],
    "enquiryStatus": "查調中",
    "requiredChecks": {
      "totalIncome": true,
      "monthlyIncome": true,
      "propertyValue": true,
      "movableValue": true,
      "rentTier": true
    },
    "rentTier": 4,
    "standards": {
      "totalIncome": 1500000,
      "monthlyIncome": 30000,
      "propertyValue": 2000000,
      "movableValue": 500000,
      "rentTier": "第1～3級"
    },
    "referenceDate": "2026/10/08",
    "completedAt": null,
    "standardsAreSimulated": true,
    "authorizations": [
      {
        "personId": "A123456789",
        "authorized": true
      }
    ],
    "authorizationIsSimulated": true,
    "assetOwnerIds": {
      "realEstate": [],
      "movable": []
    }
  },
  {
    "caseId": "LA-115-00000002",
    "name": "林志明",
    "idNumber": "A123456780",
    "agency": "臺北市政府",
    "housing": "臺北示範社宅",
    "room": "二房型",
    "appliedAt": "2026/10/08 20:30:00",
    "movedAt": "",
    "address": "",
    "results": {
      "totalIncome": "",
      "monthlyIncome": "",
      "propertyValue": "",
      "movableValue": "",
      "rentTier": ""
    },
    "status": "待查調",
    "lastQuery": "2026/10/08 20:30",
    "caseMemberIds": [
      "A123456780"
    ],
    "result": {
      "applicant": {
        "name": "林志明",
        "birth": "1985/06/15",
        "income": 480000,
        "identity": "",
        "id": "A123456780",
        "relation": "本人",
        "fetus": 0,
        "household": true,
        "cohabiting": true
      },
      "people": [
        {
          "name": "林志明",
          "birth": "1985/06/15",
          "income": 480000,
          "identity": "",
          "id": "A123456780",
          "relation": "本人",
          "fetus": 0,
          "household": true,
          "cohabiting": true
        }
      ],
      "marriage": "single",
      "marriageSource": "lookup",
      "targetType": "family",
      "realEstate": [
        {
          "owner": "林志明",
          "category": "房屋",
          "address": "新北市／三重段／00123-000",
          "household": true,
          "share": "5 分之 2",
          "area": "36 平方公尺",
          "value": 1200000,
          "common": false
        }
      ],
      "movable": [
        {
          "name": "林志明",
          "interest": 2000,
          "preferred": true,
          "prize": 2000,
          "other": 0,
          "subtotal": 121760
        }
      ],
      "documents": [
        [
          "戶籍資料證明",
          "A123456780_戶政查調_戶籍資料證明.pdf"
        ],
        [
          "婚姻關係資料",
          "A123456780_戶政查調_婚姻關係資料.pdf"
        ],
        [
          "所得資料清單",
          "家庭成員_財稅查調_所得資料清單.pdf"
        ],
        [
          "全國財產稅總歸戶清單",
          "家庭成員_財稅查調_財產歸戶清單.pdf"
        ],
        [
          "警消人員職務列等資料",
          "A123456780_警政查調_職務列等資料.pdf"
        ]
      ],
      "lastQuery": "2026/10/08 20:30",
      "received": {
        "applicant": true,
        "family": true,
        "property": true,
        "documents": true
      }
    },
    "households": [
      {
        "number": "",
        "label": "案件成員",
        "address": "",
        "members": [
          {
            "name": "林志明",
            "birth": "1985/06/15",
            "income": 480000,
            "identity": "",
            "id": "A123456780",
            "relation": "本人",
            "fetus": 0,
            "household": true,
            "cohabiting": true
          }
        ]
      }
    ],
    "enquiryStatus": "查調中",
    "requiredChecks": {
      "totalIncome": true,
      "monthlyIncome": true,
      "propertyValue": true,
      "movableValue": true,
      "rentTier": true
    },
    "rentTier": 4,
    "standards": {
      "totalIncome": 1500000,
      "monthlyIncome": 30000,
      "propertyValue": 2000000,
      "movableValue": 500000,
      "rentTier": "第1～3級"
    },
    "referenceDate": "2026/10/08",
    "completedAt": null,
    "standardsAreSimulated": true,
    "authorizations": [
      {
        "personId": "A123456780",
        "authorized": true
      }
    ],
    "authorizationIsSimulated": true,
    "assetOwnerIds": {
      "realEstate": [
        "A123456780"
      ],
      "movable": [
        "A123456780"
      ]
    }
  },
  {
    "caseId": "LH-115-00000002",
    "name": "陳怡安",
    "idNumber": "A123456781",
    "agency": "桃園市政府",
    "housing": "桃園示範社宅",
    "room": "三房型",
    "appliedAt": "2026/10/08 20:30:00",
    "movedAt": "",
    "address": "",
    "results": {
      "totalIncome": "",
      "monthlyIncome": "",
      "propertyValue": "",
      "movableValue": "",
      "rentTier": ""
    },
    "status": "查調中",
    "lastQuery": "2026/10/08 20:30",
    "caseMemberIds": [
      "A123456781"
    ],
    "result": {
      "applicant": {
        "name": "陳怡安",
        "birth": "1985/06/15",
        "income": 480000,
        "identity": "",
        "id": "A123456781",
        "relation": "本人",
        "fetus": 0,
        "household": true,
        "cohabiting": true
      },
      "people": [
        {
          "name": "陳怡安",
          "birth": "1985/06/15",
          "income": 480000,
          "identity": "",
          "id": "A123456781",
          "relation": "本人",
          "fetus": 0,
          "household": true,
          "cohabiting": true
        }
      ],
      "marriage": "single",
      "marriageSource": "lookup",
      "targetType": "family",
      "realEstate": [
        {
          "owner": "陳怡安",
          "category": "房屋",
          "address": "新北市／三重段／00123-000",
          "household": true,
          "share": "5 分之 2",
          "area": "36 平方公尺",
          "value": 1200000,
          "common": false
        }
      ],
      "movable": [
        {
          "name": "陳怡安",
          "interest": 2000,
          "preferred": true,
          "prize": 2000,
          "other": 0,
          "subtotal": 121760
        }
      ],
      "documents": [
        [
          "戶籍資料證明",
          "A123456781_戶政查調_戶籍資料證明.pdf"
        ],
        [
          "婚姻關係資料",
          "A123456781_戶政查調_婚姻關係資料.pdf"
        ],
        [
          "所得資料清單",
          "家庭成員_財稅查調_所得資料清單.pdf"
        ],
        [
          "全國財產稅總歸戶清單",
          "家庭成員_財稅查調_財產歸戶清單.pdf"
        ],
        [
          "警消人員職務列等資料",
          "A123456781_警政查調_職務列等資料.pdf"
        ]
      ],
      "lastQuery": "2026/10/08 20:30",
      "received": {
        "applicant": true,
        "family": true,
        "property": true,
        "documents": true
      }
    },
    "households": [
      {
        "number": "",
        "label": "案件成員",
        "address": "",
        "members": [
          {
            "name": "陳怡安",
            "birth": "1985/06/15",
            "income": 480000,
            "identity": "",
            "id": "A123456781",
            "relation": "本人",
            "fetus": 0,
            "household": true,
            "cohabiting": true
          }
        ]
      }
    ],
    "enquiryStatus": "查調中",
    "requiredChecks": {
      "totalIncome": true,
      "monthlyIncome": true,
      "propertyValue": true,
      "movableValue": true,
      "rentTier": true
    },
    "rentTier": 4,
    "standards": {
      "totalIncome": 1500000,
      "monthlyIncome": 30000,
      "propertyValue": 2000000,
      "movableValue": 500000,
      "rentTier": "第1～3級"
    },
    "referenceDate": "2026/10/08",
    "completedAt": null,
    "standardsAreSimulated": true,
    "authorizations": [
      {
        "personId": "A123456781",
        "authorized": true
      }
    ],
    "authorizationIsSimulated": true,
    "assetOwnerIds": {
      "realEstate": [
        "A123456781"
      ],
      "movable": [
        "A123456781"
      ]
    }
  },
  {
    "caseId": "LB-115-00000002",
    "name": "李雅雯",
    "idNumber": "A123456782",
    "agency": "臺中市政府",
    "housing": "臺中示範社宅",
    "room": "套房",
    "appliedAt": "2026/10/08 20:30:00",
    "movedAt": "",
    "address": "",
    "results": {
      "totalIncome": "",
      "monthlyIncome": "",
      "propertyValue": "",
      "movableValue": "",
      "rentTier": ""
    },
    "status": "已完成",
    "lastQuery": "2026/10/08 20:30",
    "caseMemberIds": [
      "A123456782"
    ],
    "result": {
      "applicant": {
        "name": "李雅雯",
        "birth": "1985/06/15",
        "income": 480000,
        "identity": "",
        "id": "A123456782",
        "relation": "本人",
        "fetus": 0,
        "household": true,
        "cohabiting": true
      },
      "people": [
        {
          "name": "李雅雯",
          "birth": "1985/06/15",
          "income": 480000,
          "identity": "",
          "id": "A123456782",
          "relation": "本人",
          "fetus": 0,
          "household": true,
          "cohabiting": true
        }
      ],
      "marriage": "single",
      "marriageSource": "lookup",
      "targetType": "family",
      "realEstate": [
        {
          "owner": "李雅雯",
          "category": "房屋",
          "address": "新北市／三重段／00123-000",
          "household": true,
          "share": "5 分之 2",
          "area": "36 平方公尺",
          "value": 1200000,
          "common": false
        }
      ],
      "movable": [
        {
          "name": "李雅雯",
          "interest": 2000,
          "preferred": true,
          "prize": 2000,
          "other": 0,
          "subtotal": 121760
        }
      ],
      "documents": [
        [
          "戶籍資料證明",
          "A123456782_戶政查調_戶籍資料證明.pdf"
        ],
        [
          "婚姻關係資料",
          "A123456782_戶政查調_婚姻關係資料.pdf"
        ],
        [
          "所得資料清單",
          "家庭成員_財稅查調_所得資料清單.pdf"
        ],
        [
          "全國財產稅總歸戶清單",
          "家庭成員_財稅查調_財產歸戶清單.pdf"
        ],
        [
          "警消人員職務列等資料",
          "A123456782_警政查調_職務列等資料.pdf"
        ]
      ],
      "lastQuery": "2026/10/08 20:30",
      "received": {
        "applicant": true,
        "family": true,
        "property": true,
        "documents": true
      }
    },
    "households": [
      {
        "number": "",
        "label": "案件成員",
        "address": "",
        "members": [
          {
            "name": "李雅雯",
            "birth": "1985/06/15",
            "income": 480000,
            "identity": "",
            "id": "A123456782",
            "relation": "本人",
            "fetus": 0,
            "household": true,
            "cohabiting": true
          }
        ]
      }
    ],
    "enquiryStatus": "查調中",
    "requiredChecks": {
      "totalIncome": true,
      "monthlyIncome": true,
      "propertyValue": true,
      "movableValue": true,
      "rentTier": true
    },
    "rentTier": 4,
    "standards": {
      "totalIncome": 1500000,
      "monthlyIncome": 30000,
      "propertyValue": 2000000,
      "movableValue": 500000,
      "rentTier": "第1～3級"
    },
    "referenceDate": "2026/10/08",
    "completedAt": null,
    "standardsAreSimulated": true,
    "authorizations": [
      {
        "personId": "A123456782",
        "authorized": true
      }
    ],
    "authorizationIsSimulated": true,
    "assetOwnerIds": {
      "realEstate": [
        "A123456782"
      ],
      "movable": [
        "A123456782"
      ]
    }
  }
];
