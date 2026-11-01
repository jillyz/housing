(function () {
  const navigation = document.querySelector('.admin-navigation');
  if (!navigation) return;
  const links = [...navigation.querySelectorAll('a[href]')];

  function updateCurrentMenu() {
    const currentUrl = new URL(window.location.href);
    const matches = link => {
      const target = new URL(link.href, currentUrl);
      return target.pathname === currentUrl.pathname && target.hash === currentUrl.hash;
    };
    const active = links.find(matches) || links.find(link => {
      const target = new URL(link.href, currentUrl);
      return target.pathname === currentUrl.pathname && !target.hash;
    });
    links.forEach(link => {
      link.classList.toggle('active', link === active);
      if (link === active) link.setAttribute('aria-current', currentUrl.hash ? 'location' : 'page');
      else link.removeAttribute('aria-current');
    });
    if (!active) return;
    let group = active.closest('details');
    while (group) {
      group.open = true;
      group = group.parentElement.closest('details');
    }
  }

  updateCurrentMenu();
  window.addEventListener('hashchange', updateCurrentMenu);
})();
