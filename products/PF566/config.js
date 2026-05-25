// PF566 美富優退 — 商品設定
// 富邦人壽美富優退外幣分紅終身保險（115/03/31 版）
window.PF566_CONFIG =
{
  "code": "PF566",
  "name": "美富優退",
  "fullName": "富邦人壽美富優退外幣分紅終身保險",
  "currency": "USD",
  "engineType": "retirement_income",
  "keyPrefix": "PF566",

  // 六個變體：三個退休年齡 × 三/六年期
  "productVariants": [
    { "key": "PF5503", "label": "55退-3年", "retireAge": 55, "ageMax": 49, "period": 3 },
    { "key": "PF5506", "label": "55退-6年", "retireAge": 55, "ageMax": 49, "period": 6 },
    { "key": "PF6003", "label": "60退-3年", "retireAge": 60, "ageMax": 54, "period": 3 },
    { "key": "PF6006", "label": "60退-6年", "retireAge": 60, "ageMax": 54, "period": 6 },
    { "key": "PF6503", "label": "65退-3年", "retireAge": 65, "ageMax": 59, "period": 3 },
    { "key": "PF6506", "label": "65退-6年", "retireAge": 65, "ageMax": 59, "period": 6, "default": true }
  ],

  // 三年期與六年期都支援
  "periodOptions": [3, 6],
  "periodLabels": { "3": "3 年期", "6": "6 年期" },

  // 投保年齡範圍（以 productVariants.ageMax 為準，依選擇變體動態限制）
  "ageRange": {
    "3": { "min": 0, "max": 59 },
    "6": { "min": 0, "max": 59 }
  },

  // 保額限制（最低 0.5 萬 = 5,000 美元；以千美元為單位）
  "sumLimits": [
    { "ageMax": 15, "min": 0.5, "max":  60 },
    { "ageMax": 40, "min": 0.5, "max": 120 },
    { "ageMax": 59, "min": 0.5, "max": 200 }
  ],

  // 折扣規則（上限 4%）
  "discount": {
    "3": {
      "highAmount": [
        { "minSum":  5, "pct": 0.01 },
        { "minSum": 15, "pct": 0.02 },
        { "minSum": 30, "pct": 0.03 }
      ],
      "paymentMethod": 0.01,
      "cap": 0.04
    },
    "6": {
      "highAmount": [
        { "minSum": 10, "pct": 0.01 },
        { "minSum": 30, "pct": 0.02 },
        { "minSum": 60, "pct": 0.03 }
      ],
      "paymentMethod": 0.01,
      "cap": 0.04
    }
  },

  // 計算模式（與 PFW 相同）
  "modes": {
    "3": [
      { "key": "total",  "label": "三年總存", "unit": "萬", "default": 50,  "quickPicks": [30, 50, 100, 300] },
      { "key": "annual", "label": "年存",      "unit": "萬/年", "default": 20, "quickPicks": [10, 20, 30, 50] },
      { "key": "retire", "label": "退休金年領","unit": "萬/年", "default": 36, "quickPicks": [12, 24, 36, 60, 120] }
    ],
    "6": [
      { "key": "total",  "label": "六年總存", "unit": "萬", "default": 100, "quickPicks": [50, 100, 300, 600] },
      { "key": "annual", "label": "年存",      "unit": "萬/年", "default": 20, "quickPicks": [10, 20, 30, 50] },
      { "key": "retire", "label": "退休金年領","unit": "萬/年", "default": 36, "quickPicks": [12, 24, 36, 60, 120] }
    ]
  },

  // 試算表欄位
  "columns": [
    { "key": "year",     "label": "年度" },
    { "key": "age",      "label": "年齡" },
    { "key": "paid_yr",  "label": "折扣後保費" },
    { "key": "paid_cum", "label": "折扣後總保費" },
    { "key": "surv_yr",  "label": "年度生存金" },
    { "key": "surv_pct", "label": "生存金%" },
    { "key": "surv_cum", "label": "累計生存金" },
    { "key": "death",    "label": "身故金" },
    { "key": "surr",     "label": "解約金" },
    { "key": "profit",   "label": "解約獲利" }
  ],

  // 回饋金（目前無特定活動，預留空陣列）
  "bonus": {
    "lucky":  [],
    "wallet": [],
    "walletAmount": 0,
    "luckyContent":  "",
    "walletContent": ""
  }
}
;
