/* sesion.js  (opcional)
   Muestra "Cerrar sesión" en el menú cuando alguien ya inició sesión, y permite salir.

   Enlazar al final del <body> de TODAS las páginas, después de efectos.js:
     <script src="js/sesion.js"></script>

   Cambia el enlace "Ingresar" del menú (header a.acceso y el del menú de pantalla
   completa) por "Cerrar sesión". Si la sesión caducó, la renueva sola.
   Desde otros scripts puedes usar: NyESesion.obtener() y NyESesion.cerrar().
*/
(function () {
  'use strict';

  var SUPABASE_URL = 'https://rvhqzpdtqbfbmhjbthxp.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_wnxJClfIwqEO8W-gr13BVw_3hoxlTqv';
  var CLAVE_SESION = 'nye_sesion';   // igual que en login.js
  var PAGINA_INICIO = 'index.html';  // a dónde ir al cerrar sesión
  var ENLACES_ACCESO = 'header a.acceso, .menu-pantalla a[href="login.html"]';

  function leer() {
    try { return JSON.parse(localStorage.getItem(CLAVE_SESION)); } catch (e) { return null; }
  }
  function guardar(s) {
    try { localStorage.setItem(CLAVE_SESION, JSON.stringify(s)); } catch (e) { /* almacenamiento bloqueado */ }
  }
  function borrar() {
    try { localStorage.removeItem(CLAVE_SESION); } catch (e) { /* sin acción */ }
  }
  function vigente(s) {
    return !!(s && s.access_token && s.expires_at * 1000 - 30000 > Date.now());
  }

  // Renueva la sesión caducada con el refresh_token
  function refrescar(s) {
    if (!s || !s.refresh_token) { borrar(); return Promise.resolve(null); }
    return fetch(SUPABASE_URL + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: s.refresh_token })
    }).then(
      function (res) {
        if (res.status === 400 || res.status === 401 || res.status === 403) { borrar(); return null; } // sesión inválida
        if (!res.ok) return null;
        return res.json().then(function (d) {
          if (!d || !d.access_token) return null;
          var nueva = {
            access_token: d.access_token,
            refresh_token: d.refresh_token || s.refresh_token,
            expires_at: d.expires_at || Math.floor(Date.now() / 1000) + (d.expires_in || 3600),
            usuario: s.usuario
          };
          guardar(nueva);
          return nueva;
        });
      },
      function () { return null; } // sin conexión: no se borra la sesión
    );
  }

  function obtener() {
    var s = leer();
    if (!s) return Promise.resolve(null);
    return vigente(s) ? Promise.resolve(s) : refrescar(s);
  }

  function cerrar() {
    var s = leer();
    borrar();
    var aviso = s && s.access_token
      ? fetch(SUPABASE_URL + '/auth/v1/logout?scope=local', {
          method: 'POST',
          headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + s.access_token }
        }).catch(function () { /* da igual si falla: la sesión local ya se borró */ })
      : Promise.resolve();
    return aviso.then(function () { window.location.href = PAGINA_INICIO; });
  }

  function pintar(s) {
    if (!s) return;
    document.body.classList.add('con-sesion');
    document.querySelectorAll(ENLACES_ACCESO).forEach(function (a) {
      a.textContent = 'Cerrar sesión';
      a.setAttribute('href', '#');
      if (s.usuario && s.usuario.email) a.title = s.usuario.email;
      a.addEventListener('click', function (e) { e.preventDefault(); cerrar(); });
    });
  }

  window.NyESesion = { obtener: obtener, cerrar: cerrar };

  function iniciar() {
    var s = leer();
    if (vigente(s)) pintar(s);                       // al instante, sin esperar
    else if (s) refrescar(s).then(pintar);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
