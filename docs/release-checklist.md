# CodeFoundry — Release Checklist

Pasos a verificar antes de hacer release a producción.
Ejecutar en orden. Cada paso tiene un comando o criterio de aceptación claro.

---

## 1. Variables de entorno

Verificar que todas las variables requeridas estén configuradas en el entorno destino.

```bash
pnpm validate-env
```

Variables requeridas:

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Connection string de PostgreSQL |
| `AUTH_SECRET` | Secret de Auth.js para firmar sesiones (mínimo 32 caracteres) |

Configurar `AUTH_URL` con el origen del entorno destino cuando corresponda. Para
`pnpm start` local, usar `http://localhost:3000` (o el puerto elegido). Verificar
que Auth.js reconoce el host antes de ejecutar el smoke test.

---

## 2. Migraciones pendientes

Asegurarse de que todas las migraciones están aplicadas en la DB destino.

```bash
pnpm db:generate
pnpm db:migrate
```

Criterio: el comando termina sin errores y no reporta migraciones pendientes.

---

## 3. Seed de cursos

Sincronizar el contenido de `content/courses/` con la base de datos.
Actualiza cursos y módulos mediante upsert. Si se quitaron módulos del contenido,
elimina esos módulos y su progreso; revisar primero el impacto en la base destino.

```bash
pnpm db:check
pnpm db:seed
pnpm db:seed-assessments
```

Criterio: todos los slugs de cursos aparecen en la salida como `✓ <slug> — N module(s) synced`.

Las tres entregas versionadas del piloto deben sincronizarse sin sobrescribir
consignas previas. El seed impide eliminar módulos con entregas asociadas.
Habilitar una cuenta registrada con `pnpm admin:bootstrap --email EMAIL` y
comprobar acceso a `/admin`; ver [evaluation-model.md](evaluation-model.md).

---

## 4. Typecheck

```bash
pnpm typecheck
```

Criterio: sin errores de TypeScript.

---

## 5. Unit tests

```bash
pnpm test
pnpm test:db
```

Criterio: todos los tests en verde.

---

## 6. Build de producción

```bash
pnpm build
```

Criterio: build exitoso sin errores de compilación ni de tipos.

---

## 7. Smoke test manual (UI)

Con el servidor de producción levantado (`pnpm start`), verificar el flujo crítico:

- [ ] `/` carga la landing con lista de cursos
- [ ] `/courses` muestra los cursos publicados
- [ ] `/register` permite crear una cuenta nueva
- [ ] `/login` permite iniciar sesión
- [ ] `/courses/[slug]` muestra el detalle y el CTA correcto según estado de inscripción
- [ ] Al hacer click en "Empezar curso" se crea la inscripción y redirige al módulo 1
- [ ] Marcar módulo como completado actualiza el estado en la UI
- [ ] `/dashboard` muestra el curso en "En progreso" con el porcentaje correcto
- [ ] Al completar todos los módulos, el curso aparece en "Completados"
- [ ] El alumno envía un intento y ve únicamente su propio historial
- [ ] Un profesor asignado toma la entrega y devuelve cambios por criterio
- [ ] El alumno reenvía un nuevo commit; el profesor aprueba al cumplir los criterios
- [ ] El administrador gestiona roles y asignaciones; retirar permisos libera revisiones activas
- [ ] Una invitación puede aceptarse solo una vez y con el email indicado

El estado de lectura completada aún no representa la aprobación con certificado:
esa separación se implementa en la Fase 6.

---

## 8. E2E en CI

Verificar que el workflow `e2e.yml` pasó en el último commit de `main` antes del release.

URL del repo: `https://github.com/<org>/code-foundry/actions`

---

## Post-release

- [ ] Programar la limpieza periódica de ventanas vencidas con `pnpm db:prune-auth-limits`

- [ ] Verificar que las rutas `/courses`, `/login` y `/dashboard` responden correctamente en producción
- [ ] Revisar logs de errores en las primeras 10 minutos después del deploy
