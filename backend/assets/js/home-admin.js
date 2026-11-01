// 保留 admin/home-admin.html 的案件查詢與監控示意行為。

const caseFilter = document.getElementById('caseFilter');
const caseStartDate = document.getElementById('caseStartDate');
const caseEndDate = document.getElementById('caseEndDate');
const caseAgency = document.getElementById('caseAgency');
const caseQuerySummary = document.getElementById('caseQuerySummary');

// 以臺灣日期計算近一個月，月底回推時取上個月最後一日。
const taiwanDateParts = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit'
}).formatToParts(new Date());
const datePart = type => Number(taiwanDateParts.find(part => part.type === type).value);
const caseToday = new Date(Date.UTC(datePart('year'), datePart('month') - 1, datePart('day')));
const formatCaseDate = date => date.toISOString().slice(0, 10);
const caseMonthStart = new Date(caseToday);
caseMonthStart.setUTCDate(1);
caseMonthStart.setUTCMonth(caseMonthStart.getUTCMonth() - 1);
const previousMonthLastDay = new Date(Date.UTC(caseToday.getUTCFullYear(), caseToday.getUTCMonth(), 0)).getUTCDate();
caseMonthStart.setUTCDate(Math.min(caseToday.getUTCDate(), previousMonthLastDay));
caseStartDate.defaultValue = formatCaseDate(caseMonthStart);
caseEndDate.defaultValue = formatCaseDate(caseToday);

// 本頁為靜態展示；正式串接時以後端查詢結果取代此示意資料。
const caseSampleRows = [
  { agency: '國家住都中心', accepted: 5944, occupied: 1808, terminated: 126 },
  { agency: '新北市政府', accepted: 4400, occupied: 1400, terminated: 80 },
  { agency: '臺中市政府', accepted: 3200, occupied: 1000, terminated: 65 },
  { agency: '臺北市政府', accepted: 3000, occupied: 900, terminated: 60 },
  { agency: '高雄市政府', accepted: 2600, occupied: 700, terminated: 50 },
  { agency: '桃園市政府', accepted: 2000, occupied: 600, terminated: 45 }
].map((row, index) => {
  const date = new Date(caseToday);
  date.setUTCDate(date.getUTCDate() - (index * 4 + 3));
  return { ...row, date: formatCaseDate(date) };
});

function renderCaseOverview() {
  const rows = caseSampleRows.filter(row =>
    row.date >= caseStartDate.value && row.date <= caseEndDate.value &&
    (!caseAgency.value || row.agency === caseAgency.value)
  );
  const totals = rows.reduce((sum, row) => ({
    accepted: sum.accepted + row.accepted,
    occupied: sum.occupied + row.occupied,
    terminated: sum.terminated + row.terminated
  }), { accepted: 0, occupied: 0, terminated: 0 });
  document.getElementById('caseAccepted').textContent = totals.accepted.toLocaleString('zh-TW');
  document.getElementById('caseOccupied').textContent = totals.occupied.toLocaleString('zh-TW');
  document.getElementById('caseTerminated').textContent = totals.terminated.toLocaleString('zh-TW');
  const agencyRows = document.getElementById('caseAgencyRows');
  agencyRows.replaceChildren();
  const agencies = [...new Set(caseSampleRows.map(row => row.agency))]
    .filter(agency => !caseAgency.value || agency === caseAgency.value);
  agencies.forEach(agency => {
    const agencyCases = rows.filter(row => row.agency === agency);
    const tableRow = document.createElement('tr');
    const agencyCell = document.createElement('th');
    agencyCell.scope = 'row';
    agencyCell.textContent = agency;
    tableRow.appendChild(agencyCell);
    ['accepted', 'occupied', 'terminated'].forEach(status => {
      const cell = document.createElement('td');
      cell.textContent = agencyCases.reduce((sum, row) => sum + row[status], 0).toLocaleString('zh-TW');
      tableRow.appendChild(cell);
    });
    agencyRows.appendChild(tableRow);
  });
  caseQuerySummary.textContent = caseStartDate.value + ' 至 ' + caseEndDate.value +
    '｜' + (caseAgency.value || '全部權責機關') + (rows.length ? '｜單位：件' : '｜此區間無符合條件的示意資料');
}

caseFilter.addEventListener('submit', event => {
  event.preventDefault();
  caseEndDate.setCustomValidity(caseStartDate.value > caseEndDate.value ? '結束日期不得早於開始日期。' : '');
  if (caseFilter.reportValidity()) renderCaseOverview();
});
[caseStartDate, caseEndDate].forEach(input => {
  input.addEventListener('input', () => caseEndDate.setCustomValidity(''));
});
caseFilter.addEventListener('reset', () => {
  caseEndDate.setCustomValidity('');
  // 等待表單恢復預設值後更新統計。
  setTimeout(renderCaseOverview, 0);
});
renderCaseOverview();

const heatmap = document.getElementById('healthHeatmap');
const heatmapTimes = Array.from({length:19}, (_, index) => String(index).padStart(2, '0') + ':00').concat('目前');
const heatStatusMeta = {
  g: { rate: '99.8%', error: '0' },
  y: { rate: '97.2%', error: '6' },
  r: { rate: '92.4%', error: '18' },
  b: { rate: '維護中', error: '0' },
  n: { rate: '無交易', error: '0' }
};

function findHeatmapService(serviceName) {
  return [...heatmap.querySelectorAll('.heatmap-service')]
    .find(row => row.querySelector('strong')?.textContent.trim() === serviceName);
}

function insertExchangeService(serviceName, statuses, beforeServiceName) {
  const referenceRow = findHeatmapService(beforeServiceName);
  if (!referenceRow) return;

  const fragment = document.createDocumentFragment();
  const serviceRow = document.createElement('div');
  serviceRow.className = 'heatmap-service';
  serviceRow.innerHTML = '<strong>' + serviceName + '</strong>';
  fragment.appendChild(serviceRow);

  statuses.forEach((status, index) => {
    const button = document.createElement('button');
    const meta = heatStatusMeta[status];
    button.type = 'button';
    button.className = 'heat-cell ' + status + (index === statuses.length - 1 ? ' pulse' : '');
    button.dataset.service = serviceName + '資料交換';
    button.dataset.time = heatmapTimes[index];
    button.dataset.rate = meta.rate;
    button.dataset.error = meta.error;
    fragment.appendChild(button);
  });

  heatmap.insertBefore(fragment, referenceRow);
}

function renameHeatmapService(currentName, newName, dataSuffix) {
  const serviceRow = findHeatmapService(currentName);
  if (!serviceRow) return;

  serviceRow.querySelector('strong').textContent = newName;
  let cell = serviceRow.nextElementSibling;
  while (cell?.classList.contains('heat-cell')) {
    cell.dataset.service = newName + dataSuffix;
    cell = cell.nextElementSibling;
  }
}

function insertLookupService(serviceName, statuses, beforeServiceName) {
  const referenceRow = findHeatmapService(beforeServiceName);
  if (!referenceRow) return;

  const fragment = document.createDocumentFragment();
  const serviceRow = document.createElement('div');
  serviceRow.className = 'heatmap-service';
  serviceRow.innerHTML = '<strong>' + serviceName + '</strong>';
  fragment.appendChild(serviceRow);

  statuses.forEach((status, index) => {
    const button = document.createElement('button');
    const meta = heatStatusMeta[status];
    button.type = 'button';
    button.className = 'heat-cell ' + status + (index === statuses.length - 1 ? ' pulse' : '');
    button.dataset.service = serviceName + '查調';
    button.dataset.time = heatmapTimes[index];
    button.dataset.rate = meta.rate;
    button.dataset.error = meta.error;
    fragment.appendChild(button);
  });

  heatmap.insertBefore(fragment, referenceRow);
}

function reorderHeatmapServices(serviceNames) {
  const fragment = document.createDocumentFragment();

  serviceNames.forEach(serviceName => {
    const serviceRow = findHeatmapService(serviceName);
    if (!serviceRow) return;

    const rowNodes = [serviceRow];
    let cell = serviceRow.nextElementSibling;
    while (cell?.classList.contains('heat-cell')) {
      rowNodes.push(cell);
      cell = cell.nextElementSibling;
    }
    rowNodes.forEach(node => fragment.appendChild(node));
  });

  heatmap.appendChild(fragment);
}

insertExchangeService('新北市政府', ['g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g'], '臺中市政府');
insertExchangeService('桃園市政府', ['g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','y','g','g'], '臺中市政府');
insertExchangeService('臺南市政府', ['g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g'], '國家住都中心');
insertExchangeService('高雄市政府', ['g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','y','y','g'], '國家住都中心');

renameHeatmapService('戶政司', '戶政司', '查調');
renameHeatmapService('財政部', '財政部', '查調');
renameHeatmapService('地政司', '地政司', '查調');
insertLookupService('移民署', ['g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g'], '財政部');
insertLookupService('消防（警政）署', ['g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g'], '財政部');
insertLookupService('衛福部', ['g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g'], '財政部');
insertLookupService('集保所', ['g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g'], '地政司');
insertLookupService('勞動部', ['g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','y','g','g'], '地政司');
insertLookupService('國防部', ['g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g','g'], '地政司');
reorderHeatmapServices(['戶政司','地政司','移民署','消防（警政）署','衛福部','財政部','集保所','勞動部','國防部']);

const tooltip = document.getElementById('heatTooltip');
const tipTitle = document.getElementById('tipTitle');
const tipTime = document.getElementById('tipTime');
const tipRate = document.getElementById('tipRate');
const tipError = document.getElementById('tipError');

document.querySelectorAll('.heat-cell').forEach(cell => {
  cell.addEventListener('mouseenter', e => {
    tipTitle.textContent = cell.dataset.service;
    tipTime.textContent = '時間區間：' + cell.dataset.time;
    tipRate.textContent = '成功率：' + cell.dataset.rate;
    tipError.textContent = '異常筆數：' + cell.dataset.error;
    tooltip.style.display = 'block';
  });

  cell.addEventListener('mousemove', e => {
    const offset = 14;
    tooltip.style.left = Math.min(e.clientX + offset, window.innerWidth - 230) + 'px';
    tooltip.style.top = Math.min(e.clientY + offset, window.innerHeight - 120) + 'px';
  });

  cell.addEventListener('mouseleave', () => {
    tooltip.style.display = 'none';
  });

  cell.addEventListener('click', () => {
    showDemoMessage(
      cell.dataset.service + '\n' +
      '時間區間：' + cell.dataset.time + '\n' +
      '成功率：' + cell.dataset.rate + '\n' +
      '異常筆數：' + cell.dataset.error + '\n\n' +
      '示意：開啟該服務與時段的錯誤明細。'
    );
  });
});

document.getElementById('monitorTimeSearch').addEventListener('click', () => {
  const startTime = document.getElementById('monitorStartTime').value;
  const endTime = document.getElementById('monitorEndTime').value;

  if (!startTime || !endTime || new Date(startTime) > new Date(endTime)) {
    showDemoMessage('請確認開始時間與結束時間，且開始時間不得晚於結束時間。');
    return;
  }

  showDemoMessage('示意：查詢「' + startTime.replace('T', ' ') + '」至「' + endTime.replace('T', ' ') + '」的平臺監控資料。');
});

document.querySelectorAll('#rangeControl button').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('#rangeControl button').forEach(item => item.classList.remove('active'));
    button.classList.add('active');

    const rangeText = {
      '24h': '最近 24 小時',
      '6h': '最近 6 小時',
      '7d': '最近 7 日',
      '30d': '最近 30 日'
    }[button.dataset.range];

    showDemoMessage('示意：切換為「' + rangeText + '」監控資料。');
  });
});

