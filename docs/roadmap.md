# CodeFoundry — Roadmap MVP

## Plan vigente de cierre

El alcance acordado está en [mvp-scope.md](mvp-scope.md). Incluye revisión manual,
paneles de profesores y administradores y certificados. Las listas históricas que
siguen a este plan describen el MVP anterior y no acreditan un release validado.

| Fase                                     | Trabajo                                                                                                                 | Estado                |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------- |
| 1. Alcance                               | Curso piloto, español, stack, entregas, roles, evaluación y certificado                                                 | Definido              |
| 2. Entorno                               | Certificados de descarga de Prisma, cliente generado, variables, base local, migraciones y seed                         | Verificado localmente |
| 3. Acceso y autenticación                | Publicación efectiva, validación del servidor, callback de login, normalización de email y límites de intentos          | Verificado localmente |
| 4. Diseño e implementación de evaluación | Roles y permisos, entregas versionadas, revisión por criterios, historial y paneles de alumno, profesor y administrador | Verificado localmente |
| 5. Curso piloto                          | Adaptación al español, siete lecciones, repositorio base, tres consignas con rúbricas comprobables y recursos           | Pendiente             |
| 6. Certificados y experiencia            | Requisitos de aprobación, PDF y verificación, estados de interfaz, accesibilidad y revisión móvil                       | Pendiente             |
| 7. Calidad y entrega                     | Corregir lint y E2E, comprobar typecheck, unitarios y build, CI y validación del flujo completo desplegado              | Pendiente             |
| 8. Documentación y release               | README, decisiones técnicas, operación, límites y checklist de release                                                  | Pendiente             |

El contenido puede desarrollarse en paralelo con la implementación una vez
definidas las estructuras de módulos, entregas y criterios.

### Evidencia de la Fase 2

- Cliente Prisma generado usando los certificados confiables de Windows.
- `.env` local con secreto único y URL de Auth.js; validación automática en los scripts de arranque y build.
- PostgreSQL accesible en localhost; dos migraciones aplicadas y sin pendientes.
- Seed ejecutado: cinco cursos y 34 módulos sincronizados, sin módulos eliminados ni progreso afectado.
- 24 tests unitarios aprobados; lint, typecheck y build de producción aprobados.
- Arranque de producción local verificado: landing, catálogo, login y endpoint de sesión responden correctamente; módulo y dashboard envían al usuario sin sesión al login.
- Guía reproducible en [local-setup.md](local-setup.md).

Estas comprobaciones usan la base local configurada. No se ejecutaron E2E ni CI
remoto; el flujo autenticado y la base aislada de E2E se validarán en la fase de calidad.
La traducción y la publicación exclusiva del curso piloto pertenecen a la fase de contenido.

### Evidencia de la Fase 3

- Detalle, módulos y metadatos filtran cursos publicados; módulos y dashboard comprueban sesión.
- Inscripción y progreso comprueban que los identificadores pertenezcan al mismo curso publicado y usan la identidad de la sesión.
- Login y registro conservan destinos internos seguros y normalizan email, también en el proveedor de credenciales.
- Validación de tipos, longitudes y órdenes; registro controla duplicados concurrentes.
- Límites persistidos en PostgreSQL para login y registro; migración aplicada en la base local.
- 78 pruebas unitarias y cinco pruebas de integración con PostgreSQL aprobadas (concurrencia, vencimiento, publicación e aislamiento de progreso).
- Lint y build de producción con chequeo de tipos aprobados.
- Workflow E2E configurado para ejecutar las pruebas de integración en su base de prueba; CI remoto y recorrido completo de interfaz aún pendientes.
- Políticas y operación documentadas en [access-auth.md](access-auth.md).

### Evidencia de la Fase 4

- Migración aditiva de roles, cuentas activas, profesores asignados, entregas, versiones, intentos, invitaciones y auditoría. Las cuentas existentes conservan sus datos y reciben rol alumno.
- Paneles de alumno, profesor y administrador con permisos consultados en el servidor y estados de carga, vacío y error.
- Tres entregas del piloto vinculadas a los módulos 3, 5 y 7; consignas y criterios en español, seed idempotente y versiones anteriores conservadas.
- Corrección manual por criterio, reserva exclusiva de revisión, historial, reenvíos con un commit diferente y desbloqueo secuencial tras aprobar.
- Desactivar profesores o retirar permisos libera revisiones activas; se impide corregir trabajos propios y quitar al último administrador activo.
- Invitaciones de un solo uso, ligadas al email, con token almacenado como hash, vencimiento de siete días y revocación. El enlace se comparte manualmente.
- Comando de alta inicial del administrador aplicado a una cuenta registrada en el entorno local.
- 90 pruebas unitarias y 14 de integración con PostgreSQL aprobadas. La integración usa una base temporal aislada y la elimina al terminar.
- Dos E2E locales aprobados sobre el build de producción: entrega, devolución, reenvío y aprobación; invitación, aceptación y retiro de permisos.
- Lint, TypeScript y build de producción aprobados. La CI incluye seed de entregas y pruebas de integración; no se ejecutó CI remoto ni la suite E2E histórica completa.
- Modelo, permisos y operación documentados en [evaluation-model.md](evaluation-model.md).

Las lecciones completas en español, el repositorio base y los recursos corresponden
a la Fase 5. El certificado y la separación final entre lectura completada y curso
aprobado corresponden a la Fase 6.

## Roadmap histórico

## Fase 1 — Setup base

- [x] Instalar y configurar shadcn/ui sobre Tailwind 4
- [x] Actualizar `layout.tsx`: metadata de CodeFoundry, fuentes, navbar básica
- [x] Reemplazar `app/page.tsx` con landing real (hero + listado de cursos)

## Fase 2 — Catálogo y contenido

- [x] Ruta `/courses` — grid de CourseCards leyendo datos de Prisma (Server Component)
- [x] Ruta `/courses/[slug]` — detalle del curso con lista de módulos
- [x] Ruta `/courses/[slug]/modules/[order]` — vista del módulo con descripción en texto
- [ ] Renderizado de lecciones completas en el formato de contenido elegido

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

- [x] Agregar tests E2E del flujo crítico (auth → curso → progreso → dashboard)
- [x] Mantener unit tests + typecheck en verde en cada PR
- [x] Cubrir casos de regresión de tracking y navegación

## Fase 9 — CI/CD mínimo y release checklist

- [x] Configurar GitHub Actions (`install`, `test`, `build`)
- [x] Validar variables de entorno requeridas al arranque
- [x] Ejecutar checklist de release (migraciones, seed, smoke test)

## Fase 10 — Documentación y cierre

- [ ] Actualizar `README.md` al estado real del proyecto
- [ ] Documentar decisiones técnicas (Auth, Prisma, progreso, publicación)
- [ ] Agregar sección de límites del MVP y siguientes pasos post-MVP
- [ ] Cerrar roadmap con PR final de release
