const router = require('express').Router();
const db = require('../db'), { guardarFoto } = require('../almacen');
const { h, auth, upload, idNumerico } = require('../middleware');
router.param('id', idNumerico);

const SEL = `SELECT o.*, c.nombre_categoria, u.nombre AS autor,
  (SELECT ruta_imagen FROM fotografias f WHERE f.id_objeto=o.id_objeto LIMIT 1) AS foto
  FROM objetos o JOIN categorias c ON c.id_categoria=o.id_categoria JOIN usuarios u ON u.id_usuario=o.id_usuario`;

router.get('/categorias', auth, h(async (req, res) => res.json(await db.q('SELECT * FROM categorias ORDER BY id_categoria'))));
router.get('/stats', auth, h(async (req, res) => {
  res.json(await db.one(`SELECT COUNT(*)::int AS publicaciones,
    COUNT(*) FILTER (WHERE tipo='Encontrado')::int AS encontrados,
    COUNT(*) FILTER (WHERE estado='Recuperado')::int AS recuperados FROM objetos`));
}));
router.get('/objetos', auth, h(async (req, res) => {
  const { q, tipo, categoria, ubicacion } = req.query, w = [], p = [];
  if (q) { w.push('(o.nombre_objeto ILIKE ? OR o.descripcion ILIKE ?)'); p.push(`%${q}%`, `%${q}%`); }
  if (tipo) { w.push('o.tipo=?'); p.push(tipo); }
  if (categoria && /^\d+$/.test(categoria)) { w.push('o.id_categoria=?'); p.push(categoria); }
  if (ubicacion) { w.push('o.ubicacion ILIKE ?'); p.push(`%${ubicacion}%`); }
  res.json(await db.q(`${SEL} ${w.length ? 'WHERE ' + w.join(' AND ') : ''} ORDER BY o.id_objeto DESC LIMIT 60`, p));
}));
router.get('/mis-objetos', auth, h(async (req, res) =>
  res.json(await db.q(`${SEL} WHERE o.id_usuario=? ORDER BY o.id_objeto DESC`, [req.user.id]))));
router.get('/objetos/:id', auth, h(async (req, res) => {
  const o = await db.one(`${SEL} WHERE o.id_objeto=?`, [req.params.id]);
  o ? res.json(o) : res.status(404).json({ error: 'No encontramos ese objeto' });
}));
router.post('/objetos', auth, upload.single('foto'), h(async (req, res) => {
  const { tipo, nombre_objeto, id_categoria, ubicacion, fecha_suceso, descripcion = '' } = req.body;
  if (!['Perdido', 'Encontrado'].includes(tipo) || !nombre_objeto || !/^\d+$/.test(id_categoria || '') || !ubicacion || !fecha_suceso)
    return res.status(400).json({ error: 'Completa tipo, nombre, categoría, lugar y fecha' });
  const r = await db.one(
    'INSERT INTO objetos (id_usuario,id_categoria,nombre_objeto,descripcion,tipo,ubicacion,fecha_suceso) VALUES (?,?,?,?,?,?,?) RETURNING id_objeto',
    [req.user.id, id_categoria, nombre_objeto, descripcion, tipo, ubicacion, fecha_suceso]);
  if (req.file) await db.run('INSERT INTO fotografias (id_objeto, ruta_imagen) VALUES (?,?)', [r.id_objeto, await guardarFoto(req.file)]);
  res.json({ id: r.id_objeto });
}));
router.patch('/objetos/:id/estado', auth, h(async (req, res) => {
  if (!['Abierto', 'Recuperado'].includes(req.body.estado)) return res.status(400).json({ error: 'Estado no válido' });
  const n = await db.run('UPDATE objetos SET estado=? WHERE id_objeto=? AND id_usuario=?', [req.body.estado, req.params.id, req.user.id]);
  n ? res.json({ ok: 1 }) : res.status(403).json({ error: 'Solo quien publicó puede cambiarlo' });
}));
router.SEL = SEL;
module.exports = router;
