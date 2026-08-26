(function(){
  const body=document.body;
  const mobileMenu=document.getElementById('mobileMenu');
  const sidebarOverlay=document.getElementById('sidebarOverlay');
  const operatorBox=document.getElementById('operatorBox');
  const operatorMenu=document.getElementById('operatorMenu');
  const homeSwitch=document.getElementById('homeSwitch');
  const homeSwitchToggle=document.getElementById('homeSwitchToggle');

  const closeSidebar=()=>{
    body.classList.remove('sidebar-open');
    mobileMenu?.setAttribute('aria-expanded','false');
  };
  const closeOperator=()=>{
    operatorBox?.classList.remove('open');
    operatorMenu?.setAttribute('aria-expanded','false');
  };
  const closeHomeSwitch=()=>{
    homeSwitch?.classList.remove('open');
    homeSwitchToggle?.setAttribute('aria-expanded','false');
  };

  mobileMenu?.addEventListener('click',()=>{
    const isOpen=body.classList.toggle('sidebar-open');
    mobileMenu.setAttribute('aria-expanded',String(isOpen));
  });
  sidebarOverlay?.addEventListener('click',closeSidebar);
  document.querySelectorAll('.sidebar a').forEach(link=>link.addEventListener('click',()=>{
    if(window.innerWidth<=900)closeSidebar();
  }));

  operatorMenu?.addEventListener('click',event=>{
    event.stopPropagation();
    const isOpen=operatorBox.classList.toggle('open');
    operatorMenu.setAttribute('aria-expanded',String(isOpen));
  });

  homeSwitchToggle?.addEventListener('click',event=>{
    event.stopPropagation();
    const isOpen=homeSwitch.classList.toggle('open');
    homeSwitchToggle.setAttribute('aria-expanded',String(isOpen));
  });

  document.querySelectorAll('[data-operator-action]').forEach(button=>{
    button.addEventListener('click',()=>{
      const action=button.dataset.operatorAction;
      if(action==='logout'||action==='登出系統'){
        window.location.href='../index.html';
        return;
      }
      const actionText={profile:'開啟個人資料與帳號設定',role:'開啟登入角色切換'}[action]||action;
      alert(`示意：${actionText}。`);
    });
  });

  document.addEventListener('click',event=>{
    if(operatorBox&&!operatorBox.contains(event.target))closeOperator();
    if(homeSwitch&&!homeSwitch.contains(event.target))closeHomeSwitch();
  });
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    closeSidebar();
    closeOperator();
    closeHomeSwitch();
  });
})();
