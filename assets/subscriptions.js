(function () {
  'use strict';
  // Static prototype data; replace with the signed-in member's subscription API.
  const samples = [
    { id: 'query-taichung', type: 'query', locations: [{ city: '臺中市', districts: ['西屯區', '北屯區', '南屯區'] }, { city: '彰化縣', districts: ['彰化市', '員林市'] }], budgetMin: 5000, budgetMax: 12000, services: ['托育服務', '幼兒園'], date: '2026/10/28' },
    { id: 'query-newtaipei', type: 'query', locations: [{ city: '臺北市', districts: ['萬華區', '文山區'] }, { city: '新北市', districts: ['板橋區', '中和區'] }], budgetMin: 5000, budgetMax: 15000, services: [], date: '2026/10/25' },
    { id: 'housing-xitun', type: 'housing', housingName: '西屯安居社會住宅', city: '臺中市', districts: ['西屯區'], date: '2026/10/22' },
    { id: 'housing-wenxin', type: 'housing', housingName: '文心好室社會住宅', city: '臺中市', districts: ['北屯區'], date: '2026/10/18' }
  ];
  const storageKey = 'housing-subscriptions-demo-cancelled-v1';
  let cancelled = [];
  let pendingId = null;
  let undoId = null;
  const list = document.getElementById('subscriptionLists');
  const dialog = document.getElementById('cancelSubscriptionDialog');
  const feedback = document.getElementById('subscriptionFeedback');
  const undo = document.getElementById('undoSubscription');
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (Array.isArray(stored)) cancelled = stored.filter(id => samples.some(item => item.id === id));
  } catch { /* Keep sample subscriptions available when browser storage is unavailable. */ }
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const chips = values => values.map(value => `<span class="subscription-chip">${escape(value)}</span>`).join('');
  const formatBudget = item => `NT$ ${item.budgetMin.toLocaleString('zh-TW')} – ${item.budgetMax.toLocaleString('zh-TW')}／月`;
  const describeSubscription = item => item.type === 'housing'
    ? item.housingName
    : item.locations.map(location => location.city + '（' + (location.districts.join('、') || '全行政區') + '）').join('；')
      + '｜預算範圍：' + formatBudget(item) + '｜公設服務：' + (item.services.join('、') || '不限');
  const locationMarkup = locations => '<div class="subscription-locations">' + locations.map(location => `<div class="subscription-location"><strong>${escape(location.city)}</strong><div>${location.districts.length ? chips(location.districts) : '<span class="subscription-unlimited">全行政區</span>'}</div></div>`).join('') + '</div>';
  const actionMarkup = item => `<td data-label="媒合推薦"><a class="subscription-match-button" href="housing-map.html" title="查看媒合推薦" aria-label="查看媒合推薦：${escape(describeSubscription(item))}"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></svg></a></td><td data-label="操作"><button type="button" class="unsubscribe-button" data-cancel="${escape(item.id)}" aria-label="取消訂閱：${escape(describeSubscription(item))}">取消訂閱</button></td>`;
  function render() {
    ['query', 'housing'].forEach(type => {
      const items = samples.filter(item => item.type === type && !cancelled.includes(item.id));
      document.getElementById(type + 'Count').textContent = items.length + ' 筆';
      document.getElementById(type + 'TableWrap').hidden = items.length === 0;
      document.getElementById(type + 'Empty').hidden = items.length > 0;
      document.getElementById(type + 'List').innerHTML = items.map(item => type === 'query'
        ? `<tr><td data-label="訂閱地區">${locationMarkup(item.locations)}</td><td data-label="預算範圍">${escape(formatBudget(item))}</td><td data-label="公設服務">${item.services.length ? chips(item.services) : '<span class="subscription-unlimited">不限</span>'}</td><td data-label="訂閱日期" class="subscription-date">${escape(item.date)}</td>${actionMarkup(item)}</tr>`
        : `<tr><td data-label="社宅名稱"><strong class="subscription-housing-name">${escape(item.housingName)}</strong></td><td data-label="所在地區">${locationMarkup([{city:item.city,districts:item.districts}])}</td><td data-label="訂閱日期" class="subscription-date">${escape(item.date)}</td>${actionMarkup(item)}</tr>`
      ).join('');
    });
  }
  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify(cancelled)); return true; } catch { return false; }
  }
  function announce(message, canUndo) {
    document.getElementById('subscriptionMessage').textContent = message;
    feedback.hidden = false;
    undo.hidden = !canUndo;
  }
  list.addEventListener('click', event => {
    const button = event.target.closest('[data-cancel]');
    if (!button) return;
    pendingId = button.dataset.cancel;
    document.getElementById('cancelSubscriptionDescription').textContent = describeSubscription(samples.find(item => item.id === pendingId));
    dialog.returnValue = '';
    dialog.showModal();
  });
  dialog.addEventListener('close', () => {
    if (dialog.returnValue !== 'cancel' || !pendingId) { pendingId = null; return; }
    const item = samples.find(item => item.id === pendingId);
    cancelled.push(pendingId);
    undoId = pendingId;
    pendingId = null;
    const saved = persist();
    render();
    announce(`已取消「${item.type === 'query' ? '此組條件' : item.housingName}」的訂閱。${saved ? '' : '瀏覽器無法儲存變更，重新整理後將還原。'}`, true);
    undo.focus();
  });
  undo.addEventListener('click', () => {
    if (!undoId) return;
    const restoredType = samples.find(item => item.id === undoId).type;
    cancelled = cancelled.filter(id => id !== undoId);
    undoId = null;
    const saved = persist();
    render();
    announce(`已復原訂閱。${saved ? '' : '瀏覽器無法儲存變更，重新整理後可能還原。'}`, false);
    document.getElementById(restoredType + 'Heading').focus();
  });
  render();
})();
