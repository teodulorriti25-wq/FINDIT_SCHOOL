const router = require('express').Router();
const db = require('../db');
const { h, auth, idNumerico } = require('../middleware');
router.param('id', idNumerico);

const SOL = `SELECT s.*, o.nombre_objeto, o.id_usuario AS id_dueno, u.nombre AS solicitante,
  (SELECT contenido FROM mensajes m WHERE m.id_solicitud=s.id_solicitud ORDER BY m.id_mensaje DESC LIMIT 1) AS ultimo FROM solicitudes s
  JOIN objetos o ON o.id_objeto=s.id_objeto JOIN usuarios u ON u.id_usuario=s.id_usuario`;

// Devuelve la solicitud solo si el usuario es quien reclama o el dueño del objeto
const participante = async (req, res) => {
  const s = await db.one(`${SOL} WHERE s.id_solicitud=?`, [req.params.id]);
  if (!s || (s.id_usuario !== req.user.id && s.id_dueno !== req.user.id)) { res.status(403).json({ error: 'No participas en esta solicitud' }); return null; }
  return s;
};

router.post('/solicitudes', auth, h(async (req, res) => {
  const { id_objeto, mensaje_verificacion = '' } = req.body;
  const o = /^\d+$/.test(String(id_objeto)) ? await db.one('SELECT id_usuario, estado FROM objetos WHERE id_objeto=?', [id_objeto]) : null;
  if (!o) return res.status(404).json({ error: 'Objeto inexistente' });
  if (o.id_usuario === req.user.id) return res.status(400).json({ error: 'No puedes reclamar tu propia publicación' });
  if (o.estado === 'Recuperado') return res.status(400).json({ error: 'Este objeto ya fue recuperado' });
  if (mensaje_verificacion.trim().length < 10) return res.status(400).json({ error: 'Describe algo que solo el dueño sabría (mínimo 10 caracteres)' });
  const dup = await db.q('SELECT 1 FROM solicitudes WHERE id_objeto=? AND id_usuario=?', [id_objeto, req.user.id]);
  if (dup.length) return res.status(409).json({ error: 'Ya enviaste una solicitud por este objeto' });
  const r = await db.one('INSERT INTO solicitudes (id_objeto,id_usuario,mensaje_verificacion) VALUES (?,?,?) RETURNING id_solicitud', [id_objeto, req.user.id, mensaje_verificacion.trim()]);
  await db.run("UPDATE objetos SET estado='En revisión' WHERE id_objeto=? AND estado='Abierto'", [id_objeto]);
  res.json({ id: r.id_solicitud });
}));
router.get('/solicitudes', auth, h(async (req, res) =>
  res.json(await db.q(`${SOL} WHERE s.id_usuario=? OR o.id_usuario=? ORDER BY s.id_solicitud DESC`, [req.user.id, req.user.id]))));
router.get('/solicitudes/:id/mensajes', auth, h(async (req, res) => {
  const s = await participante(req, res); if (!s) return;
  const m = await db.q('SELECT m.*, u.nombre FROM mensajes m JOIN usuarios u ON u.id_usuario=m.id_remitente WHERE m.id_solicitud=? ORDER BY m.id_mensaje', [s.id_solicitud]);
  // la respuesta de verificación solo la ve el dueño del objeto
  res.json({ solicitud: { ...s, mensaje_verificacion: s.id_dueno === req.user.id ? s.mensaje_verificacion : null }, mensajes: m });
}));
router.post('/solicitudes/:id/mensajes', auth, h(async (req, res) => {
  const s = await participante(req, res); if (!s) return;
  if (!(req.body.contenido || '').trim()) return res.status(400).json({ error: 'Escribe un mensaje' });
  await db.run('INSERT INTO mensajes (id_solicitud,id_remitente,contenido) VALUES (?,?,?)', [s.id_solicitud, req.user.id, req.body.contenido.trim()]);
  res.json({ ok: 1 });
}));
router.patch('/solicitudes/:id', auth, h(async (req, res) => {
  const s = await participante(req, res); if (!s) return;
  if (s.id_dueno !== req.user.id) return res.status(403).json({ error: 'Solo quien publicó el objeto decide' });
  if (!['En revisión', 'Cerrada'].includes(req.body.estado)) return res.status(400).json({ error: 'Estado no válido' });
  await db.run('UPDATE solicitudes SET estado=? WHERE id_solicitud=?', [req.body.estado, s.id_solicitud]);
  if (req.body.estado === 'Cerrada') await db.run("UPDATE objetos SET estado='Recuperado' WHERE id_objeto=?", [s.id_objeto]);
  res.json({ ok: 1 });
}));
module.exports = router;
