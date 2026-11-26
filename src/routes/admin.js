const router = require('express').Router();
const db = require('../db'), SEL = require('./objetos').SEL, { emitir } = require('../realtime');
const { h, auth, soloAdmin, idNumerico } = require('../middleware');
router.param('id', idNumerico);

router.get('/admin/resumen', auth, soloAdmin, h(async (req, res) => {
  const resumen = await db.one(`SELECT (SELECT COUNT(*) FROM usuarios)::int AS usuarios,
    (SELECT COUNT(*) FROM objetos WHERE estado<>'Recuperado')::int AS activos,
    (SELECT COUNT(*) FROM objetos WHERE estado='Recuperado')::int AS recuperados,
    (SELECT COUNT(*) FROM solicitudes)::int AS solicitudes`);
  const objetos = await db.q(`${SEL} ORDER BY o.id_objeto DESC LIMIT 50`);
  const usuarios = await db.q('SELECT id_usuario, nombre, correo, rol, fecha_registro FROM usuarios ORDER BY id_usuario DESC LIMIT 50');
  res.json({ resumen, objetos, usuarios });
}));
router.delete('/admin/objetos/:id', auth, soloAdmin, h(async (req, res) => {
  await db.run('DELETE FROM objetos WHERE id_objeto=?', [req.params.id]);
  emitir('general', 'objeto:eliminado', { id_objeto: +req.params.id });
  res.json({ ok: 1 });
}));
module.exports = router;
