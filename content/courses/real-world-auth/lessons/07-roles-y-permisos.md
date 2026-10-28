---
title: Roles y permisos
module: 7
---

## Objetivos

- Modelar roles sencillos (usuario y administrador) y decidir dónde guardarlos.
- Exigir el rol correcto en cada operación administrativa, en el servidor.
- Explicar por qué un rol enviado por el cliente nunca debe creerse.
- Razonar qué ocurre cuando un rol cambia con la sesión abierta.
- Integrar todo el recorrido y presentar la **Entrega 3**.

## Contexto

La aplicación ya identifica a las personas y protege sus notas. Ahora el equipo necesita dos tipos de usuario: las personas comunes, que gestionan sus propias notas, y las administradoras, que además pueden ver el listado de usuarios y desactivar cuentas. Surgen preguntas: ¿dónde se guarda el rol?, ¿se manda al navegador para ocultar botones?, ¿qué pasa si le quitamos el rol de administrador a alguien que ya tiene sesión iniciada?

## Explicación

### Autorización basada en roles (RBAC)

El modelo más simple de permisos es asignar a cada usuario uno o más **roles**, y a cada operación un **rol requerido**:

| Operación | Quién puede |
| --- | --- |
| Leer, crear, editar y borrar **sus** notas | Cualquier usuario autenticado, solo sobre sus recursos |
| Listar usuarios | Solo administradores |
| Desactivar una cuenta | Solo administradores |

Dos niveles de verificación se combinan: **¿tiene el rol?** (permiso general) y **¿es suyo el recurso?** (propiedad, módulo 6). Un administrador también tiene límites: que sea administrador no implica que deba ver el contenido privado de las notas, a menos que el producto lo defina así.

### Dónde guardar el rol

- **En la base de datos**, en la tabla `users` (por ejemplo, una columna `role` con valores `USER` o `ADMIN`, o una tabla de roles si necesitas varios). Es la **fuente de verdad**.
- **Nunca** como un dato que el cliente envía y el servidor acepta (`{ "role": "admin" }` en el cuerpo, una cookie editable `role=admin`, un campo oculto).
- Por defecto, el **registro público debe crear usuarios comunes**. Si el endpoint de registro acepta un campo `role`, cualquiera se convierte en administrador (*mass assignment*). Define explícitamente qué campos se leen del cuerpo y descarta el resto.
- El primer administrador se crea fuera de la aplicación (un script, una migración de datos o una variable de entorno controlada) y los siguientes los otorga otro administrador.

### Exigir el rol en el servidor

```ts
export async function requireRole(role: "ADMIN") {
  const user = await requireUser(); // 401 si no hay sesión
  if (user.role !== role) throw new HttpError(403, "Sin permiso");
  return user;
}
```

```ts
// app/api/admin/users/route.ts
export async function GET() {
  try {
    await requireRole("ADMIN");
    return Response.json(await listUsers()); // devuelve solo campos permitidos
  } catch (error) {
    if (error instanceof HttpError) return Response.json({ error: error.message }, { status: error.status });
    throw error;
  }
}
```

Aplica `requireRole` en **cada** endpoint y acción administrativa, no solo en la página del panel. Que la página `/admin` esté protegida no protege `POST /api/admin/users/42/disable` si ese endpoint no verifica por su cuenta.

Principios útiles (OWASP):

- **Denegar por defecto**: una operación sin regla explícita se rechaza.
- **Mínimo privilegio**: da a cada rol solo lo que necesita.
- **Verificar en cada solicitud**, no una vez al iniciar sesión.

### Manipulación del cliente

Lo que llega del navegador puede ser cualquier cosa. Prueba estos intentos contra tu API y comprueba que ninguno concede permisos:

- Editar el JSON enviado para incluir `"role": "ADMIN"` o `"isAdmin": true`.
- Cambiar el `userId` en el cuerpo o la URL para operar sobre otra cuenta.
- Alterar la cookie de sesión.
- Llamar directamente al endpoint administrativo con una cuenta común.

Mostrar u ocultar el menú de administración según el rol es válido para la interfaz, pero la decisión real siempre se toma en el servidor.

### Cuando el rol cambia con la sesión abierta

Si a una persona le quitan el rol de administrador mientras tiene una sesión activa, ¿qué ocurre?

- **Sesión en el servidor que consulta la base en cada solicitud**: el cambio se aplica de inmediato, porque el rol se lee de la fuente de verdad.
- **JWT que lleva el rol dentro**: el token antiguo sigue diciendo `ADMIN` hasta que venza. Para mitigarlo, usa vencimientos cortos, o vuelve a consultar el rol en la base en las operaciones sensibles, o invalida las sesiones del usuario al cambiar su rol.

Cualquiera sea tu estrategia, documenta qué ocurre y cuánto tarda en aplicarse un cambio. Un cambio de rol es un buen momento para cerrar las sesiones existentes de esa cuenta.

### Registro de auditoría

Para acciones administrativas conviene guardar un registro: quién hizo qué, sobre qué recurso y cuándo. No incluyas datos secretos. En una beta puede ser una tabla simple de eventos.

### Integración final

La Entrega 3 reúne todo el recorrido. Se espera que alguien pueda clonar tu repositorio, seguir el README desde una instalación limpia (instalar, configurar variables, levantar PostgreSQL, migrar, ejecutar pruebas) y comprobar: **registro, login, acceso autorizado, rechazo de accesos indebidos y logout**.

## Práctica

Esta práctica cierra la **Entrega 3: Autorización e integración final**.

1. Añade el rol al modelo de datos (valor por defecto de usuario común) y asegúrate de que el registro público no acepta un rol enviado por el cliente.
2. Crea un mecanismo para el primer administrador fuera de la API pública (por ejemplo, un script documentado).
3. Implementa `requireRole("ADMIN")` y úsalo en al menos dos operaciones administrativas (listar usuarios y desactivar una cuenta).
4. Escribe pruebas: usuario común rechazado con `403`, administrador aceptado, intento de enviar `role` en el registro, intento de modificar identificadores del cliente y acceso sin sesión.
5. Decide y documenta qué sucede cuando se cambia el rol de alguien con sesión activa, e impleméntalo.
6. Escribe una prueba del recorrido completo: registro, login, acceso a su propio recurso, rechazo del recurso ajeno, rechazo de la operación administrativa, logout y rechazo posterior.
7. Prueba tu README en una carpeta limpia: clona, instala, configura y ejecuta siguiendo solo sus pasos.
8. Revisa la rúbrica y envía la entrega con el commit exacto. Las Entregas 1 y 2 deben estar aprobadas.

## Recursos

- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) — Principios de mínimo privilegio, denegación por defecto y verificación en cada solicitud. (en inglés)
- [OWASP Top 10: A01 Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/) — Ejemplos de escalada de privilegios y de manipulación de metadatos del cliente. (en inglés)
- [OWASP Mass Assignment Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html) — Por qué no debes aceptar campos como `role` desde el cliente. (en inglés)
- [Next.js: Authentication](https://nextjs.org/docs/app/guides/authentication) — Sección de autorización y de Data Access Layer en el App Router. (en inglés)
- [Auth.js: control de acceso basado en roles](https://authjs.dev/guides/role-based-access-control) — Guía de ejemplo para añadir roles con Auth.js, útil como comparación con tu implementación. (en inglés)
- [MDN: 403 Forbidden](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/403) — Significado de 403 frente a 401. (en inglés)

## Criterios de finalización

- [ ] Los recursos privados rechazan en el servidor las solicitudes sin sesión y las que apuntan a recursos de otra cuenta.
- [ ] Una cuenta común no puede ejecutar operaciones administrativas; una cuenta con el rol correcto sí.
- [ ] Modificar roles o identificadores enviados desde el navegador no concede permisos adicionales.
- [ ] El registro público siempre crea usuarios comunes.
- [ ] Documentaste qué ocurre cuando cambia el rol de una persona con sesión abierta.
- [ ] Tu README permite instalar, ejecutar y verificar el flujo completo desde una instalación limpia.
- [ ] Has enviado la Entrega 3 con el commit exacto y has marcado el módulo como completado.
