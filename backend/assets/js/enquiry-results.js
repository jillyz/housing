/* 查調結果共用呈現：標準及級距由案件資料提供，不推定審查門檻。 */
window.EnquiryResults = (() => {
  const columns = [
    { key: 'totalIncome', label: '總所得' },
    { key: 'monthlyIncome', label: '每人每月平均所得' },
    { key: 'propertyValue', label: '不動產價值' },
    { key: 'movableValue', label: '動產價值' },
    { key: 'rentTier', label: '租金級距' }
  ];
  const limits = { totalIncome: 1450000, monthlyIncome: 62125, propertyValue: 7080000, movableValue: 4710000 };
  const excludedLand = p => p.category === '土地' && ['原住民保留地', '道路用地'].includes(p.landUse);
  const amount = value => `${Number(value).toLocaleString('zh-TW')} 元`;
  const hasValue = value => value !== null && value !== undefined && value !== '';
  function authorizedData(record) {
    const ids = new Set((record.authorizations || []).filter(p => p.authorized === true).map(p => p.personId));
    return {
      ids,
      people: (record.result?.people || []).filter(p => ids.has(p.id)),
      realEstate: (record.result?.realEstate || []).filter((p, i) => ids.has(record.assetOwnerIds?.realEstate?.[i])),
      movable: (record.result?.movable || []).filter((p, i) => ids.has(record.assetOwnerIds?.movable?.[i]))
    };
  }
  function values(record) {
    const result = record.result;
    const authorized = authorizedData(record);
    const members = authorized.people.filter(p => record.caseMemberIds.includes(p.id));
    const incomeReady = result?.received.family && members.length === record.caseMemberIds.length && members.length > 0
      && members.every(p => hasValue(p.income) && Number.isFinite(Number(p.income)));
    const population = members.length + members.reduce((sum, p) => sum + Number(p.fetus || 0), 0);
    const annual = incomeReady ? members.reduce((sum, p) => sum + Number(p.income), 0) : null;
    const returned = {
      totalIncome: annual,
      monthlyIncome: incomeReady && population ? Math.round(annual / 12 / population) : null,
      propertyValue: result?.received.property && authorized.ids.size ? authorized.realEstate.filter(p => !excludedLand(p)).reduce((sum, p) => sum + p.value, 0) : null,
      movableValue: result?.received.property && authorized.ids.size ? authorized.movable.reduce((sum, p) => sum + p.subtotal, 0) : null,
      rentTier: (result ? incomeReady : authorized.ids.has(record.idNumber)) ? record.rentTier ?? null : null
    };
    // 僅缺少原頁明細的列表範例使用使用者授權的模擬數值。
    for (const key of ['totalIncome', 'monthlyIncome', 'propertyValue', 'movableValue']) {
      if (!result && authorized.ids.has(record.idNumber) && !hasValue(returned[key]) && hasValue(record.simulatedValues?.[key])) returned[key] = record.simulatedValues[key];
    }
    return returned;
  }
  function display(record, key, row = 'verdict') {
    if (!record.requiredChecks[key]) return '--';
    if (row === 'standard') {
      if (key in limits) return `${key === 'monthlyIncome' ? '≤' : '<'} ${amount(limits[key])}`;
      const standard = record.standards?.[key];
      return hasValue(standard) ? (typeof standard === 'number' && key !== 'rentTier' ? `≤ ${amount(standard)}` : String(standard)) : '待設定';
    }
    if (record.enquiryStatus !== '查調完成') return '查調中';
    if (row === 'actual' || row === 'list' && key === 'rentTier') {
      const value = values(record)[key];
      if (!hasValue(value)) return key === 'rentTier' ? '待設定' : '未提供';
      return key === 'rentTier' ? `第${value}級` : amount(value);
    }
    if (!hasValue(values(record)[key])) return '待資料齊全';
    if (key in limits) {
      const value = values(record)[key];
      return (key === 'monthlyIncome' ? value <= limits[key] : value < limits[key]) ? '符合' : '不符合';
    }
    return record.results[key] || '待判定';
  }
  return { columns, values, display, authorizedData };
})();
