# CodeFoundry — Roadmap MVP

## Fase 1 — Setup base
- [ ] Instalar y configurar shadcn/ui sobre Tailwind 4
- [ ] Actualizar `layout.tsx`: metadata de CodeFoundry, fuentes, navbar básica
- [ ] Reemplazar `app/page.tsx` con landing real (hero + listado de cursos)

## Fase 2 — Catálogo y contenido
- [ ] Ruta `/courses` — grid de CourseCards leyendo datos de Prisma (Server Component)
- [ ] Ruta `/courses/[slug]` — detalle del curso con lista de módulos
- [ ] Ruta `/courses/[slug]/modules/[order]` — vista del módulo (renderizado de Markdown)

## Fase 3 — Autenticación
- [ ] Instalar Auth.js v5
- [ ] Implementar register + login con credentials (passwordHash ya en schema)
- [ ] Proteger rutas de módulos con middleware de sesión

## Fase 4 — Tracking de progreso
- [ ] Server Action: marcar módulo como completado (tabla `Progress`)
- [ ] Dashboard `/dashboard` con progreso del usuario por curso
- [ ] Lógica de `isPublished` + seed actualizado

## Fase 5 — Calidad
- [ ] Tests unitarios para `courseParser.ts` y Server Actions críticos
- [ ] Tipos estrictos end-to-end (Prisma types → componentes)
