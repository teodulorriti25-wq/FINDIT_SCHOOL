// Actualización en vivo con Socket.IO.
// Cada persona entra a dos salas: "general" (novedades de publicaciones) y "usuario:<id>" (avisos solo para ella).
// Los clientes solo escuchan: el servidor es quien emite, después de guardar en la base de datos.
const { Server } = require('socket.io');
const { verificar } = require('./middleware');

let io = null;

exports.iniciar = servidor => {
  io = new Server(servidor);
  // Solo se conecta quien trae una sesión válida (el mismo JWT del resto de la API)
  io.use((socket, next) => {
    try { socket.data.user = verificar(socket.handshake.auth?.token || ''); next(); }
    catch { next(new Error('sin sesión')); }
  });
  io.on('connection', socket => {
    socket.join('general');
    socket.join('usuario:' + socket.data.user.id);
  });
};

exports.emitir = (sala, evento, datos) => { if (io) io.to(sala).emit(evento, datos); };
