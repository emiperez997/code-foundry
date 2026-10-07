import { randomBytes } from "node:crypto"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { parse } from "dotenv"

const envPath = resolve(".env")
let contents = readFileSync(existsSync(envPath) ? envPath : resolve(".env.example"), "utf8")
const values = parse(contents)

if (!values.AUTH_URL?.trim()) {
  const declaration = /^\s*(?:export\s+)?AUTH_URL\s*=.*$/gm
  contents = declaration.test(contents)
    ? contents.replace(declaration, "AUTH_URL=http://localhost:3000")
    : `${contents.trimEnd()}\nAUTH_URL=http://localhost:3000\n`
}

if (!values.AUTH_SECRET?.trim()) {
  const secret = randomBytes(32).toString("hex")
  const declaration = /^\s*(?:export\s+)?AUTH_SECRET\s*=.*$/gm
  contents = declaration.test(contents)
    ? contents.replace(declaration, `AUTH_SECRET=${secret}`)
    : `${contents.trimEnd()}\nAUTH_SECRET=${secret}\n`
}

writeFileSync(envPath, contents, { mode: 0o600 })
console.log(".env preparado. Se conservaron los valores existentes, se configuró AUTH_URL local y se generó AUTH_SECRET si faltaban.")
console.log("Verificá DATABASE_URL y ejecutá pnpm validate-env. Los secretos no se muestran en la salida.")
