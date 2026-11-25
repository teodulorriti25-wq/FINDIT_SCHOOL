require('dotenv').config();
const express = require('express'), fs = require('fs');
const app = express();
app.use(express.json());
app.get('/healthz', (req, res) => res.send('ok')); // Render lo usa para saber que el servicio está vivo
fs.mkdirSync('uploads', { recursive: true });
app.use('/uploads', express.static('uploads'));
app.use(express.static('public'));
app.use('/api', require('./src/routes/auth'), require('./src/routes/objetos'),
  require('./src/routes/solicitudes'), require('./src/routes/admin'));
app.use((err, req, res, next) => res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'La foto pesa más de 3 MB' : 'Solicitud no válida' }));
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log('FindIt School en http://localhost:' + PORT));
