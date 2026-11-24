/* 靜態展示：歷史批次明確標示範例；正式資料應由後端提供不可變快照及到期刪除。 */
window.EnquiryHistory = (() => {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const parse = value => new Date(String(value).replaceAll('/', '-').replace(' ', 'T') + '+08:00');
  const format = date => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Taipei', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false }).format(date).replaceAll('-', '/');
  function expiry(sentAt) {
    const [y,m,d,h,min,sec] = sentAt.match(/\d+/g).map(Number);
    const lastDay = new Date(Date.UTC(y, m + 6, 0)).getUTCDate();
    return new Date(Date.UTC(y, m - 1 + 6, Math.min(d, lastDay), h - 8, min, sec || 0));
  }
  const available = (batches, now = new Date()) => batches.filter(b => now < expiry(b.sentAt)).sort((a,b) => parse(b.sentAt) - parse(a.sentAt));
  let activeRecord, batches = [];
  function sourceFor(record) {
    // 模擬歷次紀錄沿用本案資料快照，不編造不同審查數值。
    const source = record.enquiryHistory || [2,1,0].map((offset, index) => ({
      id: 'INQ-' + String(3-index).padStart(3,'0'),
      sentAt: format(new Date(parse(record.appliedAt).getTime() + offset * 1000)),
      current: index === 0,
      snapshot: JSON.parse(JSON.stringify(record)),
      sample: true
    }));
    return source;
  }
  function render(record) {
    batches = available(sourceFor(record));
    const rows = batches.map(b => '<tr><td data-th="批次">'+escape(b.id)+'</td><td data-th="送查調時間">'+escape(b.sentAt)+'</td><td data-th="狀態"><span class="badge rounded-pill '+(b.current?'enquiry-status--complete':'enquiry-status--pending')+'">'+(b.current?'目前採用':'歷史結果')+'</span></td><td data-th="保存期限">'+escape(format(expiry(b.sentAt)))+'</td><td data-th="結果"><button type="button" class="btn btn-sm btn-outline-primary" data-enquiry-batch="'+escape(b.id)+'" aria-label="檢視 '+escape(b.id)+' 查調結果">檢視</button></td></tr>').join('');
    return '<p>每次查調紀錄自送查調時間起保存六個月，到期刪除。</p><table class="table table-list table-rwd enquiry-detail-table"><caption class="visually-hidden">歷次查調紀錄</caption><thead><tr><th scope="col">批次</th><th scope="col">送查調時間</th><th scope="col">狀態</th><th scope="col">保存期限</th><th scope="col">結果</th></tr></thead><tbody>'+(rows || '<tr><td colspan="5">目前無保存期限內的查調紀錄。</td></tr>')+'</tbody></table>';
  }
  const modal = document.getElementById('enquiryHistoryModal');
  const target = document.getElementById('enquiryHistoryBody');

  function showList() {
    if (!activeRecord) return;
    target.innerHTML = render(activeRecord);

  }
  modal.addEventListener('show.bs.modal', showList);
  target.addEventListener('click', event => {
    const button = event.target.closest('[data-enquiry-batch]');
    if (!button) return;
    const batch = batches.find(b => b.id === button.dataset.enquiryBatch);
    if (!batch || !available([batch]).length) {
      target.innerHTML = '<p>此版查調內容已超過六個月保存期限或不存在，無法檢視。</p>';
      return;
    }
    location.href = 'enquiry-detail.html?case=' + encodeURIComponent(activeRecord.caseId) + '&batch=' + encodeURIComponent(batch.id);
  });
  modal.addEventListener('hidden.bs.modal', () => { target.innerHTML = ''; });
  function select(record, batchId) {
    init(record);
    const retained = available(sourceFor(record));
    const selected = batchId ? retained.find(b => b.id === batchId) : retained.find(b => b.current);
    document.getElementById('enquiryVersion').hidden = false;
    const banner = document.getElementById('enquiryVersionInfo');
    const currentLink = '<a class="btn btn-outline-primary btn-sm" href="enquiry-detail.html?case=' + encodeURIComponent(record.caseId) + '">返回目前採用版本</a>';
    if (!selected) {
      banner.innerHTML = '<span>此版本已超過六個月保存期限或不存在，無法檢視。</span>' + (batchId ? currentLink : '');
      return null;
    }
    banner.innerHTML = '<div><div class="d-flex flex-wrap align-items-center gap-2"><strong>目前檢視：' + escape(selected.id) + '</strong><span class="badge rounded-pill ' + (selected.current ? 'enquiry-status--complete' : 'enquiry-status--pending') + '">' + (selected.current ? '目前採用版本' : '歷史版本') + '</span>' + (!selected.current ? currentLink : '') + '</div><div class="mt-2">送查調時間：' + escape(selected.sentAt) + '｜保存期限：' + escape(format(expiry(selected.sentAt))) + '</div></div>';
    return selected.snapshot;
  }
  function init(record) {
    activeRecord = record;
    document.getElementById('enquiryHistoryButton').disabled = false;
  }
  return { init, select, render, expiry, available };
})();
