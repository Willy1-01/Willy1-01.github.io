/* practica.js -> diagrama del SGSI, simulador de riesgo y autoevaluación */
(function () {
  var d = document, $ = function (s) { return d.querySelector(s); };
  var traducir = function () { if (window.nyeAplicar) window.nyeAplicar(); };

  /* Diagrama del SGSI */
  var info = [
    ['Contexto', 'Entiende tu organización, quién depende de tu información y qué requisitos debes cumplir. Aquí se define el alcance del sistema.'],
    ['Riesgos', 'Identifica amenazas y vulnerabilidades, estima su probabilidad e impacto y decide cuáles tratar primero.'],
    ['Controles', 'Aplica medidas concretas del Anexo A para reducir los riesgos: técnicas, físicas, organizativas y de personas.'],
    ['Auditoría', 'Comprueba, con revisiones internas y con un organismo independiente, que el sistema funciona y cumple la norma.'],
    ['Mejora continua', 'Corrige las no conformidades y ajusta el sistema para que mejore en cada ciclo.']
  ];
  var nodos = d.querySelectorAll('.nodo');
  function elegir(i) {
    nodos.forEach(function (n, k) { n.classList.toggle('on', k === i); });
    $('.sgsi-info h3').textContent = info[i][0];
    $('.sgsi-info p').textContent = info[i][1];
    traducir();
  }
  nodos.forEach(function (n, i) {
    n.addEventListener('click', function () { elegir(i); });
    n.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); elegir(i); } });
  });

  /* Simulador de riesgo */
  var ctl = d.querySelectorAll('.sim-controles input');
  function calcular() {
    var p = 4, i = 4;
    ctl.forEach(function (c) { if (c.checked) { p -= +c.dataset.p || 0; i -= +c.dataset.i || 0; } });
    p = Math.max(1, p); i = Math.max(1, i);
    var r = p * i, n = r <= 4 ? ['bajo', 'Bajo'] : r <= 9 ? ['medio', 'Medio'] : r <= 14 ? ['alto', 'Alto'] : ['critico', 'Crítico'];
    $('#barP').style.width = p * 20 + '%'; $('#valP').textContent = p + '/5';
    $('#barI').style.width = i * 20 + '%'; $('#valI').textContent = i + '/5';
    $('#nivel').dataset.nivel = n[0]; $('#nivelTxt').textContent = n[1];
    $('#simTxt').textContent = r <= 4 ? 'Con estos controles el riesgo queda en un nivel que la organización puede aceptar y vigilar.'
      : ctl[0].checked || ctl[1].checked || ctl[2].checked || ctl[3].checked || ctl[4].checked ? 'El riesgo baja, pero todavía es alto. Activa más controles.'
      : 'Sin controles, una cuenta comprometida es probable y puede causar mucho daño.';
    traducir();
  }
  ctl.forEach(function (c) { c.addEventListener('change', calcular); });
  calcular();

  /* Autoevaluación */
  var qs = d.querySelectorAll('.auto-preguntas input, .auto > label input');
  function evaluar() {
    var n = 0; qs.forEach(function (c) { if (c.checked) n++; });
    $('#autoNum').textContent = n + (window.nyeLang && nyeLang() === 'en' ? ' of ' : ' de ') + qs.length; traducir();
    $('#autoBar').style.width = (n / qs.length * 100) + '%';
    $('#autoTxt').textContent = n <= 2 ? 'Estás en la etapa inicial. Empieza por definir tu alcance y evaluar tus riesgos.'
      : n <= 4 ? 'Buen avance: ya tienes parte de la base. Revisa lo que falta con la guía de estructura.'
      : 'Muy buena base. Te conviene prepararte para una auditoría interna.';
    traducir();
  }
  qs.forEach(function (c) { c.addEventListener('change', evaluar); });
  evaluar();
  document.addEventListener('nye-idioma', function () { calcular(); evaluar(); });
})();
