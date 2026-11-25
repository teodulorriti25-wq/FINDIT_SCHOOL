const { Pool, types } = require('pg');
types.setTypeParser(1082, v => v); // DATE llega como texto "2026-11-09", sin cambios por zona horaria

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
  max: 5 // el pooler gratuito de Supabase tiene pocas conexiones
});
// Las consultas se escriben con ? y aquí se convierten al formato $1, $2 de Postgres
const num = sql => { let i = 0; return sql.replace(/\?/g, () => '$' + (++i)); };

module.exports = {
  q: async (sql, p = []) => (await pool.query(num(sql), p)).rows,         // todas las filas
  one: async (sql, p = []) => (await pool.query(num(sql), p)).rows[0],    // una fila o undefined
  run: async (sql, p = []) => (await pool.query(num(sql), p)).rowCount    // filas afectadas
};
