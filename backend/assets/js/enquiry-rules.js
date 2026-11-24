/* 兩階段查調展示；不發送查調請求、不修改正式案件。 */
(() => {
  'use strict';
  const model = window.EnquiryRuleDemo;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const emptyText = value => `<span class="rules-empty">${escape(value)}</span>`;
  const personalValue = value => !value || ['未登載', '未提供', '無資料'].includes(value) ? emptyText(value || '無資料') : escape(value);
  const headerText = value => value === '（稱謂）與戶長關係' ? '（稱謂）<br>與戶長關係' : escape(value);
  const amount = value => new Intl.NumberFormat('zh-TW').format(value);
  const badge = (text, state = '') => `<span class="rules-status ${state}">${escape(text)}</span>`;
  const relationCell = value => value === '未填列' ? '<span class="rules-unfilled">未填列</span>' : escape(value);
  const propertyBoolean = value => typeof value !== 'boolean' ? emptyText('未提供') : `<span class="rules-property-boolean ${value ? 'text-success' : 'rules-property-no'}" role="img" aria-label="${value ? '是' : '否'}" title="${value ? '是' : '否'}"><i class="fa-solid ${value ? 'fa-circle-check' : 'fa-circle-xmark'}" aria-hidden="true"></i></span>`;
  const table = (headers, rows, caption, className = '', rowClass = () => '') => `<table class="table table-list table-rwd rules-table ${className}"><caption class="visually-hidden">${escape(caption)}</caption><thead><tr>${headers.map(h => `<th scope="col">${headerText(h)}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.map((row, rowIndex) => `<tr${rowClass(rowIndex) ? ` class="${escape(rowClass(rowIndex))}"` : ''}>${row.map((cell, index) => `<td data-th="${escape(headers[index])}">${cell}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${headers.length}" class="text-center py-4 rules-empty">無資料</td></tr>`}</tbody></table>`;
  const section = (id, title, body) => `<section class="item" id="${id}" aria-labelledby="${id}Title"><div class="collapse-wrap position-relative"><h2 class="collapse-title" id="${id}Title"><span class="text">${escape(title)}</span></h2><a href="#${id}Body" class="collapse-btn stretched-link" data-bs-toggle="collapse" role="button" aria-expanded="true" aria-controls="${id}Body" aria-label="展開或收合${escape(title)}"><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></a></div><div class="collapse show" id="${id}Body"><div class="body">${body}</div></div></section>`;
  const fields = items => `<dl class="rules-meta">${items.map(([name, value]) => `<div><dt>${escape(name)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>`;
  const steps = complete => `<ol class="rules-steps" aria-label="查調流程"><li class="rules-step ${complete ? 'done' : 'current'}" ${complete ? '' : 'aria-current="step"'}><span class="rules-step-number">1</span><div><strong>確認案件成員</strong><small>${complete ? '成員及申請人配偶已核對齊全' : '比對全戶戶籍與申請人配偶'}</small></div></li><li class="rules-step ${complete ? 'current' : ''}" ${complete ? 'aria-current="step"' : ''}><span class="rules-step-number">2</span><div><strong>完整資料查調</strong><small>${complete ? '個人資料、社福、所得及財產已回傳' : '待成員齊全後才可查調'}</small></div></li></ol>`;
  const hint = (label, icon, className = '') => `<button type="button" class="rules-tip ${className}" data-rule-tip title="${escape(label)}" aria-label="${escape(label)}"><i class="fa-solid ${icon}" aria-hidden="true"></i></button>`;
  function activateTips() {
    document.querySelectorAll('[data-rule-tip]').forEach(element => window.bootstrap?.Tooltip.getOrCreateInstance(element, { container: 'body', trigger: 'hover focus', placement: 'top' }));
  }
  function disposeTips() {
    document.querySelectorAll('[data-rule-tip]').forEach(element => window.bootstrap?.Tooltip.getInstance(element)?.dispose());
  }
  function resultIcon(check, state, label) {
    if (state === '待補齊成員') return hint(`${label}：等待成員補齊後查調`, 'fa-hourglass-half', 'rules-verdict rules-verdict--waiting');
    if (state === '查調中') return '';
    const text = `${amount(check.value)} 元，${check.pass ? '未超標' : '超標'}`;
    return hint(`${label}：${text}`, check.pass ? 'fa-circle-check' : 'fa-circle-exclamation', `rules-verdict rules-verdict--${check.pass ? 'pass' : 'fail'}`);
  }
  const rentTier = check => check?.value ? `<span class="rules-tier">第${check.value}級</span>` : '';
  function comparison(record, declared) {
    const checks = model.assessment(record, declared);
    const complete = Boolean(checks);
    const state = model.status(record, declared);
    const headers = ['項目', ...model.columns.map(c => c.label)];
    const rows = [
      ['本案', ...model.columns.map((column, i) => column.key === 'rentTier' ? rentTier(checks?.[i]) : !complete ? '<span class="rules-muted rules-empty">尚未查調</span>' : `${amount(checks[i].value)} 元`)],
      ['標準值', ...model.columns.map(column => column.key === 'rentTier' ? '<details class="rules-notes"><summary>查看級距</summary><ul class="ps-3 mt-2 mb-0"><li>第 1 級：低收入戶或中低收入戶</li><li>第 2 級：每人每月平均所得 0～26,624 元</li><li>第 3 級：每人每月平均所得 26,625～62,125 元</li></ul></details>' : `${column.inclusive ? '≤' : '&lt;'} ${amount(column.limit)} 元`)],
      ['資格初判', ...model.columns.map((column, i) => column.key === 'rentTier' ? rentTier(checks?.[i]) : `${resultIcon(checks?.[i], state, column.label)}<span class="rules-verdict-label">${!complete ? '等待補齊' : checks[i].pass ? '未超標' : '超標'}</span>`)]
    ];
    return table(headers, rows, '本案查調結果、標準值與資格初判', 'rules-comparison');
  }
  function listTable(records) {
    const labels = ['統一案件編號', '申請人', '申請社宅', '權責機關', '查調狀態', ...model.columns.map(c => c.label), '操作'];
    const headings = labels.slice(0, 5).map(label => `<th rowspan="2" scope="col">${label}</th>`).join('') + '<th colspan="5" scope="colgroup">資格初判</th><th rowspan="2" scope="col">操作</th>';
    return `<table class="table table-list table-rwd rules-table rules-list-table"><caption class="visually-hidden">查調案件與五項資格初判</caption><colgroup>${labels.map((_, i) => `<col class="rules-list-col-${i}">`).join('')}</colgroup><thead><tr>${headings}</tr><tr>${model.columns.map(column => `<th scope="col">${column.label}</th>`).join('')}</tr></thead><tbody>${records.map(record => {
      const state = model.status(record);
      const checks = model.assessment(record);
      const cellState = state === '查調中' ? 'loading' : state === '待補齊成員' ? 'waiting' : '';
      const action = model.canView(record) ? `<a class="btn btn-sm btn-outline-primary" href="enquiry-detail.html?case=${encodeURIComponent(record.id)}" aria-label="查看案件 ${escape(record.id)} 詳細資料">查看詳細</a>` : '';
      const cells = [`<span class="rules-case-id">${escape(record.id)}${hint(`${record.scenario}：${record.description}`, 'fa-circle-info', 'rules-info')}</span>`, escape(model.people(record).find(p => p.key === record.applicant).name), escape(record.housing), escape(record.agency), badge(state, state === '查調中' ? 'loading' : state === '待補齊成員' ? 'pending' : ''), ...model.columns.map((column, i) => cellState ? '' : column.key === 'rentTier' ? rentTier(checks?.[i]) : resultIcon(checks?.[i], state, column.label)), action];
      return `<tr data-case-id="${escape(record.id)}">${cells.map((cell, i) => `<td data-th="${labels[i]}"${i >= 5 && i <= 9 ? ` class="rules-result-cell${cellState ? ' rules-result-cell--' + cellState : ''}"${cellState ? ` aria-label="${labels[i]}：${state}"` : ''}` : ''}>${cell}</td>`).join('')}</tr>`;
    }).join('')}</tbody></table>`;
  }

  function initList() {
    const form = document.getElementById('enquiryFilter');
    const keyword = document.getElementById('enquiryKeyword');
    const agency = document.getElementById('enquiryAgency');
    const stage = document.getElementById('enquiryStage');
    const summary = document.getElementById('enquirySummary');
    const exportButton = document.getElementById('enquiryExport');
    const exportStatus = document.getElementById('enquiryExportStatus');
    let exportRecords = [];
    let exporting = false;
    const params = new URLSearchParams(location.search);
    keyword.value = params.get('q') || '';
    agency.value = params.get('agency') || '';
    stage.value = params.get('stage') || '';
    function render() {
      const query = keyword.value.trim().toLocaleLowerCase('zh-TW');
      const spouseMissing = record => record.marriage === '有偶' && !model.spouseCheck(record)?.member;
      const records = [...model.cases].sort((a, b) => Number(spouseMissing(b)) - Number(spouseMissing(a))).filter(record => {
        const applicant = model.people(record).find(p => p.key === record.applicant);
        return (!query || [record.id, applicant.name, record.scenario, record.description].some(v => v.toLocaleLowerCase('zh-TW').includes(query)))
          && (!agency.value || record.agency === agency.value)
          && (!stage.value || ({ '查調完成': 'complete', '待補齊成員': 'members', '查調中': 'querying' })[model.status(record)] === stage.value);
      });
      const pending = model.cases.filter(c => model.status(c) === '待補齊成員').length;
      exportRecords = records;
      exportButton.disabled = exporting || records.length === 0;
      exportStatus.textContent = '';
      const querying = model.cases.filter(c => model.status(c) === '查調中').length;
      summary.textContent = `共 ${records.length} 筆查調案件（全部 ${model.cases.length} 筆：${pending} 筆待補齊、${querying} 筆查調中、${model.cases.length - pending - querying} 筆查調完成）`;
      disposeTips();
      document.getElementById('enquiryCaseList').innerHTML = listTable(records);
      if (!records.length) document.getElementById('enquiryCaseList').innerHTML = '<p class="text-center py-5 rules-empty" role="status">查無符合條件的案件，請調整查詢條件或重設。</p>';
      activateTips();
    }
    form.addEventListener('submit', event => {
      event.preventDefault();
      const next = new URLSearchParams();
      if (keyword.value.trim()) next.set('q', keyword.value.trim());
      if (agency.value) next.set('agency', agency.value);
      if (stage.value) next.set('stage', stage.value);
      history.replaceState(null, '', `${location.pathname}${next.size ? '?' + next : ''}`);
      render();
    });
    form.addEventListener('reset', event => {
      event.preventDefault();
      keyword.value = agency.value = stage.value = '';
      history.replaceState(null, '', location.pathname);
      render();
    });
    exportButton.addEventListener('click', async () => {
      if (exporting || !exportRecords.length) return;
      exporting = true;
      exportButton.disabled = true;
      exportStatus.textContent = '正在匯出 Excel…';
      const records = [...exportRecords];
      try {
        await window.EnquiryRuleExport.download(records);
        exportStatus.textContent = `已匯出 ${records.length} 筆案件。`;
      } catch (error) {
        exportStatus.textContent = `匯出失敗：${error.message || '請稍後再試。'}`;
      } finally {
        exporting = false;
        exportButton.disabled = exportRecords.length === 0;
      }
    });
    render();
  }

  function initDetail() {
    const params = new URLSearchParams(location.search);
    const record = model.cases.find(c => c.id === (params.get('case') || model.cases[0].id));
    const root = document.getElementById('detailBody');
    if (!record) {
      document.getElementById('detailStatus').textContent = '查無案件';
      root.innerHTML = '<div class="rules-warning" role="alert">查無此案件情境，請返回列表選擇案件。</div>';
      return;
    }
    if (!model.canView(record)) {
      document.getElementById('detailStatus').innerHTML = badge('查調中', 'loading');
      root.innerHTML = '<div class="rules-scope" role="status"><strong>查調中，暫不開放明細</strong><p class="mt-2 mb-0">案件資料仍在回傳中，請待查調完成後再檢視。</p></div><a href="enquiry-hub.html" class="btn btn-outline-primary align-self-start">返回案件列表</a>';
      return;
    }
    const historyState = window.EnquiryRuleHistory.select(record, params);
    window.EnquiryRuleHistory.init(record, historyState);
    if (!historyState.selected) {
      document.getElementById('detailStatus').textContent = '批次無法檢視';
      root.innerHTML = '<p class="rules-warning" role="alert">此批次不存在或已超過保存期限，請返回目前採用版本。</p>';
      return;
    }
    const declared = [...historyState.selected.declared];
    const population = model.population(record, declared);
    const supplemented = !model.ready(record) && model.ready(record, declared);
    const complete = model.ready(record, declared);
    const missing = model.missing(record, declared);
    const applicant = model.people(record).find(p => p.key === record.applicant);
    const spouse = model.spouseCheck(record, declared);
    const otherMembers = model.otherCaseMembers(record, declared);
    const status = document.getElementById('detailStatus');
    status.innerHTML = complete ? badge('查調完成') : badge('待補齊成員', 'pending');
    document.title = `${record.id}｜${record.scenario}｜查調案件詳細資料`;
    const notices = complete
      ? '<div class="rules-success" role="status"><strong>案件成員齊全，查調完成。</strong></div>'
      : `<div class="rules-warning" role="status"><h2>尚有 ${missing.length} 位成員待補齊</h2><ul>${missing.map(p => `<li>${escape(p.name)}${p.key === record.spouse ? '（申請人配偶）' : '（家庭成員）'}</li>`).join('')}</ul></div>`;
    const overview = fields([['統一案件編號', record.id], ['申請人', applicant.name], ['權責機關', record.agency], ['申請社宅', record.housing], ['申請時間', '2026/11/18 09:30'], ['查調基準日', '2026/11/18'], ['查調狀態', complete ? '查調完成' : '待補齊成員']])
      + `<h3 class="rules-members-heading">案件成員</h3><p class="rules-population">人數：成員數 ${population.memberCount} 人 ＋ 胎兒數 ${population.fetusCount} 人 ＝ <strong>共 ${population.total} 人</strong></p>`
      + table(['姓名', '與申請人關係', '身分證字號', '是否同意授權查調'], model.people(record).filter(p => declared.includes(p.key)).map(p => [escape(p.name) + (p.fetus ? `<small class="rules-muted d-block">胎兒 ${p.fetus} 人</small>` : ''), relationCell(model.relationship(record, p.key, declared)), escape(p.idNumber), (record.authorizations.find(a => a.key === p.key)?.consent === true || supplemented && !record.declared.includes(p.key)) ? '<span class="text-success"><i class="fa-solid fa-circle-check me-2" aria-hidden="true"></i>是</span>' : '否']), '案件成員與申請人關係及授權查調狀態');
    const family = `<div class="rules-scope mb-4">申請人婚姻狀況：<strong>${escape(record.marriage)}</strong>${spouse ? `　｜　申請人配偶姓名：<strong>${escape(spouse.name)}</strong>（${spouse.separate ? '分戶' : '同戶'}）　｜　${spouse.member ? '配偶已填列' : relationCell('未填列')}` : ''}</div>`
      + model.householdView(record, declared).map(h => `<div class="rules-household"><h3>${escape(h.label)}</h3>${personalTable(h.members)}</div>`).join('')
      + (otherMembers.length ? `<div class="rules-household" id="otherCaseMembers"><h3>其他案件成員（不在申請人戶及配偶戶）</h3>${personalTable(otherMembers)}</div>` : '');
    const summary = section('enquirySummary', '查調結果', comparison(record, declared));
    let html = `${steps(complete)}${notices}${section('caseInfo', '案件資料', overview)}${summary}${section('familyInfo', '家庭成員／共居者（戶政司）', family)}`;
    if (complete) {
      const members = model.people(record).filter(p => model.requiredKeys(record).includes(p.key));
      const totals = model.totals(record);
      const serviceLinks = [['familyInfo', '個人資料'], ['welfareInfo', '社福資格'], ['incomeInfo', '所得'], ['propertyInfo', '不動產'], ['movableInfo', '動產']];
      const serviceSummary = `<div class="rules-service-summary mt-4">${serviceLinks.map(([id, name]) => `<a href="#${id}">${name}<small>查調完成</small></a>`).join('')}</div>`;
      html = `${steps(complete)}${notices}${section('caseInfo', '案件資料', overview)}${section('enquirySummary', '查調結果', comparison(record, declared) + serviceSummary)}${section('familyInfo', '家庭成員／共居者（戶政司）', family)}`;
      html += section('welfareInfo', '社福資格（衛福部）', table(['姓名', '社福資格', '查調結果'], members.map(p => [escape(p.name), p.welfare.length ? `<ul class="mb-0 ps-3">${p.welfare.map(w => `<li>${escape(w)}${w === '育有未成年子女' && p.minorChildren?.length ? `<ol class="rules-minor-children">${p.minorChildren.map(name => `<li>${escape(name)}</li>`).join('')}</ol>` : ''}</li>`).join('')}</ul>` : emptyText('無符合之社福資格紀錄'), badge('已回傳')]), '案件成員社福資格'));
      html += section('incomeInfo', '所得（財政部）', `<p class="rules-muted">所得年度：114 年度（2025 年）；成員數 ${population.memberCount} 人 ＋ 胎兒數 ${population.fetusCount} 人，計算人數共 ${population.total} 人。</p>` + table(['姓名', '所得年度', '年所得合計'], members.map(p => [escape(p.name), '114 年度', `${amount(p.income)} 元`]), '案件成員年所得') + `<div class="rules-total">全案年所得合計<strong>${amount(totals.income)} 元</strong><div class="mt-2">每人每月平均所得<strong>${amount(Math.round(totals.income / 12 / population.total))} 元</strong></div><div class="rules-muted mt-2">年所得合計 ÷ 12 個月 ÷ ${population.total} 人（含胎兒 ${population.fetusCount} 人），四捨五入至元。</div></div>`);
      const properties = members.flatMap(p => p.properties.map(a => [escape(p.name), escape(a.type), escape(a.location), propertyBoolean(a.household), escape(a.share), escape(a.area), `${amount(a.value)} 元`, propertyBoolean(a.common), propertyBoolean(['原住民保留地', '道路用地'].includes(a.landUse))]));
      html += section('propertyInfo', '不動產（地政司）', properties.length ? table(['持有者', '類別', '地段地號建號／座落', '戶籍地', '持分比', '房地面積', '房地現值金額', '公同共有', '原住民保留地、道路用地'], properties, '案件成員不動產明細', 'rules-property-table') + `<div class="rules-total">不動產總額<strong>${amount(totals.property)} 元</strong></div>` : '<p class="mb-0 rules-empty">查調完成，全案成員均無不動產紀錄（合計 0 元）。</p>');
      html += section('movableInfo', '動產（財政部）', `<p class="rules-muted">利率：${amount(model.parameters.interestRate * 100)}%　｜　動產限額：${amount(model.parameters.movableLimit)} 元</p>` + table(['姓名', '利息（存款本金）', '中獎所得', '其他所得', '小計'], members.map(p => {
        const value = model.movable(p);
        return [escape(p.name), `${amount(p.interest)} 元`, `${amount(p.prizeIncome)} 元`, `${amount(p.oneTimeIncome)} 元`, `${amount(value.total)} 元${p.securities ? `<small class="rules-muted d-block">含有價證券 ${amount(p.securities)} 元</small>` : ''}`];
      }), '案件成員動產明細') + `<div class="rules-total">全案動產價值合計<strong>${amount(totals.movable)} 元</strong></div>`);
    }
    html += `<div class="rules-toolbar pb-4"><a href="enquiry-hub.html" class="btn btn-outline-primary">返回案件列表</a>${!complete ? '<button type="button" id="simulateComplete" class="btn btn-primary">模擬補齊成員並查調</button>' : supplemented ? `<a href="enquiry-detail.html?case=${encodeURIComponent(record.id)}" class="btn btn-outline-primary">還原成員未齊情境</a>` : ''}</div>`;
    root.innerHTML = html;
    activateTips();
    document.getElementById('simulateComplete')?.addEventListener('click', () => {
      const next = new URL(location.href);
      next.searchParams.set('members', 'complete');
      next.searchParams.delete('batch');
      location.assign(next.href);
    });
  }
  function notesCell(person) {
    const adoption = person.adoptiveFather || person.adoptiveMother ? '<div class="rules-adopted">有養父母：是</div>' : '';
    const assistance = person.notes.some(note => note.type === '輔助宣告') ? '<div class="rules-note-tag">輔助宣告</div>' : '';
    const notes = person.notes.length ? `<details class="rules-notes"><summary>查看 ${person.notes.length} 筆個人記事</summary><ol>${person.notes.map(note => `<li><strong>${escape(note.type)}</strong>${note.code ? `<div class="rules-muted">代碼：${escape(note.code)}</div>` : ''}<p>${escape(note.text)}</p></li>`).join('')}</ol></details>` : '';
    return adoption + assistance + notes;
  }
  function personalTable(members) {
    const rows = members.map(p => p.relation === '未填列'
      ? [escape(p.name), relationCell(p.relation), '', '', escape(p.title), '', '', '']
      : [escape(p.name), relationCell(p.relation), escape(p.idNumber), escape(p.birth), escape(p.title), parentCell('父', p.father, p.adoptiveFather), parentCell('母', p.mother, p.adoptiveMother), notesCell(p)]);
    return table(['姓名', '與申請人關係', '身分證字號', '生日', '（稱謂）與戶長關係', '父／養父', '母／養母', '註記'], rows, '戶政個人資料與個人記事', 'rules-personal-table', index => members[index].relation === '未填列' ? 'rules-member-row--unlisted' : 'rules-member-row--declared');
  }
  function parentCell(label, parent, adoptiveParent) {
    const parentMissing = !parent || ['未登載', '未提供', '無資料', '無'].includes(parent);
    return `<div class="rules-parent">${adoptiveParent && parentMissing ? '' : `<span>${label}：${personalValue(parent)}</span>`}${adoptiveParent ? `<span>養${label}：${escape(adoptiveParent)}</span>` : ''}</div>`;
  }
  if (document.getElementById('enquiryCaseList')) initList();
  if (document.getElementById('detailBody')) initDetail();
})();
