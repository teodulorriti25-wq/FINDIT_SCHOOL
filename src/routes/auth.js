const router = require('express').Router();
const bcrypt = require('bcryptjs'), crypto = require('crypto');
const db = require('../db'), enviarCorreo = require('../correo');
const { h, firmar } = require('../middleware');

const sha = t => crypto.createHash('sha256').update(t).digest('hex');
const escHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sesion = u => ({ token: firmar(u), user: { id: u.id_usuario, nombre: u.nombre, rol: u.rol, correo: u.correo } });

router.post('/registro', h(async (req, res) => {
  const { nombre = '', correo = '', password = '' } = req.body;
  if (nombre.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(correo) || password.length < 6)
    return res.status(400).json({ error: 'Revisa tu nombre, un correo válido y una contraseña de al menos 6 caracteres' });
  const dup = await db.q('SELECT 1 FROM usuarios WHERE correo=?', [correo.toLowerCase()]);
  if (dup.length) return res.status(409).json({ error: 'Ese correo ya tiene una cuenta' });
  const r = await db.one('INSERT INTO usuarios (nombre, correo, contrasena_hash) VALUES (?,?,?) RETURNING id_usuario',
    [nombre.trim(), correo.toLowerCase(), await bcrypt.hash(password, 10)]);
  res.json(sesion({ id_usuario: r.id_usuario, nombre: nombre.trim(), rol: 'estudiante', correo: correo.toLowerCase() }));
}));

router.post('/login', h(async (req, res) => {
  const u = await db.one('SELECT * FROM usuarios WHERE correo=?', [(req.body.correo || '').toLowerCase()]);
  if (!u || !(await bcrypt.compare(req.body.password || '', u.contrasena_hash)))
    return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
  res.json(sesion(u));
}));

// Recuperación: siempre responde igual, exista o no el correo, para no revelar quién tiene cuenta
router.post('/recuperar', h(async (req, res) => {
  const correo = (req.body.correo || '').toLowerCase().trim();
  const u = await db.one('SELECT id_usuario, nombre FROM usuarios WHERE correo=?', [correo]);
  if (u) {
    const token = crypto.randomBytes(32).toString('hex');
    await db.run('UPDATE recuperaciones SET usado=TRUE WHERE id_usuario=? AND usado=FALSE', [u.id_usuario]);
    await db.run("INSERT INTO recuperaciones (id_usuario, token_hash, expira) VALUES (?,?,NOW() + INTERVAL '1 hour')",
      [u.id_usuario, sha(token)]); // en la base solo se guarda el hash del token
    const enlace = `${process.env.APP_URL || 'https://findit-school.onrender.com'}/#/restablecer/${token}`;
    try {
      await enviarCorreo({
        para: correo, nombre: u.nombre, asunto: 'Restablece tu contraseña de FindIt School',
        html: `<p>Hola ${escHtml(u.nombre)},</p><p>Recibimos una solicitud para cambiar tu contraseña. Usa este enlace en la próxima hora:</p>
          <p><a href="${enlace}">Crear una contraseña nueva</a></p><p>Si no fuiste tú, ignora este correo y tu contraseña seguirá igual.</p>`
      });
    } catch (e) { console.error('No se pudo enviar el correo:', e.message); }
  }
  res.json({ ok: 1 });
}));

router.post('/restablecer', h(async (req, res) => {
  const { token = '', password = '' } = req.body;
  if (password.length < 6) return res.status(400).json({ error: 'La contraseña necesita al menos 6 caracteres' });
  const r = await db.one('SELECT id_recuperacion, id_usuario FROM recuperaciones WHERE token_hash=? AND usado=FALSE AND expira > NOW()', [sha(token)]);
  if (!r) return res.status(400).json({ error: 'El enlace venció o ya se usó. Pide uno nuevo.' });
  await db.run('UPDATE usuarios SET contrasena_hash=? WHERE id_usuario=?', [await bcrypt.hash(password, 10), r.id_usuario]);
  await db.run('UPDATE recuperaciones SET usado=TRUE WHERE id_recuperacion=?', [r.id_recuperacion]);
  res.json({ ok: 1 });
}));
module.exports = router;
