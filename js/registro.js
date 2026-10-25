/* registro.js
   Conecta el formulario de registro con Supabase.

   Instalación:
   1. Guardar este archivo como js/registro.js
   2. En registro.html, al final del <body> (después de efectos.js):
        <script src="js/registro.js"></script>
   3. Ejecutar en Supabase (SQL Editor) el script SQL que crea la tabla "perfiles"
      y la política de inserción pública.

   Qué hace al enviar el formulario:
   - Valida los datos en el navegador.
   - Crea la cuenta con Supabase Auth (la contraseña la guarda Supabase, cifrada;
     nunca se guarda en una tabla propia).
   - Inserta un perfil (nombre y correo) en la tabla "perfiles".
   - Muestra el resultado en pantalla y, si la cuenta queda lista, lleva al login.
*/
(function () {
  'use strict';

  /* ===== Configuración =====
     La clave "publishable" está pensada para ir en el navegador: la protección real
     la dan las políticas RLS de la base de datos, no ocultar esta clave.
     NUNCA pongas aquí una clave "secret" ni "service_role". */
  var SUPABASE_URL = 'https://rvhqzpdtqbfbmhjbthxp.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_wnxJClfIwqEO8W-gr13BVw_3hoxlTqv';
  var TABLA_PERFILES = 'perfiles';
  var PAGINA_LOGIN = 'login.html';
  var MIN_CLAVE = 8;          // caracteres mínimos de la contraseña
  var TIEMPO_MAX_MS = 15000;  // tiempo máximo de espera por petición

  /* ===== Elementos de la página ===== */
  var form = document.querySelector('main form');
  if (!form) return;
  if (form.dataset.registroListo) return; // evita registrar el envío dos veces si el script se carga repetido
  form.dataset.registroListo = '1';

  var campoNombre = form.querySelector('#nombre');
  var campoCorreo = form.querySelector('#correo');
  var campoClave = form.querySelector('#clave');
  var boton = form.querySelector('button[type="submit"]');
  if (!campoNombre || !campoCorreo || !campoClave || !boton) return;

  var textoBoton = boton.textContent;
  var enviando = false;

  // Mensaje de resultado (se crea aquí para no tocar el HTML)
  var mensaje = document.createElement('p');
  mensaje.className = 'registro-mensaje';
  mensaje.setAttribute('role', 'status');
  mensaje.setAttribute('aria-live', 'polite');
  mensaje.style.cssText = 'display:none;margin:0 0 16px;font-size:0.95rem;font-weight:600;line-height:1.3;text-align:center';
  form.insertBefore(mensaje, boton);

  function mostrar(texto, tipo) {
    mensaje.textContent = texto;
    mensaje.style.display = texto ? 'block' : 'none';
    mensaje.style.color = tipo === 'ok' ? '#1b7f3b' : '#c62828';
  }

  function ocupado(si) {
    boton.disabled = si;
    boton.textContent = si ? 'Registrando…' : textoBoton;
    form.setAttribute('aria-busy', si ? 'true' : 'false');
  }

  /* ===== Comunicación con Supabase (fetch, sin librerías) ===== */
  function pedir(ruta, opciones) {
    var control = new AbortController();
    var temporizador = setTimeout(function () { control.abort(); }, TIEMPO_MAX_MS);

    opciones.signal = control.signal;
    opciones.headers = Object.assign(
      { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
      opciones.headers || {}
    );

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

  // Traduce los errores de Supabase a mensajes claros
  function textoError(r) {
    var d = r.datos || {};
    var codigo = d.error_code || d.code || '';
    var msg = String(d.msg || d.message || d.error_description || '');

    if (codigo === 'over_email_send_rate_limit') {
      return 'Se alcanzó el límite de correos de confirmación. Inténtalo más tarde.';
    }
    if (r.status === 429 || codigo === 'over_request_rate_limit') {
      return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
    }
    if (codigo === 'user_already_exists' || codigo === 'email_exists' || /already registered/i.test(msg)) {
      return 'Este correo ya está registrado. Prueba iniciar sesión.';
    }
    if (codigo === 'weak_password') {
      return 'La contraseña es muy débil. Usa al menos ' + MIN_CLAVE + ' caracteres y mezcla letras y números.';
    }
    if (codigo === 'signup_disabled') {
      return 'Los registros están desactivados por ahora.';
    }
    if (codigo === 'validation_failed' || /valid email|invalid.*email/i.test(msg)) {
      return 'Revisa que el correo sea válido.';
    }
    return 'No pudimos completar el registro. Inténtalo de nuevo en un momento.';
  }

  // Guarda el perfil (nombre y correo). Nunca incluye la contraseña.
  function guardarPerfil(nombre, correo) {
    return pedir('/rest/v1/' + TABLA_PERFILES, {
      method: 'POST',
      headers: { Prefer: 'return=minimal' }, // la tabla no permite leer, así que no pedimos la fila de vuelta
      body: JSON.stringify({ nombre: nombre, correo: correo })
    }).then(
      function (r) { return r.ok || r.status === 409; }, // 409 = ya existía ese correo
      function () { return false; }
    );
  }

  /* ===== Envío del formulario ===== */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (enviando) return;

    var nombre = campoNombre.value.trim();
    var correo = campoCorreo.value.trim().toLowerCase();
    var clave = campoClave.value;

    if (!nombre || nombre.length > 100) {
      mostrar('Escribe tu nombre (máximo 100 caracteres).', 'error');
      return;
    }
    if (!campoCorreo.checkValidity() || !correo || correo.length > 254) {
      mostrar('Escribe un correo válido.', 'error');
      return;
    }
    if (clave.length < MIN_CLAVE) {
      mostrar('La contraseña debe tener al menos ' + MIN_CLAVE + ' caracteres.', 'error');
      return;
    }

    enviando = true;
    ocupado(true);
    mostrar('', 'ok');

    // El enlace del correo de confirmación llevará de vuelta al login (si el sitio está en http/https)
    var redireccion = '';
    if (/^https?:$/.test(location.protocol)) {
      redireccion = '?redirect_to=' + encodeURIComponent(new URL(PAGINA_LOGIN, location.href).href);
    }

    pedir('/auth/v1/signup' + redireccion, {
      method: 'POST',
      body: JSON.stringify({ email: correo, password: clave, data: { nombre: nombre } })
    })
      .then(function (r) {
        if (!r.ok) throw { respuesta: r };

        // Con correo ya registrado y confirmación activada, Supabase responde "bien"
        // pero sin identidades: lo tratamos como correo repetido.
        var usuario = (r.datos && (r.datos.user || r.datos)) || {};
        if (usuario.identities && usuario.identities.length === 0) throw { yaRegistrado: true };

        var requiereConfirmacion = !(r.datos && r.datos.access_token);
        return guardarPerfil(nombre, correo).then(function (perfilOk) {
          if (!perfilOk) console.warn('La cuenta se creó, pero no se pudo guardar el perfil en la tabla "' + TABLA_PERFILES + '".');
          return requiereConfirmacion;
        });
      })
      .then(function (requiereConfirmacion) {
        form.reset();
        if (requiereConfirmacion) {
          mostrar('¡Listo, ' + nombre + '! Te enviamos un correo para confirmar tu cuenta. Revisa también la carpeta de spam.', 'ok');
        } else {
          mostrar('¡Cuenta creada! Te llevamos al inicio de sesión…', 'ok');
          setTimeout(function () { window.location.href = PAGINA_LOGIN; }, 2500);
        }
      })
      .catch(function (err) {
        if (err && err.yaRegistrado) {
          mostrar('Este correo ya está registrado. Prueba iniciar sesión.', 'error');
        } else if (err && err.respuesta) {
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
