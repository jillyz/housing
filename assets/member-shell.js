(function(){
  const siteHeader=document.querySelector('.site-header');
  const mobileMenu=document.querySelector('.site-mobile-menu');
  const mobileNav=document.getElementById('memberMobileNav');

  function closeMemberMenu(){
    if(!mobileMenu||!mobileNav)return;
    mobileNav.classList.remove('open');
    mobileMenu.setAttribute('aria-expanded','false');
    mobileMenu.textContent='☰';
    mobileMenu.setAttribute('aria-label','開啟選單');
  }

  if(siteHeader){
    const updateHeader=()=>siteHeader.classList.toggle('is-scrolled',window.scrollY>8);
    updateHeader();
    window.addEventListener('scroll',updateHeader,{passive:true});
  }

  if(mobileMenu&&mobileNav){
    mobileMenu.addEventListener('click',()=>{
      const isOpen=mobileNav.classList.toggle('open');
      mobileMenu.setAttribute('aria-expanded',String(isOpen));
      mobileMenu.textContent=isOpen?'×':'☰';
      mobileMenu.setAttribute('aria-label',isOpen?'關閉選單':'開啟選單');
    });
    mobileNav.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMemberMenu));
    document.addEventListener('click',event=>{if(!event.target.closest('.site-main-nav'))closeMemberMenu()});
    window.addEventListener('resize',()=>{if(window.innerWidth>1180)closeMemberMenu()});
  }

  const notificationButtons=[...document.querySelectorAll('.member-icon[aria-label="查看通知"]')];
  if(notificationButtons.length&&document.querySelector('.site-main-nav')){
    const notificationPanel=document.createElement('section');
    notificationPanel.className='notification-panel';
    notificationPanel.id='memberNotificationPanel';
    notificationPanel.setAttribute('role','dialog');
    notificationPanel.setAttribute('aria-label','通知中心');
    notificationPanel.hidden=true;
    notificationPanel.innerHTML=`
      <div class="notification-head"><strong>通知中心</strong><span class="notification-total">3 則未讀</span></div>
      <ul class="notification-list">
        <li class="notification-item"><div class="notification-copy"><strong>申請進度更新</strong><p>您的社宅申請已成功送出，目前正在進行資格審查。</p><span class="notification-time">10 分鐘前</span></div></li>
        <li class="notification-item"><div class="notification-copy"><strong>補件期限提醒</strong><p>尚有一項證明文件待補，請於 7 月 22 日前完成上傳。</p><span class="notification-time">今天 09:30</span></div></li>
        <li class="notification-item"><div class="notification-copy"><strong>符合需求的招租通知</strong><p>臺北市有新的社會住宅開始受理申請，請查看住宅資訊。</p><span class="notification-time">昨天</span></div></li>
      </ul>
      <div class="notification-footer"><a href="progress.html">查看申請進度與補件</a></div>`;
    document.querySelector('.site-main-nav').appendChild(notificationPanel);

    const closeNotifications=()=>{
      notificationPanel.hidden=true;
      notificationButtons.forEach(button=>button.setAttribute('aria-expanded','false'));
    };

    notificationButtons.forEach(button=>{
      button.dataset.notificationButton='';
      button.setAttribute('aria-label','查看通知，3 則未讀');
      button.setAttribute('aria-controls',notificationPanel.id);
      button.setAttribute('aria-expanded','false');
      button.addEventListener('click',event=>{
        event.stopPropagation();
        const willOpen=notificationPanel.hidden;
        closeNotifications();
        if(willOpen){
          notificationPanel.hidden=false;
          button.setAttribute('aria-expanded','true');
        }
      });
    });
    notificationPanel.addEventListener('click',event=>event.stopPropagation());
    document.addEventListener('click',closeNotifications);
    document.addEventListener('keydown',event=>{if(event.key==='Escape')closeNotifications()});
  }
})();
