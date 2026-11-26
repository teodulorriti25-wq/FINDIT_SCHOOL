// Avisos en vivo: sonido, notificaciones emergentes y contador de pendientes
export const estado = { convAbierta: null }; // conversación que la persona tiene abierta ahora

let ctx = null, sinLeer = 0;

// Los navegadores solo dejan sonar audio después de que la persona toca la página;
// por eso el audio se prepara en el primer clic o tecla.
function contexto() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx ??= new AC();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
addEventListener('pointerdown', contexto, { once: true });
addEventListener('keydown', contexto, { once: true });

export const sonidoActivo = () => localStorage.sonido !== 'off';
export function alternarSonido() {
  localStorage.sonido = sonidoActivo() ? 'off' : 'on';
  if (sonidoActivo()) sonar('aviso'); // al activarlo suena una vez para comprobar
  return sonidoActivo();
}

// Sonido generado con Web Audio (no hay archivos de audio): dos notas para avisos y una para mensajes
export function sonar(tipo = 'aviso') {
  if (!sonidoActivo()) return;
  const c = contexto();
  if (!c) return;
  const notas = tipo === 'mensaje' ? [740] : [880, 1175];
  const t0 = c.currentTime;
  notas.forEach((hz, i) => {
    const t = t0 + i * 0.14, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = hz;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.2, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + 0.4);
  });
}

// Notificación emergente: se cierra sola a los 7 segundos o al tocarla
export function toast(titulo, texto, href) {
  const caja = document.querySelector('#toasts');
  if (!caja) return;
  const a = document.createElement(href ? 'a' : 'div');
  a.className = 'toast';
  if (href) a.href = href;
  const b = document.createElement('b'); b.textContent = titulo;
  const p = document.createElement('span'); p.textContent = texto;
  a.append(b, p);
  const quitar = () => a.remove();
  a.addEventListener('click', quitar);
  caja.append(a);
  while (caja.children.length > 3) caja.firstChild.remove();
  setTimeout(quitar, 7000);
}

// Contador de avisos sin ver: sale junto a "Solicitudes" y en el título de la pestaña
export function pintarBadge() {
  const b = document.querySelector('#b-sol');
  if (b) { b.textContent = sinLeer; b.hidden = !sinLeer; }
  document.title = sinLeer ? `(${sinLeer}) FindIt School` : 'FindIt School';
}
export function sumarSinLeer() {
  if (location.hash.startsWith('#/solicitudes')) return; // ya está viendo sus solicitudes
  sinLeer++; pintarBadge();
}
export function reiniciarSinLeer() { sinLeer = 0; pintarBadge(); }
