/**
 * e2e/progress.spec.ts
 *
 * Tests for the critical flow: enroll → complete module → dashboard tracking.
 * Also covers regression cases for progress persistence and navigation.
 */

import { test, expect } from "@playwright/test"
import { createTestUser, registerAndLogin } from "./helpers/auth"

const COURSE_SLUG = "real-world-auth"
const FIRST_MODULE = 1

test.describe("Progress tracking (critical flow)", () => {
  let user: ReturnType<typeof createTestUser>

  test.beforeEach(async ({ page }) => {
    user = createTestUser()
    await registerAndLogin(page, user)
  })

  test("completing a module marks it as completed in the module list", async ({
    page,
  }) => {
    // Enroll first
    await page.goto(`/courses/${COURSE_SLUG}`)
    await page.getByRole("button", { name: /empezar curso/i }).click()
    await page.waitForURL(/\/modules\//)

    // Mark module as completed
    await page.getByRole("button", { name: /marcar completado/i }).click()

    await expect(
      page.getByRole("button", { name: /marcar pendiente/i }),
    ).toBeVisible()
  })

  test("completed module appears in course detail with completed badge", async ({
    page,
  }) => {
    // Enroll and complete first module
    await page.goto(`/courses/${COURSE_SLUG}`)
    await page.getByRole("button", { name: /empezar curso/i }).click()
    await page.waitForURL(/\/modules\//)
    await page.getByRole("button", { name: /marcar completado/i }).click()
    await page.waitForResponse((res) => res.url().includes("_next"))

    // Go back to course detail
    await page.goto(`/courses/${COURSE_SLUG}`)

    await expect(
      page.getByRole("status").or(page.getByText(/completado/i)).first(),
    ).toBeVisible()
  })

  test("progress appears in dashboard under En progreso", async ({ page }) => {
    // Enroll
    await page.goto(`/courses/${COURSE_SLUG}`)
    await page.getByRole("button", { name: /empezar curso/i }).click()
    await page.waitForURL(/\/modules\//)

    // Go to dashboard
    await page.goto("/dashboard")

    await expect(
      page.getByRole("heading", { name: "En progreso" }),
    ).toBeVisible()
    await expect(page.getByText(new RegExp(COURSE_SLUG.replace(/-/g, "."), "i"))).toBeVisible()
  })

  test("progress persists after navigating away and back", async ({ page }) => {
    // Enroll and complete first module
    await page.goto(`/courses/${COURSE_SLUG}`)
    await page.getByRole("button", { name: /empezar curso/i }).click()
    await page.waitForURL(/\/modules\//)
    await page.getByRole("button", { name: /marcar completado/i }).click()

    // Navigate away
    await page.goto("/")

    // Come back to the module
    await page.goto(
      `/courses/${COURSE_SLUG}/modules/${FIRST_MODULE}`,
    )

    await expect(
      page.getByRole("button", { name: /marcar pendiente/i }),
    ).toBeVisible()
  })

  test("module can be marked as pending after being completed", async ({
    page,
  }) => {
    // Enroll and complete
    await page.goto(`/courses/${COURSE_SLUG}`)
    await page.getByRole("button", { name: /empezar curso/i }).click()
    await page.waitForURL(/\/modules\//)
    await page.getByRole("button", { name: /marcar completado/i }).click()

    // Mark as pending
    await page.getByRole("button", { name: /marcar pendiente/i }).click()

    await expect(
      page.getByRole("button", { name: /marcar completado/i }),
    ).toBeVisible()
  })

  test("dashboard shows Completados section", async ({ page }) => {
    await page.goto("/dashboard")

    await expect(
      page.getByRole("heading", { name: "Completados" }),
    ).toBeVisible()
  })
})
