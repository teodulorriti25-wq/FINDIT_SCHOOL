const jwt = require('jsonwebtoken'), multer = require('multer');
const SECRET = process.env.JWT_SECRET || 'cambia-esto';

// Atrapa errores de funciones async para no repetir try/catch en cada ruta
const h = fn => (req, res) => fn(req, res).catch(e => { console.error(e); res.status(500).json({ error: 'Error del servidor' }); });
const verificar = token => jwt.verify(token, SECRET);
const firmar = u => jwt.sign({ id: u.id_usuario, nombre: u.nombre, rol: u.rol }, SECRET, { expiresIn: '7d' });
const auth = (req, res, next) => {
  try { req.user = verificar((req.headers.authorization || '').slice(7)); next(); }
  catch { res.status(401).json({ error: 'Inicia sesión para continuar' }); }
};
const soloAdmin = (req, res, next) => req.user.rol === 'admin' ? next() : res.status(403).json({ error: 'Solo administradores' });
// La foto se recibe en memoria y de ahí pasa a almacen.js
const upload = multer({
  storage: multer.memoryStorage(), limits: { fileSize: 3e6 },
  fileFilter: (req, f, cb) => cb(null, /^image\/(png|jpe?g|webp)$/.test(f.mimetype))
});
// Si el :id de la URL no es un número, responde 404 en lugar de romper la consulta
const idNumerico = (req, res, next, v) => /^\d+$/.test(v) ? next() : res.status(404).json({ error: 'No encontrado' });
module.exports = { h, firmar, verificar, auth, soloAdmin, upload, idNumerico };
