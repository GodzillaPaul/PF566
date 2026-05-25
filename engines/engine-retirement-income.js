// ============================================================
// engine-retirement-income.js
// 引擎類型：retirement_income（生存保險型分紅）
// 來源：PFWX main.js 既有引擎，已驗證對齊富邦原 Excel
// 依賴：window.RATES、window.PDATA（由 products/<CODE>/data.js 提供）
// ============================================================

(function (root) {
  'use strict';

  // ── 工具函式 ─────────────────────────────────────
  function tw(n) { return Math.round(n).toLocaleString('zh-TW'); }

  function calcInsAge(bday, today) {
    let b = String(bday).replace(/[\/\-]/g, '');
    let y, m, d;
    if (b.length === 6) { y = +b.slice(0, 2) + 1911; m = +b.slice(2, 4); d = +b.slice(4, 6); }
    else if (b.length === 7) { y = +b.slice(0, 3) + 1911; m = +b.slice(3, 5); d = +b.slice(5, 7); }
    else return null;
    if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) return null;
    let age = today.getFullYear() - y;
    let bd = new Date(today.getFullYear(), m - 1, d);
    let hd = new Date(today.getFullYear(), m - 1, d);
    hd.setDate(hd.getDate() + 183);
    if (today < bd) age--;
    if (today >= hd) age++;
    return age;
  }

  // ── 折扣計算（PFW 規則：保額分檔 + 1% base） ──────
  // 注意：這裡的「保額分檔」是按 amtWan(萬保額)，不是按年齡。
  function getMaxAmount(age, sumLimits) {
    for (const seg of sumLimits) {
      if (age <= seg.ageMax) return seg.max;
    }
    return sumLimits[sumLimits.length - 1].max;
  }

  function getHighAmtDisc(amtWan, highAmountRules) {
    let pct = 0;
    for (const r of highAmountRules) {
      if (amtWan >= r.minSum) pct = r.pct;
    }
    return pct;
  }

  function getDiscRate(amtWan, discountConfig) {
    const high = getHighAmtDisc(amtWan, discountConfig.highAmount);
    return Math.min(discountConfig.paymentMethod + high, discountConfig.cap);
  }

  // ── PDATA lookup ─────────────────────────────────
  function pdGet(table, key, yr) {
    const row = root.PDATA[table] && root.PDATA[table][key];
    if (!row) return 0;
    return row[yr - 1] || 0;
  }

  function pvfbGet(table, key, yr) {
    const row = root.PDATA[table] && root.PDATA[table][key];
    if (!row) return 0;
    return row[yr] || 0;
  }

  // ── 核心：完整給付試算表 ──────────────────────────
  function computeBenefitTable(prod6, gender, age, amount, bonusType) {
    bonusType = bonusType || 2;
    const g = String(gender).padStart(2, '0');
    const a = String(age).padStart(2, '0');
    const key = prod6 + g + a;
    const bonukey = key + bonusType;

    const rate = root.PDATA.GP[key];
    if (!rate) return null;

    let cumN = 0, cumSurv = 0;
    const results = [];
    const maxYr = Math.min(99 - age, 111);

    for (let yr = 1; yr <= maxYr; yr++) {
      const idx = yr - 1;
      const ageYr = age + yr - 1;

      const diePwCheck = pdGet('DIE', key, yr);
      if (!diePwCheck && yr > 6) break;

      // 年度保單紅利 K
      const bonu = pdGet('BONU', bonukey, yr);
      const K = Math.ceil(amount * bonu) + Math.ceil((cumN / 10000) * bonu);

      // 增購保額 M
      const pvfbNext = pvfbGet('PVFB', key, yr);
      const pvfb0Next = pvfbGet('PVFB0', key, yr);
      const M = pvfbNext > 0 ? Math.round(K / (pvfbNext / 10000)) : 0;
      cumN += M;

      // 身故金
      const diePw = pdGet('DIE', key, yr);
      const die2Pw = pdGet('_DIE2', key, yr);
      const bonudiePw = pdGet('BONUDIE', bonukey, yr);
      const death = Math.ceil(diePw * amount)
        + Math.ceil(die2Pw * cumN / 10000)
        + Math.ceil(bonudiePw * amount);

      // 解約金
      const cvPw = pdGet('CV', key, yr);
      const bonucvPw = pdGet('BONUCV', bonukey, yr);
      const surr = Math.ceil(cvPw * amount)
        + Math.ceil(pvfb0Next * cumN / 10000)
        + Math.ceil(bonucvPw * amount);

      // 生存保險金（PFW 特有）
      const srvPw = pdGet('SRV', key, yr);
      const survYr = Math.ceil(srvPw * amount) + Math.ceil(srvPw * cumN / 10000);
      cumSurv += survYr;

      results.push({ yr: yr, age: ageYr, death: death, surr: surr, surv: survYr, cumSurv: cumSurv });
    }
    return results;
  }

  // ── 反推：六年總存 → 保額 ────────────────────────
  function amtWanFrom6YrTotal(sixYrTWD, gender, age, prod, exrate, discountConfig) {
    const g = gender === 1 ? 'M' : 'F';
    const ratePerWan = root.RATES[prod] && root.RATES[prod][g] && root.RATES[prod][g][age];
    if (!ratePerWan) return null;
    let amtWan = sixYrTWD / (6 * ratePerWan * 0.97 * exrate);
    for (let i = 0; i < 5; i++) {
      const disc = getDiscRate(amtWan, discountConfig);
      amtWan = sixYrTWD / (6 * ratePerWan * (1 - disc) * exrate);
    }
    return Math.round(amtWan * 10) / 10;
  }

  // ── 反推：找最接近 targetUSD 首次生存金的保額 ──
  function findAmtForSurv(prodKey, gender, age, targetUSD) {
    let lo = 0.1, hi = 600.0;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      const tbl = computeBenefitTable(prodKey, gender, age, mid, 2);
      if (!tbl) return null;
      const firstSurv = (tbl.find(function (r) { return r.surv > 0; }) || { surv: 0 }).surv;
      if (firstSurv < targetUSD) lo = mid;
      else hi = mid;
    }
    return Math.round((lo + hi) / 2 * 10) / 10;
  }

  // ── 算保費（給定保額） ─────────────────────────
  function computePremium(prod, gender, age, amtWan, exrate, discountConfig) {
    const g = gender === 1 ? 'M' : 'F';
    const ratePerWan = (root.RATES[prod] && root.RATES[prod][g] && root.RATES[prod][g][age]) || 0;
    const disc = getDiscRate(amtWan, discountConfig);
    const rawUSD = Math.round(ratePerWan * amtWan * 10) / 10;
    const annualUSD = Math.floor(rawUSD);
    const discUSD = Math.round(annualUSD * (1 - disc));
    const premTWD = Math.round(discUSD * exrate);
    return {
      ratePerWan: ratePerWan,
      discount: disc,
      rawUSD: rawUSD,
      annualUSD: annualUSD,
      discUSD: discUSD,
      premTWD: premTWD
    };
  }

  // ── 對外 API ──────────────────────────────────
  root.RetirementIncomeEngine = {
    tw: tw,
    calcInsAge: calcInsAge,
    getMaxAmount: getMaxAmount,
    getDiscRate: getDiscRate,
    computeBenefitTable: computeBenefitTable,
    amtWanFrom6YrTotal: amtWanFrom6YrTotal,
    findAmtForSurv: findAmtForSurv,
    computePremium: computePremium
  };
})(typeof window !== 'undefined' ? window : globalThis);
