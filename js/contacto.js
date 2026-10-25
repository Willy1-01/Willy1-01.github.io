/* contacto.js
   Guarda los mensajes del formulario de contacto en Supabase (tabla "mensajes_contacto").

   Instalación:
   1. Guardar este archivo como js/contacto.js
   2. En contacto.html, al final del <body> (después de efectos.js):
        <script src="js/contacto.js"></script>
   3. Ejecutar en Supabase (SQL Editor) el script SQL que crea la tabla
      "mensajes_contacto" y la política de inserción pública.

   Qué hace al enviar el formulario:
   - Valida los datos en el navegador (y limita el largo de cada campo).
   - Inserta el mensaje en la tabla. Nunca lee la tabla: solo se puede insertar.
   - Muestra el resultado en pantalla (en español o inglés, según <html lang>).
*/
(function () {
  'use strict';

  /* ===== Configuración =====
     La clave "publishable" está pensada para ir en el navegador: la protección real
     la dan las políticas RLS de la base de datos. NUNCA pongas aquí una clave
     "secret" ni "service_role". */
  var SUPABASE_URL = 'https://rvhqzpdtqbfbmhjbthxp.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_wnxJClfIwqEO8W-gr13BVw_3hoxlTqv';
  var TABLA = 'mensajes_contacto';
  var ESPERA_MS = 30000;              // tiempo mínimo entre un mensaje y el siguiente (por navegador)
  var CLAVE_ULTIMO = 'nye_ultimo_contacto';
  var TIEMPO_MAX_MS = 15000;
  var MAX = { nombre: 100, correo: 254, asunto: 150, mensaje: 2000 };
  var MIN_MENSAJE = 10;

  // Colores del mensaje (pensados para fondo oscuro; cámbialos si tu fondo es claro)
  var COLOR_ERROR = '#ff9a9a';
  var COLOR_OK = '#8ff0b3';

  var TEXTOS = {
    es: {
      nombre: 'Escribe tu nombre (máximo ' + MAX.nombre + ' caracteres).',
      correo: 'Escribe un correo válido.',
      asunto: 'Escribe el asunto (máximo ' + MAX.asunto + ' caracteres).',
      mensajeCorto: 'Escribe un mensaje de al menos ' + MIN_MENSAJE + ' caracteres.',
      mensajeLargo: 'El mensaje es muy largo (máximo ' + MAX.mensaje + ' caracteres).',
      captcha: 'Marca la casilla "No soy un robot".',
      espera: 'Espera unos segundos antes de enviar otro mensaje.',
      enviando: 'Enviando…',
      ok: function (n) { return '¡Gracias, ' + n + '! Recibimos tu mensaje y te responderemos en 24 o 48 horas.'; },
      limite: 'Demasiadas solicitudes. Inténtalo de nuevo en unos minutos.',
      error: 'No pudimos enviar tu mensaje. Inténtalo de nuevo más tarde.',
      tiempo: 'La conexión tardó demasiado. Inténtalo de nuevo.',
      conexion: 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.'
    },
    en: {
      nombre: 'Enter your name (maximum ' + MAX.nombre + ' characters).',
      correo: 'Enter a valid email address.',
      asunto: 'Enter a subject (maximum ' + MAX.asunto + ' characters).',
      mensajeCorto: 'Write a message of at least ' + MIN_MENSAJE + ' characters.',
      mensajeLargo: 'The message is too long (maximum ' + MAX.mensaje + ' characters).',
      captcha: 'Please check the "I\'m not a robot" box.',
      espera: 'Please wait a few seconds before sending another message.',
      enviando: 'Sending…',
      ok: function (n) { return 'Thank you, ' + n + '! We received your message and will reply within 24 to 48 hours.'; },
      limite: 'Too many requests. Please try again in a few minutes.',
      error: 'We could not send your message. Please try again later.',
      tiempo: 'The connection timed out. Please try again.',
      conexion: 'Cannot reach the server. Check your connection and try again.'
    }
  };
  function t(clave) {
    var idioma = (document.documentElement.lang || 'es').slice(0, 2).toLowerCase();
    return (TEXTOS[idioma] || TEXTOS.es)[clave];
  }

  /* ===== Elementos de la página ===== */
  var form = document.querySelector('main form') || document.querySelector('form');
  if (!form) return;
  if (form.dataset.contactoListo) return;   // evita registrar el envío dos veces
  form.dataset.contactoListo = '1';

  function campo(nombre) { return form.querySelector('#' + nombre + ', [name="' + nombre + '"]'); }
  var campoNombre = campo('nombre');
  var campoCorreo = campo('correo');
  var campoAsunto = campo('asunto');
  var campoMensaje = campo('mensaje');
  var casilla = form.querySelector('#captcha, input[type="checkbox"]');
  var boton = form.querySelector('button[type="submit"]');
  if (!campoNombre || !campoCorreo || !campoAsunto || !campoMensaje) return;

  // Límites de largo en los propios campos
  campoNombre.maxLength = MAX.nombre;
  campoCorreo.maxLength = MAX.correo;
  campoAsunto.maxLength = MAX.asunto;
  campoMensaje.maxLength = MAX.mensaje;

  var enviando = false;

  // Mensaje de resultado (se crea aquí para no tocar el HTML)
  var mensaje = document.createElement('p');
  mensaje.className = 'contacto-mensaje';
  mensaje.setAttribute('role', 'status');
  mensaje.setAttribute('aria-live', 'polite');
  mensaje.style.cssText = 'display:none;grid-column:1 / -1;margin:0 0 14px;font-size:0.95rem;font-weight:700;line-height:1.35';
  form.insertBefore(mensaje, boton || null);

  // Campo trampa: las personas no lo ven; algunos robots lo rellenan
  var trampa = document.createElement('div');
  trampa.setAttribute('aria-hidden', 'true');
  trampa.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden';
  trampa.innerHTML = '<input type="text" name="sitio_web" tabindex="-1" autocomplete="off">';
  form.appendChild(trampa);

  function mostrar(texto, tipo) {
    mensaje.textContent = texto;
    mensaje.style.display = texto ? 'block' : 'none';
    mensaje.style.color = tipo === 'ok' ? COLOR_OK : COLOR_ERROR;
  }

  function ocupado(si, textoOriginal) {
    if (boton) {
      boton.disabled = si;
      boton.textContent = si ? t('enviando') : textoOriginal;
    }
    form.setAttribute('aria-busy', si ? 'true' : 'false');
  }

  function enEspera() {
    try { return Date.now() - Number(localStorage.getItem(CLAVE_ULTIMO) || 0) < ESPERA_MS; } catch (e) { return false; }
  }
  function marcarEnvio() {
    try { localStorage.setItem(CLAVE_ULTIMO, String(Date.now())); } catch (e) { /* almacenamiento bloqueado */ }
  }

  /* ===== Comunicación con Supabase (fetch, sin librerías) ===== */
  function insertar(datos) {
    var control = new AbortController();
    var temporizador = setTimeout(function () { control.abort(); }, TIEMPO_MAX_MS);

    return fetch(SUPABASE_URL + '/rest/v1/' + TABLA, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal' // la tabla no permite leer, así que no pedimos la fila de vuelta
      },
      body: JSON.stringify(datos),
      signal: control.signal
    }).then(
      function (res) {
        clearTimeout(temporizador);
        return res.text().then(function (texto) {
          var cuerpo = null;
          try { cuerpo = texto ? JSON.parse(texto) : null; } catch (e) { cuerpo = null; }
          return { ok: res.ok, status: res.status, datos: cuerpo };
        });
      },
      function (err) {
        clearTimeout(temporizador);
        throw err;
      }
    );
  }

  /* ===== Envío del formulario ===== */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (enviando) return;

    var nombre = campoNombre.value.trim();
    var correo = campoCorreo.value.trim().toLowerCase();
    var asunto = campoAsunto.value.trim();
    var texto = campoMensaje.value.trim();

    if (!nombre || nombre.length > MAX.nombre) { mostrar(t('nombre'), 'error'); return; }
    if (!campoCorreo.checkValidity() || !correo || correo.length > MAX.correo) { mostrar(t('correo'), 'error'); return; }
    if (!asunto || asunto.length > MAX.asunto) { mostrar(t('asunto'), 'error'); return; }
    if (texto.length < MIN_MENSAJE) { mostrar(t('mensajeCorto'), 'error'); return; }
    if (texto.length > MAX.mensaje) { mostrar(t('mensajeLargo'), 'error'); return; }
    if (casilla && !casilla.checked) { mostrar(t('captcha'), 'error'); return; }
    if (enEspera()) { mostrar(t('espera'), 'error'); return; }

    // Si el campo trampa tiene contenido, es un robot: fingimos éxito y no enviamos nada
    var inputTrampa = trampa.querySelector('input');
    if (inputTrampa && inputTrampa.value) {
      form.reset();
      mostrar(t('ok')(nombre), 'ok');
      return;
    }

    var textoOriginal = boton ? boton.textContent : '';
    enviando = true;
    ocupado(true, textoOriginal);
    mostrar('', 'ok');

    insertar({ nombre: nombre, correo: correo, asunto: asunto, mensaje: texto })
      .then(function (r) {
        if (!r.ok) throw { respuesta: r };
        marcarEnvio();
        form.reset();
        mostrar(t('ok')(nombre), 'ok');
      })
      .catch(function (err) {
        if (err && err.respuesta) {
          var r = err.respuesta;
          console.warn('Supabase respondió', r.status, r.datos); // ayuda a depurar
          if (r.status === 404) console.warn('¿Creaste la tabla "' + TABLA + '"? Ejecuta el SQL en Supabase.');
          if (r.status === 401 || r.status === 403) console.warn('Falta el permiso o la política de inserción en "' + TABLA + '".');
          mostrar(r.status === 429 ? t('limite') : t('error'), 'error');
        } else if (err && err.name === 'AbortError') {
          mostrar(t('tiempo'), 'error');
        } else {
          mostrar(t('conexion'), 'error');
        }
      })
      .then(function () {
        enviando = false;
        ocupado(false, textoOriginal);
      });
  });
})();
