/* 帳號管理展示：記憶體內編輯，不代表正式權限已授予。 */
(() => {
  const agencies = ['國家住都中心','內政部國土管理署','新北市政府','臺北市政府','桃園市政府','臺中市政府','臺南市政府','高雄市政府'];
  const firstAgency = '內政部國土管理署';
  const ministryRoles = ['系統管理員', '國土署管理員', '國土署人員'];
  const housingRoles = ['社宅機關查調人員', '社宅機關人員'];
  function rolesForAgency(agency) {
    if (!agency) return [...ministryRoles, ...housingRoles];
    return agency === firstAgency ? ministryRoles : housingRoles;
  }
  const names = ['張忠政','張大富','張曉雯','劉欣慧','王怡君','林志明','陳怡安','李雅雯','陳怡君','王雅婷','張家豪','李佳蓉','黃柏翰','吳欣怡','陳建宏','林佳穎','陳明德','黃淑芬','劉俊宏','蔡雅玲','吳志成','李佩珊','王建文','林美華'];
  const authTypes = ['自然人憑證','行動自然人憑證','健保卡號與身分證字號比對'];
  const surnames = Array.from('王林陳張李黃吳劉蔡楊許鄭謝郭洪邱曾廖賴徐周葉蘇莊呂');
  const accounts = Array.from({length: 600}, (_, i) => {
    const baseName = names[i % names.length];
    const name = i < names.length ? baseName : surnames[Math.floor(i / names.length)] + baseName.slice(1);
    const lastLoginAt = new Date(
      Date.UTC(2026, 10, 7, 18, 30) - i * 37 * 60000
    ).toISOString().slice(0, 19).replaceAll('-', '/').replace('T', ' ');
    // 示範 IP 使用文件保留網段，正式資料由後端提供最後成功登入來源。
    const lastLoginIp = '192.0.2.' + (i % 254 + 1);
    const agency = i < 4 || i % 3 === 0 ? '' : agencies[i % agencies.length];
    const roles = rolesForAgency(agency);
    const agencyRole = agency ? roles[Math.floor(i / (2 * agencies.length)) % roles.length] : '';
    return {key:i,name,lastLoginAt,lastLoginIp,nationalId:i===0?'B134567890':i===3?'A287654329':'A'+String(100000000+i),phone:'09'+String(10000000+i),email:'member'+String(i+1).padStart(2,'0')+'@example.com',verified:i%4!==0,verifiedAt:i%4!==0?'2026/10/08 10:30:00':null,authType:authTypes[i%3],authAt:'2026/10/08 09:20:00',active:i%7!==6,role:i<4||i%3===0?'民眾':'機關',agency,agencyRole};
  });
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const badge = (text,ok) => '<span class="badge rounded-pill text-nowrap '+(ok?'account-badge':'account-muted')+'">'+esc(text)+'</span>';
  const orderedAgencies = [firstAgency, ...agencies.filter(agency => agency !== firstAgency)];
  for (const id of ['filterAgency', 'editAgency']) {
    $(id).insertAdjacentHTML('beforeend', orderedAgencies.map(agency => '<option>'+esc(agency)+'</option>').join(''));
  }
  function syncFilterRoles() {
    const select = $('filterAgencyRole');
    const selected = select.value;
    const roles = rolesForAgency($('filterAgency').value);
    select.replaceChildren(new Option('全部機關角色', ''), ...roles.map(role => new Option(role, role)));
    select.value = roles.includes(selected) ? selected : '';
  }
  $('filterAgency').addEventListener('change', syncFilterRoles);
  syncFilterRoles();
  const statusIcon = (ok, yes, no, positive='fa-circle-check', negative='fa-circle-xmark') => '<span class="account-status '+(ok?'is-positive':'is-negative')+'" role="img" aria-label="'+esc(ok?yes:no)+'" title="'+esc(ok?yes:no)+'"><i class="fa-solid '+(ok?positive:negative)+'" aria-hidden="true"></i></span>';
  let activeRole='民眾';
  let page=1, matches=accounts, editing=null, readOnly=false;
  let pageSize = Number($('accountPageSize').value);
  const formatNumber = new Intl.NumberFormat('zh-TW');
  const sortFields = {
    name: '真實姓名', nationalId: '身分證／居留證號', phone: '聯絡手機', email: '電子信箱',
    agency: '機關名稱', agencyRole: '機關角色', lastLoginAt: '最後登入時間', active: '狀態'
  };
  const sortByRole = {
    '民眾': {key: 'lastLoginAt', descending: true},
    '機關': {key: 'lastLoginAt', descending: true}
  };
  const collator = new Intl.Collator('zh-TW', {numeric: true, sensitivity: 'base'});
  function sortMatches() {
    const {key, descending} = sortByRole[activeRole];
    matches.sort((a, b) => {
      const order = collator.compare(String(a[key]), String(b[key]));
      return (descending ? -order : order) || a.key - b.key;
    });
  }
  function applySort(key, descending) {
    sortByRole[activeRole] = {key, descending};
    sortMatches();
    page = 1;
    render();
  }
  $('accountHead').addEventListener('click', event => {
    const button = event.target.closest('button[data-sort]');
    if (!button) return;
    const key = button.dataset.sort;
    const current = sortByRole[activeRole];
    applySort(key, key === current.key ? !current.descending : key === 'lastLoginAt');
    $('accountHead').querySelector('[data-sort="'+key+'"]').focus();
  });
  $('accountSortField').addEventListener('change', event => {
    const key = event.target.value;
    applySort(key, key === 'lastLoginAt');
  });
  $('accountSortDirection').addEventListener('click', () => {
    const {key, descending} = sortByRole[activeRole];
    applySort(key, !descending);
  });
  function pageNumbers(current, last) {
    const start = Math.max(1, Math.min(current - 3, last - 6));
    const end = Math.min(last, start + 6);
    const items = [];
    if (start > 1) items.push(1);
    if (start === 3) items.push(2);
    if (start > 3) items.push(null);
    for (let number = start; number <= end; number++) items.push(number);
    if (end < last - 2) items.push(null);
    if (end === last - 2) items.push(last - 1);
    if (end < last) items.push(last);
    return items;
  }
  function renderPager(pages) {
    const jump = $('accountPageNumber');
    jump.max = pages;
    jump.value = page;
    jump.disabled = pages === 1;
    $('accountPageJump').querySelector('button').disabled = pages === 1;
    function link(number, content, label, disabled = false, current = false) {
      const state = disabled ? 'disabled' : current ? 'active' : '';
      const target = disabled ? 'aria-disabled="true"' : 'href="#accountTable" data-page="'+number+'"';
      const selected = current ? ' aria-current="page"' : '';
      return '<li class="'+state+'"><a '+target+selected+' aria-label="'+label+'" title="'+label+'">'+content+'</a></li>';
    }
    const links = pageNumbers(page, pages).map(number => {
      if (number === null) return '<li class="disabled" aria-hidden="true"><a>…</a></li>';
      return link(number, number, '第 '+number+' 頁', false, number === page);
    });
    const icon = name => '<i class="fas fa-'+name+'" aria-hidden="true"></i>';
    links.unshift(link(1, icon('backward-step'), '第一頁', page === 1),
      link(page - 1, icon('chevron-left'), '上一頁', page === 1));
    links.push(link(page + 1, icon('chevron-right'), '下一頁', page === pages),
      link(pages, icon('forward-step'), '最後一頁', page === pages));
    $('accountPagination').innerHTML = links.join('');
  }
  function render(){
    const agency=activeRole==='機關';
    const fields = Object.entries(sortFields).filter(([key]) => agency || !['agency', 'agencyRole'].includes(key));
    const labels = [...fields.map(([,label]) => label), '操作'];
    const sort = sortByRole[activeRole];
    const direction = sort.descending ? '降冪' : '升冪';
    $('accountSortField').innerHTML = fields.map(([key,label]) => '<option value="'+key+'">'+label+'</option>').join('');
    $('accountSortField').value = sort.key;
    $('accountSortDirection').textContent = direction;
    $('accountSortDirection').setAttribute('aria-label', '目前'+direction+'，切換排序方向');
    const headers = fields.map(([key,label]) => {
      const selected = key === sort.key;
      const order = selected ? ' aria-sort="'+(sort.descending ? 'descending' : 'ascending')+'"' : '';
      const icon = selected ? (sort.descending ? 'fa-sort-down' : 'fa-sort-up') : 'fa-sort';
      return '<th scope="col" class="text-wrap"'+order+'><button type="button" data-sort="'+key+'">'+label+' <i class="fas '+icon+'" aria-hidden="true"></i></button></th>';
    });
    $('accountHead').innerHTML = '<tr>'+headers.join('')+'<th scope="col">操作</th></tr>';
    $('accountTable').classList.toggle('is-agency',agency);
    $('accountTable').querySelector('caption').textContent=activeRole+'帳號管理清單';
    const total = matches.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    page = Math.min(page, pages);
    const start = (page - 1) * pageSize;
    const end = Math.min(start + pageSize, total);
    const fmt = number => formatNumber.format(number);
    $('accountCount').textContent = total
      ? '顯示第 '+fmt(start+1)+'–'+fmt(end)+' 筆，共 '+fmt(total)+' 筆（第 '+fmt(page)+'／'+fmt(pages)+' 頁）'
      : '共 0 筆帳號';
    $('accountRows').innerHTML=matches.slice(start,end).map(a=>{
      const cells=[esc(a.name),esc(a.nationalId),esc(a.phone),'<div class="account-email">'+statusIcon(a.verified,'信箱已驗證','信箱未驗證','fa-circle-check','fa-circle-exclamation')+'<span class="email-address">'+esc(a.email)+'</span></div>',...(agency?[esc(a.agency||'--'),badge(a.agencyRole,a.agencyRole==='社宅機關查調人員')]:[]),esc(a.lastLoginAt),statusIcon(a.active,'帳號啟用','帳號停用','fa-circle-check','fa-ban'),'<div class="d-inline-flex gap-2"><button class="btn btn-sm btn-outline-primary" data-bs-toggle="modal" data-bs-target="#accountModal" data-key="'+a.key+'" data-mode="view" aria-label="檢視'+esc(a.name)+'">檢視</button><button class="btn btn-sm btn-outline-primary" data-bs-toggle="modal" data-bs-target="#accountModal" data-key="'+a.key+'" data-mode="edit" aria-label="編輯'+esc(a.name)+'">編輯</button></div>'];
      return '<tr>'+cells.map((c,i)=>'<td data-th="'+labels[i]+'">'+c+'</td>').join('')+'</tr>';
    }).join('')||'<tr><td colspan="'+labels.length+'" class="text-center">查無符合條件的帳號。</td></tr>';
    renderPager(pages);
  }
  function validateLoginRange() {
    const start = $('filterLoginStart').value;
    const end = $('filterLoginEnd');
    const invalid = Boolean(start && end.value && start > end.value);
    end.setCustomValidity(invalid ? '最後登入時間的迄日不得早於起日。' : '');
    return !invalid;
  }
  for (const id of ['filterLoginStart', 'filterLoginEnd']) {
    $(id).addEventListener('input', validateLoginRange);
  }
  function filter(resetPage = true){
    const q = $('accountKeyword').value.trim().toLowerCase();
    const start = $('filterLoginStart').value;
    const end = $('filterLoginEnd').value;
    matches = accounts.filter(a => {
      // 依畫面顯示的登入日期比較，包含起訖當日，不另做時區轉換。
      const loginDate = String(a.lastLoginAt || '').slice(0, 10).replaceAll('/', '-');
      return [a.name, a.nationalId, a.phone, a.email, a.lastLoginIp].some(v => String(v ?? '').toLowerCase().includes(q))
        && a.role === activeRole
        && (activeRole !== '機關' || !$('filterAgency').value || a.agency === $('filterAgency').value)
        && (activeRole !== '機關' || !$('filterAgencyRole').value || a.agencyRole === $('filterAgencyRole').value)
        && (!$('filterStatus').value || String(Number(a.active)) === $('filterStatus').value)
        && (!start || (loginDate && loginDate >= start))
        && (!end || (loginDate && loginDate <= end));
    });
    sortMatches();
    if (resetPage) page = 1;
    render();
  }
  $('accountFilter').addEventListener('submit', e => {
    e.preventDefault();
    if (!validateLoginRange()) { $('filterLoginEnd').reportValidity(); return; }
    filter();
  });
  $('accountFilter').addEventListener('reset', e => {
    e.preventDefault();
    for (const id of ['accountKeyword', 'filterAgency', 'filterAgencyRole', 'filterStatus', 'filterLoginStart', 'filterLoginEnd']) $(id).value = '';
    validateLoginRange();
    syncFilterRoles();
    filter();
  });
  const tabs=Array.from(document.querySelectorAll('.account-tabs [role="tab"]'));
  function selectTab(tab){
    activeRole=tab.dataset.role;
    tabs.forEach(t=>{const selected=t===tab;t.classList.toggle('active',selected);t.setAttribute('aria-selected',String(selected));t.tabIndex=selected?0:-1;});
    $('accountPanel').setAttribute('aria-labelledby',tab.id);
    document.querySelectorAll('[data-agency-only]').forEach(el=>{el.hidden=activeRole!=='機關';el.querySelectorAll('select').forEach(select=>{select.disabled=el.hidden;});});
    $('accountMessage').textContent='';filter();
  }
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>selectTab(tab));
    tab.addEventListener('keydown',e=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
      e.preventDefault();const next=e.key==='Home'?tabs[0]:e.key==='End'?tabs[tabs.length-1]:tabs[(index+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length];
      selectTab(next);next.focus();
    });
  });
  function goToPage(number) {
    if (!Number.isInteger(number) || number < 1 || number > Math.ceil(matches.length / pageSize)) return;
    page = number;
    render();
    $('accountCount').focus();
    $('accountCount').scrollIntoView({block: 'start'});
  }
  $('accountPagination').addEventListener('click', event => {
    const link = event.target.closest('a[data-page]');
    if (!link) return;
    event.preventDefault();
    goToPage(Number(link.dataset.page));
  });
  $('accountPageJump').addEventListener('submit', event => {
    event.preventDefault();
    goToPage($('accountPageNumber').valueAsNumber);
  });
  $('accountPageSize').addEventListener('change', event => {
    const firstRecord = (page - 1) * pageSize;
    pageSize = Number(event.target.value);
    page = Math.floor(firstRecord / pageSize) + 1;
    render();
  });
  function roleFields() {
    const agency = $('editRole').value === '機關';
    for (const id of ['editAgency', 'editAgencyRole']) {
      $(id + 'Wrap').hidden = !agency;
      $(id).disabled = readOnly || !agency;
      $(id).required = agency;
    }
  }
  $('editRole').addEventListener('change',roleFields);
  $('accountModal').addEventListener('show.bs.modal',e=>{
    editing=accounts.find(a=>a.key===Number(e.relatedTarget?.dataset.key));if(!editing){e.preventDefault();return;}
    readOnly=e.relatedTarget.dataset.mode==='view';$('accountModalTitle').textContent=(readOnly?'檢視':'編輯')+'帳號資料';$('accountSave').hidden=readOnly;
    const values={editName:editing.name,editId:editing.nationalId,editPhone:editing.phone,editEmail:editing.email,editRole:editing.role,editAgency:editing.agency||agencies[0],editAgencyRole:editing.agencyRole||'社宅機關人員',editStatus:editing.active?'啟用':'停用'};
    $('accountModal').classList.toggle('is-viewing', readOnly);
    for (const [id, value] of Object.entries(values)) {
      const field = $(id);
      field.value = value;
      field.disabled = readOnly || id === 'editId';
      if (readOnly) {
        const wrapper = $(id + 'Wrap');
        let detail = wrapper.querySelector('.account-detail');
        if (!detail) {
          detail = document.createElement('dl');
          detail.className = 'account-detail';
          const label = document.createElement('dt');
          label.textContent = field.labels[0].textContent;
          detail.append(label, document.createElement('dd'));
          wrapper.prepend(detail);
        }
        detail.querySelector('dd').textContent = value;
      }
    }
    updateEmailVerification();
    const details = readOnly ? [
      ['首次身分驗證方式', editing.authType],
      ['首次身分驗證時間', editing.authAt],
      ['最後登入時間', editing.lastLoginAt || '尚未登入'],
      ['最後登入 IP', editing.lastLoginAt ? (editing.lastLoginIp || '無紀錄') : '無紀錄']
    ] : [];
    $('accountVerification').hidden = !readOnly;
    $('accountEditForm').querySelector('hr').hidden = !readOnly;
    $('accountVerification').innerHTML = details.map(([k,v]) => '<div class="col-md-6"><dt class="form-label">'+k+'</dt><dd>'+esc(v)+'</dd></div>').join('');
    roleFields();
  });
  function updateEmailVerification(){
    const verified=editing.verified&&$('editEmail').value.trim()===editing.email;
    const note = $('editEmailVerification');
    note.classList.toggle('is-verified', verified);
    note.querySelector('i').className = verified ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation';
    $('editEmailVerifiedAt').textContent=verified?'驗證時間：'+editing.verifiedAt:'信箱尚未驗證';
  }
  $('editEmail').addEventListener('input',updateEmailVerification);
  $('accountEditForm').addEventListener('submit',e=>{e.preventDefault();if(!editing||readOnly||!e.target.reportValidity())return;const email=$('editEmail').value.trim(),agency=$('editRole').value==='機關';if(!agencies.includes($('editAgency').value)&&agency)return;
    if(editing.email!==email){editing.verified=false;editing.verifiedAt=null;}
    Object.assign(editing,{name:$('editName').value.trim(),phone:$('editPhone').value.trim(),email,role:$('editRole').value,agency:agency?$('editAgency').value:'',agencyRole:agency?$('editAgencyRole').value:'',active:$('editStatus').value==='啟用'});
    filter(false);$('accountMessage').innerHTML='<div class="alert alert-success">已更新「'+esc(editing.name)+'」的示範資料。</div>';bootstrap.Modal.getInstance($('accountModal')).hide();
  });
  selectTab(tabs[0]);
})();
