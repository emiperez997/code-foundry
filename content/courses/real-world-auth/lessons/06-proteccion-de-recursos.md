---
title: Protección de recursos
module: 6
---

## Objetivos

- Explicar por qué la protección solo en el cliente (ocultar botones, redirigir en el navegador) no es seguridad.
- Aplicar la verificación de sesión en el servidor en páginas, Route Handlers y Server Actions.
- Impedir que una persona acceda a recursos de otra (control de propiedad, IDOR).
- Elegir entre `401`, `403` y `404` con criterio.
- Preparar la **Entrega 3**.

## Contexto

Una persona del equipo de QA entró al panel de administración escribiendo la URL `/admin` a mano. La interfaz no mostraba el enlace, y había una redirección en el navegador cuando no había sesión, pero la página y los datos eran accesibles: la redirección ocurría después de que el servidor ya había enviado todo. Luego probó cambiar el número en `/api/notes/17` por `/api/notes/18` y vio una nota de otro usuario.

Son dos fallos distintos, ambos de **autorización en el servidor**: no exigir sesión y no comprobar de quién es el recurso.

## Explicación

### El navegador es territorio del usuario

Todo lo que ejecuta el navegador puede ser modificado por quien lo usa: se puede editar el JavaScript, quitar un `disabled`, llamar a la API directamente o repetir una solicitud con otros valores. Ocultar un botón o redirigir desde un componente cliente mejora la **experiencia**, pero no protege nada. La regla es:

> **Cada operación y cada página privada deben verificar identidad y permisos en el servidor, cada vez.**

Hacerlo en la interfaz también es útil (no mostrar lo que no se puede usar), pero es una comodidad, no una defensa.

### Dónde verificar en Next.js

En el App Router hay varios puntos de entrada y **cada uno necesita su propia comprobación**:

- **Páginas y layouts (Server Components)**: verifica la sesión antes de leer datos. Cuidado: un layout no protege a sus páginas por sí solo, porque en navegaciones del lado del cliente los layouts no se vuelven a renderizar. Comprueba en cada página, o mejor, dentro de la función de acceso a datos.
- **Route Handlers** (`app/api/.../route.ts`): comprueba la sesión al inicio de cada método (`GET`, `POST`, ...).
- **Server Actions**: son endpoints públicos aunque parezcan funciones. Verifica sesión y permisos dentro de cada acción.
- **Middleware / proxy**: sirve para redirecciones rápidas (por ejemplo, enviar a `/login` si no hay cookie), pero no debe ser la única barrera: solo comprueba la presencia de la cookie, no su validez completa, y puede haber rutas que no cubra.

El patrón más robusto es una **capa de acceso a datos** (*Data Access Layer*): funciones como `getCurrentUserOrThrow()` y `getNoteForUser(userId, noteId)` que todos los puntos de entrada usan. Así la comprobación no depende de que cada desarrollador la recuerde.

```ts
// lib/auth/guard.ts
export class HttpError extends Error {
  constructor(public status: 401 | 403 | 404, message: string) {
    super(message);
  }
}

export async function requireUser() {
  const user = await getSessionUser((await cookies()).get("session")?.value);
  if (!user) throw new HttpError(401, "No autenticado");
  return user;
}
```

```ts
// app/api/notes/route.ts
export async function GET() {
  try {
    const user = await requireUser();
    const notes = await listNotesByOwner(user.id); // el userId sale de la sesión, no del cliente
    return Response.json(notes);
  } catch (error) {
    if (error instanceof HttpError) return Response.json({ error: error.message }, { status: error.status });
    throw error;
  }
}
```

Observa que `user.id` sale de la **sesión validada**, nunca de la cabecera, el cuerpo o la URL.

### Propiedad de los recursos (IDOR)

Que la persona esté autenticada no significa que pueda ver **cualquier** recurso. Si `/api/notes/18` devuelve la nota sin comprobar de quién es, tienes una *referencia directa a objeto insegura* (IDOR). La solución es incluir al propietario en la consulta:

```ts
// ❌ Solo autentica
const note = await db.query("SELECT * FROM notes WHERE id = $1", [noteId]);

// ✅ Autoriza: el recurso se busca dentro de lo que le pertenece a la persona
const note = await db.query(
  "SELECT id, title, body FROM notes WHERE id = $1 AND owner_id = $2",
  [noteId, user.id],
);
if (note.rowCount === 0) throw new HttpError(404, "No encontrado");
```

Los identificadores difíciles de adivinar (UUID) ayudan, pero **no reemplazan** la comprobación.

### 401, 403 o 404

| Código | Cuándo |
| --- | --- |
| `401` | No hay identidad válida: no hay sesión, vencida o inválida |
| `403` | Hay identidad, pero no tiene permiso para esta operación (se usará con roles) |
| `404` | El recurso no existe **o no te pertenece**; evita confirmar que existe |

Para recursos que pertenecen a otra persona suele ser preferible `404`: un `403` confirma que el recurso existe. Lo importante es ser consistente y documentarlo.

### Rutas protegidas en la interfaz

En el cliente puedes redirigir a `/login` y ocultar elementos para mejorar la experiencia, pero acompaña siempre esa lógica con la verificación del servidor. Una forma de probarlo: desactiva JavaScript o llama a la API con `curl` sin cookie y comprueba que recibes `401` y ningún dato.

### Otras fugas habituales

- **Datos de más en la respuesta**: devolver el objeto completo de la base de datos con campos internos.
- **Acciones con `GET` que cambian datos**: los navegadores y los rastreadores hacen `GET` sin pensar.
- **Confianza en campos ocultos**: un `<input type="hidden" name="userId">` es editable.
- **Rutas olvidadas**: endpoints de prueba o de administración sin protección.

## Práctica

Este módulo prepara la **Entrega 3**.

1. Añade a tu proyecto una función `requireUser()` que valide la sesión en el servidor y reutilízala en todos los puntos de entrada privados.
2. Protege las páginas y los endpoints privados del `starter/` (notas): sin sesión, el servidor responde `401` para la API y redirige a login para las páginas, sin enviar datos privados.
3. Elimina cualquier uso de `X-User-Id` o de identificadores enviados por el cliente para determinar la identidad.
4. Asegura la propiedad: las consultas de lectura, edición y borrado de notas deben incluir el propietario obtenido de la sesión.
5. Decide y documenta qué código devuelves cuando el recurso es de otra persona.
6. Escribe pruebas: acceso sin sesión (páginas y API), acceso a la nota de otra cuenta, acceso a una nota propia y a una inexistente.
7. Haz un recorrido manual: abre las URLs privadas en una ventana de incógnito y repite con `curl`.

## Recursos

- [OWASP Top 10: A01 Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/) — Visión general de los fallos de control de acceso, incluida la manipulación de URL e identificadores. (en inglés)
- [OWASP IDOR Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html) — Explica las referencias directas a objetos y cómo prevenirlas. (en inglés)
- [Next.js: Data Security](https://nextjs.org/docs/app/guides/data-security) — Recomendaciones oficiales sobre la capa de acceso a datos y la verificación en el servidor. (en inglés)
- [Next.js: Authentication (autorización y rutas protegidas)](https://nextjs.org/docs/app/guides/authentication) — Incluye por qué un layout no basta y cómo usar un Data Access Layer. (en inglés)
- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) — Principios: denegar por defecto, verificar en cada solicitud y aplicar el mínimo privilegio. (en inglés)
- [MDN: 403 Forbidden](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/403) — Diferencia entre 401 y 403. (en inglés)

## Criterios de finalización

- [ ] Todas las páginas y operaciones privadas rechazan en el servidor las solicitudes sin sesión válida.
- [ ] La identidad se obtiene siempre de la sesión validada, nunca de datos enviados por el cliente.
- [ ] Un usuario no puede leer, modificar ni borrar recursos de otra cuenta.
- [ ] Documentaste qué código HTTP se devuelve en cada caso de rechazo.
- [ ] Tienes pruebas del acceso sin sesión y del acceso a recursos ajenos.
- [ ] Has marcado el módulo como completado.
