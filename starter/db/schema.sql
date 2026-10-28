-- Esquema inicial de la base del curso.
-- A propósito NO hay contraseñas ni sesiones: las añadirás tú en los módulos 2 a 5.

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid() en versiones antiguas

CREATE TABLE IF NOT EXISTS users (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      text NOT NULL,
  body       text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notes_owner_id_idx ON notes(owner_id);
