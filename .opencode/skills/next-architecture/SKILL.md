---
name: next-architecture
description: Diseñar la estructura de un proyecto Next.js App Router.
---

## Objetivo

Diseñar la estructura de un proyecto Next.js App Router.

## Instrucciones:

- Usar App Router
- Separar rutas públicas y privadas
- Priorizar Server Components
- Minimizar componentes client
- Mantener estructura clara y escalable

## Consideraciones:

- En la última versión de Next.js ya no utiliza el archivo `middleware.ts` para proteger rutas privadas, sino que ahora se llama `proxy.ts`
- El archivo `proxy.ts` se utiliza para manejar la lógica de autenticación y autorización en las rutas privadas, asegurando que solo los usuarios autorizados puedan acceder a ellas.
- La estructura de carpetas debe reflejar claramente la separación entre rutas públicas y privadas, facilitando el mantenimiento y la escalabilidad del proyecto a medida que crece.

## Resultado esperado

- Propuesta de carpetas
- Explicación breve de decisiones
