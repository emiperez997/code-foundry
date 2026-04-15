# Real-World Authentication System

## Metadata

- **slug:** `real-world-auth`
- **nivel:** Intermedio
- **duracion_estimada:** 8–12 horas
- **estado:** draft
- **tags:** `auth`, `seguridad`, `jwt`, `oauth`, `roles`, `backend`
- **prerequisitos:** Conocimiento básico de HTTP, manejo de bases de datos relacionales, experiencia con al menos un framework web

---

## Contexto del mundo real

El estudiante acaba de unirse a una startup de fintech que tiene una app web con usuarios reales. El sistema de autenticación fue hecho "a las carreras" hace 6 meses. El CTO les pide rediseñarlo correctamente antes del siguiente funding round.

---

## Objetivo del Curso

Al finalizar, el estudiante será capaz de diseñar, implementar y evolucionar un sistema de autenticación/autorización completo, tomando decisiones informadas en cada etapa: desde el registro de un usuario hasta el control de acceso por roles en una API.

---

## Progresión

```
Diagnóstico → Diseño → Registro → Sesiones → Protección → Roles → OAuth → Observabilidad
```

---

## Módulos

### Módulo 1 — El Sistema Roto

**Descripción:** El estudiante recibe una base de código existente con un sistema de auth "funcional pero frágil". Hay passwords en texto plano, tokens sin expiración y cero control de acceso. Su primera tarea: auditar, no arreglar todavía.

**El estudiante debe pensar:**
- ¿Qué está mal aquí y por qué es un riesgo?
- ¿Cuál es el orden de prioridad para arreglarlo?
- ¿Qué preguntas le haría al equipo antes de tocar nada?

**Escenario real:** Un dev que hereda deuda técnica y debe hacer un diagnóstico antes de proponer cambios.

---

### Módulo 2 — Diseño del Sistema Antes de Escribir Código

**Descripción:** Antes de implementar, el estudiante debe diseñar el sistema completo: flujos de usuario, estados de sesión, qué datos se almacenan y dónde. Sin diagramas perfectos — solo decisiones claras.

**El estudiante debe pensar:**
- ¿Qué necesita saber el sistema sobre un usuario autenticado?
- ¿Dónde vive la sesión: cookie, localStorage, memoria?
- ¿Qué diferencia hay entre autenticación y autorización?

**Escenario real:** Una sesión de diseño técnico antes de un sprint de implementación.

---

### Módulo 3 — Registro y Contraseñas Seguras

**Descripción:** Implementar el flujo de registro de usuario con hashing de contraseñas, validaciones y manejo de errores. El estudiante decide qué librería usar, qué reglas de contraseña aplicar y qué devuelve el servidor en cada caso.

**El estudiante debe pensar:**
- ¿Por qué nunca se almacena una contraseña en texto plano?
- ¿Qué le digo al usuario cuando falla el registro? ¿Qué no le digo?
- ¿Cuántas validaciones deben ocurrir en el cliente vs. el servidor?

**Escenario real:** Un ticket real de "implementar registro de usuario" con criterios de aceptación de seguridad.

---

### Módulo 4 — Sesiones y Tokens JWT

**Descripción:** El estudiante implementa login con emisión de JWT, manejo de refresh tokens y logout. Descubre por qué los tokens sin expiración son un problema y cómo diseñar un sistema de renovación sin fricción.

**El estudiante debe pensar:**
- ¿Cuánto tiempo debe durar un access token?
- ¿Qué pasa si el usuario roba el refresh token de otro?
- ¿Cuándo usar cookies HttpOnly vs. Authorization header?

**Escenario real:** El equipo de seguridad pide que las sesiones expiren en 15 minutos, pero el PM dice que los usuarios se quejan si los desloguean. Hay que resolver esa tensión.

---

### Módulo 5 — Protección de Rutas y Middleware

**Descripción:** El sistema ya emite tokens. Ahora hay que usarlos para proteger rutas tanto en el frontend como en el backend. El estudiante aprende dónde y cómo verificar la identidad en cada capa.

**El estudiante debe pensar:**
- ¿Qué rutas deben estar protegidas? ¿Cuáles son públicas?
- ¿La verificación del token debe ocurrir en el middleware, en el servidor o en ambos?
- ¿Qué le muestro al usuario si su token expiró mientras navegaba?

**Escenario real:** Un QA encuentra que al pegar una URL protegida en otra pestaña, el usuario entra sin problema. Hay un bug de seguridad real.

---

### Módulo 6 — Roles y Control de Acceso (RBAC)

**Descripción:** La startup creció. Ahora hay usuarios, admins y moderadores. El estudiante diseña e implementa un sistema de roles y permisos que escale, decidiendo entre RBAC simple y algo más granular.

**El estudiante debe pensar:**
- ¿Los roles van en el token o en la base de datos?
- ¿Qué pasa cuando un admin le quita permisos a otro usuario que ya tiene sesión activa?
- ¿Cómo evito que la lógica de permisos se disemine por todo el código?

**Escenario real:** El CTO dice "necesitamos que los admins puedan ver todo, pero que los moderadores solo vean su región". Hay que modelar eso.

---

### Módulo 7 — OAuth y Login Social

**Descripción:** Los usuarios piden "Login con Google". El estudiante integra OAuth2 y enfrenta las decisiones reales: ¿cómo vinculo una cuenta social a una cuenta existente? ¿Qué pasa si el email ya existe?

**El estudiante debe pensar:**
- ¿Qué datos me entrega el proveedor OAuth y cuáles realmente necesito?
- ¿Cómo unifico el flujo de auth social con el auth propio sin duplicar lógica?
- ¿Qué riesgos hay si confío ciegamente en el email que devuelve el proveedor?

**Escenario real:** Un usuario reporta que puede iniciar sesión con Google usando el email de otra persona. Es un edge case real de account linking mal implementado.

---

### Módulo 8 — Auditoría, Monitoreo y Mejora Continua

**Descripción:** El sistema está en producción. Ahora hay que observarlo: logs de acceso, intentos fallidos, detección de comportamiento sospechoso. El estudiante aprende que un sistema de auth no termina cuando "funciona".

**El estudiante debe pensar:**
- ¿Qué eventos debo registrar? ¿Cuáles son sensibles?
- ¿Cómo detecto un ataque de fuerza bruta sin bloquear usuarios legítimos?
- ¿Qué métricas le mostraría al equipo de seguridad cada semana?

**Escenario real:** El equipo de ops detecta 3,000 intentos de login en 2 minutos desde una misma IP. El sistema no tiene rate limiting. Toca diagnosticar y proponer solución.
