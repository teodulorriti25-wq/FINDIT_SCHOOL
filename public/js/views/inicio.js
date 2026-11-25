import { api } from '../api.js';
import { $, app, fila } from '../utils.js';

export async function inicio() {
  const s = await api('/stats');
  app.innerHTML = `<h1>Encuentra lo que buscas</h1><p class="sub">Busca entre los objetos perdidos y encontrados de la comunidad.</p>
  <form class="buscar" id="f"><input name="q" placeholder="Buscar objetos..." aria-label="Buscar objetos"><a class="btn" href="#/publicar">Publicar objeto</a></form>
  <div class="metricas"><div class="m azul"><b>${s.publicaciones || 0}</b>Publicaciones</div>
  <div class="m verde"><b>${s.encontrados || 0}</b>Objetos encontrados</div><div class="m azul"><b>${s.recuperados || 0}</b>Objetos recuperados</div></div>
  <h2 style="margin-bottom:1rem">Publicaciones recientes</h2><div id="g"></div>`;
  const f = $('#f'), g = $('#g');
  const carga = async () => {
    const q = f.q.value.trim(), o = await api('/objetos?' + new URLSearchParams({ q }));
    const lista = q ? o : o.slice(0, 5);
    g.innerHTML = lista.length ? lista.map(x => fila(x, { modo: 'inicio' })).join('') : '<p class="sub">Aún no hay publicaciones. Publica el primer reporte.</p>';
  };
  f.oninput = carga; f.onsubmit = e => e.preventDefault();
  carga();
}
