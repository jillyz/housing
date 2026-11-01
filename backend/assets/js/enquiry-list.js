/* 查調工作臺：靜態示意資料篩選；表單與表格沿用後臺模板。 */
(() => {
  const form = document.getElementById('enquiryFilter');
  const keyword = document.getElementById('enquiryKeyword');
  const agency = document.getElementById('enquiryAgency');
  const status = document.getElementById('enquiryStatus');
  const rows = [...document.querySelectorAll('#enquiryRows tr[data-case-id]')];
  const summary = document.getElementById('enquirySummary');
  const empty = document.getElementById('enquiryEmpty');
  const pagination = document.getElementById('enquiryPagination');
  const paginationNav = document.getElementById('enquiryPaginationNav');
  const configuredPageSize = Number(form.dataset.pageSize);
  const pageSize = Number.isInteger(configuredPageSize) && configuredPageSize > 0 ? configuredPageSize : 5;
  let currentPage = 1;
  let filteredRows = rows;

  function renderPage() {
    const count = filteredRows.length;
    const pageCount = Math.ceil(count / pageSize);
    currentPage = Math.max(1, Math.min(currentPage, pageCount));
    const start = (currentPage - 1) * pageSize;
    rows.forEach(row => { row.hidden = true; });
    filteredRows.slice(start, start + pageSize).forEach(row => { row.hidden = false; });
    empty.hidden = count !== 0;
    summary.textContent = count
      ? `共 ${count} 筆查調案件，顯示第 ${start + 1}–${Math.min(start + pageSize, count)} 筆（每頁 ${pageSize} 筆）`
      : '共 0 筆查調案件';
    paginationNav.hidden = count === 0;
    if (!count) { pagination.innerHTML = ''; return; }

    function pageLink(page, label, content, disabled = false) {
      const active = page === currentPage && !disabled && content === String(page);
      return `<li${disabled ? ' class="disabled"' : active ? ' class="active"' : ''}><a href="#enquiryRows" data-page="${page}" aria-label="${label}"${disabled ? ' aria-disabled="true" tabindex="-1"' : active ? ' aria-current="page"' : ''}>${content}</a></li>`;
    }
    const parts = [pageLink(currentPage - 1, '上一頁', '<i class="fas fa-chevron-left" aria-hidden="true"></i>', currentPage === 1)];
    // 保留首尾與目前頁附近頁碼，頁數多時使用模板的省略樣式。
    let previous = 0;
    for (let page = 1; page <= pageCount; page += 1) {
      if (pageCount > 7 && page !== 1 && page !== pageCount && Math.abs(page - currentPage) > 1) continue;
      if (previous && page - previous > 1) parts.push('<li class="disabled"><a aria-hidden="true">…</a></li>');
      parts.push(pageLink(page, `第 ${page} 頁`, String(page)));
      previous = page;
    }
    parts.push(pageLink(currentPage + 1, '下一頁', '<i class="fas fa-chevron-right" aria-hidden="true"></i>', currentPage === pageCount));
    pagination.innerHTML = parts.join('');
  }

  function filterRows(query, selectedAgency, selectedStatus = '') {
    const normalized = query.trim().toLocaleLowerCase('zh-TW');
    filteredRows = rows.filter(row => {
      const matchesKeyword = [row.dataset.caseId, row.dataset.applicant, row.dataset.idNumber]
        .some(value => value.toLocaleLowerCase('zh-TW').includes(normalized));
      const matchesAgency = !selectedAgency || row.dataset.agency === selectedAgency;
      const matchesStatus = !selectedStatus || row.dataset.status === selectedStatus;
      return matchesKeyword && matchesAgency && matchesStatus;
    });
    currentPage = 1;
    renderPage();
  }

  pagination.addEventListener('click', event => {
    const link = event.target.closest('a[data-page]');
    if (!link) return;
    event.preventDefault();
    if (link.getAttribute('aria-disabled') === 'true') return;
    const page = Number(link.dataset.page);
    if (!Number.isInteger(page) || page < 1 || page > Math.ceil(filteredRows.length / pageSize)) return;
    currentPage = page;
    renderPage();
    pagination.querySelector('[aria-current="page"]')?.focus({ preventScroll: true });
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    filterRows(keyword.value, agency.value, status?.value || '');
  });
  form.addEventListener('reset', () => filterRows('', ''));
  filterRows('', '');
})();
