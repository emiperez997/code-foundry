import "dotenv/config"
import { randomUUID } from "node:crypto"
import { execFileSync } from "node:child_process"
import { resolve } from "node:path"
import { test, expect, type Page } from "@playwright/test"


const prefix = `evaluation-e2e-${randomUUID()}`
const password = "EvaluationTest123!"
let student: string
let teacher: string
let admin: string
let invitee: string
let courseId: string
let assignmentId: string
const email = (role: string) => `${prefix}-${role}@example.com`

function fixture(action: string, data: Record<string, unknown> = {}) {
  return JSON.parse(execFileSync(process.execPath, ["--import", "tsx", resolve("e2e/helpers/evaluation-fixture.ts"), action], {
    input: JSON.stringify({ prefix, password, student, teacher, admin, invitee, courseId, assignmentId, ...data }),
    encoding: "utf8",
    env: process.env,
  })) as Record<string, string>
}

test.beforeAll(async () => {
  const data = fixture("create")
  ;({ student, teacher, admin, invitee, courseId, assignmentId } = data)
})
test.afterAll(async () => { fixture("cleanup") })

async function login(page: Page, role: string, destination: string) {
  await page.context().clearCookies()
  await page.goto(`/login?callbackUrl=${encodeURIComponent(destination)}`)
  await page.getByLabel("Email", { exact: true }).fill(email(role))
  await page.getByLabel("Contraseña", { exact: true }).fill(password)
  await page.getByRole("button", { name: "Entrar", exact: true }).click()
  await expect.poll(() => new URL(page.url()).pathname, { timeout: 30000 }).toBe(destination)
}
async function submit(page: Page, commit: string) {
  await page.getByLabel("Repositorio HTTPS").fill("https://example.com/repo")
  await page.getByLabel("Commit completo").fill(commit)
  await page.getByLabel("Cómo instalar y ejecutar").fill("pnpm install")
  await page.getByLabel("Evidencias y resultados de pruebas").fill("Tests aprobados")
  await page.getByLabel("Explicación de decisiones y cambios").fill("Implementé el control de acceso")
  await page.getByRole("button", { name: "Enviar entrega", exact: true }).click()
  await expect(page.getByText("Tu trabajo está pendiente de corrección.", { exact: true })).toBeVisible()
}
async function review(page: Page, attempt: number, passed: boolean) {
  const record = fixture("submission", { attempt })
  await page.goto(`/teacher/submissions/${record.id}`)
  const response = page.waitForResponse((res) => res.request().method() === "POST" && new URL(res.url()).pathname === `/teacher/submissions/${record.id}`)
  await page.getByRole("button", { name: "Tomar entrega", exact: true }).click()
  expect((await response).status()).toBe(200)
  const claimed = fixture("submission", { attempt })
  expect(claimed.status).toBe("IN_REVIEW")
  expect(claimed.reviewerId).toBe(teacher)
  await expect(page.getByLabel("Resultado", { exact: true })).toBeVisible({ timeout: 15000 })
  await page.getByLabel("Resultado", { exact: true }).selectOption(passed ? "pass" : "changes")
  if (!passed) await page.getByLabel("Devolución (obligatoria si requiere cambios)").fill("Falta proteger el recurso privado")
  await page.getByLabel("Devolución general", { exact: true }).fill(passed ? "Aprobado" : "Corregir autorización")
  await page.getByRole("button", { name: "Guardar corrección", exact: true }).click()
  await expect(page.getByText(passed ? "Aprobada" : "Cambios solicitados", { exact: true })).toBeVisible()
}

test("student, teacher and admin complete the manual evaluation workflow", async ({ page }) => {
  test.setTimeout(120000)
  await login(page, "student", `/assignments/${assignmentId}`)
  await submit(page, "a".repeat(40))
  await page.goto("/admin")
  await expect(page.getByRole("heading", { name: "404", exact: true })).toBeVisible()
  await login(page, "teacher", "/teacher")
  await expect(page.getByText("Entrega temporal", { exact: true })).toBeVisible()
  await review(page, 1, false)
  await login(page, "student", `/assignments/${assignmentId}`)
  await expect(page.getByText("Falta proteger el recurso privado", { exact: true })).toBeVisible()
  await submit(page, "b".repeat(40))
  await login(page, "teacher", "/teacher")
  await review(page, 2, true)
  await expect(page.getByText("Intentos anteriores", { exact: true })).toBeVisible()
  await login(page, "student", `/assignments/${assignmentId}`)
  await expect(page.getByText("Esta entrega está aprobada.", { exact: true })).toBeVisible()
  await expect(page.getByText("Intento 1 · Versión 1", { exact: true })).toBeVisible()
  await expect(page.getByText("Intento 2 · Versión 1", { exact: true })).toBeVisible()
})

test("admin invites a teacher and revokes teacher permissions", async ({ page }) => {
  test.setTimeout(120000)
  await login(page, "admin", "/admin")
  await page.getByLabel("Email del profesor").fill(email("invitee"))
  await page.getByRole("button", { name: "Crear invitación", exact: true }).click()
  await expect(page.getByLabel("Enlace de invitación")).toBeVisible()
  const invitation = new URL(await page.getByLabel("Enlace de invitación").inputValue())
  await login(page, "invitee", invitation.pathname)
  await page.getByRole("button", { name: "Aceptar invitación", exact: true }).click()
  await expect(page.getByRole("link", { name: "Correcciones", exact: true })).toBeVisible()
  await page.goto("/teacher")
  await expect(page.getByText("Todavía no tenés cursos asignados. El administrador debe asignarte uno para corregir.", { exact: true })).toBeVisible()
  await login(page, "admin", "/admin")
  await page.getByLabel("Buscar por nombre o email").fill(email("teacher"))
  await page.getByRole("button", { name: "Buscar", exact: true }).click()
  await page.getByLabel("Profesor", { exact: true }).selectOption("no")
  await page.getByLabel("Alumno", { exact: true }).selectOption("yes")
  await page.getByRole("button", { name: "Guardar usuario", exact: true }).click()
  await expect(page.getByText("Usuario actualizado.", { exact: true })).toBeVisible()
  await login(page, "teacher", "/courses")
  await expect(page.getByRole("link", { name: "Correcciones", exact: true })).toHaveCount(0)
  await page.goto("/teacher")
  await expect(page.getByRole("heading", { name: "404", exact: true })).toBeVisible()
})
