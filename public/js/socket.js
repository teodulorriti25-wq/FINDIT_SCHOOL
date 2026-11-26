// Conexión en vivo con el servidor (Socket.IO) y reparto de eventos
import { sesion } from './api.js';
import { estado, sonar, toast, sumarSinLeer } from './avisos.js';

let socket = null;
const global = [];       // avisos que funcionan en cualquier pantalla: [evento, función]
const vista = new Map(); // lo que hace la pantalla abierta con cada evento (una función por evento)

const EVENTOS = ['objeto:nuevo', 'objeto:cambio', 'objeto:eliminado', 'solicitud:nueva', 'solicitud:estado', 'mensaje:nuevo'];
const despachar = (ev, d) => { global.forEach(([e, f]) => e === ev && f(d)); vista.get(ev)?.(d); };

// Cada pantalla dice qué hacer cuando llega un evento; volver a registrar el mismo evento reemplaza la función anterior
export const enVivo = (ev, fn) => vista.set(ev, fn);
export const limpiarVista = () => { vista.clear(); estado.convAbierta = null; };

export function conectar() {
  if (socket || !sesion.token || typeof io === 'undefined') return;
  socket = io({ auth: { token: sesion.token } });
  EVENTOS.forEach(ev => socket.on(ev, d => despachar(ev, d)));
  let primera = true;
  // Si se cae la conexión y vuelve, la pantalla se refresca para recuperar lo que se perdió
  socket.on('connect', () => { if (!primera) despachar('reconectado'); primera = false; });
  socket.on('connect_error', e => { if (e.message === 'sin sesión') desconectar(); });
}
export function desconectar() { socket?.disconnect(); socket = null; }
addEventListener('sesion-cerrada', desconectar);

// ---- Avisos personales: suenan y salen como notificación en cualquier pantalla ----
const siempre = (ev, fn) => global.push([ev, fn]);

siempre('solicitud:nueva', d => {
  sonar();
  toast('Nueva solicitud', `${d.solicitante} pidió contacto por "${d.nombre_objeto}"`, '#/solicitudes');
  sumarSinLeer();
});
siempre('mensaje:nuevo', d => {
  sonar('mensaje');
  if (estado.convAbierta === d.id_solicitud && location.hash.startsWith('#/solicitudes')) return; // ya lo está viendo
  toast(`Mensaje de ${d.de}`, d.contenido, '#/solicitudes');
  sumarSinLeer();
});
siempre('solicitud:estado', d => {
  sonar();
  toast(d.estado === 'Cerrada' ? 'Entrega confirmada' : 'Tu solicitud está en revisión', d.nombre_objeto, '#/solicitudes');
  sumarSinLeer();
});
