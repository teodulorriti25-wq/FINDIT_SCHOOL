import { api } from '../api.js';
import { $, app, esc } from '../utils.js';

export async function publicar() {
  const cats = await api('/categorias');
  app.innerHTML = `<h1>Publicar un objeto</h1><p class="sub">Comparte los detalles para que podamos ayudarte a encontrarlo.</p>
  <form id="f"><div class="pub-grid">
    <div class="col">
      <div><span class="campo" id="lt" style="display:block;font-weight:500;margin-bottom:.45rem">Tipo de publicación</span>
        <div class="seg" role="radiogroup" aria-labelledby="lt">
          <input type="radio" name="tipo" id="t1" value="Perdido"><label for="t1">Perdido</label>
          <input type="radio" name="tipo" id="t2" value="Encontrado" checked><label for="t2">Encontrado</label></div></div>
      <div><label class="campo" for="b">Categoría</label><select id="b" name="id_categoria">${cats.map(c => `<option value="${c.id_categoria}">${esc(c.nombre_categoria)}</option>`).join('')}</select></div>
      <div><label class="campo" for="d">Fecha</label><input id="d" type="date" name="fecha_suceso" required value="${new Date().toISOString().slice(0, 10)}"></div>
    </div>
    <div class="col">
      <div><label class="campo" for="a">Nombre del objeto</label><input id="a" name="nombre_objeto" required maxlength="100"></div>
      <div><label class="campo" for="u">Lugar aproximado</label><input id="u" name="ubicacion" required maxlength="150"></div>
      <div><label class="campo" for="x">Descripción</label><textarea id="x" name="descripcion" rows="5" placeholder="Color, marca, detalles visibles. No incluyas datos privados."></textarea></div>
    </div>
    <div class="col"><div><span class="campo" style="display:block;font-weight:500;margin-bottom:.45rem">Fotografía</span>
      <div class="foto-prev" id="prev">Sin fotografía</div>
      <input class="sr" id="o" type="file" name="foto" accept="image/png,image/jpeg,image/webp"><label class="agregar" for="o">Agregar una fotografía</label></div></div>
    <div class="envio"><p id="e" class="err" role="alert"></p><button class="btn block">Publicar reporte</button></div>
  </div></form>`;
  $('#o').onchange = e => {
    const f = e.target.files[0], p = $('#prev');
    p.style.backgroundImage = f ? `url(${URL.createObjectURL(f)})` : '';
    p.textContent = f ? '' : 'Sin fotografía';
  };
  $('#f').onsubmit = async e => {
    e.preventDefault();
    try { const d = await api('/objetos', { method: 'POST', body: new FormData(e.target) }); location.hash = '#/objeto/' + d.id; }
    catch (x) { $('#e').textContent = x.message; }
  };
}
