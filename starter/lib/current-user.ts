import { UUID_PATTERN } from "./notes";

/**
 * ⚠️ PUNTO DE PARTIDA INSEGURO (módulo 1): la identidad es lo que el cliente
 * dice en la cabecera X-User-Id. Cualquiera puede escribir cualquier valor.
 * Reemplaza esto por una sesión validada en el servidor.
 */
export function currentUserIdFromRequest(request: Request): string | null {
  const value = request.headers.get("x-user-id");
  return value && UUID_PATTERN.test(value) ? value : null;
}
