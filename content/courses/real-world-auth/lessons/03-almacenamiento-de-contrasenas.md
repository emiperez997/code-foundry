---
title: Almacenamiento de contraseñas
module: 3
---

## Objetivos

- Explicar por qué las contraseñas no se guardan en texto plano ni cifradas de forma reversible.
- Distinguir un hash criptográfico rápido (SHA-256) de una función de derivación de contraseñas (Argon2id, scrypt, bcrypt).
- Elegir y configurar un algoritmo de hash adaptativo y justificar la decisión.
- Integrar el hash en el registro sin filtrarlo en respuestas ni registros.
- Preparar y presentar la **Entrega 1**.

## Contexto

Durante una revisión alguien descubre que la tabla `users` de la aplicación contiene una columna `password` con las contraseñas tal cual las escribieron las personas. Si la base de datos se filtra (por una copia de seguridad expuesta, una inyección SQL o un empleado descuidado), el daño no se limita a tu aplicación: como mucha gente reutiliza contraseñas, los atacantes probarán esas credenciales en otros servicios.

La pregunta del CTO es concreta: "¿cómo guardamos las contraseñas para que, aunque se filtre la base, no valgan de mucho?".

## Explicación

### Por qué un hash

Un **hash** es una función de un solo sentido: dado un texto produce una huella, pero de la huella no se puede recuperar el texto. En lugar de guardar la contraseña, guardas su hash. Al hacer login, calculas el hash de lo que se envía y lo comparas con el guardado. Nunca necesitas conocer la contraseña original.

Cifrar (por ejemplo con AES) **no** es lo mismo: lo cifrado se puede descifrar con la clave, y la clave suele estar en el mismo servidor que se comprometió.

### Por qué SHA-256 no basta

SHA-256 está diseñado para ser **rápido**. Una GPU moderna calcula miles de millones de hashes por segundo, así que un atacante con una base filtrada puede probar diccionarios enormes de contraseñas comunes en poco tiempo. Para contraseñas necesitas lo contrario: una función deliberadamente **lenta y costosa en memoria**, con un parámetro de costo que puedas subir con los años.

### Sal (salt)

Una **sal** es un valor aleatorio, distinto por usuario, que se mezcla con la contraseña antes de calcular el hash. Evita que dos personas con la misma contraseña tengan el mismo hash y vuelve inútiles las tablas precalculadas (*rainbow tables*). Los algoritmos modernos para contraseñas generan la sal automáticamente y la guardan dentro de la cadena resultante, así que no debes gestionarla a mano.

### Algoritmos recomendados

La guía de OWASP (Password Storage Cheat Sheet) ordena las opciones así:

| Algoritmo | Cuándo usarlo | Parámetros mínimos orientativos según OWASP |
| --- | --- | --- |
| **Argon2id** | Primera opción si está disponible | 19 MiB de memoria, 2 iteraciones, 1 hilo de paralelismo |
| **scrypt** | Si no hay Argon2id; viene incluido en Node.js (`crypto.scrypt`) | N = 2^17, r = 8, p = 1 |
| **bcrypt** | Sistemas existentes o cuando no hay otra opción | Factor de costo de 10 o más |

Los valores exactos cambian con el tiempo; revisa siempre la guía vigente. El criterio práctico es: **ajusta el costo para que verificar una contraseña tarde del orden de decenas a pocos cientos de milisegundos en tu servidor**.

Un detalle de bcrypt que conviene conocer: solo procesa los primeros **72 bytes** de la contraseña, por lo que limitar la longitud máxima en el registro es coherente con el algoritmo.

### Ejemplo con bcrypt

```ts
import bcrypt from "bcryptjs";

const COST = 12; // ajustado midiendo el tiempo en tu servidor

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

El resultado tiene esta forma, y ya incluye algoritmo, costo y sal:

```text
$2b$12$Zz0u...........................................................
```

Ejemplo con la función `scrypt` integrada de Node.js (sin dependencias):

```ts
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

const PARAMS = { N: 2 ** 17, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, 64, PARAMS);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [, saltB64, keyB64] = stored.split("$");
  const expected = Buffer.from(keyB64, "base64");
  const actual = await scryptAsync(password, Buffer.from(saltB64, "base64"), expected.length, PARAMS);
  return timingSafeEqual(actual, expected);
}
```

Cualquiera de las dos es válida para la entrega; lo importante es **elegir una, configurarla y justificarla**. En el segundo ejemplo, una versión de producción también guardaría los parámetros dentro de la cadena para poder subirlos en el futuro.

### Reglas para no filtrar el hash

- El hash vive solo en la base de datos y en la función que verifica.
- Selecciona explícitamente las columnas que devuelves (`id`, `email`) en lugar de `SELECT *`.
- No registres cuerpos de solicitud de registro o login (contienen contraseñas en claro).
- Un hash filtrado sigue siendo sensible: no lo muestres ni siquiera "parcialmente".

### Migrar el costo con el tiempo

Un algoritmo adaptativo permite subir el costo más adelante. Una estrategia habitual es comprobar, tras un login correcto, si el hash usa parámetros antiguos y recalcularlo con los nuevos (es el único momento en que conoces la contraseña en claro).

## Práctica

Esta práctica cierra la **Entrega 1: Registro y contraseñas**.

1. Elige un algoritmo (Argon2id, scrypt o bcrypt) y escribe en el README **por qué** y **con qué parámetros**.
2. Mide cuánto tarda un hash en tu máquina y ajusta el costo en consecuencia; anota el resultado.
3. Implementa `hashPassword` y `verifyPassword` en un módulo propio y reemplaza cualquier almacenamiento en texto plano del `starter/`.
4. Asegúrate de que el registro guarda solo el hash y que ni la respuesta ni los logs contienen la contraseña ni el hash.
5. Añade pruebas: el hash de la misma contraseña es distinto cada vez; `verifyPassword` acepta la contraseña correcta y rechaza una incorrecta; el valor guardado no contiene la contraseña.
6. Revisa el repositorio con la rúbrica de la entrega (la tienes en la página de la entrega) y comprueba cada criterio con un procedimiento reproducible.
7. Envía la entrega desde la plataforma con el enlace al repositorio, el **commit exacto**, las instrucciones de ejecución, los resultados de las pruebas y una explicación breve de tus decisiones.

Recuerda: la aprobación de la entrega es independiente de marcar el módulo como leído. Puedes seguir leyendo mientras esperas la revisión, pero no podrás enviar la Entrega 2 hasta que la 1 esté aprobada.

## Recursos

- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) — Referencia principal para elegir algoritmo y parámetros; revísala siempre en su versión vigente. (en inglés)
- [Node.js: crypto.scrypt](https://nodejs.org/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback) — Documentación de la función `scrypt` integrada, con sus opciones de costo. (en inglés)
- [bcrypt.js](https://github.com/dcodeIO/bcrypt.js) — Implementación en JavaScript de bcrypt, con ejemplos de uso y notas sobre el límite de 72 bytes. (en inglés)
- [NIST SP 800-63B](https://pages.nist.gov/800-63-3/sp800-63b.html) — Requisitos oficiales para almacenar secretos memorizados, incluyendo sal y funciones de derivación. (en inglés)
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) — Qué datos nunca deben escribirse en los registros, entre ellos las contraseñas. (en inglés)

## Criterios de finalización

- [ ] Puedes explicar por qué un hash rápido como SHA-256 no es adecuado para contraseñas.
- [ ] Tu aplicación guarda las contraseñas con un hash adaptativo con sal, y no hay contraseñas en texto plano en la base.
- [ ] Ninguna respuesta ni registro incluye contraseñas ni hashes.
- [ ] Tu README justifica el algoritmo y los parámetros elegidos.
- [ ] Tus pruebas cubren los casos de registro y de hashing descritos.
- [ ] Has enviado la Entrega 1 con el commit exacto y has marcado el módulo como completado.
