# Acceso y autenticación — Fase 3

## Publicación y acciones

El catálogo, los detalles, los módulos y sus metadatos consultan únicamente cursos
con `isPublished=true`. Un curso oculto no se puede abrir con su URL; para un
usuario sin sesión, la ruta de módulo solicita login antes de consultar contenido.
La página de módulo comprueba la sesión además de la protección del proxy.
El dashboard también está protegido por el proxy y por su página.

La inscripción exige que ID, slug y módulo de destino correspondan a un mismo
curso publicado. Las acciones de completar y desmarcar exigen que el ID del módulo,
el orden y el slug coincidan con un módulo de un curso publicado.
La identidad del alumno siempre proviene de la sesión; un `userId` enviado desde
el navegador no modifica esa identidad. Completar crea inscripción y progreso
en una transacción. Desmarcar elimina únicamente progreso del usuario autenticado.

## Validación y redirecciones

- Login y registro normalizan email con trim y minúsculas; el proveedor también valida solicitudes directas a Auth.js.
- Los campos de formulario deben ser texto, no archivos.
- Nombre: obligatorio, hasta 100 caracteres y sin controles.
- Email: obligatorio, hasta 254 caracteres y con formato básico válido.
- Contraseña de registro: mínimo 8 caracteres y máximo 72 bytes UTF-8 para evitar truncamiento en bcrypt.
- Órdenes: enteros positivos completos dentro del rango de PostgreSQL; no se aceptan valores como `1abc`.
- El registro controla el error de unicidad de PostgreSQL incluso si dos solicitudes intentan crear la misma cuenta simultáneamente.
- Las credenciales incorrectas y los límites de login muestran el mismo error genérico. Para cuentas inexistentes se compara contra un hash ficticio.

`callbackUrl` se conserva entre login y registro y se valida de nuevo en la acción.
Solo se admiten rutas internas; se rechazan URLs externas, rutas con origen relativo,
barras invertidas, controles y codificaciones ambiguas de rutas. Login y registro
no pueden ser destinos de retorno. El destino de respaldo es `/courses`.
Si el registro crea la cuenta pero Auth.js rechaza el ingreso automático, se envía
al login conservando el destino.

## Límites de intentos de la beta

| Operación | Clave | Límite por ventana fija |
|---|---|---|
| Login | Global | 100 solicitudes por minuto |
| Login | Email normalizado | 10 intentos cada 15 minutos |
| Registro | Global | 100 intentos válidos cada 15 minutos |
| Registro | Email normalizado | 5 intentos válidos cada 15 minutos |

Los intentos permitidos se consumen también cuando el resultado es exitoso.
La ventana empieza con el primer intento y vence sin intervención manual.
Los límites globales protegen la capacidad de la beta y pueden restringir a varios
usuarios a la vez; los límites por email pueden afectar a usuarios que comparten cuenta.
Estos valores se revisarán según el uso antes de ampliar la beta.

La tabla `auth_rate_limits` persiste ventanas y contadores; un UPSERT atómico aplica
los límites entre procesos, solicitudes concurrentes y reinicios. Las claves por
email contienen un hash SHA-256 y no el email en texto plano. No se confía en un
header IP enviado por el cliente. Una política por IP requiere primero definir
la infraestructura y qué proxy proporciona una IP confiable.

Aplicar la migración antes de arrancar la aplicación actualizada:

```powershell
pnpm db:generate
pnpm db:migrate
```

Para evitar acumulación de ventanas vencidas, ejecutar periódicamente:

```powershell
pnpm db:prune-auth-limits
```

El comando elimina exclusivamente ventanas ya vencidas. Su programación en el
entorno destino forma parte de la preparación del despliegue.

## Validación

```powershell
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

Las pruebas de integración son optativas en la suite habitual y requieren PostgreSQL
con las migraciones aplicadas. Para ejecutarlas en una sesión de PowerShell:

```powershell
$env:RUN_DB_TESTS = '1'
pnpm exec vitest run lib/auth/access.integration.test.ts
Remove-Item Env:RUN_DB_TESTS
```

Usan fixtures con UUID y limpian únicamente sus propios usuarios, cursos, módulos,
progreso y ventanas. En CI se ejecutan contra la base de prueba del workflow E2E.
Las pruebas de interfaz del recorrido completo se actualizan en la fase de calidad.
Los permisos de profesores y administradores pertenecen a la Fase 4.
