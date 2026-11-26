import { api, sesion } from '../api.js';
import { $, app, esc } from '../utils.js';
import { enVivo } from '../socket.js';
import { estado } from '../avisos.js';

let sel = null; // solicitud abierta
const etiqueta = s => s.estado === 'Cerrada' ? '<span class="pill ok">Resuelto</span>' : '<span class="pill rev">En curso</span>';

// vivo = true cuando la pantalla se repinta por un evento en tiempo real (conserva lo que se estaba escribiendo)
export async function solicitudes(vivo = false) {
  // Cualquier novedad de solicitudes o mensajes repinta esta pantalla
  ['solicitud:nueva', 'solicitud:estado', 'mensaje:nuevo', 'objeto:eliminado', 'reconectado'].forEach(ev => enVivo(ev, () => solicitudes(true)));
  const l = await api('/solicitudes');
  if (!location.hash.startsWith('#/solicitudes')) return; // la persona ya cambió de pantalla
  const previo = $('#m input'), borrador = vivo && previo ? previo.value : '', enfocado = vivo && previo && document.activeElement === previo;
  app.innerHTML = '<h1>Solicitudes y mensajes</h1><p class="sub">Comunícate para facilitar la recuperación de objetos.</p><div id="w"></div>';
  if (!l.length) { $('#w').innerHTML = '<p class="sub">No tienes solicitudes todavía. Encuentra un objeto tuyo en <a href="#/explorar">Explorar</a> y pide contacto.</p>'; return; }
  if (!l.some(s => s.id_solicitud === sel)) sel = l[0].id_solicitud;
  const yo = sesion.user.id;
  $('#w').innerHTML = `<div class="chat-wrap"><div class="tarjeta">${l.map(s => `<button class="conv ${sel === s.id_solicitud ? 'on' : ''}" data-id="${s.id_solicitud}">
    <span><b>${esc(s.nombre_objeto)}</b><small>${esc(s.ultimo || 'Solicitud enviada')}</small></span>${etiqueta(s)}</button>`).join('')}</div>
    <div class="tarjeta" id="c"></div></div>`;
  app.querySelectorAll('.conv').forEach(b => b.onclick = () => { sel = +b.dataset.id; solicitudes(); });

  const d = await api(`/solicitudes/${sel}/mensajes`), s = d.solicitud, dueno = s.id_dueno === yo;
  if (!$('#c')) return;
  estado.convAbierta = sel; // así los avisos saben qué conversación está a la vista
  $('#c').innerHTML = `<div class="chat-cab"><div><h2>${esc(s.nombre_objeto)}</h2><p>Conversación sobre la recuperación del objeto.</p></div>${etiqueta(s)}</div>
  ${dueno ? `<div class="verif"><b>Verificación de ${esc(s.solicitante)}:</b> ${esc(s.mensaje_verificacion)}
    ${s.estado !== 'Cerrada' ? '<div class="acciones"><button class="btn sec" data-estado="En revisión">Marcar en revisión</button><button class="btn" data-estado="Cerrada">Confirmar entrega</button></div>' : ''}</div>` : ''}
  <div class="msgs">${d.mensajes.map(m => `<div class="b ${m.id_remitente === yo ? 'yo' : ''}"><small>${esc(m.nombre)}</small>${esc(m.contenido)}</div>`).join('') || '<p class="hint">Aún no hay mensajes.</p>'}</div>
  ${s.estado !== 'Cerrada' ? `<form class="envio-msg" id="m"><input placeholder="Escribe un mensaje..." required aria-label="Mensaje"><button class="btn">Enviar</button></form>
    <div class="aviso">Por tu seguridad, evita compartir información personal sensible en los mensajes.</div>` : '<p class="msg" style="padding:0 .6rem">Entrega confirmada.</p>'}`;
  const msgs = $('#c .msgs'); msgs.scrollTop = msgs.scrollHeight;

  $('#c').querySelectorAll('[data-estado]').forEach(b => b.onclick = async () => {
    if (b.dataset.estado === 'Cerrada' && !confirm('¿Ya verificaste que es suyo y se entregó el objeto?')) return;
    await api('/solicitudes/' + sel, { method: 'PATCH', body: { estado: b.dataset.estado } });
    solicitudes();
  });
  const f = $('#m');
  if (f) {
    const campo = f.querySelector('input');
    if (borrador) campo.value = borrador;   // lo que se estaba escribiendo no se pierde
    if (enfocado) campo.focus();
    f.onsubmit = async e => {
      e.preventDefault();
      await api(`/solicitudes/${sel}/mensajes`, { method: 'POST', body: { contenido: campo.value } });
      solicitudes();
    };
  }
}
