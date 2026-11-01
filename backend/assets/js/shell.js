/* 模板外框行為；所有未串接操作明確維持示意狀態。 */
function showDemoMessage(message) {
  const modal = document.getElementById('demoModal');
  const trigger = document.activeElement;
  const heatTooltip = document.getElementById('heatTooltip');
  if (heatTooltip) heatTooltip.style.display = 'none';
  document.getElementById('demoModalMessage').textContent = message;
  modal.addEventListener('hidden.bs.modal', () => trigger?.focus({ preventScroll: true }), { once: true });
  bootstrap.Modal.getOrCreateInstance(modal).show();
}

$(function () {
  const navigation = document.querySelector('.backend-navigation');
  const desktopMenu = document.getElementById('desktopMenu');
  const mobileMenu = document.getElementById('mobileMenu');
  const navCollapse = document.getElementById('backendNav');
  // 選單開闔由模板 menu.js 負責；此處僅同步可及性狀態。
  desktopMenu.addEventListener('click', () => {
    const closed = navigation.classList.contains('isMenuClose');
    desktopMenu.setAttribute('aria-expanded', String(!closed));
    desktopMenu.setAttribute('aria-label', closed ? '展開側邊選單' : '收合側邊選單');
  });
  const menuToggles = navigation.querySelectorAll('.has-children');
  menuToggles.forEach(toggle => {
    toggle.addEventListener('click', () => toggle.setAttribute('aria-expanded', String(toggle.parentElement.classList.contains('show'))));
    toggle.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle.click(); }
    });
  });
  const closeMobileMenu = () => bootstrap.Collapse.getInstance(navCollapse)?.hide();
  navCollapse.addEventListener('shown.bs.collapse', () => mobileMenu.setAttribute('aria-label', '關閉後臺選單'));
  navCollapse.addEventListener('hidden.bs.collapse', () => mobileMenu.setAttribute('aria-label', '開啟後臺選單'));
  navigation.querySelectorAll('a[href]').forEach(link => link.addEventListener('click', () => {
    if (window.innerWidth < 992) closeMobileMenu();
  }));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navCollapse.classList.contains('show')) {
      closeMobileMenu();
      mobileMenu.focus();
    }
  });
  window.matchMedia('(min-width: 992px)').addEventListener('change', event => {
    if (event.matches) closeMobileMenu();
  });
  function updateNavigation() {
    const links = [...navigation.querySelectorAll('a[href]')];
    const current = links.find(link => link.pathname === location.pathname && link.hash === location.hash)
      || links.find(link => link.pathname === location.pathname && !link.hash);
    links.forEach(link => {
      link.classList.toggle('active', link === current);
      if (link === current) link.setAttribute('aria-current', location.hash ? 'location' : 'page');
      else link.removeAttribute('aria-current');
    });
    $(current).parents('.sub-menu').show().parent('li').addClass('show');
    menuToggles.forEach(toggle => toggle.setAttribute('aria-expanded', String(toggle.parentElement.classList.contains('show'))));
  }
  updateNavigation();
  window.addEventListener('hashchange', updateNavigation);
  document.querySelectorAll('[data-operator-action]').forEach(button => button.addEventListener('click', () => {
    const action = button.dataset.operatorAction;
    if (action === 'logout') { location.href = '../index.html'; return; }
    showDemoMessage('示意：' + (action === 'profile' ? '開啟個人資料與帳號設定' : '開啟登入角色切換') + '。');
  }));
  // 原頁明細按鈕尚無後端；提供一致的示意回饋，避免無反應。
  document.querySelectorAll('.text-button, .monitor-table .btn').forEach(button => button.addEventListener('click', () => {
    const service = button.closest('tr')?.querySelector('td:nth-child(2)')?.textContent.trim();
    showDemoMessage('示意：' + (service ? service + ' — ' : '') + button.textContent.trim() + '。目前使用靜態展示資料，尚未串接監控服務。');
  }));
  document.getElementById('granularitySelect')?.addEventListener('change', event => {
    showDemoMessage('示意：切換為「' + event.target.value + '」時間粒度，目前熱區圖仍為示意資料。');
  });
  document.querySelectorAll('.heat-cell').forEach(cell => {
    const status = { g: '正常', y: '注意', r: '異常', b: '維護中', n: '無交易' };
    const statusLabel = Object.keys(status).find(key => cell.classList.contains(key));
    cell.setAttribute('aria-label', `${cell.dataset.service}，${cell.dataset.time}，${status[statusLabel]}，成功率 ${cell.dataset.rate}，異常 ${cell.dataset.error} 筆`);
    cell.addEventListener('focus', () => {
      const tooltip = document.getElementById('heatTooltip');
      const rect = cell.getBoundingClientRect();
      cell.dispatchEvent(new Event('mouseenter'));
      tooltip.style.left = Math.max(8, Math.min(rect.left, innerWidth - 238)) + 'px';
      tooltip.style.top = Math.max(8, Math.min(rect.bottom + 8, innerHeight - 130)) + 'px';
    });
    cell.addEventListener('blur', () => document.getElementById('heatTooltip').style.display = 'none');
  });
  const goTop = document.getElementById('goTop');
  goTop.addEventListener('click', event => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    document.getElementById('mainContent').focus({ preventScroll: true });
  });
});
