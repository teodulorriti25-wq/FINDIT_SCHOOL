import { api, sesion } from '../api.js';
import { app, esc, fecha, badge } from '../utils.js';
import { enVivo } from '../socket.js';

export async function admin(sub = '') {
  if (sesion.user.rol !== 'admin') { app.innerHTML = '<p class="err">Solo administradores.</p>'; return; }
  // En vivo: el panel se repinta cuando hay publicaciones nuevas, cambios o eliminaciones
  ['objeto:nuevo', 'objeto:cambio', 'objeto:eliminado', 'reconectado'].forEach(ev => enVivo(ev, () => admin(sub)));
  const d = await api('/admin/resumen'), r = d.resumen;
  if (!location.hash.startsWith('#/admin')) return; // la persona ya cambió de pantalla
  const tablaObjetos = (titulo, lista) => `<div class="tabla-card"><h2>${titulo}</h2><table><tr><th>Objeto</th><th>Tipo</th><th>Usuario</th><th>Estado</th><th>Acción</th></tr>
    ${lista.map(o => `<tr><td>${esc(o.nombre_objeto)}</td><td>${o.tipo}</td><td>${esc(o.autor)}</td><td>${badge(o)}</td><td><a href="#/objeto/${o.id_objeto}">Revisar</a></td></tr>`).join('')}</table></div>`;

  if (sub === 'usuarios') {
    app.innerHTML = `<h1>Usuarios</h1><p class="sub">Cuentas registradas en la plataforma.</p><div class="tabla-card"><table><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Registro</th></tr>
    ${d.usuarios.map(u => `<tr><td>${esc(u.nombre)}</td><td>${esc(u.correo)}</td><td>${u.rol}</td><td>${fecha(u.fecha_registro)}</td></tr>`).join('')}</table></div>`;
  } else if (sub === 'publicaciones') {
    app.innerHTML = `<h1>Publicaciones</h1><p class="sub">Todas las publicaciones. Entra a Revisar para moderar.</p>${tablaObjetos('Publicaciones', d.objetos)}`;
  } else {
    app.innerHTML = `<h1>Panel de administración</h1><p class="sub">Supervisa publicaciones, usuarios y solicitudes.</p>
    <div class="metricas"><div class="m b"><span>Usuarios</span><b>${r.usuarios}</b></div><div class="m b"><span>Reportes activos</span><b>${r.activos}</b></div>
    <div class="m b"><span>Objetos recuperados</span><b>${r.recuperados}</b></div><div class="m b"><span>Solicitudes</span><b>${r.solicitudes}</b></div></div>
    ${tablaObjetos('Publicaciones recientes', d.objetos.slice(0, 5))}`;
  }
}
