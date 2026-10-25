/* Entrada escalonada de las tarjetas del equipo */
(function () {
  var items = document.querySelectorAll('.equipo .miembro');
  if (!items.length) return;
  document.documentElement.classList.add('js');
  items.forEach(function (el, i) { el.style.setProperty('--n', i); });

  if (!('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('visible'); });
    return;
  }
  var obs = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.2 });
  items.forEach(function (el) { obs.observe(el); });
})();
