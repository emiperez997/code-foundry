# Base del curso: Sistema de autenticación para una aplicación real

Proyecto mínimo con **Next.js (App Router), TypeScript y PostgreSQL** sobre el que harás las tres
entregas del curso. Es una aplicación de notas privadas que **todavía no tiene autenticación**:
identifica a las personas con la cabecera `X-User-Id`, que cualquiera puede falsificar. Tu trabajo
es reemplazar eso por un sistema de acceso real.

> Esta carpeta forma parte del repositorio de CodeFoundry, pero es un proyecto independiente.
> **Cópiala a un repositorio propio** (fuera de CodeFoundry) y trabaja allí: las entregas se
> hacen con el enlace a ese repositorio y un commit exacto.

## Requisitos

- Node.js 20 o superior y [pnpm](https://pnpm.io) (o npm).
- Docker con Compose (o un PostgreSQL 14+ propio).

## Puesta en marcha

```bash
cp .env.example .env.local   # DATABASE_URL apunta al PostgreSQL de compose.yml (puerto 5433)
pnpm install
pnpm db:up                   # levanta PostgreSQL con docker compose
export DATABASE_URL="postgres://starter:starter-local-only@localhost:5433/starter"
pnpm db:init                 # crea las tablas y dos usuarios de ejemplo; imprime sus ids
pnpm dev                     # http://localhost:3000
```

Las credenciales de `compose.yml` son solo para desarrollo local. No las uses en ningún entorno real.

## Probar el punto de partida (módulo 1)

Usa uno de los ids impresos por `pnpm db:init`:

```bash
curl -H "X-User-Id: <id-de-ana>" http://localhost:3000/api/notes
curl -H "X-User-Id: <id-de-luis>" http://localhost:3000/api/notes
```

Cambiar el valor de la cabecera basta para leer las notas de otra persona: ese es el problema que
resolverás.

## Qué trae y qué te falta

| Elemento | Estado inicial |
| --- | --- |
| Tablas `users` y `notes` (`db/schema.sql`) | `users` no tiene email ni contraseña: los añades tú |
| `GET /api/notes`, `GET /api/notes/:id` | Identidad por `X-User-Id`; la nota por id no comprueba propietario |
| Pruebas con Vitest (`tests/`) | Una prueba de ejemplo; extiéndelas en cada módulo |
| Registro, login, sesiones, roles | **No existen**: son tu trabajo |

## Mapa de trabajo

1. Módulo 1: reproduce la suplantación y escribe tus requisitos.
2. Módulos 2 y 3 (Entrega 1): registro con validación y contraseñas con hash.
3. Módulos 4 y 5 (Entrega 2): login, sesiones, logout y límite de intentos.
4. Módulos 6 y 7 (Entrega 3): protección de recursos, roles e integración final.

## Comandos

| Comando | Descripción |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Compilación de producción |
| `pnpm typecheck` | Comprobación de tipos |
| `pnpm test` | Pruebas con Vitest |
| `pnpm db:up` / `pnpm db:init` | Levantar PostgreSQL / crear esquema y datos de ejemplo |

## Convenciones recomendadas

- No guardes secretos en el repositorio: usa `.env.local` (ya está en `.gitignore`).
- Añade migraciones o actualiza `db/schema.sql` de forma reproducible para que otra persona pueda
  instalar el proyecto desde cero.
- Mantén un `README.md` propio que explique cómo instalar, ejecutar, probar y verificar tu solución.
