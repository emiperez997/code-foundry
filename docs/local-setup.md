# Preparación del entorno local

## Requisitos

- Node.js y pnpm; esta preparación se verificó con Node.js 24.14.0 y pnpm 10.30.3.
- PostgreSQL 16 disponible localmente, o Docker Compose para levantarlo.
- Acceso HTTPS para descargar dependencias y motores de Prisma.

## Instalación y variables

```powershell
pnpm install --frozen-lockfile
pnpm setup:env
pnpm validate-env
```

`setup:env` crea `.env` desde `.env.example` si no existe y genera un
`AUTH_SECRET` aleatorio de 32 bytes si falta. Agrega `AUTH_URL=http://localhost:3000`
si no está configurado, para que Auth.js reconozca el host al ejecutar `pnpm start`.
Conserva los valores ya configurados
y no muestra secretos. `.env` está excluido de Git.
La validación requiere una URL de PostgreSQL con host y base y un secreto de al
menos 32 caracteres. No comprueba conectividad; esa verificación es independiente.

El ejemplo apunta a `codefoundry` en localhost con las credenciales del Compose.
Si usás otra instancia, editá `DATABASE_URL` en `.env` para apuntar a una base de
desarrollo dedicada. Las pruebas E2E deben usar una base separada, porque crean usuarios.
Si cambiás el puerto o desplegás en otro dominio, ajustá `AUTH_URL` al origen correcto.

## PostgreSQL

Si ya tenés PostgreSQL, creá la base y el usuario correspondientes a tu configuración.
Si usás Docker, desde la raíz del repositorio:

```powershell
docker compose up -d --wait db
```

El Compose incluye un healthcheck y publica el puerto 5432 únicamente en localhost.
Las credenciales de ejemplo son para desarrollo local.

## Cliente, migraciones y cursos

```powershell
pnpm db:generate
pnpm db:migrate
pnpm db:status
pnpm db:seed
pnpm db:check
```

`db:migrate` aplica las migraciones existentes sin resetear la base.
El seed es explícito y debe ejecutarse separado de las migraciones.
Actualiza cursos y módulos desde `content/courses/`; si se eliminaron módulos del
contenido, elimina también su progreso. Sobre una base con datos existentes,
ejecutá `pnpm db:check` antes del seed para revisar módulos y progreso afectados.
`db:check` solo lee la base y compara los órdenes de módulos con el contenido;
no sustituye la revisión del texto ni de la publicación de cursos.

## Certificados de Windows y Prisma

En este entorno la descarga inicial de Prisma fallaba con
`self-signed certificate in certificate chain`. Se resolvió usando los certificados
confiables del sistema con Node.js 24, sin desactivar la validación TLS:

```powershell
$env:NODE_USE_SYSTEM_CA = '1'
pnpm db:generate
```

La variable se aplica a la sesión actual de PowerShell. No es una opción de `.env`
de la aplicación: Node debe recibirla al iniciar el proceso. Si el error persiste,
revisá los certificados confiables de la red con quien administra el entorno.

## Comprobaciones y arranque

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm start
```

Para desarrollo, usá `pnpm dev`. Los scripts `predev` y `prebuild` validan el
entorno y generan Prisma antes de arrancar o compilar; `prestart` valida el entorno.
Los comandos directos de Next.js no ejecutan esas comprobaciones.

## Resultado de la Fase 2

La evidencia local y las limitaciones se registran en el roadmap. El cierre de esta
fase no implica que los E2E ni el nuevo alcance funcional estén completados.
