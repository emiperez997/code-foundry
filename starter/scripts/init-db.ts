/**
 * Crea el esquema y carga datos de ejemplo (dos usuarios con una nota cada uno).
 * Es idempotente: puedes ejecutarlo varias veces.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "pg";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Falta DATABASE_URL (copia .env.example a .env.local y expórtala).");

  const pool = new Pool({ connectionString });
  try {
    await pool.query(readFileSync(join(__dirname, "..", "db", "schema.sql"), "utf8"));

    const seeded = await pool.query("SELECT count(*)::int AS n FROM users");
    if (seeded.rows[0].n === 0) {
      for (const [name, title, body] of [
        ["Ana", "Nota de Ana", "Contenido privado de Ana."],
        ["Luis", "Nota de Luis", "Contenido privado de Luis."],
      ]) {
        const user = await pool.query("INSERT INTO users (name) VALUES ($1) RETURNING id", [name]);
        await pool.query("INSERT INTO notes (owner_id, title, body) VALUES ($1, $2, $3)", [user.rows[0].id, title, body]);
      }
    }

    const users = await pool.query("SELECT id, name FROM users ORDER BY created_at");
    console.log("Base lista. Usuarios de ejemplo:");
    for (const u of users.rows) console.log(`  ${u.name}: ${u.id}`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
