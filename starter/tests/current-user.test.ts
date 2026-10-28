import { describe, expect, it } from "vitest";
import { currentUserIdFromRequest } from "../lib/current-user";

const ID = "3f2a8c1e-6b4d-4e0a-9f31-0d5c7a1b2e44";

describe("currentUserIdFromRequest (punto de partida)", () => {
  it("devuelve el id enviado en X-User-Id", () => {
    const request = new Request("http://localhost/api/notes", { headers: { "x-user-id": ID } });
    expect(currentUserIdFromRequest(request)).toBe(ID);
  });

  it("devuelve null sin cabecera o con un valor que no es UUID", () => {
    expect(currentUserIdFromRequest(new Request("http://localhost/api/notes"))).toBeNull();
    const bad = new Request("http://localhost/api/notes", { headers: { "x-user-id": "1 OR 1=1" } });
    expect(currentUserIdFromRequest(bad)).toBeNull();
  });
});

// Ejemplo para extender: cuando reemplaces X-User-Id por sesiones, esta prueba debe
// cambiar para exigir una sesión válida. Escribe aquí tus propias pruebas por módulo.
