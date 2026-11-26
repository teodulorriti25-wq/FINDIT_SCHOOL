import { api } from '../api.js';
import { $, app, esc, fila } from '../utils.js';
import { enVivo } from '../socket.js';

export async function explorar() {
  const cats = await api('/categorias');
  if (!location.hash.startsWith('#/explorar')) return;
  app.innerHTML = `<h1>Explorar objetos</h1><p class="sub">Filtra por tipo, categoría o lugar para encontrar lo que perdiste.</p>
  <form class="filtros" id="f"><input name="q" placeholder="Buscar objetos..." aria-label="Buscar objetos">
  <select name="tipo" aria-label="Tipo"><option value="">Perdido y encontrado</option><option>Perdido</option><option>Encontrado</option></select>
  <select name="categoria" aria-label="Categoría"><option value="">Todas las categorías</option>${cats.map(c => `<option value="${c.id_categoria}">${esc(c.nombre_categoria)}</option>`).join('')}</select>
  <input name="ubicacion" placeholder="Lugar" aria-label="Lugar"></form><div id="g"></div>`;
  const f = $('#f'), g = $('#g');
  const carga = async () => {
    const o = await api('/objetos?' + new URLSearchParams(new FormData(f)));
    if (!$('#g')) return;
    g.innerHTML = o.length ? o.map(x => fila(x, { modo: 'inicio' })).join('') : '<p class="sub">No hay publicaciones con esos filtros. Prueba otra búsqueda.</p>';
  };
  // En vivo: la lista se vuelve a pedir con los mismos filtros que la persona ya eligió
  ['objeto:nuevo', 'objeto:cambio', 'objeto:eliminado', 'reconectado'].forEach(ev => enVivo(ev, carga));
  f.oninput = carga; f.onsubmit = e => e.preventDefault();
  carga();
}
