import { api } from '../api.js';
import { $, app, fila } from '../utils.js';
import { enVivo } from '../socket.js';

export async function inicio() {
  const s = await api('/stats');
  if (!['', '#/'].includes(location.hash)) return; // la persona ya cambió de pantalla
  app.innerHTML = `<h1>Encuentra lo que buscas</h1><p class="sub">Busca entre los objetos perdidos y encontrados de la comunidad.</p>
  <form class="buscar" id="f"><input name="q" placeholder="Buscar objetos..." aria-label="Buscar objetos"><a class="btn" href="#/publicar">Publicar objeto</a></form>
  <div class="metricas"><div class="m azul"><b id="m-pub">${s.publicaciones || 0}</b>Publicaciones</div>
  <div class="m verde"><b id="m-enc">${s.encontrados || 0}</b>Objetos encontrados</div><div class="m azul"><b id="m-rec">${s.recuperados || 0}</b>Objetos recuperados</div></div>
  <h2 style="margin-bottom:1rem">Publicaciones recientes</h2><div id="g"></div>`;
  const f = $('#f'), g = $('#g');
  const carga = async () => {
    const q = f.q.value.trim(), o = await api('/objetos?' + new URLSearchParams({ q }));
    if (!$('#g')) return;
    const lista = q ? o : o.slice(0, 5);
    g.innerHTML = lista.length ? lista.map(x => fila(x, { modo: 'inicio' })).join('') : '<p class="sub">Aún no hay publicaciones. Publica el primer reporte.</p>';
  };
  // En vivo: solo se actualizan los números y la lista, sin tocar lo que la persona escribió en el buscador
  const alVivo = async () => {
    const n = await api('/stats');
    if (!$('#m-pub')) return;
    $('#m-pub').textContent = n.publicaciones || 0; $('#m-enc').textContent = n.encontrados || 0; $('#m-rec').textContent = n.recuperados || 0;
    carga();
  };
  ['objeto:nuevo', 'objeto:cambio', 'objeto:eliminado', 'reconectado'].forEach(ev => enVivo(ev, alVivo));
  f.oninput = carga; f.onsubmit = e => e.preventDefault();
  carga();
}
