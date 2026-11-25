-- FindIt School: esquema PostgreSQL para Supabase (pégalo completo en el SQL Editor y ejecútalo)

-- Cuentas y roles
CREATE TABLE usuarios (
  id_usuario SERIAL PRIMARY KEY,                                    -- llave primaria
  nombre VARCHAR(100) NOT NULL CHECK (LENGTH(nombre) >= 2),         -- nombre completo
  correo VARCHAR(100) NOT NULL UNIQUE CHECK (LENGTH(correo) >= 5),  -- correo escolar
  contrasena_hash VARCHAR(255) NOT NULL,                            -- hash bcrypt, nunca texto plano
  rol VARCHAR(20) NOT NULL DEFAULT 'estudiante',                    -- estudiante o admin
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW()                 -- alta de la cuenta
);

-- Clasificación de objetos
CREATE TABLE categorias (
  id_categoria SERIAL PRIMARY KEY,               -- llave primaria
  nombre_categoria VARCHAR(50) NOT NULL UNIQUE,  -- nombre visible
  descripcion VARCHAR(255)                       -- ejemplos de la categoría
);

-- Reportes publicados
CREATE TABLE objetos (
  id_objeto SERIAL PRIMARY KEY,                                               -- llave primaria
  id_usuario INT NOT NULL,                                                    -- quien publica
  id_categoria INT NOT NULL,                                                  -- clasificación
  nombre_objeto VARCHAR(100) NOT NULL CHECK (LENGTH(nombre_objeto) >= 2),     -- ej. Mochila azul
  descripcion TEXT,                                                           -- características visibles
  tipo VARCHAR(20) NOT NULL CHECK (LENGTH(tipo) >= 6),                        -- Perdido o Encontrado
  ubicacion VARCHAR(150) NOT NULL,                                            -- lugar aproximado
  fecha_suceso DATE NOT NULL,                                                 -- cuándo pasó
  estado VARCHAR(30) NOT NULL DEFAULT 'Abierto',                              -- Abierto, En revisión, Recuperado
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)
);

-- Imágenes de los reportes (el archivo vive en Supabase Storage, aquí queda su URL)
CREATE TABLE fotografias (
  id_foto SERIAL PRIMARY KEY,                 -- llave primaria
  id_objeto INT NOT NULL,                     -- reporte al que pertenece
  ruta_imagen VARCHAR(500) NOT NULL,          -- URL pública de la imagen
  FOREIGN KEY (id_objeto) REFERENCES objetos(id_objeto) ON DELETE CASCADE
);

-- Reclamaciones de devolución
CREATE TABLE solicitudes (
  id_solicitud SERIAL PRIMARY KEY,                              -- llave primaria
  id_objeto INT NOT NULL,                                       -- objeto reclamado
  id_usuario INT NOT NULL,                                      -- quien reclama
  mensaje_verificacion TEXT NOT NULL,                           -- datos que prueban la propiedad (privado)
  estado VARCHAR(30) NOT NULL DEFAULT 'Enviada',                -- Enviada, En revisión, Cerrada
  fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT NOW(),           -- cuándo se envió
  UNIQUE (id_objeto, id_usuario),                               -- una solicitud por persona y objeto
  FOREIGN KEY (id_objeto) REFERENCES objetos(id_objeto) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- Chat asociado a una solicitud
CREATE TABLE mensajes (
  id_mensaje SERIAL PRIMARY KEY,                                -- llave primaria
  id_solicitud INT NOT NULL,                                    -- conversación
  id_remitente INT NOT NULL,                                    -- quien escribe
  contenido TEXT NOT NULL,                                      -- texto del mensaje
  fecha_envio TIMESTAMPTZ NOT NULL DEFAULT NOW(),               -- cuándo se envió
  FOREIGN KEY (id_solicitud) REFERENCES solicitudes(id_solicitud) ON DELETE CASCADE,
  FOREIGN KEY (id_remitente) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- Enlaces para restablecer contraseña (se guarda el hash del token, no el token)
CREATE TABLE recuperaciones (
  id_recuperacion SERIAL PRIMARY KEY,                           -- llave primaria
  id_usuario INT NOT NULL,                                      -- cuenta que pidió el cambio
  token_hash CHAR(64) NOT NULL UNIQUE,                          -- SHA-256 del token enviado por correo
  expira TIMESTAMPTZ NOT NULL,                                  -- vence una hora después de pedirlo
  usado BOOLEAN NOT NULL DEFAULT FALSE,                         -- TRUE cuando ya se usó o se reemplazó
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);

-- Seguridad: Supabase expone las tablas por su API pública. Con RLS activado y sin políticas,
-- esa API no puede leer nada; el servidor entra directo a Postgres y no se ve afectado.
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE objetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotografias ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recuperaciones ENABLE ROW LEVEL SECURITY;

INSERT INTO categorias (nombre_categoria, descripcion) VALUES
  ('Mochilas y bolsas', 'Mochilas, bolsas, loncheras'),
  ('Electrónicos', 'Celulares, audífonos, calculadoras, cargadores'),
  ('Documentos', 'Credenciales, cuadernos, libros'),
  ('Ropa y accesorios', 'Chamarras, gorras, termos, llaves'),
  ('Otros', 'Lo que no encaje arriba');
