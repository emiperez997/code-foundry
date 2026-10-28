---
title: Login y verificación de identidad
module: 4
---

## Objetivos

- Implementar la verificación de credenciales comparando la contraseña enviada con el hash almacenado.
- Diseñar mensajes de error que no revelen si una cuenta existe.
- Reducir las diferencias observables entre "email inexistente" y "contraseña incorrecta".
- Limitar los intentos repetidos de ingreso (rate limiting) con una ventana documentada.
- Evitar filtrar información sensible en respuestas y registros.

## Contexto

Las cuentas ya existen y sus contraseñas están protegidas. Ahora hace falta el login. En una primera versión alguien del equipo propone devolver mensajes "amables": "No existe una cuenta con ese email" cuando el email no está y "Contraseña incorrecta" cuando está pero la clave no coincide. Parece buena experiencia de usuario, pero entrega a un atacante una lista de emails válidos y le dice exactamente qué parte de la credencial ya acertó. Además, nada impide probar miles de contraseñas por minuto contra una misma cuenta.

## Explicación

### Verificar sin revelar

El flujo de login es corto:

1. Validar el formato de lo recibido (tipos, longitudes). No hace falta normalizar la contraseña; el email sí se normaliza igual que en el registro.
2. Buscar el usuario por email.
3. Verificar la contraseña contra el hash.
4. Si todo es correcto, crear una sesión (módulo 5). Si algo falla, devolver **siempre el mismo error genérico**.

```ts
export async function login(emailRaw: unknown, passwordRaw: unknown) {
  const GENERIC_ERROR = { ok: false, status: 401, message: "Email o contraseña incorrectos." } as const;

  if (typeof emailRaw !== "string" || typeof passwordRaw !== "string") return GENERIC_ERROR;
  const email = emailRaw.trim().toLowerCase();
  if (email.length > 254 || passwordRaw.length > 128) return GENERIC_ERROR;

  const user = await findUserByEmail(email); // devuelve id, email y passwordHash
  // Verifica siempre contra un hash, exista o no el usuario:
  const hash = user?.passwordHash ?? DUMMY_HASH;
  const valid = await verifyPassword(passwordRaw, hash);

  if (!user || !valid) return GENERIC_ERROR;
  return { ok: true, userId: user.id } as const;
}
```

### Mensajes y tiempos

- **Mismo mensaje y mismo código HTTP** para email inexistente y contraseña incorrecta. Si cambian el texto, el código, o la estructura de la respuesta, un atacante puede distinguirlos.
- **Tiempos similares**: si para un email inexistente respondes en 2 ms y para uno real en 200 ms (porque calculaste el hash), la diferencia de tiempo delata la existencia de la cuenta. Por eso el ejemplo verifica contra un `DUMMY_HASH` precalculado (un hash válido de una contraseña aleatoria generado al arrancar) cuando el usuario no existe.
- La comparación del hash debe usar la función de la biblioteca (`bcrypt.compare`, `timingSafeEqual`), no `===`.

### Qué no debes filtrar

- Mensajes de la base de datos o trazas en la respuesta.
- Si una cuenta existe, está bloqueada o tiene otro método de acceso (salvo decisión de producto documentada).
- Contraseñas, hashes o tokens en logs. Registra eventos útiles ("intento fallido", identificador de solicitud, momento) sin datos secretos.

### Límite de intentos (rate limiting)

Sin límite, un atacante puede automatizar una **fuerza bruta** (muchas contraseñas contra una cuenta) o un **relleno de credenciales** (credenciales filtradas de otros sitios probadas contra tu login). El hash lento ayuda, pero no sustituye al límite.

Una estrategia sencilla y suficiente para la beta:

- Cuenta los intentos **fallidos** por clave: por email normalizado y también por dirección IP. Contar solo por IP perjudica a quienes comparten red; contar solo por email permite que un tercero bloquee la cuenta de otra persona (esa es una limitación que debes conocer y documentar).
- Define una **ventana** (por ejemplo, 5 intentos fallidos cada 15 minutos) y responde `429 Too Many Requests` con la cabecera `Retry-After` al superarla.
- Guarda los contadores en la base de datos (un esquema mínimo es `key`, `attempts`, `window_start`) para que funcionen con varias instancias del servidor; un `Map` en memoria solo sirve en desarrollo.
- Haz la actualización del contador de forma atómica (`INSERT ... ON CONFLICT DO UPDATE`) para que solicitudes simultáneas no lo eludan.
- Reinicia el contador tras un login correcto y limpia periódicamente las filas vencidas.

```sql
INSERT INTO login_attempts (key, attempts, window_start)
VALUES ($1, 1, now())
ON CONFLICT (key) DO UPDATE SET
  attempts     = CASE WHEN login_attempts.window_start < now() - interval '15 minutes'
                      THEN 1 ELSE login_attempts.attempts + 1 END,
  window_start = CASE WHEN login_attempts.window_start < now() - interval '15 minutes'
                      THEN now() ELSE login_attempts.window_start END
RETURNING attempts, window_start;
```

Este límite debe ser **verificable**: otra persona tiene que poder repetir N intentos y ver el `429`. Documenta la ventana y el umbral en el README.

Otras defensas que quedan fuera del alcance mínimo (conviene mencionarlas en tu README): autenticación multifactor, detección de contraseñas filtradas, CAPTCHA y alertas por intentos sospechosos.

### Códigos de estado

| Situación | Código |
| --- | --- |
| Datos con formato inválido | `400` |
| Credenciales incorrectas | `401` con mensaje genérico |
| Demasiados intentos | `429` con `Retry-After` |

## Práctica

Este módulo prepara la **Entrega 2**.

1. Implementa `POST /api/login` con la validación de tipos y longitudes, la verificación contra el hash y un mensaje de error único.
2. Verifica contra un hash ficticio cuando el usuario no existe, y comprueba midiendo que los tiempos de ambos casos son comparables.
3. Añade el límite de intentos por email normalizado y por IP, con contadores en PostgreSQL, ventana y umbral configurables.
4. Responde `429` con `Retry-After` al superar el límite y reinicia el contador tras un login correcto.
5. Revisa que ni las respuestas ni los logs incluyan contraseñas, hashes ni detalles internos.
6. Escribe pruebas: login válido, email inexistente, contraseña incorrecta (mismo mensaje y código en ambos), cuerpo inválido y superación del límite.
7. Documenta en el README el umbral, la ventana y las limitaciones del límite de intentos.

Todavía no hace falta mantener la sesión: devuelve el resultado de la verificación y deja la sesión para el módulo siguiente.

## Recursos

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) — Incluye la sección sobre mensajes de error genéricos y sobre protección contra fuerza bruta. (en inglés)
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) — Qué registrar de un intento de login y qué datos excluir. (en inglés)
- [MDN: 401 Unauthorized](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401) — Cuándo usar 401 y cómo se diferencia de 403. (en inglés)
- [MDN: 429 Too Many Requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429) — Semántica del código 429 y de la cabecera `Retry-After`. (en inglés)
- [PostgreSQL: INSERT ... ON CONFLICT](https://www.postgresql.org/docs/current/sql-insert.html#SQL-ON-CONFLICT) — Documentación de la operación atómica usada para el contador. (en inglés)
- [OWASP Top 10: A07 Identification and Authentication Failures](https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/) — Contexto sobre fuerza bruta y relleno de credenciales. (en inglés)

## Criterios de finalización

- [ ] Un login con credenciales válidas se verifica correctamente contra el hash almacenado.
- [ ] Email inexistente y contraseña incorrecta producen la misma respuesta (código y mensaje).
- [ ] Los tiempos de respuesta de ambos casos fallidos son comparables.
- [ ] Repetir intentos fallidos activa un límite verificable (`429`), con ventana y umbral documentados.
- [ ] Respuestas y registros no contienen contraseñas, hashes ni detalles internos.
- [ ] Tienes pruebas de los casos de éxito y de error, y has marcado el módulo como completado.
