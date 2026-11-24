/* 開闔仍交由模板 menu.js；此處同步鍵盤與 ARIA 狀態。儀表板由 shell.js 處理。 */
$(function () {
  const navigation = document.getElementById('backendNavigation');
  if (!navigation) return;
  navigation.querySelectorAll('.has-children').forEach(toggle => {
    const sync = () => toggle.setAttribute('aria-expanded', String(toggle.parentElement.classList.contains('show')));
    sync();
    toggle.addEventListener('click', sync);
    toggle.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggle.click();
      }
    });
  });
});
