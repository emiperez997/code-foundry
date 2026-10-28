import { currentUserIdFromRequest } from "@/lib/current-user";
import { getNoteById, UUID_PATTERN } from "@/lib/notes";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  const userId = currentUserIdFromRequest(request);
  if (!userId) return Response.json({ error: "Falta identidad" }, { status: 401 });

  const { id } = await params;
  if (!UUID_PATTERN.test(id)) return Response.json({ error: "No encontrado" }, { status: 404 });

  // ⚠️ Inseguro a propósito: no comprueba que la nota sea de `userId` (módulo 6).
  const note = await getNoteById(id);
  if (!note) return Response.json({ error: "No encontrado" }, { status: 404 });
  return Response.json(note);
}
