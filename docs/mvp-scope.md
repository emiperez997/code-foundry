# CodeFoundry — Alcance del MVP

Estado: alcance acordado. Esta definición no implica que las funcionalidades estén implementadas.

## Objetivo y público

Entregar un curso completo en español que permita a un desarrollador junior
resolver un problema real, justificar sus decisiones y recibir evaluación manual.
El alumno debe conocer programación básica y haber construido una aplicación sencilla.
La primera entrega del producto será una beta con un grupo pequeño de alumnos.

## Curso piloto

- Título: Sistema de autenticación para una aplicación real.
- Slug existente: `real-world-auth`.
- Stack del repositorio base: Next.js, TypeScript y PostgreSQL.
- Prerrequisitos específicos: conocimientos básicos del stack y de HTTP.
- Escenario: una startup necesita registro, login, sesiones y permisos para su aplicación.
- Modalidad: lecciones escritas y práctica incremental en un repositorio propio, a partir de una base proporcionada.
- Idioma: interfaz, contenido, consignas y criterios en español. Los recursos externos pueden estar en otro idioma si se indica.
- Recursos: enlaces comentados a documentación, artículos y videos externos. Sin videos propios en el MVP.
- Catálogo inicial: un curso completo publicado; los otros cuatro permanecerán sin publicar hasta estar desarrollados.

Se adaptarán los temarios existentes al español y se desarrollarán las lecciones.
Cada módulo incluirá objetivos, contexto, explicación, práctica, recursos
complementarios y criterios de finalización.

## Módulos y entregas

| Módulo | Contenido | Hito |
|---|---|---|
| 1. Entender el problema | Usuarios, recursos privados, riesgos y requisitos | Preparación de entrega 1 |
| 2. Registro de usuarios | Registro, validación del servidor y duplicados | Preparación de entrega 1 |
| 3. Almacenamiento de contraseñas | Hashing y justificación de decisiones | Entrega 1: registro y contraseñas |
| 4. Login y verificación de identidad | Credenciales, errores e información sensible | Preparación de entrega 2 |
| 5. Sesiones y logout | Persistencia, vencimiento y cierre de sesión | Entrega 2: login y sesiones |
| 6. Protección de recursos | Autorización del servidor y acceso sin sesión | Preparación de entrega 3 |
| 7. Roles y permisos | Usuario, administrador e integración | Entrega 3: autorización e integración final |

Las tres entregas son obligatorias y evolucionan el mismo proyecto.

### Criterios obligatorios

| Entrega | Criterios de aceptación |
|---|---|
| 1. Registro y contraseñas | El registro válido crea una cuenta; el servidor rechaza datos inválidos; los duplicados producen errores controlados; las contraseñas se almacenan con un hash apropiado; las respuestas excluyen contraseñas y hashes; hay pruebas de los casos principales y una explicación de decisiones. |
| 2. Login y sesiones | Las credenciales válidas permiten entrar; las inválidas producen un mensaje genérico; la sesión persiste entre solicitudes; las sesiones inválidas o vencidas se rechazan; el logout elimina el acceso autenticado del navegador; los intentos repetidos tienen un límite verificable; hay pruebas y documentación. |
| 3. Autorización e integración | Los recursos privados rechazan solicitudes sin sesión; cada usuario solo accede a sus recursos; las operaciones administrativas requieren el rol correspondiente; manipular datos del cliente no concede permisos; funciona el flujo completo; el README permite instalar y verificar la solución. |

Antes de publicar, cada criterio tendrá un procedimiento de comprobación y un
resultado esperado. Se permiten distintas implementaciones que cumplan la
consigna y sus restricciones. La rúbrica se publica antes de iniciar la práctica.

## Entregas y revisión

El alumno presenta enlace al repositorio, commit exacto, instrucciones de ejecución,
resultados de pruebas y una explicación breve. Las evidencias corresponden al
commit presentado y el corrector debe poder acceder al repositorio.

| Regla | Definición |
|---|---|
| Estados | Enviada → En revisión → Aprobada o Cambios solicitados |
| Asignación | Un profesor asignado al curso toma la entrega; solo un corrector mantiene una revisión activa sobre ella |
| Evaluación | Cada criterio se marca como cumple o requiere cambios; una devolución es obligatoria cuando requiere cambios |
| Aprobación | Todos los criterios obligatorios deben cumplirse; sin nota numérica |
| Reintentos | Sin límite y sin vencimiento durante la beta; cada reenvío identifica un nuevo commit y conserva el historial |
| Secuencia | La entrega anterior debe estar aprobada para enviar la siguiente; las lecturas siguen disponibles durante la espera |
| Versionado | Se conserva la consigna y la rúbrica aplicables a cada entrega |
| Imparcialidad | Ningún profesor puede corregir su propia entrega |

## Roles y paneles

Una persona puede tener varios roles. El registro público crea alumnos; solo un
administrador otorga permisos adicionales. Administrador y usuario en el proyecto
del curso son conceptos distintos de los roles de la plataforma.

| Rol | Funciones |
|---|---|
| Alumno | Inscribirse, leer módulos, enviar entregas, consultar devoluciones, reenviar correcciones y obtener su certificado; acceso solo a sus entregas y resultados |
| Profesor corrector | Bandeja de pendientes de cursos asignados, toma de entregas, evaluación por criterio, devoluciones e historial; no administra usuarios ni cambia rúbricas |
| Administrador | Buscar y consultar usuarios, invitar profesores, gestionar roles, activar o desactivar cuentas, asignar profesores a cursos y consultar entregas pendientes |

Se registra quién corrigió, cuándo y con qué resultado, y quién modificó roles o
el estado de una cuenta. Los estados y devoluciones se consultan en la aplicación.
Los avisos por correo sobre correcciones quedan para después del MVP.
El contenido se gestiona desde el repositorio durante esta versión.

## Progreso y certificado

El avance declarado del alumno y las aprobaciones del profesor son estados distintos.
Marcar un módulo como completado no equivale a aprobar una entrega.

Se habilita un certificado de aprobación cuando los siete módulos están marcados
como completados y las tres entregas obligatorias están aprobadas.
Incluye nombre del alumno, curso, fecha, entidad emisora e identificador único.
Se descarga en PDF y dispone de una página de verificación con los datos mínimos
del certificado, sin publicar entregas ni devoluciones.

## Fuera del MVP

- Chat con IA y generación o gestión de tickets de soporte.
- Corrección automática y ejecución de código del alumno en la plataforma.
- Pagos, comunidad y editor de código integrado.
- Certificado de finalización sin evaluación.
- Producción y alojamiento de videos propios.
- Editor administrativo de cursos.

## Criterios de cierre del producto

- Un alumno puede completar el curso sin instrucciones externas sobre qué hacer.
- Puede registrarse, inscribirse, guardar avance y retomarlo desde su panel.
- Puede enviar las tres entregas, recibir correcciones y consultar su historial.
- Los profesores corrigen únicamente dentro de sus cursos asignados.
- Un administrador gestiona usuarios y asignaciones con los permisos definidos.
- El certificado solo se habilita al cumplir todos los requisitos y puede verificarse.
- Los cursos no publicados quedan inaccesibles por URL y acciones.
- El flujo completo funciona en móvil y escritorio y supera las comprobaciones de calidad en el entorno desplegado.

## Trabajo de definición siguiente

El alcance de la Fase 1 queda cerrado. En las fases de diseño e implementación se
concretarán el repositorio base, las rúbricas comprobables, el modelo de datos,
los permisos del servidor, la invitación de profesores, el acceso inicial del
administrador y la emisión de certificados.
