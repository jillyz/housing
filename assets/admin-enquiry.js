/* 查調工作台互動；右欄只讀取案件已保存的 result，不讀取表單。 */
(() => {
  'use strict';
  const M = window.EnquiryModel;
  const $ = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[c]);
  const number = value => Number(value || 0).toLocaleString('zh-TW');
  const timestamp = () => {
    const date = new Date();
    return `${date.getFullYear() - 1911}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };
  const check = value => value ? '<span class="check-mark" role="img" aria-label="是"><i class="material-symbols-rounded" aria-hidden="true">check</i></span>' : '<span class="empty-boolean" role="img" aria-label="否"></span>';
  const form = $('enquiryForm');
  const editor = $('enquiryEditor');
  const historyCard = document.querySelector('.history-card');
  const targetList = $('targetList');
  const resultArea = $('resultArea');
  const typeInputs = [...document.querySelectorAll('[name="targetGroupType"]')];
  const sections = {
    applicant: $('applicantResultTitle').closest('.result-section'),
    family: $('familyResultTitle').closest('.result-section'),
    property: $('propertyResultTitle').closest('.result-section'),
    documents: $('documentResultTitle').closest('.result-section')
  };
  const casesKey = 'housingEnquiryCases';
  const draftsKey = 'housingEnquiryDrafts';
  let storageFailed = false;

  function storageError() {
    storageFailed = true;
    $('storageNotice').textContent = '暫存未成功，請勿關閉或重新整理頁面。';
    $('storageNotice').hidden = false;
  }
  function readStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      storageError();
      return fallback;
    }
  }
  function writeStorage(key, value) {
    if (storageFailed) return false;
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { storageError(); return false; }
  }
  const saved = readStorage(casesKey, null);
  let records = Array.isArray(saved) ? saved.map(M.migrate) : M.defaults();
  let drafts = readStorage(draftsKey, {});
  if (!drafts || Array.isArray(drafts) || typeof drafts !== 'object') drafts = {};
  if (Array.isArray(saved) && saved.some(record => record.schemaVersion !== 2)) writeStorage(casesKey + '_v1_backup', saved);
  writeStorage(casesKey, records);
  let selectedId = records[0]?.recordId || '';
  let activeDraft = null;
  let dirty = false;
  let historyFilter = 'all';
  let duplicateId = '';

  function statusMeta(record, withDraft = false) {
    if ((withDraft && drafts[record.recordId]) || record.status === '待確認名單') return { label: '待送出', filter: 'draft', className: 'is-draft', icon: 'edit_note' };
    if (record.status === '查調中') return { label: '查調中', filter: 'running', className: 'is-running', icon: 'hourglass_top' };
    if (record.status === '查調異常') return { label: '查調異常', filter: 'running', className: 'is-failed', icon: 'error' };
    return { label: '查調完成', filter: 'complete', className: 'is-complete', icon: 'check_circle' };
  }
  function saveRecords() { writeStorage(casesKey, records); }
  function upsert(record) {
    records = [record, ...records.filter(item => item.recordId !== record.recordId)];
    saveRecords();
  }
  function persistDraft() {
    if (!activeDraft || !dirty) return;
    const key = activeDraft.recordId || 'new';
    drafts[key] = M.clone(activeDraft);
    const savedDraft = writeStorage(draftsKey, drafts);
    $('draftStatus').textContent = savedDraft ? '草稿已保留，可稍後繼續。' : '草稿僅保留於本次頁面，請勿重新整理。';
    renderHistory();
  }
  function changed() {
    dirty = true;
    clearErrors();
    updateEditorSummary();
    persistDraft();
  }

  function renderHistory() {
    const keyword = M.normalizeId($('historySearch').value);
    const visible = records.map((record, index) => ({ record, index })).filter(({ record }) => {
      const status = statusMeta(record, true);
      return (historyFilter === 'all' || historyFilter === status.filter) && (!keyword || M.normalizeId(`${record.caseNumber} ${record.applicantId}`).includes(keyword));
    });
    $('historyRows').innerHTML = visible.map(({ record, index }) => {
      const status = statusMeta(record, true);
      return `<article class="case-list-item ${record.recordId === selectedId ? 'is-selected' : ''}">
        <button class="case-list-main" type="button" data-history-action="view" data-history-index="${index}" aria-current="${record.recordId === selectedId}" aria-label="查看 ${escapeHtml(record.caseNumber)}">
          <span class="case-list-heading"><strong>${escapeHtml(record.caseNumber)}</strong><span class="history-status ${status.className}"><i class="material-symbols-rounded" aria-hidden="true">${status.icon}</i>${status.label}</span></span>
          <span class="case-list-meta"><span>${escapeHtml(record.applicantId)} + ${M.typeText(record.targetType)}</span><span title="人數含胎兒">| 共${number(M.population(record))}人</span></span>
        </button>
        <div class="case-list-foot"><span title="最後取得資料時間">${escapeHtml(record.lastQuery)}</span><div class="history-row-actions">
          <button type="button" data-history-action="edit" data-history-index="${index}" title="${drafts[record.recordId] ? '繼續編輯草稿' : '編輯'}" aria-label="編輯 ${escapeHtml(record.caseNumber)}"><span class="material-symbols-rounded" aria-hidden="true">edit</span></button>
          ${record.status !== '待確認名單' ? `<button type="button" data-history-action="rerun" data-history-index="${index}" title="依已送出名單重新查調" aria-label="重新查調 ${escapeHtml(record.caseNumber)}"><span class="material-symbols-rounded" aria-hidden="true">refresh</span></button>` : ''}
        </div></div>
      </article>`;
    }).join('');
    $('historyCount').textContent = `共 ${records.length} 案`;
    $('historyEmpty').hidden = visible.length > 0;
    $('historyEmpty').textContent = records.length ? '找不到符合條件的查調案件。' : '尚無案件，請新增查調。';
    $('resumeDraft').hidden = !drafts.new;
  }

  function clearErrors() {
    duplicateId = '';
    $('openExistingCase').hidden = true;
    for (const id of ['caseNumber', 'applicantId']) {
      $(id).classList.remove('is-invalid');
      $(id).removeAttribute('aria-invalid');
      $(id + 'Error').textContent = '';
    }
    $('targetListError').hidden = true;
    $('targetListError').textContent = '';
    targetList.querySelectorAll('.is-invalid').forEach(input => { input.classList.remove('is-invalid'); input.removeAttribute('aria-invalid'); });
  }
  function validateForm(requireLookup) {
    clearErrors();
    const errors = M.validate(activeDraft, records, requireLookup);
    errors.forEach(error => {
      if (error.field === 'targets') {
        $('targetListError').hidden = false;
        $('targetListError').textContent ||= error.message;
        if (error.index != null) {
          const input = targetList.children[error.index]?.querySelector(error.message.includes('胎兒') ? '.target-fetus' : '.target-id');
          input?.classList.add('is-invalid');
          input?.setAttribute('aria-invalid', 'true');
        }
      } else {
        $(error.field + 'Error').textContent = error.message;
        $(error.field).classList.add('is-invalid');
        $(error.field).setAttribute('aria-invalid', 'true');
      }
      if (error.recordId) { duplicateId = error.recordId; $('openExistingCase').hidden = false; }
    });
    if (errors.length) {
      const first = errors[0];
      if (first.field === 'targets') $('targetListError').scrollIntoView({ block: 'nearest' });
      else $(first.field).focus();
    }
    return errors.length === 0;
  }

  function updateEditorSummary() {
    $('targetCount').textContent = `共 ${number(M.population(activeDraft))} 人`;
    const complete = activeDraft.relationshipApplicant === M.normalizeId(activeDraft.applicantId) && activeDraft.marriage !== 'unknown';
    $('queryState').hidden = !complete;
    $('queryState').className = 'relationship-status';
    const manualSpouse = activeDraft.targets.some(target => target.relation === '配偶' && target.source === '自行新增');
    $('queryState').textContent = complete ? `婚姻資料：${activeDraft.marriage === 'married' ? '有配偶' : '無配偶'}${manualSpouse ? '；配偶為自行補填' : ''}` : '';
    $('runEnquiry').innerHTML = `<span class="material-symbols-rounded" aria-hidden="true">manage_search</span>${complete ? '重新查調配偶／戶籍' : '查調配偶／戶籍'}`;
    $('targetEmpty').hidden = activeDraft.targets.length > 0;
    $('cohabitantConfirmation').hidden = activeDraft.targetType !== 'cohabitant' || !activeDraft.targets.length;
    $('confirmCohabitants').checked = activeDraft.cohabitantConfirmed;
  }
  function renderTargets() {
    targetList.replaceChildren();
    activeDraft.targets.forEach((target, index) => {
      const row = $('targetRowTemplate').content.firstElementChild.cloneNode(true);
      row.dataset.targetIndex = index;
      const spouse = target.relation === '配偶';
      const known = M.knownPeople[M.normalizeId(target.id)];
      const fixed = target.source === '戶籍查得' || (spouse && target.source !== '自行新增');
      row.classList.toggle('is-detected', fixed);
      row.querySelector('.target-person-name').hidden = !fixed;
      row.querySelector('.target-relation').textContent = target.relation || known?.relation || M.typeText(activeDraft.targetType);
      row.querySelector('.target-name').textContent = target.name || known?.name || '';
      const relationSelect = row.querySelector('.target-relation-select');
      relationSelect.hidden = fixed;
      relationSelect.disabled = fixed;
      relationSelect.value = spouse ? '配偶' : '';
      const spouseOption = relationSelect.querySelector('[value="配偶"]');
      spouseOption.disabled = activeDraft.targets.some((item, i) => i !== index && item.relation === '配偶');
      spouseOption.textContent = spouseOption.disabled ? '配偶（已存在）' : '配偶';
      row.querySelector('.target-id-value').hidden = !fixed;
      row.querySelector('.target-id-value').textContent = target.id;
      const input = row.querySelector('.target-id');
      input.value = target.id;
      input.hidden = fixed;
      input.disabled = fixed;
      row.querySelector('.target-fetus').value = target.fetus;
      row.querySelector('.remove-target').hidden = spouse && fixed;
      targetList.append(row);
    });
    updateEditorSummary();
  }
  function openEditor(record = null) {
    persistDraft();
    const savedDraft = drafts[record?.recordId || 'new'];
    activeDraft = M.clone(savedDraft || M.newDraft(record));
    dirty = Boolean(savedDraft);
    $('targetTitle').textContent = record ? '編輯查調' : '新增查調';
    $('caseNumber').value = activeDraft.caseNumber;
    $('applicantId').value = activeDraft.applicantId;
    typeInputs.forEach(input => { input.checked = input.value === activeDraft.targetType; });
    $('draftStatus').textContent = savedDraft ? '已接續上次未送出的草稿。' : '未送出的內容會保留為草稿。';
    clearErrors();
    renderTargets();
    editor.hidden = false;
    historyCard.inert = true;
    editor.scrollTop = 0;
    $('caseNumber').focus({ preventScroll: true });
  }
  function closeEditor() {
    persistDraft();
    editor.hidden = true;
    historyCard.inert = false;
    activeDraft = null;
    dirty = false;
    renderHistory();
    $('newEnquiry').focus({ preventScroll: true });
  }

  function renderSection(key, received, waitingText) {
    const section = sections[key];
    const body = section.querySelector('.result-section-body');
    let waiting = section.querySelector('.section-waiting');
    if (!waiting) { waiting = document.createElement('p'); waiting.className = 'section-waiting'; section.append(waiting); }
    body.hidden = !received;
    waiting.hidden = Boolean(received);
    waiting.textContent = waitingText;
    const tag = section.querySelector('.source-tag');
    tag.hidden = !received;
  }
  function renderTable(selector, rows, labels) {
    document.querySelector(selector).innerHTML = rows.map(values => `<tr>${values.map((value, i) => `<td data-label="${labels[i]}"${typeof value === 'boolean' ? ' class="boolean-cell"' : ''}>${typeof value === 'boolean' ? check(value) : escapeHtml(value)}</td>`).join('')}</tr>`).join('');
  }
  function renderResults(record) {
    resultArea.hidden = !record;
    if (!record) return;
    const result = record.result;
    const status = statusMeta(record);
    $('resultCaseNumber').textContent = record.caseNumber;
    $('resultTime').textContent = result?.lastQuery ? `資料更新 ${result.lastQuery}` : '尚無回傳資料';
    $('resultStatus').className = `result-status ${status.className}`;
    $('resultStatus').innerHTML = `<i class="material-symbols-rounded" aria-hidden="true">${status.icon}</i><span>${status.label}</span>`;
    const pending = record.status !== '查調完成';
    const received = result?.received || {};
    const partial = Object.values(received).filter(Boolean).length < 4;
    $('resultPending').hidden = !pending && !partial;
    $('resultPendingTitle').textContent = record.status === '待確認名單' ? '待確認名單' : record.status === '查調異常' ? '部分資料查調異常' : '資料分批查調中';
    $('resultPendingMessage').textContent = record.status === '待確認名單' ? '戶籍資料已取得，確認名單後即可送出查調。' : '已取得的資料可先查看；重新查調期間保留上次結果，可稍後回案件清單查看。';
    $('refreshCaseStatus').hidden = record.status === '待確認名單' || record.phase === 'relationship';
    $('continueCase').hidden = record.status !== '待確認名單' && record.phase !== 'relationship';
    Object.keys(sections).forEach(key => renderSection(key, received[key], record.status === '待確認名單' ? '確認名單並送出後取得。' : '資料查調中，已回傳的其他區塊可先查看。'));
    if (!result) return;
    if (received.applicant) {
      $('applicantResultName').textContent = result.applicant.name;
      $('applicantResultId').textContent = result.applicant.id;
      $('marriageResult').textContent = result.marriageSource === 'manual' ? '有配偶（自行補填）' : result.marriage === 'married' ? '有配偶' : result.marriage === 'single' ? '無配偶' : '尚未取得';
      $('marriageDateResult').textContent = result.marriage === 'married' && result.marriageSource !== 'manual' ? '2017-06-18' : '—';
    }
    const group = M.typeText(result.targetType);
    $('familyResultTitle').textContent = `2. ${group}`;
    $('realEstateTitle').textContent = `3-1. ${group}不動產`;
    $('movableTitle').textContent = `3-2. ${group}動產`;
    if (received.family) {
      renderTable('#familyResultRows', result.people.map(person => [person.relation, person.name, person.birth, person.id, `${number(person.income)} 元`, person.fetus || '—', person.household, person.cohabiting, person.identity]), ['關係', '姓名', '出生年月日', 'ID', '最近一年所得', '胎兒數', '同戶籍', '同住', '身分／社福識別']);
      const total = result.people.reduce((sum, person) => sum + 1 + M.fetusNumber(person.fetus), 0);
      const income = result.people.reduce((sum, person) => sum + Number(person.income || 0), 0);
      $('familyResultCount').textContent = `共 ${number(total)} 人（含胎兒）`;
      $('familyPopulation').textContent = number(total);
      $('familyIncome').textContent = number(income);
      $('monthlyAverage').textContent = number(Math.round(income / Math.max(1, total) / 12));
    }
    if (received.property) {
      renderTable('.property-result-table tbody', result.realEstate.map(item => [item.owner, item.category, item.address, item.household, item.share, item.area, `${number(item.value)} 元`, item.common]), ['持有者', '類別', '地段地號建號／座落', '戶籍地', '持分比', '房地面積', '房地現值金額', '公同共有']);
      renderTable('.movable-result-table tbody', result.movable.map(item => [item.name, `${number(item.interest)} 元`, item.preferred, `${number(item.prize)} 元`, `${number(item.other)} 元`, `${number(item.subtotal)} 元`]), ['姓名', '利息（存款本金）', '優惠利率', '中獎所得', '其他所得', '小計']);
      const realBlock = $('realEstateTitle').closest('.asset-block');
      realBlock.querySelector('.asset-block-head>span').textContent = `${result.realEstate.length} 筆`;
      realBlock.querySelector('.result-summary strong').textContent = number(result.realEstate.reduce((sum, item) => sum + item.value, 0));
      const movableBlock = $('movableTitle').closest('.asset-block');
      movableBlock.querySelector('.asset-block-head>span').textContent = `${result.movable.length} 筆`;
      movableBlock.querySelector('.result-summary strong').textContent = number(result.movable.reduce((sum, item) => sum + item.subtotal, 0));
    }
    if (received.documents) {
      sections.documents.querySelector('.source-tag').textContent = `共 ${result.documents.length} 份`;
      document.querySelector('.document-result-list').innerHTML = result.documents.map(([label, filename]) => `<div class="document-result-row"><strong>${escapeHtml(label)}</strong><button type="button" data-preview="${escapeHtml(filename)}">${escapeHtml(filename)}</button><span>查調取得</span></div>`).join('');
    }
  }
  function selectRecord(record, scroll = true) {
    selectedId = record.recordId;
    renderResults(record);
    renderHistory();
    if (scroll) {
      resultArea.scrollTo({ top: 0 });
      resultArea.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }
  function rerun(record) {
    const running = M.startRequery(record, timestamp());
    upsert(running);
    // Demo 立即完成；查調名單取自案件，不讀取任何尚未送出的草稿。
    const complete = M.finishRequery(running, timestamp());
    upsert(complete);
    selectRecord(complete);
  }

  $('caseNumber').addEventListener('input', () => { activeDraft.caseNumber = $('caseNumber').value; changed(); });
  $('applicantId').addEventListener('input', () => { activeDraft = M.changeApplicant(activeDraft, $('applicantId').value); renderTargets(); changed(); });
  typeInputs.forEach(input => input.addEventListener('change', () => { activeDraft.targetType = input.value; activeDraft.cohabitantConfirmed = false; renderTargets(); changed(); }));
  $('confirmCohabitants').addEventListener('change', () => { activeDraft.cohabitantConfirmed = $('confirmCohabitants').checked; changed(); });
  $('addTarget').addEventListener('click', () => {
    activeDraft.targets.push({ id: '', fetus: 0, source: '自行新增', household: activeDraft.targetType === 'family', cohabiting: false });
    activeDraft.cohabitantConfirmed = false;
    renderTargets();
    changed();
    targetList.lastElementChild.querySelector('.target-id').focus();
  });
  targetList.addEventListener('input', event => {
    const row = event.target.closest('[data-target-index]');
    if (!row) return;
    const target = activeDraft.targets[Number(row.dataset.targetIndex)];
    if (event.target.matches('.target-id')) { target.id = M.normalizeId(event.target.value); activeDraft.cohabitantConfirmed = false; }
    if (event.target.matches('.target-fetus')) target.fetus = event.target.value;
    changed();
  });
  targetList.addEventListener('change', event => {
    if (!event.target.matches('.target-relation-select')) return;
    const index = Number(event.target.closest('[data-target-index]').dataset.targetIndex);
    const relation = event.target.value;
    activeDraft = M.setTargetRelation(activeDraft, index, relation);
    renderTargets();
    changed();
    const targetIndex = relation === '配偶' && activeDraft.targets[0]?.source === '自行新增' ? 0 : index;
    targetList.children[targetIndex]?.querySelector('.target-id').focus();
  });
  targetList.addEventListener('click', event => {
    const button = event.target.closest('.remove-target');
    if (!button) return;
    const index = Number(button.closest('[data-target-index]').dataset.targetIndex);
    activeDraft = M.removeTarget(activeDraft, index);
    renderTargets();
    changed();
  });
  $('newEnquiry').addEventListener('click', () => openEditor());
  $('resumeDraft').addEventListener('click', () => openEditor());
  $('cancelEnquiry').addEventListener('click', closeEditor);
  $('openExistingCase').addEventListener('click', () => {
    const record = records.find(item => item.recordId === duplicateId);
    if (record) { persistDraft(); selectRecord(record, false); openEditor(record); }
  });
  $('runEnquiry').addEventListener('click', () => {
    if (!validateForm(false)) return;
    if (!activeDraft.recordId) {
      const record = M.beginInitialRecord(activeDraft, timestamp());
      activeDraft.recordId = record.recordId;
      upsert(record);
      delete drafts.new;
    }
    dirty = true;
    persistDraft();
    activeDraft = M.lookupRelationships(activeDraft);
    const existing = records.find(record => record.recordId === activeDraft.recordId);
    if (existing?.phase === 'relationship' || existing?.status === '待確認名單') upsert(M.initialRecord(activeDraft, timestamp()));
    renderTargets();
    changed();
    $('draftStatus').textContent = storageFailed ? '名單已帶入，但暫存未成功，請勿重新整理。' : '名單已帶入並保留草稿，確認後請按「送出查調」。';
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!validateForm(true)) return;
    const record = M.submit(activeDraft, records.find(item => item.recordId === activeDraft.recordId), timestamp());
    upsert(record);
    delete drafts[activeDraft.recordId || 'new'];
    writeStorage(draftsKey, drafts);
    dirty = false;
    closeEditor();
    historyFilter = 'all';
    $('historySearch').value = '';
    updateFilters();
    selectRecord(record);
  });
  $('historyRows').addEventListener('click', event => {
    const button = event.target.closest('[data-history-index]');
    if (!button) return;
    const record = records[Number(button.dataset.historyIndex)];
    if (!record) return;
    if (button.dataset.historyAction === 'edit') { selectRecord(record, false); openEditor(record); }
    else if (button.dataset.historyAction === 'rerun') rerun(record);
    else selectRecord(record);
  });
  function updateFilters() {
    document.querySelectorAll('[data-history-filter]').forEach(button => {
      const selected = button.dataset.historyFilter === historyFilter;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    renderHistory();
  }
  document.querySelectorAll('[data-history-filter]').forEach(button => button.addEventListener('click', () => { historyFilter = button.dataset.historyFilter; updateFilters(); }));
  $('historySearch').addEventListener('input', renderHistory);
  $('continueCase').addEventListener('click', () => openEditor(records.find(record => record.recordId === selectedId)));
  $('refreshCaseStatus').addEventListener('click', () => {
    const record = records.find(item => item.recordId === selectedId);
    if (record) rerun(record);
  });
  resultArea.addEventListener('click', event => { const button = event.target.closest('[data-preview]'); if (button) alert(`示意：開啟 ${button.dataset.preview}。`); });
  window.addEventListener('pagehide', persistDraft);
  updateFilters();
  renderResults(records.find(record => record.recordId === selectedId));
})();
