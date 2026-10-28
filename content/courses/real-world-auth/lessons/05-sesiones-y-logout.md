---
title: Sesiones y logout
module: 5
---

## Objetivos

- Explicar cómo una sesión permite al servidor reconocer solicitudes sucesivas.
- Comparar sesiones almacenadas en el servidor con tokens firmados (JWT) y elegir una estrategia justificada.
- Configurar correctamente la cookie de sesión (`HttpOnly`, `Secure`, `SameSite`, vencimiento).
- Rechazar sesiones vencidas, manipuladas o cerradas.
- Implementar el logout y preparar la **Entrega 2**.

## Contexto

El login ya verifica credenciales, pero el servidor sigue sin recordar nada: en la solicitud siguiente la persona vuelve a ser anónima. Hay que emitir una credencial de sesión que el navegador presente automáticamente. El equipo duda entre dos caminos: guardar sesiones en la base de datos o emitir un JWT. También quieren saber cuánto debe durar una sesión y qué ocurre al cerrar sesión.

## Explicación

### Qué es una sesión

Una sesión es una **credencial temporal** que el servidor emite tras un login correcto. El navegador la envía en cada solicitud y el servidor la usa para saber de quién se trata. Debe cumplir tres cosas:

1. **Ser imposible de adivinar o falsificar** (aleatoria y larga, o firmada).
2. **Tener un vencimiento** (y poder terminar antes por logout).
3. **Ir por un canal que el navegador gestione bien** (normalmente una cookie).

### Dos estrategias

**A. Sesión en el servidor (identificador opaco).** Al hacer login generas un identificador aleatorio y guardas en PostgreSQL una fila con el usuario, la fecha de creación y de vencimiento. La cookie contiene solo el identificador.

- ✅ Revocar es trivial: borras la fila (logout, cambio de rol, sospecha de robo).
- ✅ El contenido nunca viaja al cliente.
- ⚠️ Cada solicitud autenticada hace una consulta.

**B. Token firmado (JWT).** El servidor emite un token con los datos (`sub`, `exp`, …) firmado con una clave secreta. No hace falta consultar la base para validarlo.

- ✅ Sin estado en el servidor; cómodo con varios servicios.
- ⚠️ **No se puede revocar** antes de que venza, salvo que mantengas una lista de revocación (que reintroduce estado).
- ⚠️ El contenido está firmado pero **no cifrado**: cualquiera lo puede leer, así que no pongas datos sensibles dentro.
- ⚠️ Errores clásicos: aceptar el algoritmo `none`, no verificar `exp`, usar secretos débiles.

Para una aplicación pequeña con un solo servidor, la **opción A es más simple y más segura por defecto**, y permite que el logout realmente cierre la sesión. Si eliges JWT, hazlo con una biblioteca consolidada, fija el algoritmo permitido, vencimientos cortos y documenta cómo manejas el logout y el cambio de roles. Auth.js, la biblioteca de autenticación para Next.js, ofrece ambas estrategias.

### Generar el identificador

Usa un generador criptográficamente seguro y suficiente entropía (OWASP recomienda al menos 64 bits; con 32 bytes aleatorios sobran):

```ts
import { createHash, randomBytes } from "node:crypto";

export function newSessionToken() {
  const token = randomBytes(32).toString("base64url"); // se envía al navegador
  const tokenHash = createHash("sha256").update(token).digest("hex"); // se guarda
  return { token, tokenHash };
}
```

Guardar solo el **hash** del identificador significa que una filtración de la tabla de sesiones no entrega sesiones utilizables. Aquí SHA-256 sí es adecuado porque el valor ya es aleatorio y de alta entropía (a diferencia de una contraseña elegida por una persona).

### La cookie de sesión

```ts
import { cookies } from "next/headers";

const SESSION_HOURS = 8;

export async function setSessionCookie(token: string) {
  (await cookies()).set("session", token, {
    httpOnly: true,                          // JavaScript no puede leerla (mitiga robo por XSS)
    secure: process.env.NODE_ENV === "production", // solo por HTTPS
    sameSite: "lax",                         // no se envía en solicitudes cross-site de escritura
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60,
  });
}
```

- `HttpOnly`: el script de la página no accede a la cookie.
- `Secure`: el navegador solo la envía por HTTPS.
- `SameSite=Lax` (o `Strict`): reduce el riesgo de CSRF, pero no lo elimina por completo; las acciones que cambian datos deben usar métodos como `POST` y, según el caso, un token anti-CSRF. Las Server Actions de Next.js incluyen protecciones propias de origen.
- **Nunca** guardes la sesión en `localStorage`: es legible por cualquier script de la página.

### Validar en cada solicitud

```ts
export async function getSessionUser(token: string | undefined) {
  if (!token) return null;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const row = await findSession(tokenHash); // { userId, expiresAt }
  if (!row) return null; // inexistente o manipulada
  if (row.expiresAt <= new Date()) {
    await deleteSession(tokenHash);
    return null; // vencida
  }
  return findUserById(row.userId);
}
```

Una cookie manipulada produce un identificador que no existe en la base: se rechaza igual que una sesión ausente. Con JWT, la firma inválida cumple ese papel.

### Vencimiento

Hay dos relojes que conviene distinguir:

- **Vencimiento absoluto**: la sesión muere N horas después de crearse, pase lo que pase.
- **Vencimiento por inactividad**: la sesión muere si no se usa durante un tiempo.

Para la beta basta un vencimiento absoluto razonable (horas o pocos días según el riesgo) bien documentado. Cuanto más sensibles los datos, más corto debe ser. Además, **renueva el identificador tras el login** (siempre se emite uno nuevo) para evitar fijación de sesión, y borra las filas vencidas de forma periódica.

### Logout

El logout debe hacer **dos cosas en el servidor**:

1. Borrar o invalidar la sesión (la fila en la base).
2. Pedir al navegador que elimine la cookie.

Si solo borras la cookie del navegador, un identificador copiado antes seguiría siendo válido. Comprueba, después del logout, que el mismo identificador es rechazado por el servidor.

### Antes de empezar la entrega

Esta lección cierra la **Entrega 2: Login y sesiones**. Revisa la rúbrica: se comprueban credenciales válidas e inválidas, persistencia entre solicitudes, rechazo de sesiones vencidas y manipuladas, logout y el límite de intentos del módulo anterior.

## Práctica

1. Decide entre sesión en el servidor y JWT y escribe en el README las razones, el vencimiento elegido y cómo se maneja el logout.
2. Crea la tabla de sesiones (identificador hasheado, usuario, creación, vencimiento) si usas sesiones en el servidor.
3. Al login correcto, emite un identificador nuevo y establece la cookie con `HttpOnly`, `Secure` en producción y `SameSite`.
4. Implementa una función que, a partir de la cookie, devuelva el usuario autenticado o `null`, rechazando sesiones inexistentes, manipuladas o vencidas.
5. Implementa el logout: borra la sesión en el servidor y la cookie en el navegador.
6. Escribe pruebas: sesión persistente entre solicitudes, sesión vencida (adelanta el vencimiento en la base), identificador manipulado y reutilización de un identificador tras el logout.
7. Verifica manualmente en el navegador: inicia sesión, recarga, cierra sesión y vuelve a pedir un recurso privado.
8. Comprueba cada criterio de la rúbrica, y envía la entrega con el commit exacto. La Entrega 1 debe estar aprobada.

## Recursos

- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) — Referencia sobre generación de identificadores, atributos de cookie, vencimiento y logout. (en inglés)
- [MDN: Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie) — Explicación de cada atributo (`HttpOnly`, `Secure`, `SameSite`, `Max-Age`). (en inglés)
- [Next.js: cookies()](https://nextjs.org/docs/app/api-reference/functions/cookies) — API para leer y escribir cookies en Server Components y Server Actions. (en inglés)
- [Introduction to JSON Web Tokens](https://jwt.io/introduction) — Explicación de la estructura y el uso de los JWT. (en inglés)
- [RFC 7519: JSON Web Token](https://datatracker.ietf.org/doc/html/rfc7519) — Especificación oficial, incluida la definición de `exp`. (en inglés)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html) — Qué es CSRF y cómo se combina `SameSite` con otras defensas. (en inglés)
- [Auth.js](https://authjs.dev) — Biblioteca de autenticación para Next.js; útil para comparar tu diseño con una solución establecida. (en inglés)

## Criterios de finalización

- [ ] Las credenciales válidas producen una sesión que se mantiene entre solicitudes y recargas.
- [ ] Las sesiones vencidas, manipuladas o cerradas son rechazadas por el servidor.
- [ ] La cookie usa `HttpOnly`, `SameSite` y `Secure` en producción, y la sesión no se guarda en `localStorage`.
- [ ] El logout invalida la sesión en el servidor y elimina la cookie del navegador.
- [ ] Tu README explica la estrategia de sesión, el vencimiento y el límite de intentos.
- [ ] Has enviado la Entrega 2 con el commit exacto y has marcado el módulo como completado.
