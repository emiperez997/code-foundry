import { getPool } from "./db";

export type Note = { id: string; title: string; body: string };

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function listNotesByOwner(ownerId: string): Promise<Note[]> {
  const { rows } = await getPool().query<Note>(
    "SELECT id, title, body FROM notes WHERE owner_id = $1 ORDER BY created_at DESC",
    [ownerId],
  );
  return rows;
}

/**
 * ⚠️ PUNTO DE PARTIDA INSEGURO (módulo 6): busca la nota solo por id,
 * sin comprobar a quién pertenece. Corrígelo.
 */
export async function getNoteById(noteId: string): Promise<Note | null> {
  const { rows } = await getPool().query<Note>(
    "SELECT id, title, body FROM notes WHERE id = $1",
    [noteId],
  );
  return rows[0] ?? null;
}
