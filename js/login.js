/* login.js
   Inicio de sesión con Supabase Auth: se entra con el mismo correo y la misma
   contraseña con los que la persona se registró en registro.html.

   Instalación:
   1. Guardar este archivo como js/login.js
   2. En login.html, al final del <body> (después de efectos.js):
        <script src="js/login.js"></script>
   3. (Opcional) js/sesion.js en todas las páginas, para que el menú muestre
      "Cerrar sesión" cuando alguien ya entró.

   Qué hace al enviar el formulario:
   - Valida los datos en el navegador.
   - Pide a Supabase iniciar sesión con correo y contraseña.
   - Si es correcto, guarda la sesión en este navegador y lleva a PAGINA_DESTINO.
   - Si no, muestra un mensaje claro.
*/
(function () {
  'use strict';

  /* ===== Configuración =====
     La clave "publishable" está pensada para ir en el navegador. */
  var SUPABASE_URL = 'https://rvhqzpdtqbfbmhjbthxp.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_wnxJClfIwqEO8W-gr13BVw_3hoxlTqv';
  var CLAVE_SESION = 'nye_sesion';       // nombre con el que se guarda la sesión (igual en sesion.js)
  var PAGINA_DESTINO = 'index.html';     // a dónde ir después de entrar
  var TIEMPO_MAX_MS = 15000;

  // Colores del mensaje (pensados para el panel oscuro del login; cámbialos si tu fondo es claro)
  var COLOR_ERROR = '#ff9a9a';
  var COLOR_OK = '#8ff0b3';

  /* ===== Elementos de la página ===== */
  var form = document.querySelector('main form') || document.querySelector('form');
  if (!form) return;
  if (form.dataset.loginListo) return;   // evita registrar el envío dos veces
  form.dataset.loginListo = '1';

  var campoUsuario = form.querySelector('input[type="email"], input[type="text"]');
  var campoClave = form.querySelector('input[type="password"]');
  var boton = form.querySelector('button[type="submit"]');
  if (!campoUsuario || !campoClave) return;

  var textoBoton = boton ? boton.textContent : '';
  var enviando = false;

  // Si ya hay una sesión vigente, no hace falta volver a entrar
  try {
    var guardada = JSON.parse(localStorage.getItem(CLAVE_SESION));
    if (guardada && guardada.access_token && guardada.expires_at * 1000 - 30000 > Date.now()) {
      window.location.replace(PAGINA_DESTINO);
      return;
    }
  } catch (e) { /* sin sesión guardada */ }

  // Mensaje de resultado (se crea aquí para no tocar el HTML)
  var mensaje = document.createElement('p');
  mensaje.className = 'login-mensaje';
  mensaje.setAttribute('role', 'status');
  mensaje.setAttribute('aria-live', 'polite');
  mensaje.style.cssText = 'display:none;margin:12px 0 0;font-size:0.95rem;font-weight:700;line-height:1.3;text-align:center';
  form.insertBefore(mensaje, boton || null);

  function mostrar(texto, tipo) {
    mensaje.textContent = texto;
    mensaje.style.display = texto ? 'block' : 'none';
    mensaje.style.color = tipo === 'ok' ? COLOR_OK : COLOR_ERROR;
  }

  function ocupado(si) {
    if (boton) {
      boton.disabled = si;
      boton.textContent = si ? 'Ingresando…' : textoBoton;
    }
    form.setAttribute('aria-busy', si ? 'true' : 'false');
  }

  /* ===== Comunicación con Supabase (fetch, sin librerías) ===== */
  function pedir(ruta, opciones) {
    var control = new AbortController();
    var temporizador = setTimeout(function () { control.abort(); }, TIEMPO_MAX_MS);

    opciones.signal = control.signal;
    opciones.headers = { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' };

    return fetch(SUPABASE_URL + ruta, opciones).then(
      function (res) {
        clearTimeout(temporizador);
        return res.text().then(function (texto) {
          var datos = null;
          try { datos = texto ? JSON.parse(texto) : null; } catch (e) { datos = null; }
          return { ok: res.ok, status: res.status, datos: datos };
        });
      },
      function (err) {
        clearTimeout(temporizador);
        throw err;
      }
    );
  }

  function textoError(r) {
    var d = r.datos || {};
    var codigo = d.error_code || d.code || '';
    var msg = String(d.msg || d.message || d.error_description || '');

    if (codigo === 'invalid_credentials' || /invalid login credentials/i.test(msg)) {
      return 'Correo o contraseña incorrectos.';
    }
    if (codigo === 'email_not_confirmed' || /not confirmed/i.test(msg)) {
      return 'Aún no confirmaste tu correo. Revisa tu bandeja de entrada (y la carpeta de spam).';
    }
    if (r.status === 429 || codigo === 'over_request_rate_limit') {
      return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
    }
    if (codigo === 'user_banned') {
      return 'Esta cuenta está suspendida.';
    }
    return 'No pudimos iniciar sesión. Inténtalo de nuevo en un momento.';
  }

  /* ===== Envío del formulario ===== */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (enviando) return;

    var correo = campoUsuario.value.trim().toLowerCase();
    var clave = campoClave.value;

    if (!correo || !clave) {
      mostrar('Escribe tu correo y tu contraseña.', 'error');
      return;
    }
    // Supabase inicia sesión con el correo: el nombre no se puede usar para entrar
    if (correo.indexOf('@') === -1) {
      mostrar('Escribe el correo con el que te registraste.', 'error');
      return;
    }

    enviando = true;
    ocupado(true);
    mostrar('', 'ok');

    pedir('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email: correo, password: clave })
    })
      .then(function (r) {
        if (!r.ok || !r.datos || !r.datos.access_token) throw { respuesta: r };

        var d = r.datos;
        var usuario = d.user || {};
        var metadatos = usuario.user_metadata || {};
        var sesion = {
          access_token: d.access_token,
          refresh_token: d.refresh_token,
          expires_at: d.expires_at || Math.floor(Date.now() / 1000) + (d.expires_in || 3600),
          usuario: { id: usuario.id, email: usuario.email || correo, nombre: metadatos.nombre || '' }
        };
        try { localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion)); } catch (err) { /* almacenamiento bloqueado */ }

        form.reset();
        mostrar('¡Bienvenido/a' + (sesion.usuario.nombre ? ', ' + sesion.usuario.nombre : '') + '! Entrando…', 'ok');
        setTimeout(function () { window.location.href = PAGINA_DESTINO; }, 800);
      })
      .catch(function (err) {
        if (err && err.respuesta) {
          console.warn('Supabase respondió', err.respuesta.status, err.respuesta.datos); // ayuda a depurar
          mostrar(textoError(err.respuesta), 'error');
        } else if (err && err.name === 'AbortError') {
          mostrar('La conexión tardó demasiado. Inténtalo de nuevo.', 'error');
        } else {
          mostrar('No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.', 'error');
        }
      })
      .then(function () {
        enviando = false;
        ocupado(false);
      });
  });
})();
