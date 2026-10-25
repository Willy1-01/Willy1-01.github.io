/* interactivo.js -> pestañas (perfil, cláusulas, controles), mini reto, índice lateral y nota de edición */
(function () {
  var d = document;

  /* Pestañas accesibles */
  d.querySelectorAll('[data-tabs]').forEach(function (g) {
    var ts = g.querySelectorAll('[role="tab"]'), ps = g.querySelectorAll('[role="tabpanel"]');
    function elegir(i) {
      ts.forEach(function (t, k) { t.setAttribute('aria-selected', k === i); t.tabIndex = k === i ? 0 : -1; });
      ps.forEach(function (p, k) { p.hidden = k !== i; });
    }
    ts.forEach(function (t, i) {
      t.addEventListener('click', function () { elegir(i); });
      t.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        var n = (i + (e.key === 'ArrowRight' ? 1 : ts.length - 1)) % ts.length;
        elegir(n); ts[n].focus();
      });
    });
    elegir(0);
  });

  /* Mini reto */
  var reto = d.querySelector('.reto');
  if (reto) {
    var bs = reto.querySelectorAll('button'), ex = d.querySelectorAll('.expl p');
    bs.forEach(function (b, i) {
      b.addEventListener('click', function () {
        bs.forEach(function (x, k) { x.classList.toggle('elegida', k === i); x.classList.toggle('correcta', i === 1 && k === i); });
        ex.forEach(function (p, k) { p.hidden = k !== i; });
      });
    });
  }

  /* Tres pilares: seleccionar uno resalta círculo y tarjeta y muestra su ejemplo */
  var movReducido = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ps = d.querySelectorAll('.pilares .pilar'), vs = d.querySelectorAll('.pilares .vp'), secP = d.querySelector('.pilares');
  function pilar(i, circulo) {
    var ya = ps[i].classList.contains('sel');
    ps.forEach(function (p, k) {
      var on = !ya && k === i;
      p.classList.toggle('sel', on); p.setAttribute('aria-pressed', on);
      vs[k].classList.toggle('sel', on); vs[k].setAttribute('aria-pressed', on);
    });
    secP.classList.toggle('hay-sel', !ya);
    if (!ya && circulo && window.innerWidth < 900) ps[i].scrollIntoView({ behavior: movReducido ? 'auto' : 'smooth', block: 'center' });
    if (!ya) hito(3);
  }
  [ps, vs].forEach(function (lista, tipo) {
    lista.forEach(function (el, i) {
      el.addEventListener('click', function () { pilar(i, tipo === 1); });
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pilar(i, tipo === 1); } });
    });
  });

  /* Invitación discreta: una vez por visita; escritorio = intención de salida; móvil = tras una interacción */
  var pag = location.pathname.split('/').pop(), vista = false, acum = 0, t0 = Date.now();
  try { vista = sessionStorage.getItem('nye-invitacion'); } catch (e) {}
  var tactil = !(window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches);
  function invitar() {
    if (vista || pag === 'registro.html') return;
    if (d.documentElement.classList.contains('cargando') || d.documentElement.classList.contains('menu-abierto')) { setTimeout(invitar, 1500); return; }
    vista = true; try { sessionStorage.setItem('nye-invitacion', '1'); } catch (e) {}
    var b = d.createElement('aside');
    b.className = 'invitacion'; b.setAttribute('role', 'region'); b.setAttribute('aria-label', 'Invitación');
    b.innerHTML = '<button class="inv-x" type="button" aria-label="Cerrar">×</button><strong>¿Te ayudó esta guía?</strong><p>Crea tu cuenta o comprueba tu nivel con una autoevaluación de un minuto.</p><div class="acciones"><a class="btn btn-cian" href="registro.html">Regístrate</a>' + (pag === 'practica.html' ? '' : '<a class="btn btn-borde" href="practica.html#autoevaluacion">Haz una autoevaluación rápida</a>') + '</div>';
    d.body.appendChild(b);
    function cerrar() { b.remove(); d.removeEventListener('keydown', tecla); }
    function tecla(e) { if (e.key === 'Escape') cerrar(); }
    b.querySelector('.inv-x').addEventListener('click', cerrar); d.addEventListener('keydown', tecla);
    if (window.nyeAplicar) window.nyeAplicar();
    requestAnimationFrame(function () { b.classList.add('ver'); });
  }
  function hito(peso) { if (!tactil || vista) return; acum += peso; if (acum >= 3) setTimeout(invitar, 900); }
  if (tactil) {
    d.addEventListener('click', function (e) { if (e.target.closest('.reto button')) hito(3); else if (e.target.closest('.mapa .tab')) hito(1); });
    d.addEventListener('change', function (e) { if (e.target.closest('.auto')) hito(1); });
    var fin = d.querySelector('footer.pie');
    if (fin && 'IntersectionObserver' in window) new IntersectionObserver(function (es) { if (es[0].isIntersecting && Date.now() - t0 > 8000) hito(3); }).observe(fin);
  } else {
    d.addEventListener('mouseout', function (e) { if (!e.relatedTarget && e.clientY <= 0 && Date.now() - t0 > 8000) invitar(); });
  }

  /* Nota de edición de la norma */
  var pie = d.querySelector('footer');
  if (pie) {
    var nota = d.createElement('aside');
    nota.className = 'nota-edicion';
    nota.innerHTML = '<strong>Edición de la norma</strong><p>Esta guía se basa en la edición ISO/IEC 27001:2022 y su enmienda de 2024. Contenido revisado el 20 de octubre de 2026.</p><p>Para decisiones de certificación, consulta la norma oficial y a tu organismo certificador.</p>';
    pie.parentNode.insertBefore(nota, pie);
  }

  /* Índice lateral con la sección actual resaltada (pantallas anchas; no en la portada) */
  if (d.querySelector('.portada')) return;
  var hs = Array.prototype.filter.call(d.querySelectorAll('main h2, .contenedor h2, .banda-clara h2'), function (h) { return !h.closest('.menu-pantalla'); });
  if (hs.length < 3) return;
  var rail = d.createElement('nav'), items = '';
  rail.className = 'rail'; rail.setAttribute('aria-label', 'En esta página');
  hs.forEach(function (h, i) { if (!h.id) h.id = 'sec-' + (i + 1); items += '<li><a href="#' + h.id + '">' + h.textContent + '</a></li>'; });
  rail.innerHTML = '<b>En esta página</b><ol>' + items + '</ol>';
  d.body.appendChild(rail);
  var links = rail.querySelectorAll('a');
  function actualizar() {
    var vh = window.innerHeight, actual = 0;
    hs.forEach(function (h, i) { if (h.getBoundingClientRect().top < vh * 0.4) actual = i; });
    links.forEach(function (a, i) { a.classList.toggle('on', i === actual); });
    var total = d.documentElement.scrollHeight - vh;
    rail.style.setProperty('--lectura', (total > 0 ? Math.min(100, window.scrollY / total * 100) : 0) + '%');
  }
  actualizar(); window.addEventListener('scroll', actualizar, { passive: true }); window.addEventListener('resize', actualizar);
})();
