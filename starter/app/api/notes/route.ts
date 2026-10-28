import { currentUserIdFromRequest } from "@/lib/current-user";
import { listNotesByOwner } from "@/lib/notes";

export async function GET(request: Request) {
  const userId = currentUserIdFromRequest(request);
  if (!userId) return Response.json({ error: "Falta identidad" }, { status: 401 });
  return Response.json(await listNotesByOwner(userId));
}
