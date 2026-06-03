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

- [x] Tests unitarios para `courseParser.ts` y Server Actions críticos
- [x] Tipos estrictos end-to-end (Prisma types → componentes)

---

## Roadmap de cierre MVP (Global)

Este bloque agrupa el trabajo final para considerar el MVP como "release-ready".

### Bloque A — Producto y experiencia de aprendizaje

## Fase 6 — Inscripción y progreso real

- [x] Crear entidad `Enrollment` (`userId`, `courseId`, `enrolledAt`)
- [x] Definir regla de inscripción (explícita o automática al iniciar curso)
- [x] Ajustar Dashboard para mostrar cursos inscritos aunque no tengan `Progress`
- [x] Mantener compatibilidad con progreso por módulo (`Progress`)

## Fase 7 — Flujo guiado y UX final

- [x] CTA inteligente en curso (`Empezar` / `Continuar` / `Completado`)
- [x] Navegación recomendada al siguiente módulo pendiente
- [x] Separar en Dashboard: "En progreso" vs "Completados"
- [x] Consolidar estados `loading`, `empty` y `error` en rutas clave

### Bloque B — Calidad, entrega y documentación

## Fase 8 — Validación de punta a punta

- [ ] Agregar tests E2E del flujo crítico (auth → curso → progreso → dashboard)
- [ ] Mantener unit tests + typecheck en verde en cada PR
- [ ] Cubrir casos de regresión de tracking y navegación

## Fase 9 — CI/CD mínimo y release checklist

- [ ] Configurar GitHub Actions (`install`, `test`, `build`)
- [ ] Validar variables de entorno requeridas al arranque
- [ ] Ejecutar checklist de release (migraciones, seed, smoke test)

## Fase 10 — Documentación y cierre

- [ ] Actualizar `README.md` al estado real del proyecto
- [ ] Documentar decisiones técnicas (Auth, Prisma, progreso, publicación)
- [ ] Agregar sección de límites del MVP y siguientes pasos post-MVP
- [ ] Cerrar roadmap con PR final de release
