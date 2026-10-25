/* registro.js
   Conecta el formulario de registro con Supabase (tabla "usuarios_registro").
*/
(function () {
  'use strict';

  var SUPABASE_URL = 'https://cietduwkxnaroigzlziy.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_bj6DwgIN8_TwwpnXXy37-A_0BZAAE8G';
  var TABLA_PERFILES = 'usuarios_registro';
  var PAGINA_LOGIN = 'login.html';
  var MIN_CLAVE = 8;
  var TIEMPO_MAX_MS = 15000;

  var form = document.querySelector('main form');
  if (!form) return;
  if (form.dataset.registroListo) return;
  form.dataset.registroListo = '1';

  var campoNombre = form.querySelector('#nombre');
  var campoCorreo = form.querySelector('#correo');
  var campoClave = form.querySelector('#clave');
  var boton = form.querySelector('button[type="submit"]');
  if (!campoNombre || !campoCorreo || !campoClave || !boton) return;

  var textoBoton = boton.textContent;
  var enviando = false;

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

  // Guarda el nombre y el email en la tabla correcta de Supabase
  function guardarPerfil(nombre, correo) {
    return pedir('/rest/v1/' + TABLA_PERFILES, {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ nombre: nombre, email: correo })
    }).then(
      function (r) { return r.ok || r.status === 409; },
      function () { return false; }
    );
  }

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

        var usuario = (r.datos && (r.datos.user || r.datos)) || {};
        if (usuario.identities && usuario.identities.length === 0) throw { yaRegistrado: true };

        var requiereConfirmacion = !(r.datos && r.datos.access_token);
        return guardarPerfil(nombre, correo).then(function (perfilOk) {
          if (!perfilOk) console.warn('La cuenta se creó, pero no se pudo guardar en la tabla "' + TABLA_PERFILES + '".');
          return requiereConfirmacion;
        });
      })
      .then(function (requiereConfirmacion) {
        form.reset();
        if (requiereConfirmacion) {
          mostrar('¡Listo, ' + nombre + '! Te enviamos un correo para confirmar tu cuenta.', 'ok');
        } else {
          mostrar('¡Cuenta creada! Te llevamos al inicio de sesión…', 'ok');
          setTimeout(function () { window.location.href = PAGINA_LOGIN; }, 2500);
        }
      })
      .catch(function (err) {
        if (err && err.yaRegistrado) {
          mostrar('Este correo ya está registrado.', 'error');
        } else {
          mostrar('No pudimos completar el registro. Revisa la consola.', 'error');
        }
      })
      .then(function () {
        enviando = false;
        ocupado(false);
      });
  });
})();