/* 本機展示檢視紀錄；歷次查調批次沿用模擬資料，不連接正式稽核系統。 */
window.EnquiryRuleHistory = (() => {
  const model = window.EnquiryRuleDemo;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const format = date => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(date).replaceAll('-', '/');
  const available = (record, supplemented, now = new Date()) => model.batches(record, supplemented).filter(batch => now < model.expiry(batch.sentAt));
  function select(record, params) {
    const supplemented = params.get('members') === 'complete' && !model.ready(record) && model.otherCaseMembers(record).length === 0;
    const batches = available(record, supplemented);
    const selected = params.get('batch') ? batches.find(batch => batch.id === params.get('batch')) : batches.find(batch => batch.current);
    return { supplemented, batches, selected };
  }
  function trackView(record, batchId, storage, now = new Date()) {
    const key = `enquiry-rule-views-v1:${record.id}`;
    const seed = [30, 15, 0].map((minute, index) => ({ viewedAt: `2026/11/18 12:${String(minute).padStart(2, '0')}:00`, viewer: `承辦人${index === 1 ? '乙' : '甲'}`, agency: record.agency, batchId: 'INQ-003' }));
    let saved;
    try { saved = JSON.parse(storage?.getItem(key) || 'null'); } catch { /* 儲存不可用時仍可檢視範例。 */ }
    const valid = saved && Number.isSafeInteger(saved.count) && saved.count >= 0 && Array.isArray(saved.visits);
    const visits = [{ viewedAt: format(now), viewer: '目前使用者', agency: record.agency, batchId }, ...(valid ? saved.visits : seed)].slice(0, 100);
    const result = { count: (valid ? saved.count : seed.length) + 1, visits, persisted: false };
    try { storage?.setItem(key, JSON.stringify({ count: result.count, visits })); result.persisted = Boolean(storage); } catch { /* 不以失敗的儲存阻擋頁面。 */ }
    return result;
  }
  const table = (headers, rows, caption) => `<table class="table table-list table-rwd rules-table"><caption class="visually-hidden">${caption}</caption><thead><tr>${headers.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>`;
  const row = (headers, cells) => `<tr>${cells.map((cell, i) => `<td data-th="${headers[i]}">${cell}</td>`).join('')}</tr>`;
  function init(record, state) {
    const selected = state.selected;
    const currentUrl = `enquiry-detail.html?case=${encodeURIComponent(record.id)}${state.supplemented ? '&members=complete' : ''}`;
    const version = document.getElementById('enquiryVersion');
    version.hidden = false;
    document.getElementById('enquiryHistoryButton').disabled = false;
    const headers = ['批次', '送查調時間', '查調狀態', '保存期限', '操作'];
    document.getElementById('enquiryHistoryBody').innerHTML = table(headers, state.batches.map(batch => row(headers, [escape(batch.id) + (batch.current ? '<div class="rules-muted">目前採用</div>' : ''), escape(batch.sentAt), model.ready(record, batch.declared) ? '查調完成' : '成員未完備', escape(format(model.expiry(batch.sentAt))), `<a class="btn btn-sm btn-outline-primary" href="${currentUrl}&batch=${encodeURIComponent(batch.id)}" aria-label="檢視 ${batch.id} 查調結果">檢視</a>`])), '歷次查調批次');
    if (!selected) {
      document.getElementById('enquiryVersionInfo').innerHTML = `此批次不存在或已超過六個月保存期限。<a class="ms-2" href="${currentUrl}">返回目前採用版本</a>`;
      return;
    }
    document.getElementById('enquiryVersionInfo').innerHTML = `<strong>目前檢視：${escape(selected.id)}</strong><span class="rules-status ${selected.current ? '' : 'neutral'} ms-2">${selected.current ? '目前採用版本' : '歷史版本'}</span>${selected.current ? '' : `<a class="btn btn-sm btn-outline-primary ms-2" href="${currentUrl}">返回目前採用版本</a>`}<div class="rules-muted mt-2">送查調時間：${escape(selected.sentAt)}｜保存期限：${escape(format(model.expiry(selected.sentAt)))}</div>`;
    document.getElementById('detailCompletedAt').textContent = model.ready(record, selected.declared) ? `完成時間：${selected.completedAt}` : '完整查調：尚未啟動，待成員確認';
    let storage;
    try { storage = window.localStorage; } catch { /* 私密模式或本機檔案可能不允許儲存。 */ }
    const views = trackView(record, selected.id, storage);
    document.getElementById('viewHistoryCount').textContent = views.count;
    document.getElementById('viewHistoryCase').textContent = record.id;
    document.getElementById('viewHistoryButton').disabled = false;
    const visitHeaders = ['檢視時間', '檢視人員', '所屬機關', '查閱批次'];
    document.getElementById('viewHistoryBody').innerHTML = table(visitHeaders, views.visits.map(visit => row(visitHeaders, [visit.viewedAt, visit.viewer, visit.agency, visit.batchId].map(escape))), '案件檢視紀錄');
  }
  return { select, available, trackView, init };
})();
