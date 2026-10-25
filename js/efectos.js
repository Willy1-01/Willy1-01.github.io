/* efectos.js -> preloader, menú a pantalla completa y aparición al hacer scroll.
   Sin librerías externas. Respeta "reducir movimiento" del sistema. */
(function () {
  var d = document, h = d.documentElement;
  var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  h.classList.add('js');
  d.body.insertAdjacentHTML('afterbegin', '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><symbol id="i-lock" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></symbol><symbol id="i-check" viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M9 12l2 2 4-4"/></symbol><symbol id="i-server" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="6" rx="1.5"/><rect x="4" y="14" width="16" height="6" rx="1.5"/><path d="M8 7h.01M8 17h.01"/></symbol><symbol id="i-target" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/></symbol><symbol id="i-alert" viewBox="0 0 24 24"><path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/></symbol><symbol id="i-sliders" viewBox="0 0 24 24"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></symbol><symbol id="i-clip" viewBox="0 0 24 24"><rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/></symbol><symbol id="i-loop" viewBox="0 0 24 24"><path d="M20 12a8 8 0 0 1-14 5.3M4 12a8 8 0 0 1 14-5.3"/><path d="M18 3v4h-4M6 21v-4h4"/></symbol><symbol id="i-laptop" viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="10" rx="1.5"/><path d="M3 19h18"/></symbol><symbol id="i-users" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3 19c0-3.3 2.7-6 6-6s6 2.7 6 6M16 6a3 3 0 0 1 0 6M18 14c2 .7 3 2.5 3 5"/></symbol><symbol id="i-link" viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1"/></symbol><symbol id="i-help" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.6 9.5a2.5 2.5 0 1 1 3.6 2.2c-.8.4-1.2 1-1.2 1.8M12 17h.01"/></symbol><symbol id="i-layers" viewBox="0 0 24 24"><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/></symbol><symbol id="i-book" viewBox="0 0 24 24"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/></symbol></defs></svg>');

  /* Intro: los datos se cifran y forman el candado (siempre en la portada; en el resto, una vez por sesión) */
  var p = d.querySelector('.precarga');
  if (p) {
    var visto = false;
    try { visto = sessionStorage.getItem('nye-precarga'); } catch (e) {}
    if (quieto || (visto && !d.querySelector('.portada'))) {
      p.remove();
    } else {
      h.classList.add('cargando');
      var NS = 'http://www.w3.org/2000/svg', g = p.querySelector('.p-datos'), partes = p.querySelectorAll('.p-candado > *'), reparto = [10, 26, 8, 4], pts = [], glifos = [];
      Array.prototype.forEach.call(partes, function (el, k) {
        var len = el.getTotalLength(), n = reparto[k] || 4;
        for (var i = 0; i < n; i++) { var q = el.getPointAtLength(len * i / n); pts.push([q.x, q.y]); }
      });
      var frase = 'datos del cliente clave contrato acceso cuenta 2026';
      pts.forEach(function (q, i) {
        var t = d.createElementNS(NS, 'text');
        t.textContent = frase.charAt((i * 7) % frase.length);
        t.style.transform = 'translate(' + (Math.random() * 220 - 10) + 'px,' + (Math.random() * 190 + 10) + 'px)';
        g.appendChild(t); glifos.push([t, q]);
      });
      requestAnimationFrame(function () { g.classList.add('ver'); });
      setTimeout(function () {
        glifos.forEach(function (a, i) {
          a[0].textContent = Math.random() < 0.5 ? '0' : '1'; a[0].classList.add('cifrado');
          a[0].style.transitionDelay = (i % 8) * 30 + 'ms';
          a[0].style.transform = 'translate(' + a[1][0] + 'px,' + a[1][1] + 'px)';
        });
      }, 700);
      setTimeout(function () { p.classList.add('armado'); }, 1900);
      var t0 = Date.now(), listo = d.readyState === 'complete';
      window.addEventListener('load', function () { listo = true; });
      (function esperar() {
        if (Date.now() - t0 < 2500 || !listo) { setTimeout(esperar, 80); return; }
        p.classList.add('listo');
        setTimeout(function () { p.classList.add('fuera'); h.classList.remove('cargando'); }, 450);
        setTimeout(function () { p.remove(); }, 1600);
        try { sessionStorage.setItem('nye-precarga', '1'); } catch (e) {}
      })();
    }
  }

  /* Menú a pantalla completa */
  var b = d.querySelector('.menu-btn'), m = d.getElementById('menu');
  function abrir(o) {
    h.classList.toggle('menu-abierto', o);
    b.setAttribute('aria-expanded', o);
    b.setAttribute('aria-label', o ? 'Cerrar menú' : 'Abrir menú');
    m.setAttribute('aria-hidden', !o);
  }
  if (b && m) {
    b.addEventListener('click', function () { abrir(!h.classList.contains('menu-abierto')); });
    m.addEventListener('click', function (e) { if (e.target.closest('a')) abrir(false); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') abrir(false); });
  }

  /* Línea de tiempo: la línea se completa al avanzar */
  var ruta = d.querySelector('.ruta');
  if (ruta) {
    var avance = function () {
      var r = ruta.getBoundingClientRect(), vh = window.innerHeight;
      ruta.style.setProperty('--prog', quieto ? 1 : Math.max(0, Math.min(1, (vh * 0.8 - r.top) / (vh * 0.45))));
    };
    avance(); window.addEventListener('scroll', avance, { passive: true }); window.addEventListener('resize', avance);
  }

  /* Aparición al hacer scroll */
  var sel = '.portada-texto,.bloque>h2,.bloque>.intro,.tarjeta,.pilar,.pasos>li,.cifras>div,.cierre>*,' +
            'main>h1,main>p,.sec>h2,.sec>p,.sec li,details,.pilar-card,.tarjeta-info,.content-box,.cta,.ilustracion,.practica article,.venn,.sgsi,.sim,.auto';
  var items = d.querySelectorAll(sel);
  if (!('IntersectionObserver' in window) || quieto) return;
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('visible');
      io.unobserve(e.target);
      (function (t) { setTimeout(function () { t.style.transitionDelay = ''; }, 900); })(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
  Array.prototype.forEach.call(items, function (el) {
    var i = Array.prototype.indexOf.call(el.parentNode.children, el);
    el.style.transitionDelay = (i % 4) * 90 + 'ms';
    el.classList.add('reveal');
    io.observe(el);
  });
})();
