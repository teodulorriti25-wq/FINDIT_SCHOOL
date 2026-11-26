// Punto de entrada: barra lateral, rutas (#/ruta/id) y control de acceso
import { sesion, salir } from './api.js';
import { $, app, esc } from './utils.js';
import { conectar, limpiarVista } from './socket.js';
import { alternarSonido, sonidoActivo, pintarBadge, reiniciarSinLeer } from './avisos.js';
import { login, recuperar, restablecer } from './views/auth.js';
import { inicio } from './views/inicio.js';
import { explorar } from './views/explorar.js';
import { publicar } from './views/publicar.js';
import { detalle } from './views/detalle.js';
import { solicitudes } from './views/solicitudes.js';
import { perfil } from './views/perfil.js';
import { admin } from './views/admin.js';

const rutas = { '': inicio, login, recuperar, restablecer, explorar, publicar, objeto: detalle, solicitudes, perfil, admin };
const publicas = ['login', 'recuperar', 'restablecer'];

const textoSonido = () => `Sonido: ${sonidoActivo() ? 'activado' : 'desactivado'}`;

function lateral(ruta, sub) {
  const u = sesion.user, enAdmin = ruta === 'admin';
  const items = enAdmin
    ? [['#/admin', 'Panel', !sub], ['#/admin/publicaciones', 'Publicaciones', sub === 'publicaciones'], ['#/admin/usuarios', 'Usuarios', sub === 'usuarios'], ['#/', 'Volver al sitio', false]]
    : [['#/', 'Inicio', ruta === ''], ['#/explorar', 'Explorar', ruta === 'explorar'], ['#/publicar', 'Publicar objeto', ruta === 'publicar'],
       ['#/solicitudes', 'Solicitudes', ruta === 'solicitudes'], ['#/perfil', 'Mi perfil', ruta === 'perfil'],
       ...(u.rol === 'admin' ? [['#/admin', 'Panel admin', false]] : [])];
  $('#side').innerHTML = `<div class="marca">FindIt <span>School</span></div><div class="lema">Tus objetos. De regreso.</div>
    <nav aria-label="Principal">${items.map(([h, t, on]) => `<a href="${h}" ${on ? 'class="on" aria-current="page"' : ''}>${t}${t === 'Solicitudes' ? '<span class="badge" id="b-sol" hidden></span>' : ''}</a>`).join('')}
    <button type="button" class="sonido" data-sonido aria-pressed="${sonidoActivo()}">${textoSonido()}</button>
    <a href="#/login" class="salir" data-salir>Cerrar sesión</a></nav>`;
  pintarBadge();
}
$('#side').addEventListener('click', e => {
  if (e.target.closest('[data-salir]')) salir();
  const b = e.target.closest('[data-sonido]');
  if (b) { alternarSonido(); b.textContent = textoSonido(); b.setAttribute('aria-pressed', sonidoActivo()); }
});

async function router() {
  const [ruta, id] = location.hash.slice(2).split('/');
  if (!sesion.user && !publicas.includes(ruta)) { location.hash = '#/login'; return; }
  document.body.classList.toggle('auth', !sesion.user || publicas.includes(ruta));
  limpiarVista(); // la pantalla anterior deja de escuchar eventos
  if (sesion.user) { conectar(); lateral(ruta, id); if (ruta === 'solicitudes') reiniciarSinLeer(); }
  try { await (rutas[ruta] || inicio)(id); }
  catch (e) { app.innerHTML = `<p class="err" style="padding:1rem">${esc(e.message)}</p>`; }
}
addEventListener('hashchange', router);
router();
