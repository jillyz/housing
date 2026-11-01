/* 資料沿用 admin/enquiry-hub.html；檢視外觀使用 apply-03.html 的 item/head/body 與表格合計列。 */
(() => {
  const records = window.EnquiryCases || [];
  const caseId = new URLSearchParams(location.search).get('case');
  const record = caseId === null ? records[0] : records.find(item => item.caseId === caseId);
  const body = document.getElementById('detailBody');
  if (!record) {
    const error = document.getElementById('detailError');
    error.hidden = false;
    error.textContent = '查無此案件，請返回列表重新選擇。';
    return;
  }

  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const number = value => Number(value).toLocaleString('zh-TW');
  const money = value => `${number(value)} 元`;
  document.getElementById('detailStatus').textContent = record.enquiryStatus;
  document.getElementById('detailCompletedAt').textContent = `資料完成時間：${record.enquiryStatus === '查調完成' ? record.completedAt || '未提供' : '尚未完成'}`;
  document.getElementById('detailStatus').setAttribute('data-state', record.enquiryStatus);
  document.title = `${record.caseId}｜查調案件詳細資料｜全國社會住宅資料整合暨共同查調管理平臺`;
  const result = record.result || { received: {}, people: [] };
  const incomeAvailable = Boolean(result.received.family);
  const propertyAvailable = Boolean(result.received.property);
  const memberIds = new Set(record.caseMemberIds);
  const authorized = window.EnquiryResults.authorizedData(record);
  const authorizedMembers = authorized.people.filter(p => memberIds.has(p.id));
  const financialValues = window.EnquiryResults.values(record);
  const allPeople = [...new Map((record.households || []).flatMap(h => h.members).map(p => [p.id, p])).values()];
  const knownPeople = new Map([...allPeople, ...result.people].map(p => [p.id, p]));
  if (!knownPeople.has(record.idNumber)) knownPeople.set(record.idNumber, { id: record.idNumber, name: record.name });
  const enquiryPeople = [...memberIds].map(id => knownPeople.get(id)).filter(Boolean).sort((a, b) => Number(b.id === record.idNumber) - Number(a.id === record.idNumber));
  const people = result.people.filter(person => memberIds.has(person.id));
  const annualIncome = authorizedMembers.reduce((sum, person) => sum + Number(person.income || 0), 0);
  const fetusCount = people.reduce((sum, person) => sum + Number(person.fetus || 0), 0);
  const population = memberIds.size + fetusCount;
  const spouse = result.people.find(person => person.relation === '配偶');

  function fields(items) {
    return `<dl class="row g-3 mb-0">${items.map(([label, value]) => `<div class="col-12 col-md-6 col-xl-4"><dt class="form-label">${escape(label)}</dt><dd class="mb-0 text-break">${escape(value)}</dd></div>`).join('')}</dl>`;
  }
  const booleanColumns = new Set(['案件成員', '授權查調', '戶籍地', '公同共有', '優惠利率']);
  function cellContent(value, label) {
    if (label === '個人詳細記事') return value ? `<details class="enquiry-notes"><summary>查看記事</summary><p class="mb-0 mt-2 text-break">${escape(value)}</p></details>` : '--';
    if (label === '社福資格') {
      const items = String(value || '').split(/\r?\n/).map(item => item.trim()).filter(Boolean);
      return `<ul class="list-unstyled vstack gap-2 mb-0 w-100">${items.map(item => {
        const numbered = item.match(/^(\d+)[.．、]\s*(.+)$/);
        return `<li class="d-flex align-items-start gap-2">${numbered ? `<span class="badge rounded-pill text-bg-primary flex-shrink-0"><span class="visually-hidden">編號 </span>${escape(numbered[1])}</span><span>${escape(numbered[2])}</span>` : `<span>${escape(item)}</span>`}</li>`;
      }).join('')}</ul>`;
    }
    if (booleanColumns.has(label) && (value === '是' || value === '否')) {
      const yes = value === '是';
      return `<span class="${yes ? 'text-success' : 'enquiry-boolean-no'} fs-5" role="img" aria-label="${value}" title="${value}"><i class="fa-solid ${yes ? 'fa-circle-check' : 'fa-circle-xmark'}" aria-hidden="true"></i></span>`;
    }
    return escape(value);
  }
  function table(headers, rows, caption, totals = []) {
    const summaryRow = totals.length ? `<tr class="p-0"><td colspan="${headers.length}" class="p-0 bg-orange-lightest"><div class="p-3 px-lg-4 text-end"><div class="grid-right-auto row-gap-2 column-gap-3 | text-end">${totals.map(([label, value]) => `<div class="start">${escape(label)}</div><div class="end">${escape(value)}</div>`).join('')}</div></div></td></tr>` : '';
    return `<table class="table table-list table-rwd enquiry-detail-table"><caption class="visually-hidden">${escape(caption)}</caption><thead><tr>${headers.map(label => `<th class="text-wrap" scope="col">${label === '申請人／配偶' ? '<span class="visually-hidden">身分</span>' : escape(label)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map((cell, i) => `<td data-th="${headers[i] === '申請人／配偶' ? '' : escape(headers[i])}">${cellContent(cell, headers[i])}</td>`).join('')}</tr>` ).join('')}${summaryRow}</tbody></table>`;
  }
  function section(id, title, content) {
    if (['familyInfo', 'welfareInfo', 'incomeInfo', 'propertyInfo', 'movableInfo'].includes(id)) return `<section class="item" id="${id}" aria-labelledby="${id}Title"><div class="collapse-wrap | position-relative"><h2 class="collapse-title" id="${id}Title"><span class="text">${title}</span></h2><a href="#${id}Body" class="collapse-btn | stretched-link" data-bs-toggle="collapse" role="button" aria-expanded="true" aria-controls="${id}Body" aria-label="展開或收合${title}"><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></a></div><div class="collapse show" id="${id}Body"><div class="body">${content}</div></div></section>`;
    return `<section class="item" id="${id}" aria-labelledby="${id}Title"><div class="head | title-border-bottom"><h2 class="title-name" id="${id}Title">${title}</h2></div><div class="body">${content}</div></section>`;
  }
  function household(title, address, members) {
    return `<h5 class="mb-3">${escape(title)}｜戶籍地址：${escape(address)}</h5>${members.some(p => p.id === record.idNumber) ? `<p>遷入日期：${escape(record.movedAt || '未提供')}</p>` : ''}`
      + table(['申請人／配偶', '姓名', '案件成員', '身分證字號', '生日', '稱謂', '父／養父', '母／養母', '個人詳細記事'], members.map(p => [p.id === record.idNumber ? '申請人' : p.id === spouse?.id ? '配偶' : '', p.name, memberIds.has(p.id) ? '是' : '否', p.id, p.birth, p.title || p.relation || '', p.father, p.mother, p.notes]), `${title}戶籍資料（戶政司）`);
  }

  // 靜態展示紀錄；正式串接時由案件 viewHistory 提供，不假裝記錄實際使用者。
  const viewHistory = record.viewHistory || [
    { viewedAt: (record.referenceDate || record.appliedAt.slice(0, 10)).replaceAll('-', '/') + ' 22:30:00', viewer: '承辦人甲（範例）', agency: record.agency },
    { viewedAt: (record.referenceDate || record.appliedAt.slice(0, 10)).replaceAll('-', '/') + ' 22:15:00', viewer: '承辦人乙（範例）', agency: '內政部國土管理署' },
    { viewedAt: (record.referenceDate || record.appliedAt.slice(0, 10)).replaceAll('-', '/') + ' 22:00:00', viewer: '承辦人甲（範例）', agency: record.agency }
  ];
  const visits = [...viewHistory].sort((a, b) => b.viewedAt.localeCompare(a.viewedAt));
  document.getElementById('viewHistoryCount').textContent = number(visits.length);
  document.getElementById('viewHistoryCase').textContent = record.caseId;
  document.getElementById('viewHistoryBody').innerHTML = visits.length
    ? table(['檢視時間', '檢視人員', '所屬機關'], visits.map(v => [v.viewedAt, v.viewer, v.agency]), '案件檢視紀錄')
    : '<p>尚無檢視紀錄。</p>';
  document.getElementById('viewHistoryButton').disabled = false;

  const overview = table(
    ['統一案件編號', '權責機關', '申請社宅', '申請房型', '申請時間', '查調基準日'],
    [[record.caseId, record.agency, record.housing, record.room, record.appliedAt,
      record.referenceDate || (record.appliedAt || '').slice(0, 10).replaceAll('-', '/') || '未提供']], '案件資料')
    + table(['', '姓名', '身分證字號', '授權查調', '胎兒數'], enquiryPeople.map(p => [p.id === record.idNumber ? '申請人' : '', p.name, p.id, authorized.ids.has(p.id) ? '是' : '否', allPeople.length ? Number(p.fetus || 0) : '未提供']), '案件查調對象與授權');
  const checks = window.EnquiryResults;
  const resultClass = record.enquiryStatus === '查調完成' ? 'enquiry-result--complete' : 'enquiry-result--pending';
  const comparisonRows = [['actual', '本案'], ['standard', '標準值'], ['verdict', '初判結果']];
  const summary = `
    <table class="table table-list table-rwd enquiry-detail-table enquiry-comparison">
      <caption class="visually-hidden">本案查調數值、標準值與符合判定</caption>
      <thead><tr><th scope="col" class="text-wrap">項目</th>${checks.columns.map(c => `<th scope="col" class="text-wrap">${c.label}<div class="small fw-normal mt-1">${c.key === 'propertyValue' ? '地政司' : c.key === 'rentTier' ? '平臺試算' : '財政部'}</div></th>`).join('')}</tr></thead>
      <tbody>${comparisonRows.map(([type, label]) => `<tr><th scope="row" class="highlight text-wrap">${label}</th>${checks.columns.map(c => {
        let value = checks.display(record, c.key, type);
        if (c.key === 'rentTier' && record.requiredChecks.rentTier) {
          if (type === 'standard') return '<td class="enquiry-result enquiry-result--complete" data-th="租金級距"><details><summary class="text-primary">點開查看</summary><ul class="list-unstyled mt-2 mb-0"><li class="mb-2">第 1 級：低收入戶 OR 中低收入戶</li><li class="mb-2">第 2 級：每人每月平均所得 0～26,624 元</li><li>第 3 級：每人每月平均所得 26,625～62,125 元</li></ul></details></td>';
          if (record.enquiryStatus === '查調完成') {
            const monthly = financialValues.monthlyIncome;
            const lowIncome = enquiryPeople.some(p => /(?:^|[\s.、])(?:低收入戶|中低收入戶)(?:$|[\s、])/m.test(p.identity || ''));
            value = type === 'actual' ? (monthly == null ? '待資料齊全' : money(monthly))
              : lowIncome ? '第 1 級' : monthly == null ? '待資料齊全' : monthly >= 0 && monthly <= 26624 ? '第 2 級' : monthly >= 26625 && monthly <= 62125 ? '第 3 級' : '未落於指定級距';
          }
        }
        const content = value === '符合' || value === '不符合' ? `<span class="text-${value === '符合' ? 'success' : 'danger'} fw-bold">${value}</span>` : escape(value);
        return `<td class="enquiry-result ${type === 'standard' ? 'enquiry-result--complete' : resultClass}" data-th="${c.label}">${content}</td>`;
      }).join('')}</tr>`).join('')}</tbody>
    </table>`;
  if (!record.result) {
    body.innerHTML = section('caseOverview', '案件資料', overview)
      + section('enquirySummary', '查調結果', summary)
      + section('returnDetails', '回傳明細', '<p>此案件目前提供案件資料與查調狀態，尚無家庭及財產回傳明細。</p>')
      + '<div class="item"><div class="btn-cta-group pb-4"><a class="btn btn-pill-outline-primary" href="enquiry-hub.html">返回列表</a></div></div>';
    return;
  }
  const family = record.households.map(h => household(h.number ? `${h.label}｜戶號 ${h.number}` : h.label, h.address, h.members)).join('')
    ;
  const welfarePeople = allPeople.filter(p => String(p.identity || '').trim());
  const welfare = welfarePeople.length ? table(['申請人／配偶', '姓名', '生日', '社福資格'], welfarePeople.map(p => [p.id === record.idNumber ? '申請人' : p.id === spouse?.id ? '配偶' : '', p.name, p.birth, p.identity]), '社福資格（衛福部）') : '<p>無社福資格資料。</p>';
  const income = authorized.people.length ? table(['申請人／配偶', '姓名', '案件成員', '近一年所得'], authorized.people.map(p => [p.id === record.idNumber ? '申請人' : p.id === spouse?.id ? '配偶' : '', p.name, memberIds.has(p.id) ? '是' : '否', incomeAvailable ? money(p.income) : '']), '家庭成員所得清單', [
    ['胎兒數', `${fetusCount} 人`],
    ['人口數', `${population} 人`],
    ['年所得', incomeAvailable ? money(annualIncome) : ''],
    ['每人每月平均所得', financialValues.monthlyIncome != null ? money(financialValues.monthlyIncome) : '待資料齊全']
  ]) + '' : '<p>無已授權查調者。</p>';
  const realEstate = propertyAvailable && !authorized.realEstate.length ? '<p>已授權查調者無不動產明細。</p>' : propertyAvailable
    ? table(['持有者', '類別', '地段地號建號／座落', '戶籍地', '持分比', '房地面積', '房地現值金額', '公同共有'], authorized.realEstate.map(p => [p.owner, p.category, p.address, p.household ? '是' : '否', p.share, p.area, money(p.value), p.common ? '是' : '否']), '家庭成員不動產明細', [['不動產總額', money(authorized.realEstate.reduce((sum, p) => sum + p.value, 0))]])
    : '<p>尚未取得財產資料，等待資料來源機關回傳。</p>';
  const movable = propertyAvailable && !authorized.movable.length ? '<p>已授權查調者無動產明細。</p>' : propertyAvailable
    ? table(['姓名', '利息（存款本金）', '優惠利率', '中獎所得', '其他所得', '小計'], authorized.movable.map(p => [p.name, money(p.interest), p.preferred ? '是' : '否', money(p.prize), money(p.other), money(p.subtotal)]), '家庭成員動產明細', [['動產總額', money(authorized.movable.reduce((sum, p) => sum + p.subtotal, 0))]])
    : '<p>尚未取得財產資料，等待資料來源機關回傳。</p>';

  body.innerHTML = section('caseOverview', '案件資料', overview)
    + section('enquirySummary', '查調結果', summary)
    + section('familyInfo', '家庭成員／共居者（戶政司）', family)
    + section('welfareInfo', '社福資格（衛福部）', welfare)
    + section('incomeInfo', '所得（財政部）', income)
    + section('propertyInfo', '不動產（地政司）', realEstate)
    + section('movableInfo', '動產（財政部）', movable)
    + '<div class="item"><div class="btn-cta-group pb-4"><a class="btn btn-pill-outline-primary" href="enquiry-hub.html">返回列表</a></div></div>';
  document.title = `${record.caseId}｜查調案件詳細資料｜全國社會住宅資料整合暨共同查調管理平臺`;
})();
