import { api, sesion } from '../api.js';
import { $, app, esc, fecha } from '../utils.js';
import { enVivo } from '../socket.js';

export async function detalle(id) {
  const o = await api('/objetos/' + id), mio = o.id_usuario === sesion.user.id, esAdmin = sesion.user.rol === 'admin';
  if (location.hash !== '#/objeto/' + id) return; // la persona ya cambió de pantalla
  // En vivo: si el objeto cambia se vuelve a pintar (salvo que esté escribiendo la verificación); si lo eliminan, se sale
  enVivo('objeto:cambio', d => { if (String(d.id_objeto) === String(id) && !$('#dlg')?.open) detalle(id); });
  enVivo('objeto:eliminado', d => { if (String(d.id_objeto) === String(id) && location.hash === '#/objeto/' + id) location.hash = '#/explorar'; });
  app.innerHTML = `<h1 style="font-size:1.4rem">Detalle del objeto</h1>
  <div class="detalle"><div class="imagen">${o.foto ? `<img src="${esc(o.foto)}" alt="${esc(o.nombre_objeto)}">` : '<div class="ph">Sin foto</div>'}</div>
  <div class="datos"><span class="pill pub">${o.tipo === 'Perdido' ? 'Objeto perdido' : 'Objeto encontrado'}</span>
  <div class="nombre">${esc(o.nombre_objeto)}</div>
  <dl style="margin:0"><dt>Categoría</dt><dd>${esc(o.nombre_categoria)}</dd><dt>Ubicación</dt><dd>${esc(o.ubicacion)}</dd>
  <dt>Fecha</dt><dd>${fecha(o.fecha_suceso)}</dd><dt>Descripción</dt><dd>${esc(o.descripcion) || 'Sin descripción.'}</dd></dl>
  <div id="acc"></div></div></div>`;
  const acc = $('#acc');
  if (mio) acc.innerHTML = '<div class="aviso" style="margin-top:1.6rem">Esta publicación es tuya. Administra su estado desde <a href="#/perfil">tu perfil</a>.</div>';
  else if (o.estado === 'Recuperado') acc.innerHTML = '<div class="aviso" style="margin-top:1.6rem">Este objeto ya fue recuperado.</div>';
  else {
    acc.innerHTML = `<button class="btn block" id="sol">Solicitar contacto</button><div class="aviso">Verifica la propiedad antes de entregar el objeto.</div>
    <dialog id="dlg"><form id="s"><h3>¿Cómo sabes que es tuyo?</h3>
    <p class="sub" style="margin:.3rem 0 .6rem">Escribe algo que solo el dueño sabría: contenido, marcas, llaveros.</p>
    <textarea id="m" rows="4" required minlength="10" aria-label="Datos para verificar la propiedad"></textarea>
    <p id="e" class="err" role="alert"></p><div class="acciones"><button type="button" class="btn sec" id="cancelar">Cancelar</button><button class="btn">Enviar solicitud</button></div></form></dialog>`;
    $('#sol').onclick = () => $('#dlg').showModal();
    $('#cancelar').onclick = () => $('#dlg').close();
    $('#s').onsubmit = async e => {
      e.preventDefault();
      try { await api('/solicitudes', { method: 'POST', body: { id_objeto: id, mensaje_verificacion: $('#m').value } }); location.hash = '#/solicitudes'; }
      catch (x) { $('#e').textContent = x.message; }
    };
  }
  if (esAdmin) {
    acc.insertAdjacentHTML('beforeend', '<button class="btn peligro block" id="del" style="margin-top:1rem">Eliminar publicación</button>');
    $('#del').onclick = async () => {
      if (!confirm('¿Eliminar esta publicación? No se puede deshacer.')) return;
      await api('/admin/objetos/' + id, { method: 'DELETE' });
      location.hash = '#/admin';
    };
  }
}
