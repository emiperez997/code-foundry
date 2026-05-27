# CodeFoundry — Roadmap MVP

## Fase 1 — Setup base

- [x] Instalar y configurar shadcn/ui sobre Tailwind 4
- [x] Actualizar `layout.tsx`: metadata de CodeFoundry, fuentes, navbar básica
- [x] Reemplazar `app/page.tsx` con landing real (hero + listado de cursos)

## Fase 2 — Catálogo y contenido

- [x] Ruta `/courses` — grid de CourseCards leyendo datos de Prisma (Server Component)
- [x] Ruta `/courses/[slug]` — detalle del curso con lista de módulos
- [x] Ruta `/courses/[slug]/modules/[order]` — vista del módulo (renderizado de Markdown)

## Fase 3 — Autenticación

- [x] Instalar Auth.js v5
- [x] Implementar register + login con credentials (passwordHash ya en schema)
- [x] Proteger rutas de módulos con middleware de sesión

## Fase 4 — Tracking de progreso

- [x] Server Action: marcar módulo como completado (tabla `Progress`)
- [x] Dashboard `/dashboard` con progreso del usuario por curso
- [x] Lógica de `isPublished` + seed actualizado

## Fase 5 — Calidad

- [ ] Tests unitarios para `courseParser.ts` y Server Actions críticos
- [ ] Tipos estrictos end-to-end (Prisma types → componentes)
