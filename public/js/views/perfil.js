import { api, sesion } from '../api.js';
import { app, esc, fila } from '../utils.js';
import { enVivo } from '../socket.js';

export async function perfil() {
  // En vivo: se repinta cuando cambia algo de mis publicaciones (alguien pidió contacto, se confirmó una entrega...)
  ['objeto:cambio', 'objeto:eliminado', 'reconectado'].forEach(ev => enVivo(ev, d => { if (d?.id_usuario === undefined || d.id_usuario === sesion.user.id) perfil(); }));
  const o = await api('/mis-objetos'), u = sesion.user, rec = o.filter(x => x.estado === 'Recuperado').length;
  if (!location.hash.startsWith('#/perfil')) return; // la persona ya cambió de pantalla
  const iniciales = u.nombre.split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase();
  app.innerHTML = `<h1>Perfil</h1><p class="sub">Administra tus publicaciones y solicitudes.</p>
  <div class="perfil-cab"><div class="avatar" aria-hidden="true">${esc(iniciales)}</div><div><h2>${esc(u.nombre)}</h2><p>${esc(u.correo || '')}</p><p>${u.rol === 'admin' ? 'Administrador' : 'Estudiante'}</p></div></div>
  <div class="metricas"><div class="m b"><b>${o.length}</b>Publicaciones</div><div class="m b"><b class="az">${rec}</b>Objetos recuperados</div><div class="m b"><b>${o.length - rec}</b>Pendientes</div></div>
  <h2 class="seccion">Mis artículos</h2>
  ${o.length ? o.map(x => fila(x, { sub: false, clase: 'peq', extra: x.estado === 'Abierto' ? `<button class="acc" data-id="${x.id_objeto}">Marcar como recuperado</button>` : '' })).join('')
    : '<p class="sub">Todavía no publicas nada. <a href="#/publicar">Crea tu primer reporte</a>.</p>'}`;
  app.querySelectorAll('button.acc').forEach(b => b.onclick = async e => {
    e.preventDefault(); e.stopPropagation();
    await api(`/objetos/${b.dataset.id}/estado`, { method: 'PATCH', body: { estado: 'Recuperado' } });
    perfil();
  });
}
