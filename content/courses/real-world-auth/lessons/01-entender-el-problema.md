---
title: Entender el problema
module: 1
---

## Objetivos

- Explicar qué significa, desde el punto de vista del servidor, que una persona "ha iniciado sesión".
- Distinguir **autenticación** (¿quién eres?) de **autorización** (¿qué puedes hacer?).
- Identificar por qué confiar en datos enviados por el cliente es una vulnerabilidad.
- Listar los recursos privados de la aplicación del curso y los riesgos que los amenazan.
- Escribir un conjunto breve de requisitos de seguridad para el sistema que vas a construir.

## Contexto

Acabas de entrar a una startup. La aplicación funciona: las personas crean notas y las consultan. Pero no existe un sistema de acceso real. Al abrir la aplicación, el navegador guarda un `userId` en `localStorage` y lo envía en cada solicitud, por ejemplo así:

```http
GET /api/notes HTTP/1.1
Host: app.example.com
X-User-Id: 42
```

El servidor lee esa cabecera y devuelve las notas del usuario 42. El CTO te pide: "necesitamos login de verdad antes de lanzar la beta". Antes de escribir código conviene entender qué está fallando exactamente.

Durante todo el curso trabajarás sobre una base proporcionada: la carpeta `starter/` del repositorio de CodeFoundry (Next.js, TypeScript y PostgreSQL). Cópiala a un repositorio propio; allí harás las tres entregas. En la sección Práctica verás cómo ejecutarla.

## Explicación

### HTTP no recuerda quién eres

HTTP es un protocolo **sin estado**: cada solicitud llega al servidor sin relación con la anterior. Si el servidor quiere saber que dos solicitudes vienen de la misma persona, necesita que el cliente presente algo en cada una. Todo sistema de autenticación consiste en decidir **qué presentar**, **cómo comprobarlo** y **cuánto tiempo vale**.

### El problema de la aplicación actual

El valor `X-User-Id: 42` lo controla quien envía la solicitud. Cualquier persona puede abrir las herramientas del navegador, o usar `curl`, y escribir otro número:

```bash
curl -H "X-User-Id: 1" https://app.example.com/api/notes
```

Si el usuario 1 es el fundador, acabas de leer sus notas. El servidor no **verificó** nada: aceptó una afirmación ("soy el 42") como si fuera una prueba. Esta es la regla que organiza todo el curso:

> **Todo dato que viene del cliente es una afirmación, no un hecho.** El servidor solo puede confiar en lo que él mismo puede verificar.

Esta categoría de fallo aparece en el primer puesto del listado OWASP Top 10 (control de acceso roto) y también en el de fallos de identificación y autenticación; ambos están enlazados en los recursos.

### Qué significa "haber iniciado sesión"

Desde el punto de vista del servidor, "sesión iniciada" significa: **en esta solicitud llegó una credencial que el servidor reconoce como emitida por él, que no ha vencido y que no ha sido revocada**, y que está asociada a una identidad concreta. Nada más. No hay "personas conectadas": hay solicitudes que demuestran, o no, una identidad.

El recorrido típico tiene cuatro pasos:

1. **Registro**: la persona crea una cuenta y el servidor guarda lo necesario para reconocerla.
2. **Login**: la persona demuestra quién es (normalmente con email y contraseña) y el servidor emite una credencial de sesión.
3. **Uso**: en cada solicitud siguiente, el navegador presenta esa credencial y el servidor la valida.
4. **Cierre**: la sesión termina por logout o por vencimiento y la credencial deja de valer.

### Autenticación y autorización

- **Autenticación**: comprobar la identidad. "Esta solicitud la hace Ana."
- **Autorización**: decidir si esa identidad puede ejecutar esa acción sobre ese recurso. "Ana puede leer *sus* notas, pero no las de Luis, y no puede borrar usuarios."

Son problemas distintos y se resuelven en momentos distintos del curso: la autenticación en los módulos 2 a 5, la autorización en los módulos 6 y 7.

### Pensar como atacante (sin exagerar)

No necesitas un modelo de amenazas complejo. Para una aplicación pequeña basta con preguntarte, para cada recurso privado: **¿quién debería poder acceder?** y **¿qué pasa si alguien que no debería lo intenta?** Algunas amenazas realistas para esta aplicación:

| Riesgo | Ejemplo |
| --- | --- |
| Suplantación | Cambiar el `userId` enviado para actuar como otra persona |
| Robo de credenciales | Una filtración de la base de datos expone contraseñas |
| Fuerza bruta | Probar miles de contraseñas contra una cuenta |
| Sesión robada o eterna | Una credencial que nunca vence y se copia desde otro equipo |
| Acceso sin permiso | Alguien entra a `/admin` solo por conocer la URL |
| Filtración de información | Un error que confirma qué emails están registrados |

No todos los riesgos pesan igual. Una startup pequeña no necesita autenticación multifactor el primer día, pero sí necesita no guardar contraseñas en texto plano ni confiar en el cliente. **Seguridad sin sobreingeniería** significa cubrir primero lo básico y documentar lo que se deja fuera, con una razón.

## Práctica

Trabajarás con la carpeta `starter/` (lee su `README.md` para levantar PostgreSQL y la aplicación).

1. Crea un repositorio propio a partir de `starter/` y ejecútalo siguiendo su README.
2. Con la aplicación en marcha, llama al endpoint de notas con `curl` cambiando el valor de `X-User-Id` y comprueba que puedes leer las notas de otra cuenta sin ninguna verificación. Anota la evidencia (comando y respuesta).
3. Inventaría los recursos de la aplicación: ¿cuáles deberían ser públicos, cuáles privados de cada usuario y cuáles solo para administración?
4. Escribe en un archivo `docs/requisitos.md` de tu repositorio entre 6 y 10 requisitos de seguridad en lenguaje comprobable. Por ejemplo: "Las solicitudes a `/api/notes` sin sesión válida devuelven 401" o "Ninguna respuesta incluye contraseñas ni hashes".
5. Marca cada requisito con el módulo del curso en el que lo cubrirás. Usarás esta lista como guía para las entregas.

Este módulo prepara la **Entrega 1**; no tiene entrega propia.

## Recursos

- [OWASP Top 10: A01 Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/) — Descripción de por qué el control de acceso roto es el riesgo más frecuente; relaciónalo con el `X-User-Id` falsificable. (en inglés)
- [OWASP Top 10: A07 Identification and Authentication Failures](https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/) — Lista de fallos habituales de autenticación; úsala como guía para tus requisitos. (en inglés)
- [MDN: HTTP authentication](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication) — Explica el marco general de autenticación del protocolo HTTP y los códigos 401 y 403. (en inglés)
- [MDN: Using HTTP cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies) — Introducción al mecanismo con el que el navegador presenta una credencial en cada solicitud; lo retomarás en el módulo 5. (en inglés)
- [Next.js: guía de autenticación](https://nextjs.org/docs/app/guides/authentication) — Visión oficial de autenticación, sesiones y autorización en el App Router. (en inglés)

## Criterios de finalización

- [ ] Puedes explicar con tus palabras por qué `X-User-Id` no es una forma válida de identificar a alguien.
- [ ] Puedes describir la diferencia entre autenticación y autorización con un ejemplo de la aplicación.
- [ ] Tienes la base `starter/` funcionando en tu repositorio y has reproducido la suplantación con `curl`.
- [ ] Tu archivo de requisitos contiene entre 6 y 10 requisitos comprobables asociados a módulos del curso.
- [ ] Has marcado el módulo como completado.
