# Sistema de autenticación para una aplicación real

## Slug
real-world-auth

## Summary
Una desarrolladora junior entra a una startup pequeña y recibe su primera tarea real: añadir un sistema de acceso a la aplicación. Lo que parece una funcionalidad sencilla se convierte en una serie de decisiones: cómo guardar contraseñas de forma segura, cómo mantener a las personas con la sesión iniciada, cómo proteger ciertas páginas y cómo manejar roles. Este curso recorre ese camino desde cero y hace explícita cada decisión.

## Learning Goals
- Razonar sobre los compromisos de seguridad sin sobredimensionar la solución
- Diseñar un flujo de login que cubra tanto el camino feliz como los errores
- Decidir dónde vive la validación (cliente o servidor)
- Proteger rutas y recursos según la identidad y el rol
- Comunicar con claridad cuando falla la autenticación, sin filtrar información

## Target Level
Junior / Mixto

## Published
true

## Prerequisites
- Conocimientos básicos de cómo funcionan las solicitudes y respuestas HTTP
- Haber construido al menos una aplicación sencilla con backend, aunque sea pequeña
- Conocimientos básicos de Next.js, TypeScript y PostgreSQL

## Real-World Context
Una startup pequeña tiene una aplicación que funciona, pero no tiene un sistema de acceso real: a los usuarios se los identifica con un ID guardado en localStorage. El CTO te pide que construyas la autenticación desde cero. El equipo es pequeño, el plazo es corto y cada decisión tendrá consecuencias con las que tendrás que convivir.

## Modules
1. Entender el problema
   - La aplicación confía hoy en lo que envía el cliente
   - Razonas sobre qué significa "haber iniciado sesión" desde el punto de vista del servidor

2. Registro de usuarios
   - Construyes el formulario de alta y el endpoint que lo recibe
   - Decides qué validar, qué guardar y qué decirle a la persona cuando algo falla

3. Almacenamiento de contraseñas
   - Se encontraron contraseñas en texto plano en la base de datos
   - Razonas por qué existe el hashing y qué hace seguro a un algoritmo de hash

4. Login y verificación de identidad
   - Comparas la contraseña enviada con el hash almacenado
   - Decides qué mensajes de error son seguros y qué información revelan

5. Sesiones y logout
   - El servidor no recuerda el estado entre solicitudes
   - Razonas cómo funcionan las sesiones, qué deben contener, cuánto deben durar y cómo se cierran

6. Protección de recursos
   - Una persona de QA entró al panel de administración solo con conocer la URL
   - Decides qué debe verificarse en el servidor y por qué la protección solo en el cliente no basta

7. Roles y permisos
   - El equipo necesita dos tipos de usuario con permisos distintos
   - Razonas dónde guardar los roles, cómo exigirlos en cada endpoint y qué ocurre cuando un rol cambia con la sesión abierta

## Outcomes
Al terminar este curso podrás:
- Construir un flujo completo de registro y login con manejo seguro de contraseñas
- Emitir y verificar sesiones con un vencimiento apropiado
- Proteger recursos en el servidor y reflejarlo en la interfaz
- Implementar un sistema sencillo de roles que restrinja el acceso por endpoint
- Decidir con criterio qué información exponer (y cuál no) en los mensajes de error
