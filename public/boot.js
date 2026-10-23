/* Runs before first paint (sync, in <head>). Marks JS as available so
   stamp-in elements can start hidden, and keeps the ink flood covering the
   screen when we arrive from an ink transition, so the new page never flashes.
   All three states fail open: if the page scripts never take over, timers lift them. */
(function () {
  var root = document.documentElement;
  var boot = (window.__medadBoot = {});
  root.classList.add('js');
  boot.js = setTimeout(function () { root.classList.remove('js'); }, 3000);
  try {
    if (sessionStorage.getItem('medad-flood') === '1') {
      sessionStorage.removeItem('medad-flood');
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        root.setAttribute('data-flood', '');
        boot.flood = setTimeout(function () { root.removeAttribute('data-flood'); }, 2500);
      }
    }
    // First visit to the home page in this session: hold the hero for the ink opener.
    if (location.pathname === '/' && !sessionStorage.getItem('medad-opened') &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.classList.add('opening');
      boot.opening = setTimeout(function () { root.classList.remove('opening'); }, 5000);
    }
  } catch (e) { /* storage blocked: plain navigation */ }
})();
