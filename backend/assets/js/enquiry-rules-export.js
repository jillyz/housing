/* 列表篩選結果匯出；所有判斷以案件申請日及已取得資料為準。 */
(() => {
  'use strict';
  const model = window.EnquiryRuleDemo;
  const headers = ['統一案件編號', '申請社宅', '申請人', '年齡(成年)', '年齡(65歲)', '設籍地', '連續設籍滿1年', '有無配偶', '配偶分戶', '未成年子女', '原住民', '有無養父母', '總所得', '每人每月平均所得', '租金分級', '動產'];
  const mark = value => value ? 'V' : '!';
  function dateParts(value) {
    const match = /^(\d{4})[/-](\d{2})[/-](\d{2})$/.exec(value || '');
    if (!match) return null;
    const parts = match.slice(1).map(Number);
    const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    return date.getUTCFullYear() === parts[0] && date.getUTCMonth() + 1 === parts[1] && date.getUTCDate() === parts[2] ? parts : null;
  }
  function ageAt(birth, applicationDate) {
    const b = dateParts(birth), a = dateParts(applicationDate);
    if (!b || !a || Date.UTC(b[0], b[1] - 1, b[2]) > Date.UTC(a[0], a[1] - 1, a[2])) return null;
    return a[0] - b[0] - Number(a[1] < b[1] || a[1] === b[1] && a[2] < b[2]);
  }
  function oneYear(movedIn, applicationDate) {
    const moved = dateParts(movedIn), applied = dateParts(applicationDate);
    if (!moved || !applied) return null;
    // 以週年日判斷；閏日遷入於次年 2 月最後一日滿一年。
    const day = Math.min(moved[2], new Date(Date.UTC(moved[0] + 1, moved[1], 0)).getUTCDate());
    return Date.UTC(...[applied[0], applied[1] - 1, applied[2]]) >= Date.UTC(moved[0] + 1, moved[1] - 1, day);
  }
  function row(record) {
    const people = model.people(record);
    const applicant = people.find(p => p.key === record.applicant);
    const values = [record.id, record.housing, applicant.name];
    if (!model.canView(record)) return [...values, ...Array(13).fill('')];
    const members = people.filter(p => record.declared.includes(p.key));
    const ages = members.map(p => ({ person: p, age: ageAt(p.birth, record.applicationDate) }));
    const minors = ages.filter(p => p.age !== null && p.age < 18).map(p => p.person);
    const seniors = ages.filter(p => p.age !== null && p.age >= 65).map(p => p.person);
    const agesKnown = ages.every(p => p.age !== null);
    const namedFlag = (flag, list) => [mark(flag), ...list.map(p => p.name)].join('\n');
    const address = applicant.registration;
    const city = address?.cityCode ? address.cityCode === record.cityCode : null;
    const anniversary = oneYear(address?.movedInDate, record.applicationDate);
    const district = city !== null && address?.district && record.housingDistrict ? city && address.district === record.housingDistrict : null;
    const spouse = model.spouseCheck(record);
    const children = ages.filter(p => p.age !== null && p.age < 18 && [p.person.father, p.person.mother, p.person.adoptiveFather, p.person.adoptiveMother].includes(applicant.name.trim()));
    const checks = model.assessment(record);
    const verdict = key => checks ? mark(checks.find(c => c.key === key).pass) : '';
    return [...values,
      agesKnown ? namedFlag(minors.length === 0, minors) : '',
      agesKnown ? namedFlag(seniors.length > 0, seniors) : '',
      city === null ? '' : mark(city),
      district === false ? '!' : district === null || anniversary === null ? '' : mark(anniversary),
      record.marriage ? mark(record.marriage === '有偶') : '',
      record.marriage === '有偶' ? spouse?.name ? mark(spouse.separate) : '' : record.marriage ? '!' : '',
      agesKnown ? children.length : '',
      checks ? members.map(p => `${p.name}：${mark(p.welfare.some(w => w.includes('原住民')))}`).join('\n') : '',
      members.map(p => `${p.name}：${mark(Boolean(p.adoptiveFather || p.adoptiveMother))}`).join('\n'),
      verdict('totalIncome'), verdict('monthlyIncome'),
      checks?.find(c => c.key === 'rentTier').value ? `第${checks.find(c => c.key === 'rentTier').value}級` : '',
      verdict('movableValue')];
  }
  function buildWorkbook(records, ExcelJS = window.ExcelJS) {
    if (!ExcelJS?.Workbook) throw new Error('Excel 匯出元件未載入，請重新整理後再試。');
    const book = new ExcelJS.Workbook();
    const sheet = book.addWorksheet('查調案件', { views: [{ state: 'frozen', ySplit: 1 }] });
    const widths = [23, 25, 13, 23, 21, 13, 19, 13, 13, 16, 26, 26, 14, 24, 14, 14];
    sheet.columns = headers.map((header, i) => ({ header, width: widths[i] }));
    sheet.addRows(records.map(row));
    sheet.autoFilter = { from: 'A1', to: `P${sheet.rowCount}` };
    sheet.eachRow((current, index) => {
      current.font = { name: '微軟正黑體', size: 11, color: { argb: 'FF253B43' } };
      current.alignment = { vertical: 'top', wrapText: true };
      const lines = Math.max(...current.values.slice(1).map(value => String(value ?? '').split('\n').length));
      current.height = index === 1 ? 34 : Math.max(30, lines * 18 + 10);
      current.eachCell({ includeEmpty: true }, cell => {
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFDCE7E9' } } };
        if (index === 1) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF137384' } };
          cell.font = { name: '微軟正黑體', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
          cell.alignment = { vertical: 'middle', wrapText: true };
        } else if (index % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F7F8' } };
      });
    });
    return book;
  }
  async function download(records) {
    const book = buildWorkbook(records);
    const buffer = await book.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const stamp = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date()).replace(/\D/g, '');
    link.href = url;
    link.download = `查調案件_${stamp}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
  window.EnquiryRuleExport = { headers, ageAt, oneYear, row, buildWorkbook, download };
})();
