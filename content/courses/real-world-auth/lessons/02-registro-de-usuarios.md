---
title: Registro de usuarios
module: 2
---

## Objetivos

- Diseñar un endpoint de registro que valide en el servidor todo lo que recibe.
- Decidir qué datos se aceptan, cuáles se normalizan y cuáles se guardan.
- Manejar emails duplicados de forma controlada, incluso con solicitudes simultáneas.
- Devolver errores útiles para la persona sin revelar detalles internos.

## Contexto

El CTO ya tiene claro que el sistema necesita cuentas. La primera pieza es el registro: un formulario y el endpoint que lo recibe. En la reunión surgen preguntas que parecen menores y no lo son: ¿qué pasa si alguien envía un email vacío?, ¿y si dos personas se registran con el mismo email a la vez?, ¿y si el formulario valida pero alguien llama al endpoint directamente?

La respuesta a todas se resume en una frase: **el servidor es la única barrera que importa**.

## Explicación

### La validación del cliente es ayuda, no seguridad

Validar en el formulario (campos obligatorios, formato de email) mejora la experiencia: la persona ve el error al instante. Pero cualquier persona puede saltarse el formulario y enviar la solicitud con `curl`. Por eso hay dos capas con objetivos distintos:

| Capa | Objetivo | ¿Puede omitirse? |
| --- | --- | --- |
| Cliente | Experiencia de uso | Sí, siempre |
| Servidor | Integridad y seguridad | No: es la regla real |

Escribe las reglas una sola vez en una función o esquema reutilizable en el servidor. Librerías como Zod ayudan a declararlas, pero no son obligatorias: una función con comprobaciones explícitas también sirve.

### Qué validar

Para un registro con email y contraseña, un conjunto razonable de reglas es:

- **Tipo y presencia**: ambos campos existen y son cadenas. El cuerpo de la solicitud puede ser cualquier cosa, incluido `null`, un número o un arreglo.
- **Email**: formato plausible y longitud máxima (254 caracteres es el límite práctico). No intentes validar el email con una expresión regular gigantesca: la única prueba real de que un email existe es enviar un mensaje.
- **Contraseña**: longitud mínima y máxima. Las recomendaciones del NIST (SP 800-63B) piden al menos 8 caracteres, permitir contraseñas largas y **no imponer reglas de composición** arbitrarias ("una mayúscula y un símbolo"). Un máximo razonable (por ejemplo 128 caracteres) evita que alguien envíe contraseñas gigantes para consumir CPU al calcular el hash.
- **Tamaño del cuerpo**: limita lo que aceptas leer.

### Normalizar antes de guardar

`Ana@Example.com` y `ana@example.com` se leen como el mismo email. Normaliza (recortar espacios y pasar a minúsculas) **antes** de validar y de guardar. Si no lo haces, la misma persona puede crear dos cuentas, y alguien puede registrar una variante de mayúsculas del email de otra.

### Duplicados: la base de datos decide

Un error frecuente es comprobar primero y crear después:

```ts
// ❌ Condición de carrera
const existing = await db.query("SELECT 1 FROM users WHERE email = $1", [email]);
if (existing.rowCount) return conflict();
await db.query("INSERT INTO users (email, password_hash) VALUES ($1, $2)", [email, hash]);
```

Si dos solicitudes llegan a la vez, ambas pueden pasar la comprobación y ambas insertar. La solución es una **restricción `UNIQUE`** en la base de datos y tratar su violación como el resultado esperado:

```sql
ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
```

```ts
try {
  await db.query("INSERT INTO users (email, password_hash) VALUES ($1, $2)", [email, hash]);
} catch (error) {
  // PostgreSQL: 23505 = unique_violation
  if ((error as { code?: string }).code === "23505") return conflict();
  throw error;
}
```

Así la base de datos garantiza que solo una de las solicitudes simultáneas gana, y la otra recibe un error controlado.

### Qué decirle a la persona

Un registro con un email ya usado plantea un dilema real: decir "ese email ya existe" ayuda a quien se equivocó, pero también confirma a un atacante que ese email tiene cuenta (enumeración de usuarios). Es un compromiso de producto. En este curso, para el registro, acepta mostrar un mensaje claro de duplicado y **documenta la decisión** en tu README, indicando el riesgo y cómo lo mitigarías (por ejemplo, un mensaje neutro y un correo de confirmación). En el login, en cambio, nunca revelarás si el email existe (módulo 4).

Reglas generales para los errores:

- Usa códigos HTTP coherentes: `400` o `422` para datos inválidos, `409` para duplicados.
- Devuelve mensajes por campo para que la interfaz pueda mostrarlos.
- No devuelvas trazas, consultas SQL ni mensajes de la base de datos.
- Nunca incluyas la contraseña en la respuesta ni en los registros (`logs`).

### Qué guardar y qué devolver

Guarda lo mínimo: email normalizado, hash de la contraseña (módulo 3), fecha de creación. Al responder, devuelve solo campos explícitamente permitidos (`id`, `email`). Evita devolver el objeto completo de la fila: es la forma más común de filtrar un hash por accidente.

## Práctica

En tu repositorio, a partir de `starter/`:

1. Crea la tabla `users` (email único, hash de contraseña, fecha de creación) mediante una migración o el archivo de esquema de la base.
2. Implementa `POST /api/register` con validación completa en el servidor: tipos, email, longitud de contraseña y tamaño del cuerpo.
3. Normaliza el email antes de validarlo y guardarlo.
4. Maneja los duplicados mediante la restricción `UNIQUE` y la violación `23505`, no con comprobación previa.
5. Devuelve únicamente `id` y `email` en la respuesta exitosa.
6. Escribe pruebas automáticas para: registro válido, campos vacíos, email inválido, contraseña corta, cuerpo que no es un objeto, duplicado y dos registros simultáneos con el mismo email.
7. Anota en el README tus decisiones de validación y el compromiso sobre el mensaje de duplicado.

Este módulo prepara la **Entrega 1**. Aún no guardes contraseñas "provisionalmente" en texto plano: si necesitas avanzar, pasa al módulo 3 y vuelve.

## Recursos

- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html) — Guía práctica de validación en el servidor, con listas permitidas y límites de longitud. (en inglés)
- [NIST SP 800-63B: Digital Identity Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html) — Fuente de las recomendaciones actuales sobre longitud y composición de contraseñas. (en inglés)
- [PostgreSQL: restricciones UNIQUE](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-UNIQUE-CONSTRAINTS) — Documentación oficial de la restricción que evita duplicados. (en inglés)
- [PostgreSQL: códigos de error](https://www.postgresql.org/docs/current/errcodes-appendix.html) — Tabla donde aparece `23505 unique_violation`. (en inglés)
- [Zod](https://zod.dev) — Biblioteca opcional para declarar esquemas de validación en TypeScript. (en inglés)
- [Next.js: formularios y Server Actions](https://nextjs.org/docs/app/guides/forms) — Cómo recibir y validar datos de formularios en el App Router. (en inglés)

## Criterios de finalización

- [ ] Tu endpoint rechaza en el servidor datos vacíos, de tipo incorrecto, con email inválido y con contraseña insuficiente, sin crear cuentas.
- [ ] Un email repetido (también con distinta capitalización y en solicitudes simultáneas) produce una sola cuenta y un error controlado.
- [ ] La respuesta de registro nunca incluye la contraseña ni su hash.
- [ ] Tienes pruebas automáticas para los casos anteriores.
- [ ] Has documentado tus decisiones de validación en el README.
- [ ] Has marcado el módulo como completado.
