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
    const name=container.querySelector('strong')?.textContent.trim()||'陳ＯＯ';
    const mobileMember=container.closest('.mobile-member');
    const mobileNav=container.closest('.site-mobile-nav');

    if(mobileMember&&mobileNav){
      const currentPage=(window.location.pathname.split('/').pop()||'').toLowerCase();
      const activeClass=page=>currentPage===page?' active':'';
      const activeCurrent=page=>currentPage===page?' aria-current="page"':'';

      if(!mobileNav.querySelector('.mobile-account-summary')){
        mobileNav.insertAdjacentHTML('afterbegin',`
          <div class="mobile-account-summary"><span>登入者</span><strong>${name}</strong></div>`);
      }

      mobileMember.className='mobile-account-section';
      mobileMember.innerHTML=`
        <button class="account-menu-item mobile-notification-toggle" type="button" aria-expanded="false" aria-controls="mobileAccountNotifications">
          <span>通知中心</span><span class="mobile-notification-meta"><b>3</b><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></span>
        </button>
        <div class="mobile-account-notifications" id="mobileAccountNotifications" hidden>
          <a class="mobile-notification-item" href="progress.html"><strong>申請進度更新</strong><span>申請已成功送出，目前正在進行資格審查。</span><small>10 分鐘前</small></a>
          <a class="mobile-notification-item" href="supplement.html"><strong>補件期限提醒</strong><span>尚有一項證明文件待補，請於期限前完成上傳。</span><small>今天 09:30</small></a>
          <a class="mobile-notification-item" href="housing-map.html"><strong>符合需求的招租通知</strong><span>有新的社會住宅開始受理申請。</span><small>昨天</small></a>
        </div>
        <div class="account-menu-divider" aria-hidden="true"></div>
        <a class="account-menu-item${activeClass('data.html')}" href="data.html?mode=edit"${activeCurrent('data.html')}>編輯申請資料</a>
        <a class="account-menu-item${activeClass('questionnaire.html')}" href="questionnaire.html"${activeCurrent('questionnaire.html')}>編輯居住需求</a>
        <a class="account-menu-item${activeClass('activity-log.html')}" href="activity-log.html"${activeCurrent('activity-log.html')}>操作紀錄</a>
        <div class="account-menu-divider" aria-hidden="true"></div>
        <a class="account-menu-item management" href="admin/home-admin.html" target="_blank" rel="noopener noreferrer">營運管理平台 <span class="account-external-mark" aria-hidden="true">↗</span></a>
        <div class="account-menu-divider" aria-hidden="true"></div>
        <a class="account-menu-item logout" href="index.html">登出</a>`;

      const mobileNotificationToggle=mobileMember.querySelector('.mobile-notification-toggle');
      const mobileNotifications=mobileMember.querySelector('.mobile-account-notifications');
      mobileNotificationToggle?.addEventListener('click',()=>{
        const willOpen=mobileNotifications.hidden;
        mobileNotifications.hidden=!willOpen;
        mobileNotificationToggle.setAttribute('aria-expanded',String(willOpen));
      });

      mobileMember.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{
        mobileNav.classList.remove('open');
        const mobileMenu=document.querySelector('.site-mobile-menu');
        if(mobileMenu){
          mobileMenu.setAttribute('aria-expanded','false');
          mobileMenu.textContent='☰';
          mobileMenu.setAttribute('aria-label','開啟選單');
        }
      }));
      return;
    }

    container.classList.add('account-menu');
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
