// Utilidades compartidas por las vistas
export const $ = s => document.querySelector(s);
export const app = $('#app');
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const fecha = d => String(d).slice(0, 10);

// Etiqueta de estado. En Inicio se muestra el tipo (Encontrado / Publicado), en el resto el avance.
export function badge(o, modo) {
  if (o.estado === 'Recuperado') return '<span class="pill ok">Recuperado</span>';
  if (modo === 'inicio') return o.tipo === 'Encontrado' ? '<span class="pill ok">Encontrado</span>' : '<span class="pill pub">Publicado</span>';
  return o.estado === 'En revisión' ? '<span class="pill rev">En revisión</span>' : '<span class="pill pend">Pendiente</span>';
}
export const miniatura = o => o.foto
  ? `<img src="${esc(o.foto)}" alt="${esc(o.nombre_objeto)}">`
  : '<div class="ph" aria-hidden="true">Sin foto</div>';

// Fila de lista: foto, nombre, "Perdido en aula" y etiqueta
export const fila = (o, { modo = '', sub = true, extra = '', clase = '' } = {}) =>
  `<a class="fila ${clase}" href="#/objeto/${o.id_objeto}">${miniatura(o)}
   <div class="info"><h3>${esc(o.nombre_objeto)}</h3>${sub ? `<p>${o.tipo} en ${esc(o.ubicacion.toLowerCase())}</p>` : ''}</div>${extra}${badge(o, modo)}</a>`;
