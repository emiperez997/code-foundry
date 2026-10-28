import "dotenv/config"
import { randomUUID } from "node:crypto"
import { execFileSync } from "node:child_process"
import { resolve } from "node:path"
import { test, expect, type Page } from "@playwright/test"

const prefix = `certificate-e2e-${randomUUID()}`
const password = "CertificateTest123!"

function fixture(action: string) {
  return JSON.parse(execFileSync(process.execPath, ["--import", "tsx", resolve("e2e/helpers/certificate-fixture.ts"), action], {
    input: JSON.stringify({ prefix, password }),
    encoding: "utf8",
    env: process.env,
  })) as Record<string, string>
}

test.beforeAll(() => { fixture("create") })
test.afterAll(() => { fixture("cleanup") })

async function login(page: Page, destination: string) {
  await page.context().clearCookies()
  await page.goto(`/login?callbackUrl=${encodeURIComponent(destination)}`)
  await page.getByLabel("Email", { exact: true }).fill(`${prefix}-student@example.com`)
  await page.getByLabel("Contraseña", { exact: true }).fill(password)
  await page.getByRole("button", { name: "Entrar", exact: true }).click()
  await expect.poll(() => new URL(page.url()).pathname, { timeout: 30000 }).toBe(destination)
}

test("reading alone gives no certificate; approval does, with PDF and public verification", async ({ page, browser, baseURL }) => {
  test.setTimeout(150000)
  await login(page, `/courses/${prefix}/modules/1`)
  for (const order of [1, 2]) {
    await page.goto(`/courses/${prefix}/modules/${order}`)
    await page.getByRole("button", { name: /marcar modulo como completado/i }).click()
    await expect(page.getByRole("button", { name: /marcar modulo como pendiente/i })).toBeVisible()
  }

  // Lectura completa, pero sin entregas aprobadas: sin botón de certificado.
  await page.goto(`/courses/${prefix}`)
  await expect(page.getByText("Lectura completada:", { exact: false })).toBeVisible()
  await expect(page.getByText("2/2 módulos")).toBeVisible()
  await expect(page.getByText("Curso no aprobado todavía", { exact: false })).toBeVisible()
  await expect(page.getByRole("link", { name: "Obtener certificado" })).toHaveCount(0)
  await page.goto("/dashboard")
  await expect(page.getByRole("heading", { name: "En progreso", exact: true })).toBeVisible()
  await expect(page.getByText("Ir a mis entregas").first()).toBeVisible()
  await page.goto(`/dashboard/certificates/${prefix}`)
  await expect(page.getByRole("button", { name: "Obtener certificado" })).toHaveCount(0)

  // Con las entregas aprobadas aparece el certificado.
  fixture("approve")
  await page.goto(`/dashboard/certificates/${prefix}`)
  await page.getByRole("button", { name: "Obtener certificado" }).click()
  await expect(page.getByText("Código de verificación")).toBeVisible()
  const code = (await page.locator("dd.font-mono").innerText()).trim()
  expect(code).toMatch(/^CF-[2-9A-Z]{4}(-[2-9A-Z]{4}){3}$/)

  const pdf = await page.request.get(`/api/certificates/${code}/pdf`)
  expect(pdf.status()).toBe(200)
  expect(pdf.headers()["content-type"]).toContain("application/pdf")
  expect((await pdf.body()).subarray(0, 5).toString("latin1")).toBe("%PDF-")

  await page.goto("/dashboard")
  await expect(page.getByRole("heading", { name: "Aprobados", exact: true })).toBeVisible()

  // Visitante anónimo: ve solo datos públicos y no puede descargar el PDF.
  const anonymous = await browser.newContext({ baseURL })
  const visitor = await anonymous.newPage()
  await visitor.goto(`/verify/${code}`)
  await expect(visitor.getByText("Estado: Válido")).toBeVisible()
  await expect(visitor.getByText("María Peña student")).toBeVisible()
  await expect(visitor.getByText("Curso temporal de certificados")).toBeVisible()
  await expect(visitor.getByText("CodeFoundry", { exact: true })).toBeVisible()
  await expect(visitor.getByText(`${prefix}-student@example.com`)).toHaveCount(0)
  await expect(visitor.getByText("SECRETO-DEVOLUCION")).toHaveCount(0)
  expect((await anonymous.request.get(`/api/certificates/${code}/pdf`)).status()).toBe(401)
  await visitor.goto("/verify/CF-2222-2222-2222-2222")
  await expect(visitor.getByText("No encontramos un certificado con ese código", { exact: false })).toBeVisible()
  await anonymous.close()
})
