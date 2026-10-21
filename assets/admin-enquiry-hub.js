/* 分戶結果頁示範資料與呈現；不變更原查調工作台的資料。 */
(() => {
  'use strict';
  const M = window.EnquiryModel;
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/^\u2014$/, '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[c]);
  const number = value => Number(value || 0).toLocaleString('zh-TW');
  const qualificationText = value => String(value).replace(/^\s*(\d+)\.\s*/, (prefix, digits) => {
    const index = Number(digits);
    return index >= 1 && index <= 20 ? `${String.fromCodePoint(0x2460 + index - 1)} ` : prefix;
  });
  const applicantId = 'B134567890';
  const sampleCaseNumber = 'TA-116-000123-B';
  // 案件原始名單獨立保存，不以戶籍補入或查調回傳名單推定。
  const sampleCaseMemberIds = ['E123456789', applicantId, 'B234567890', 'A287654329', 'B123456789'];
  const members = [
    { id: 'E123456789', name: '張大富', title: '戶長', birth: '1951/09/10', father: '張勇', mother: '張鄭平', income: 0, identity: '5.65歲以上老人\n7.身心障礙', notes: '經法院裁定受輔助宣告，選定張忠政為張大富之輔助人。' },
    { id: applicantId, name: '張忠政', title: '長子', birth: '1980/02/05', father: '張大富', mother: '張陳梅', income: 700000, identity: '9.平地原住民 阿美族', role: '申請人' },
    { id: 'B234567890', name: '張曉雯', title: '孫', birth: '2012/12/23', father: '張忠政', mother: '劉欣慧', income: 0, identity: '' },
    { id: 'N123456789', name: '陳OO', title: '寄居', birth: '2013/11/12', father: '陳OO', mother: '莊OO', income: 0, identity: '' },
    { id: 'N222567828', name: '廖OO', title: '寄居', birth: '2018/04/06', father: '廖OO', mother: '賴OO', income: 0, identity: '' },
    { id: 'A287654329', name: '劉欣慧', title: '戶長', birth: '1989/05/07', father: '劉OO', mother: '林OO', income: 600000, identity: '', role: '配偶', fetus: 1 },
    { id: 'B123456789', name: '張曉晨', title: '兒子', birth: '2014/12/23', father: '張忠政', mother: '劉欣慧', income: 0, identity: '' }
  ];
  members.forEach(person => { M.knownPeople[person.id] = { ...person }; });
  const referenceHouseholds = [
    { number: 'B2567895', label: '申請人戶', address: '新北市OO區OO路100號5樓', members: members.slice(0, 5) },
    { number: 'B2011378', label: '配偶戶', address: '新北市OO區OO街8巷11-1號', members: members.slice(5) }
  ];
  const sampleTargets = () => members.filter(p => p.id !== applicantId && p.title !== '寄居').map(p => ({
    id: p.id, name: p.name, relation: p.role === '配偶' ? '配偶' : p.title,
    fetus: M.fetusNumber(p.fetus), source: '戶籍查得', household: referenceHouseholds[0].members.includes(p), cohabiting: false
  }));
  // 同步更新本頁既有暫存的示範案件，避免舊的 0 人與公同共有值覆蓋畫面。
  function updateSampleDetails(record) {
    if (record.caseNumber !== sampleCaseNumber || record.applicantId !== applicantId) return record;
    for (const person of [...record.targets, ...(record.result?.people || [])]) {
      if (typeof person.identity === 'string') person.identity = person.identity.split('\n')
        .filter(text => text !== '3.育有未成年子女(2人)')
        .map(text => text.replace('7.身心障礙(輕度)', '7.身心障礙')).join('\n');
      if (person.id === 'A287654329') person.fetus = 1;
      if (person.id === 'E123456789') person.notes = members[0].notes;
    }
    for (const property of record.result?.realEstate || []) {
      if (property.owner === '張忠政') property.common = true;
    }
    record.populationTotal = M.population(record);
    if (record.status === '查調完成') record.status = '查調中';
    return record;
  }
  const originalMigrate = M.migrate;
  M.migrate = record => updateSampleDetails(originalMigrate(record));
  const primaryDemo = () => updateSampleDetails({ ...M.submit({
    ...M.newDraft(), caseNumber: sampleCaseNumber, applicantId, targetType: 'family',
    targets: sampleTargets(), relationshipApplicant: applicantId, marriage: 'married'
  }, null, '2026/10/08 21:34'), recordId: 'hub-demo-123', caseMemberIds: [...sampleCaseMemberIds] });
  M.defaults = () => {
    const examples = [
      ['124', '王怡君', 'A123456789', '查調資料申請中'],
      ['125', '林志明', 'A123456780', '待查調'],
      ['126', '陳怡安', 'A123456781', '查調中'],
      ['127', '李雅雯', 'A123456782', '已完成']
    ].map(([suffix, name, id, status]) => {
      M.knownPeople[id] = { name, birth: '1985/06/15', income: 480000, identity: '' };
      const record = M.submit({ ...M.newDraft(), caseNumber: `TA-116-000${suffix}-B`, applicantId: id,
        targetType: 'family', relationshipApplicant: id, marriage: 'single' }, null, '2026/10/08 20:30');
      if (status === '查調資料申請中') {
        record.result.received.property = false;
        record.result.received.documents = false;
        record.result.realEstate = [];
        record.result.movable = [];
        record.result.documents = [];
      }
      return { ...record, recordId: `hub-demo-${suffix}`, applicantName: name, status,
        caseMemberIds: [id], result: record.result };
    });
    return [primaryDemo(), ...examples];
  };
  const originalLookup = M.lookupRelationships;
  M.lookupRelationships = draft => {
    if (M.normalizeId(draft.applicantId) !== applicantId) return originalLookup(draft);
    const next = M.clone(draft);
    const manualSpouse = next.targets.some(p => p.relation === '配偶' && p.source === '自行新增');
    sampleTargets().forEach(person => {
      if ((person.relation === '配偶' && manualSpouse) || next.excludedIds.includes(person.id) || next.targets.some(p => M.normalizeId(p.id) === person.id)) return;
      next.targets.push(person);
    });
    next.relationshipApplicant = applicantId;
    next.marriage = 'married';
    next.cohabitantConfirmed = false;
    return next;
  };

  const detail = (label, value, wide = false) => `<div class="hub-detail${wide ? ' hub-detail-wide' : ''}"><dt>${esc(label)}</dt><dd>${esc(value || '')}</dd></div>`;
  function householdTable(household, caseMemberIds, result, index) {
    const headers = ['', '稱謂', '姓名', '身分證字號', '生日', '父/養父', '母/養母', '胎兒數', '近一年所得', '弱勢戶資格', '個人詳細記事'];
    return `<section class="hub-household" aria-labelledby="hubHousehold${index}">
      <div class="hub-household-head"><div><h4 id="hubHousehold${index}">戶號 ${esc(household.number)}</h4><p><span>戶籍地址</span>${esc(household.address)}</p></div><span class="hub-count">${household.members.length} 人</span></div>
      <div class="result-table-wrap hub-table-scroll" role="region" aria-label="戶號 ${esc(household.number)} 成員資料" tabindex="0">
        <table class="result-table hub-household-table"><caption class="hub-sr-only">戶號 ${esc(household.number)} 家庭成員與財稅資料</caption><colgroup>${headers.map(() => '<col>').join('')}</colgroup><thead><tr>${headers.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>
        ${household.members.map(member => {
          const returned = result.people.find(p => p.id === member.id);
          const person = { ...member, ...returned };
          const cells = [
            member.role ? `<span class="hub-role">${esc(member.role)}</span>` : '', esc(member.title || person.relation || ''),
            `<span class="hub-person-cell"><span class="hub-member-name"><strong>${esc(person.name)}</strong>${caseMemberIds.has(M.normalizeId(person.id)) ? '<span class="hub-case-member-tag" role="img" aria-label="案件既有成員" title="案件既有成員">●</span>' : ''}</span></span>`, esc(person.id), esc(person.birth || ''),
            esc(member.father || ''), esc(member.mother || ''),
            M.fetusNumber(person.fetus) ? `<span class="hub-fetus-count">${number(person.fetus)}</span>` : '',
            `<span>${number(person.income)}<span class="hub-unit"> 元</span></span>`,
            person.identity ? `<ul class="hub-qualifications">${person.identity.split('\n').map(text => `<li>${esc(qualificationText(text))}</li>`).join('')}</ul>` : '<span class="hub-muted"></span>',
            `<span class="hub-note">${esc(person.notes || '')}</span>`
          ];
          return `<tr class="${member.role ? 'hub-key-member' : ''}">${cells.map((cell, i) => `<td data-label="${headers[i]}"${i === 8 ? ' class="hub-income"' : ''}>${cell}</td>`).join('')}</tr>`;
        }).join('')}</tbody></table>
      </div>
    </section>`;
  }
  function renderPeople(record) {
    const result = record.result;
    const body = $('householdResultBody');
    const available = Boolean(result?.received.applicant);
    body.hidden = !available;
    $('householdResultWaiting').hidden = available;
    if (!available) { body.innerHTML = ''; return; }
    const sample = record.applicantId === applicantId;
    const person = result.applicant;
    const spouse = result.people.find(p => p.relation === '配偶');
    const application = [
      detail('統一案件編號', record.caseNumber), detail('申請時間', sample ? '2026-10-08 21:34:55' : ''),
      detail('申請社宅', sample ? '世大運選手村D區' : ''), detail('社宅縣市', sample ? '新北市' : ''),
      detail('社宅權責機關', sample ? '國家住都中心' : '')
    ].join('');
    const applicant = [
      detail('申請人姓名', person.name), detail('生日', person.birth),
      detail('婚姻狀況', result.marriage === 'married' ? '有配偶' : result.marriage === 'single' ? '無配偶' : '尚未取得'),
      detail('配偶', spouse?.name || ''),
      detail('遷入日期', sample ? '2012/04/23' : ''),
      detail('戶籍地址', sample ? '新北市OO區OO路100號5樓' : '', true)
    ].join('');
    const originalMemberIds = Array.isArray(record.caseMemberIds) ? record.caseMemberIds
      : sample && record.caseNumber === sampleCaseNumber ? sampleCaseMemberIds : [];
    const caseMemberIds = new Set(originalMemberIds.map(M.normalizeId).filter(Boolean));
    const uniqueCaseMembers = new Map(result.people
      .filter(member => caseMemberIds.has(M.normalizeId(member.id)))
      .map(member => [M.normalizeId(member.id), member]));
    // 胎兒歸屬個別成員，入住人口只加總案件既有成員名下的胎兒。
    const fetusCount = [...uniqueCaseMembers.values()].reduce((sum, member) => sum + M.fetusNumber(member.fetus), 0);
    const occupancyCount = caseMemberIds.size + fetusCount;
    const incomeComplete = caseMemberIds.size > 0 && uniqueCaseMembers.size === caseMemberIds.size
      && [...uniqueCaseMembers.values()].every(member => member.income != null
        && String(member.income).trim() !== '' && Number.isFinite(Number(member.income)));
    const annualIncome = incomeComplete
      ? [...uniqueCaseMembers.values()].reduce((sum, member) => sum + Number(member.income), 0) : null;
    const monthlyAverage = annualIncome != null && occupancyCount > 0 ? annualIncome / occupancyCount : null;
    const households = sample ? referenceHouseholds.map(h => ({ ...h, members: h.members.map(p => ({ ...p })) })) : [
      { label: '案件成員', number: '', address: '', members: result.people.map(p => ({ ...p, role: p.id === person.id ? '申請人' : p.relation === '配偶' ? '配偶' : '', title: p.relation })) }
    ];
    const knownIds = new Set(households.flatMap(h => h.members.map(p => p.id)));
    const additional = result.people.filter(p => !knownIds.has(p.id));
    if (additional.length) households.push({ label: '其他案件成員', number: '', address: '', members: additional });
    const householdCount = households.reduce((sum, h) => sum + h.members.length, 0);
    body.innerHTML = `<div class="hub-summary-block"><dl class="hub-case-grid" aria-label="申請資料">${application}</dl></div>
      <div class="hub-summary-block"><h3>1.申請人資料</h3><dl class="hub-applicant-grid">${applicant}</dl></div>
      <div class="hub-family-heading"><div><h3>2.家庭成員/共居者</h3></div>${result.received.family ? `<span class="hub-count">${households.length} 組・${householdCount} 人</span>` : ''}</div>
      ${result.received.family ? `<div class="result-summary hub-population-summary" aria-label="人數計算">
        <span><span class="hub-case-member-tag" aria-hidden="true">●</span> 案件既有成員 <strong id="caseMemberCount">${number(caseMemberIds.size)}</strong> 人</span>
        <span>+ 胎兒數 <strong id="fetusCount">${number(fetusCount)}</strong> 人</span>
        <span>= <span class="hub-occupancy-total">人數 <strong id="occupancyCount">${number(occupancyCount)}</strong> 人</span></span>
      </div>` : ''}
      ${result.received.family ? `${households.map((h, i) => householdTable(h, caseMemberIds, result, i)).join('')}
        <div class="hub-income-summaries">
          <div class="result-summary hub-financial-summary"><span>總所得（年）</span><span><strong id="familyIncome">${annualIncome == null ? '待資料齊全' : number(annualIncome)}</strong>${annualIncome == null ? '' : '元'}</span></div>
          <div class="result-summary hub-financial-summary" title="總所得（年）÷ 人數（含胎兒）；四捨五入至整數"><span>每人每月平均所得</span><span><strong id="monthlyAverage">${monthlyAverage == null ? '待資料齊全' : number(Math.round(monthlyAverage))}</strong>${monthlyAverage == null ? '' : '元'}</span></div>
        </div>` : '<p class="section-waiting">家庭成員資料等待資料來源機關回傳。</p>'}`;
  }
  function statusMeta(record) {
    // 舊模型的「查調完成」只代表資料取得，不能視為人員已確認。
    const label = record.status === '查調完成' ? '待查調' : record.status === '待確認名單' ? '查調資料申請中' : record.status;
    const styles = {
      '查調資料申請中': ['is-requesting', 'hourglass_top', '尚有部分查調資料在等待資料來源機關回傳'],
      '待查調': ['is-queued', 'inventory', '全部查調資料皆已回傳'],
      '查調中': ['is-running', 'visibility', '人員正在查看查調結果'],
      '已完成': ['is-complete', 'check_circle', '人員已作確認']
    };
    const [className, icon, description] = styles[label] || ['is-failed', 'error', '請查看案件最新狀態'];
    return { label, className, icon, description };
  }
  function canView(record) {
    return ['待查調', '查調中', '已完成'].includes(statusMeta(record).label);
  }
  function canComplete(record) {
    return ['待查調', '查調中'].includes(statusMeta(record).label)
      && ['applicant', 'family', 'property', 'documents'].every(key => record.result?.received[key]);
  }
  function renderStatus(record) {
    const { label, icon, description } = statusMeta(record);
    $('resultPending').hidden = false;
    $('resultPendingTitle').textContent = label;
    $('resultPendingMessage').textContent = description;
    $('hubStatusIcon').textContent = icon;
    $('completeCase').disabled = !canComplete(record);
    $('completeCase').title = label === '已完成' ? '此案件已由人員確認' : canComplete(record) ? '確認查調結果並標記為已完成' : '全部查調資料回傳後才能確認完成';
    if (!record.result?.received.applicant) $('householdResultWaiting').textContent = '尚未取得申請人資料，等待資料來源機關回傳。';
    if (!record.result?.received.property) {
      const waiting = $('propertyResultTitle').closest('.result-section').querySelector('.section-waiting');
      if (waiting) waiting.textContent = '尚未取得財產資料，等待資料來源機關回傳。';
    }
  }
  function initReadOnly({ readRecords, writeRecords, renderResults }) {
    // 瀏覽時補入示範案件；僅在人員確認完成時儲存。
    const demos = M.defaults();
    let selectedId = '';
    let visible = [];
    const renderList = () => {
      $('hubCaseList').innerHTML = visible.map(record => {
        const status = statusMeta(record);
        return `<button type="button" class="hub-case-item${record.recordId === selectedId ? ' is-selected' : ''}" data-case-id="${esc(record.recordId)}" aria-pressed="${record.recordId === selectedId}"${canView(record) ? '' : ' disabled title="資料尚未全數回傳，暫不可查看查調結果"'}>
          <strong>${esc(record.caseNumber)}</strong>
          <span class="hub-case-item-meta"><span>${esc(record.result?.applicant?.name || record.applicantName || M.knownPeople[record.applicantId]?.name || '申請人資料待回傳')}</span><span class="hub-case-status ${status.className}" title="${esc(status.description)}">${esc(status.label)}</span></span>
        </button>`;
      }).join('');
    };
    const loadRecords = () => {
      const saved = readRecords();
      const records = Array.isArray(saved) ? saved.map(M.migrate) : [];
      for (const demo of demos) if (!records.some(record => M.caseKey(record.caseNumber) === M.caseKey(demo.caseNumber))) records.push(demo);
      return records;
    };
    const search = () => {
      const records = loadRecords();
      const keyword = $('hubSearchInput').value.trim().toLocaleLowerCase();
      const filter = $('hubStatusFilter').value;
      visible = records.filter(record => (!keyword || String(record.caseNumber).toLocaleLowerCase().includes(keyword))
        && (filter === 'all' || statusMeta(record).label === filter));
      const available = visible.filter(canView);
      const selected = available.find(record => record.recordId === selectedId) || available[0];
      selectedId = selected?.recordId || '';
      $('hubSearchStatus').textContent = visible.length ? '' : '查無符合案件，請調整編號或狀態。';
      renderList();
      renderResults(selected);
      $('hubResultEmpty').hidden = Boolean(selected);
      $('hubResultEmpty').textContent = visible.length ? '目前符合條件的案件尚未開放查看，請待資料全數回傳。' : '查無符合案件，請調整編號或狀態。';
    };
    $('hubSearchForm').addEventListener('submit', event => { event.preventDefault(); search(); });
    $('hubStatusFilter').addEventListener('change', search);
    $('hubSearchClear').addEventListener('click', () => {
      $('hubSearchInput').value = '';
      $('hubStatusFilter').value = 'all';
      search();
      $('hubSearchInput').focus();
    });
    $('hubCaseList').addEventListener('click', event => {
      const button = event.target.closest('[data-case-id]');
      const record = button && visible.find(item => item.recordId === button.dataset.caseId);
      if (!record || !canView(record)) return;
      selectedId = record.recordId;
      // 保留目前按鈕焦點，讓鍵盤可繼續切換案件。
      $('hubCaseList').querySelectorAll('[data-case-id]').forEach(item => {
        const selected = item.dataset.caseId === selectedId;
        item.classList.toggle('is-selected', selected);
        item.setAttribute('aria-pressed', String(selected));
      });
      renderResults(record);
    });
    $('completeCase').addEventListener('click', () => {
      const record = loadRecords().find(item => item.recordId === selectedId);
      if (!record || !canComplete(record)) return;
      if (!window.confirm(`確定已確認案件「${record.caseNumber}」的查調結果，並將狀態改為「已完成」嗎？`)) return;
      const latest = loadRecords();
      const current = latest.find(item => item.recordId === record.recordId);
      if (!current || !canComplete(current)) { search(); return; }
      const completed = { ...current, status: '已完成', confirmedAt: new Date().toISOString() };
      if (!writeRecords(latest.map(item => item.recordId === current.recordId ? completed : item))) {
        $('storageNotice').hidden = false;
        $('storageNotice').textContent = '完成狀態未能儲存，案件尚未標記為已完成，請重試。';
        return;
      }
      if ($('hubStatusFilter').value !== 'all') $('hubStatusFilter').value = '已完成';
      search();
    });
    search();
  }
  window.EnquiryPage = { readOnly: true, casesKey: 'housingEnquiryHubCasesV1', draftsKey: 'housingEnquiryHubDraftsV1', renderPeople, statusMeta, renderStatus, initReadOnly };
})();
