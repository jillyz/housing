/* 戶役政 CP03 P301 專頁：以戶籍回傳資料呈現申請人、配偶及同戶三等親／共居者。 */
(() => {
  const records = window.EnquiryCases || [];
  const params = new URLSearchParams(location.search);
  const caseId = params.get('case');
  const record = caseId ? records.find(item => item.caseId === caseId) : records[0];
  const body = document.getElementById('detailBody');

  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const safe = value => value === undefined || value === null || value === '' ? '未提供' : escape(value);
  const list = value => Array.isArray(value) ? value : [];
  const sourceResult = record?.result || {};
  const householdList = list(record?.households);
  const members = [...new Map(householdList.flatMap(h => list(h.members)).map(person => [person.id, person])).values()];
  const resultPeople = list(sourceResult.people);
  resultPeople.forEach(person => { if (!members.some(item => item.id === person.id)) members.push(person); });
  if (record && !members.some(person => person.id === record.idNumber)) members.unshift({ id: record.idNumber, name: record.name, relation: '本人' });
  const applicant = members.find(person => person.id === record?.idNumber) || sourceResult.applicant || { id: record?.idNumber, name: record?.name };
  const spouse = members.find(person => person.relation === '配偶') || resultPeople.find(person => person.relation === '配偶');
  const memberIds = new Set(list(record?.caseMemberIds));
  const applicantHousehold = householdList.find(h => list(h.members).some(person => person.id === applicant.id)) || householdList[0];
  const spouseHousehold = spouse ? householdList.find(h => list(h.members).some(person => person.id === spouse.id)) : null;

  if (!record) {
    const error = document.getElementById('detailError');
    error.hidden = false;
    error.textContent = '查無此案件，請返回查調案件詳細資料。';
    return;
  }

  const status = record.enquiryStatus || record.status || '未提供';
  document.getElementById('detailStatus').textContent = status;
  document.getElementById('detailStatus').setAttribute('data-state', status);
  document.getElementById('detailCompletedAt').textContent = `戶役政資料基準日：${record.referenceDate || '未提供'}｜完成時間：${record.completedAt || '未完成'}`;
  document.title = `${record.caseId}｜戶役政查調資料｜全國社會住宅資料整合暨共同查調管理平臺`;

  const codeMap = { single: '1', married: '2', divorced: '3', widowed: '4' };
  const marriageCode = codeMap[sourceResult.marriage] || '未提供';
  const indigenousCode = person => {
    const text = String(person?.identity || '');
    if (/平埔/.test(text)) return '3｜平埔原住民';
    if (/山地/.test(text)) return '2｜山地原住民';
    if (/平地/.test(text)) return '1｜平地原住民';
    return '0｜非原住民';
  };
  const locationParts = address => {
    const match = String(address || '').match(/^(.*?[市縣])([^路街巷號]*?(?:區|鎮|鄉|市))/);
    return { county: match?.[1] || '未提供', district: match?.[2] || '未提供' };
  };
  const addressInfo = locationParts(applicantHousehold?.address || record.address);
  const formatRole = person => {
    if (person.id === applicant.id) return '申請人';
    if (spouse && person.id === spouse.id) return '配偶';
    if (/寄居/.test(`${person.title || ''}${person.relation || ''}`)) return '共居者（寄居）';
    return '戶籍成員';
  };
  const formatRelationship = person => {
    if (person.id === applicant.id) return '本人';
    if (spouse && person.id === spouse.id) return '配偶';
    return person.relation || person.title || '未提供';
  };
  const isLodger = person => /寄居/.test(`${person.title || ''}${person.relation || ''}`);
  const badge = (text, kind = '') => `<span class="badge rounded-pill ${kind}">${escape(text)}</span>`;
  const table = (headers, rows, caption, className = '') => `<div class="table-responsive"><table class="table table-list table-rwd enquiry-detail-table ${className}"><caption class="visually-hidden">${escape(caption)}</caption><thead><tr>${headers.map(header => `<th scope="col" class="text-wrap">${escape(header)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map((cell, index) => `<td data-th="${escape(headers[index] || '')}">${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const keyValue = items => `<dl class="row g-3 mb-0 enquiry-household-meta p-3">${items.map(([label, value]) => `<div class="col-12 col-md-6 col-xl-4"><dt>${escape(label)}</dt><dd>${safe(value)}</dd></div>`).join('')}</dl>`;
  const section = (id, title, content, collapsible = true) => collapsible
    ? `<section class="item" id="${id}" aria-labelledby="${id}Title"><div class="collapse-wrap position-relative"><h2 class="collapse-title" id="${id}Title"><span class="text">${escape(title)}</span></h2><a href="#${id}Body" class="collapse-btn stretched-link" data-bs-toggle="collapse" role="button" aria-expanded="true" aria-controls="${id}Body" aria-label="展開或收合${escape(title)}"><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></a></div><div class="collapse show" id="${id}Body"><div class="body">${content}</div></div></section>`
    : `<section class="item" id="${id}" aria-labelledby="${id}Title"><div class="head title-border-bottom"><h2 class="title-name" id="${id}Title">${escape(title)}</h2></div><div class="body">${content}</div></section>`;

  const familyReceived = sourceResult.received?.family;
  const response = keyValue([
    ['表號／作業代號', 'CP03／P301'],
    ['資料種類', '申請人及配偶同戶籍上下三親等戶籍資料（客製化）'],
    ['索引條件', `01 統號｜${applicant.id || '未提供'}`],
    ['訊息代碼', familyReceived === true ? '0' : familyReceived === false ? '9' : '未取得'],
    ['訊息', familyReceived === true ? '查調成功' : familyReceived === false ? '戶役政資料尚未完成' : '尚無戶政回傳'],
    ['異常訊息', familyReceived === false ? '等待戶政司回傳' : '—']
  ]);

  const applicantHouseholdTitle = applicantHousehold?.label || '申請人戶';
  const householdSummary = `<div class="row g-3 mb-4">
    <div class="col-12 col-md-4"><div class="enquiry-household-stat"><span>戶號</span><strong>${safe(applicantHousehold?.number)}</strong></div></div>
    <div class="col-12 col-md-4"><div class="enquiry-household-stat"><span>戶籍所在縣市</span><strong>${safe(addressInfo.county)}</strong></div></div>
    <div class="col-12 col-md-4"><div class="enquiry-household-stat"><span>戶籍所在鄉鎮市區</span><strong>${safe(addressInfo.district)}</strong></div></div>
  </div>${keyValue([
    ['戶籍地址', applicantHousehold?.address || record.address],
    ['是否包含寄居者', householdList.length ? (members.some(isLodger) ? '是' : '否') : '未提供'],
    ['回傳成員數', `${members.length} 人`],
    ['查調基準日', record.referenceDate],
    ['資料來源', '戶政司'],
    ['查詢識別碼', applicantHousehold?.inquiryId || '待 API 回傳']
  ])}`;

  const householdRows = members.map(person => {
    const kind = memberIds.has(person.id) ? 'case' : 'cohab';
    const source = isLodger(person) ? '共居者／寄居' : '戶籍成員';
    return `<tr class="household-member-row" data-kind="${kind}" data-search="${escape(`${person.name || ''} ${person.id || ''} ${formatRelationship(person)} ${source}`)}"><td data-th="身分／範圍">${badge(formatRole(person), memberIds.has(person.id) ? 'text-bg-primary' : 'text-bg-light text-dark')}</td><td data-th="姓名">${safe(person.name)}</td><td data-th="戶籍稱謂">${safe(person.title)}</td><td data-th="統號">${safe(person.id)}</td><td data-th="出生日期">${safe(person.birth)}</td><td data-th="與申請人關係">${safe(formatRelationship(person))}</td><td data-th="原住民身分">${escape(indigenousCode(person))}</td><td data-th="資料範圍">${escape(source)}</td></tr>`;
  }).join('');
  const memberTable = `<div class="household-filter-bar p-3 mb-3"><div class="row g-3 align-items-end"><div class="col-12 col-md-4"><label for="householdScope" class="form-label">顯示範圍</label><select class="form-select" id="householdScope"><option value="all">全部戶籍成員</option><option value="case">僅案件成員</option><option value="cohab">共居者／非案件成員</option></select></div><div class="col-12 col-md-5"><label for="householdSearch" class="form-label">快速尋找</label><input type="search" class="form-control" id="householdSearch" placeholder="姓名、統號或關係"></div><div class="col-12 col-md-3"><button type="button" class="btn btn-outline-secondary w-100" id="householdReset">清除篩選</button></div></div><p class="small text-muted mb-0 mt-3">案件成員依本次查調名單判斷；戶籍成員／寄居者僅代表戶政回傳名單，不會自動成為財稅查調對象。</p></div><div class="table-responsive"><table class="table table-list table-rwd enquiry-detail-table" id="householdMemberTable"><caption class="visually-hidden">家庭成員與共居者戶籍資料（戶政司）</caption><thead><tr>${['身分／範圍', '姓名', '戶籍稱謂', '統號', '出生日期', '與申請人關係', '原住民身分', '資料範圍'].map(header => `<th scope="col" class="text-wrap">${header}</th>`).join('')}</tr></thead><tbody>${householdRows || '<tr><td colspan="8" class="text-center py-4">尚無戶籍成員資料。</td></tr>'}</tbody></table></div><p class="small text-muted mt-3 mb-0" id="householdFilterStatus" role="status" aria-live="polite"></p>`;

  const applicantInfo = keyValue([
    ['統號', applicant.id], ['姓名', applicant.name], ['出生日期', applicant.birth], ['遷入日期', record.movedAt],
    ['婚姻狀況代碼', marriageCode], ['配偶統號', spouse?.id], ['配偶姓名', spouse?.name], ['配偶特殊記事', spouse ? (spouse.specialNotes || '現住人口') : '—'],
    ['原住民身分代碼', indigenousCode(applicant)], ['結婚日期', sourceResult.marriageDate || '待來源回傳']
  ]);
  const personalBlock = `<div class="row g-4"><div class="col-12"><h5 class="mb-3">申請人本人資料</h5>${applicantInfo}</div>${spouse ? `<div class="col-12"><h5 class="mb-3">配偶本人資料</h5>${keyValue([['統號', spouse.id], ['姓名', spouse.name], ['出生日期', spouse.birth], ['原住民身分代碼', indigenousCode(spouse)], ['配偶戶號', spouseHousehold?.number], ['配偶戶籍所在縣市', locationParts(spouseHousehold?.address).county]])}</div>` : '<div class="col-12"><p class="mb-0">本次戶政回傳未提供配偶資料。</p></div>'}</div>`;

  const guardian = members.find(person => /監護|輔助/.test(person.notes || ''));
  const guardianBlock = guardian ? table(['監護／輔助類別', '監護／輔助人統號', '監護／輔助人姓名', '來源記事'], [[/受輔助/.test(guardian.notes || '') ? '受輔助宣告' : '受監護宣告', safe(applicant.id), safe(applicant.name), safe(guardian.notes)]], '申請人監護／輔助資料') : '<p class="mb-0">本次回傳未提供監護／輔助資料。</p>';
  const applicantRelations = list(applicantHousehold?.members).filter(person => person.id !== applicant.id && !isLodger(person));
  const spouseRelations = spouse && spouseHousehold ? list(spouseHousehold.members).filter(person => person.id !== spouse.id && !isLodger(person)) : [];
  const relationBlock = `<div class="row g-4"><div class="col-12"><h5 class="mb-3">申請人同戶三等親資料</h5>${table(['統號', '姓名', '與申請人關係', '出生日期', '原住民身分'], applicantRelations.map(person => [safe(person.id), safe(person.name), safe(person.relation || person.title), safe(person.birth), escape(indigenousCode(person))]), '申請人同戶三等親資料')}</div>${spouse ? `<div class="col-12"><h5 class="mb-3">配偶同戶三等親資料</h5>${table(['統號', '姓名', '與配偶關係', '出生日期', '原住民身分'], spouseRelations.map(person => [safe(person.id), safe(person.name), safe(person.relation || person.title), safe(person.birth), escape(indigenousCode(person))]), '配偶同戶三等親資料')}</div>` : ''}</div><p class="small text-muted mt-3 mb-0">【N】欄位表示 0 至多筆；姻親關係名稱依戶政司回傳內容顯示。</p>`;

  const navigation = `<div class="item"><div class="btn-cta-group pb-4"><a class="btn btn-pill-outline-primary" href="enquiry-detail.html?case=${encodeURIComponent(record.caseId)}"><i class="fa-solid fa-arrow-left me-1" aria-hidden="true"></i>返回案件詳細資料</a><a class="btn btn-primary" href="enquiry-hub.html"><i class="fa-solid fa-list me-1" aria-hidden="true"></i>返回查調工作臺</a></div></div>`;
  body.innerHTML = `<div class="alert alert-info" role="status"><i class="fa-solid fa-circle-info me-2" aria-hidden="true"></i>本頁為戶役政查調互動原型，欄位依 CP03／P301 申請人及配偶同戶籍上下三親等資料規劃；畫面中的姓名、統號及地址為示意資料。</div>${section('householdResponse', '戶役政查調回應', response, false)}${section('applicantHousehold', `${applicantHouseholdTitle}摘要`, householdSummary, true)}${section('householdMembers', '家庭成員／共居者（戶政司）', memberTable, true)}${section('personalData', '申請人／配偶本人資料', personalBlock, true)}${section('guardianData', '監護／輔助資料', guardianBlock, true)}${section('relationData', '同戶三等親資料', relationBlock, true)}${navigation}`;

  const scope = document.getElementById('householdScope');
  const search = document.getElementById('householdSearch');
  const rows = [...document.querySelectorAll('.household-member-row')];
  const filterStatus = document.getElementById('householdFilterStatus');
  const applyFilter = () => {
    const selected = scope.value;
    const keyword = search.value.trim().toLowerCase();
    let visible = 0;
    rows.forEach(row => {
      const matchesScope = selected === 'all' || row.dataset.kind === selected;
      const matchesSearch = !keyword || row.dataset.search.toLowerCase().includes(keyword);
      row.classList.toggle('is-hidden', !(matchesScope && matchesSearch));
      if (matchesScope && matchesSearch) visible += 1;
    });
    filterStatus.textContent = `目前顯示 ${visible}／${rows.length} 筆戶籍成員`;
  };
  scope?.addEventListener('change', applyFilter);
  search?.addEventListener('input', applyFilter);
  document.getElementById('householdReset')?.addEventListener('click', () => { scope.value = 'all'; search.value = ''; applyFilter(); });
  applyFilter();
})();
