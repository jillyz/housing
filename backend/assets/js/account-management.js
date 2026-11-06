/* 帳號管理展示：記憶體內編輯，不代表正式權限已授予。 */
(() => {
  const agencies = ['國家住宅及都市更新中心','內政部國土管理署','新北市政府','臺北市政府','桃園市政府','臺中市政府','臺南市政府','高雄市政府'];
  const names = ['張忠政','張大富','張曉雯','劉欣慧','王怡君','林志明','陳怡安','李雅雯','陳怡君','王雅婷','張家豪','李佳蓉','黃柏翰','吳欣怡','陳建宏','林佳穎','陳明德','黃淑芬','劉俊宏','蔡雅玲','吳志成','李佩珊','王建文','林美華'];
  const authTypes = ['自然人憑證','行動自然人憑證','健保卡號與身分證字號比對'];
  const accounts = names.map((name,i) => ({key:i,name,nationalId:i===0?'B134567890':i===3?'A287654329':'A'+String(100000000+i),phone:'09'+String(10000000+i),email:'member'+String(i+1).padStart(2,'0')+'@example.com',verified:i%4!==0,verifiedAt:i%4!==0?'2026/10/08 10:30:00':null,authType:authTypes[i%3],authAt:'2026/10/08 09:20:00',active:i%7!==6,role:i<4||i%3===0?'民眾':'機關',agency:i<4||i%3===0?'':agencies[i%agencies.length],agencyRole:i<4||i%3===0?'':i%2?'查調授權人員':'一般機關人員'}));
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const badge = (text,ok) => '<span class="badge rounded-pill text-wrap '+(ok?'account-badge':'account-muted')+'">'+esc(text)+'</span>';
  for (const id of ['filterAgency','editAgency']) $(id).insertAdjacentHTML('beforeend',agencies.map(a=>'<option>'+esc(a)+'</option>').join(''));
  const statusIcon = (ok, yes, no, positive='fa-circle-check', negative='fa-circle-xmark') => '<span class="account-status '+(ok?'is-positive':'is-negative')+'" role="img" aria-label="'+esc(ok?yes:no)+'" title="'+esc(ok?yes:no)+'"><i class="fa-solid '+(ok?positive:negative)+'" aria-hidden="true"></i></span>';
  let activeRole='民眾';
  let page=1, matches=accounts, editing=null, readOnly=false;
  function render(){
    const agency=activeRole==='機關';
    const labels=['真實姓名','身分證／居留證號','聯絡手機','電子信箱',...(agency?['機關名稱','機關角色']:[]),'帳號狀態','操作'];
    $('accountHead').innerHTML='<tr>'+labels.map(label=>'<th scope="col" class="text-wrap">'+label+'</th>').join('')+'</tr>';
    $('accountTable').classList.toggle('is-agency',agency);
    $('accountTable').querySelector('caption').textContent=activeRole+'帳號管理清單';
    const total=matches.length,pages=Math.max(1,Math.ceil(total/20));page=Math.min(page,pages);
    $('accountCount').textContent='共 '+total+' 筆帳號'+(total?'，顯示第 '+((page-1)*20+1)+'–'+Math.min(page*20,total)+' 筆（每頁 20 筆）':'');
    $('accountRows').innerHTML=matches.slice((page-1)*20,page*20).map(a=>{
      const cells=[esc(a.name),esc(a.nationalId),esc(a.phone),'<div class="account-email">'+statusIcon(a.verified,'信箱已驗證','信箱未驗證','fa-circle-check','fa-circle-exclamation')+'<span class="email-address">'+esc(a.email)+'</span></div>',...(agency?[esc(a.agency||'--'),badge(a.agencyRole,a.agencyRole==='查調授權人員')]:[]),statusIcon(a.active,'帳號啟用','帳號停用','fa-circle-check','fa-ban'),'<div class="d-flex flex-wrap gap-2"><button class="btn btn-sm btn-outline-primary" data-bs-toggle="modal" data-bs-target="#accountModal" data-key="'+a.key+'" data-mode="view" aria-label="檢視'+esc(a.name)+'">檢視</button><button class="btn btn-sm btn-outline-primary" data-bs-toggle="modal" data-bs-target="#accountModal" data-key="'+a.key+'" data-mode="edit" aria-label="編輯'+esc(a.name)+'">編輯</button></div>'];
      return '<tr>'+cells.map((c,i)=>'<td data-th="'+labels[i]+'">'+c+'</td>').join('')+'</tr>';
    }).join('')||'<tr><td colspan="'+labels.length+'" class="text-center">查無符合條件的帳號。</td></tr>';
    const link=(n,label,content,disabled=false)=>'<li class="'+(disabled?'disabled':n===page&&content===String(n)?'active':'')+'"><a href="#accountTable" data-page="'+n+'" aria-label="'+label+'"'+(disabled?' aria-disabled="true" tabindex="-1"':n===page&&content===String(n)?' aria-current="page"':'')+'>'+content+'</a></li>';
    $('accountPagination').innerHTML=link(page-1,'上一頁','<i class="fas fa-chevron-left" aria-hidden="true"></i>',page===1)+Array.from({length:pages},(_,i)=>link(i+1,'第 '+(i+1)+' 頁',String(i+1))).join('')+link(page+1,'下一頁','<i class="fas fa-chevron-right" aria-hidden="true"></i>',page===pages);
  }
  function filter(){
    const q=$('accountKeyword').value.trim().toLowerCase();
    matches=accounts.filter(a=>[a.name,a.nationalId,a.phone,a.email].some(v=>v.toLowerCase().includes(q))&&a.role===activeRole&&(activeRole!=='機關'||!$('filterAgency').value||a.agency===$('filterAgency').value)&&(activeRole!=='機關'||!$('filterAgencyRole').value||a.agencyRole===$('filterAgencyRole').value)&&(!$('filterStatus').value||String(Number(a.active))===$('filterStatus').value));page=1;render();
  }
  $('accountFilter').addEventListener('submit',e=>{e.preventDefault();filter();});
  $('accountFilter').addEventListener('reset',e=>{e.preventDefault();for(const id of ['accountKeyword','filterAgency','filterAgencyRole','filterStatus'])$(id).value='';filter();});
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
  $('accountPagination').addEventListener('click',e=>{const a=e.target.closest('[data-page]');if(!a)return;e.preventDefault();if(a.getAttribute('aria-disabled')==='true')return;page=Number(a.dataset.page);render();$('accountPagination').querySelector('[aria-current="page"]')?.focus();});
  function roleFields(){const agency=$('editRole').value==='機關';for(const id of ['editAgency','editAgencyRole']){$(id+'Wrap').hidden=!agency;$(id).disabled=readOnly||!agency;$(id).required=agency;}$('accountPermission').textContent=!agency?'民眾帳號：不具後台機關或查調資料檢視權限。':$('editAgencyRole').value==='查調授權人員'?'查調授權人員：具一般機關功能及所屬機關案件的查調資料檢視權限。':'一般機關人員：可使用一般機關功能，不具查調資料檢視權限。';}
  $('editRole').addEventListener('change',roleFields);$('editAgencyRole').addEventListener('change',roleFields);
  $('accountModal').addEventListener('show.bs.modal',e=>{
    editing=accounts.find(a=>a.key===Number(e.relatedTarget?.dataset.key));if(!editing){e.preventDefault();return;}
    readOnly=e.relatedTarget.dataset.mode==='view';$('accountModalTitle').textContent=(readOnly?'檢視':'編輯')+'帳號資料';$('accountSave').hidden=readOnly;
    const values={editName:editing.name,editId:editing.nationalId,editPhone:editing.phone,editEmail:editing.email,editRole:editing.role,editAgency:editing.agency||agencies[0],editAgencyRole:editing.agencyRole||'一般機關人員',editStatus:editing.active?'啟用':'停用'};
    for(const [id,v]of Object.entries(values)){$(id).value=v;$(id).disabled=readOnly||id==='editId';}
    updateEmailVerification();
    $('accountVerification').innerHTML=[['首次身分驗證方式',editing.authType],['首次身分驗證時間',editing.authAt]].map(([k,v])=>'<div class="col-md-6"><dt class="form-label">'+k+'</dt><dd>'+esc(v)+'</dd></div>').join('');roleFields();
  });
  function updateEmailVerification(){
    const verified=editing.verified&&$('editEmail').value.trim()===editing.email;
    $('editEmailVerification').innerHTML=statusIcon(verified,'信箱已驗證','信箱未驗證','fa-circle-check','fa-circle-exclamation');
    $('editEmailVerifiedAt').textContent=verified?'驗證時間：'+editing.verifiedAt:'信箱尚未驗證';
  }
  $('editEmail').addEventListener('input',updateEmailVerification);
  $('accountEditForm').addEventListener('submit',e=>{e.preventDefault();if(!editing||readOnly||!e.target.reportValidity())return;const email=$('editEmail').value.trim(),agency=$('editRole').value==='機關';if(!agencies.includes($('editAgency').value)&&agency)return;
    if(editing.email!==email){editing.verified=false;editing.verifiedAt=null;}
    Object.assign(editing,{name:$('editName').value.trim(),phone:$('editPhone').value.trim(),email,role:$('editRole').value,agency:agency?$('editAgency').value:'',agencyRole:agency?$('editAgencyRole').value:'',active:$('editStatus').value==='啟用'});
    filter();$('accountMessage').innerHTML='<div class="alert alert-success">已更新「'+esc(editing.name)+'」的示範資料。</div>';bootstrap.Modal.getInstance($('accountModal')).hide();
  });
  selectTab(tabs[0]);
})();
