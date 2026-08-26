(function(){
  const mainMenuLinks=[...document.querySelectorAll('.member-nav a,.site-mobile-nav>a')];
  mainMenuLinks.forEach(link=>{
    const label=link.textContent.trim();
    if(label==='需求登記'||label==='申請社宅'||label==='操作紀錄'){
      link.remove();
      return;
    }
    if(link.getAttribute('href')==='data.html'||label==='資料登記'||label==='登記申請')link.textContent='登記申請社宅';
  });

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
        <a class="account-menu-item" role="menuitem" href="data.html">編輯申請資料</a>
        <a class="account-menu-item" role="menuitem" href="questionnaire.html">編輯居住需求/政策回饋</a>
        <button class="account-menu-item" role="menuitem" type="button">操作歷程</button>
        <div class="account-menu-divider" aria-hidden="true"></div>
        <a class="account-menu-item management" role="menuitem" href="admin/home-admin.html">營運管理平台</a>
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
