// Guarda las fotos: en Supabase Storage si está configurado, y en la carpeta uploads/ si no (solo para local).
// Render gratis borra los archivos del disco en cada reinicio, por eso en producción deben ir a Supabase.
const crypto = require('crypto'), fs = require('fs'), path = require('path');
const { createClient } = require('@supabase/supabase-js');

const BUCKET = process.env.SUPABASE_BUCKET || 'fotos';
const sb = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } }) : null;
const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };

exports.guardarFoto = async file => {
  const nombre = `${crypto.randomUUID()}.${EXT[file.mimetype]}`;
  if (sb) {
    const { error } = await sb.storage.from(BUCKET).upload(nombre, file.buffer, { contentType: file.mimetype });
    if (error) throw error;
    return sb.storage.from(BUCKET).getPublicUrl(nombre).data.publicUrl;
  }
  fs.mkdirSync('uploads', { recursive: true });
  fs.writeFileSync(path.join('uploads', nombre), file.buffer);
  return '/uploads/' + nombre;
};
