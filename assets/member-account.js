(function(){
  const accountMenus=[];
  const closeAccountMenus=(except=null)=>{
    accountMenus.forEach(({button,panel})=>{
      if(panel===except)return;
      panel.hidden=true;
      button.setAttribute('aria-expanded','false');
    });
  };

  document.querySelectorAll('.login-user').forEach((container,index)=>{
    if(container.dataset.accountReady==='true')return;
    container.dataset.accountReady='true';
    container.classList.add('account-menu');
    const name=container.querySelector('strong')?.textContent.trim()||'陳ＯＯ';
    const menuId=`memberAccountMenu${index+1}`;
    container.innerHTML=`
      <button class="account-trigger" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="${menuId}">
        <span class="login-user-label">登入者</span><strong>${name}</strong><span class="account-chevron" aria-hidden="true"><i class="fa-solid fa-chevron-down"></i></span>
      </button>
      <div class="account-panel" id="${menuId}" role="menu" hidden>
        <a class="account-menu-item" role="menuitem" href="data.html?mode=edit">編輯申請資料</a>
        <a class="account-menu-item" role="menuitem" href="questionnaire.html">編輯居住需求</a>
        <a class="account-menu-item" role="menuitem" href="activity-log.html">操作紀錄</a>
        <div class="account-menu-divider" aria-hidden="true"></div>
        <a class="account-menu-item management" role="menuitem" href="admin/home-admin.html" target="_blank" rel="noopener noreferrer">營運管理平台 <span class="account-external-mark" aria-hidden="true">↗</span></a>
        <div class="account-menu-divider" aria-hidden="true"></div>
        <a class="account-menu-item logout" role="menuitem" href="index.html">登出</a>
      </div>`;
    const button=container.querySelector('.account-trigger');
    const panel=container.querySelector('.account-panel');
    accountMenus.push({button,panel});
    button.addEventListener('click',event=>{
      event.stopPropagation();
      const willOpen=panel.hidden;
      closeAccountMenus();
      panel.hidden=!willOpen;
      button.setAttribute('aria-expanded',String(willOpen));
    });
    panel.addEventListener('click',event=>event.stopPropagation());
  });

  document.addEventListener('click',()=>closeAccountMenus());
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape')closeAccountMenus();
  });
})();
