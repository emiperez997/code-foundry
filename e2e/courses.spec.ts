/**
 * e2e/courses.spec.ts
 *
 * Tests for course catalog navigation and course detail page.
 */

import { test, expect } from "@playwright/test"
import { cleanupTestUsers } from "./helpers/cleanup"
import { createTestUser, registerAndLogin } from "./helpers/auth"

const FIRST_COURSE_SLUG = "real-world-auth"

test.describe("Course catalog", () => {
  test("shows published courses on /courses", async ({ page }) => {
    await page.goto("/courses")

    await expect(
      page.getByRole("heading", { name: "Cursos" }),
    ).toBeVisible()
    await expect(page.getByRole("link", { name: /ver curso/i }).first()).toBeVisible()
  })

  test("only the pilot course is published", async ({ page }) => {
    await page.goto("/courses")

    await expect(page.getByRole("link", { name: /ver curso/i })).toHaveCount(1)
    for (const slug of [
      "real-world-api-design",
      "real-world-cicd",
      "real-world-database-design",
      "real-world-frontend-architecture",
    ]) {
      const response = await page.goto(`/courses/${slug}`)
      expect(response?.status()).toBe(404)
    }
  })

  test("navigates to course detail page", async ({ page }) => {
    await page.goto("/courses")

    await page.getByRole("link", { name: /ver curso/i }).first().click()

    await expect(page).toHaveURL(/\/courses\//)
    await expect(page.getByRole("heading", { level: 2, name: /módulos/i })).toBeVisible()
  })

  test("course detail shows module list", async ({ page }) => {
    await page.goto(`/courses/${FIRST_COURSE_SLUG}`)

    const modules = page.locator("ol li")
    await expect(modules.first()).toBeVisible()
  })
})

test.describe("Course enrollment (authenticated)", () => {
  let user: ReturnType<typeof createTestUser>

  test.beforeEach(async ({ page }) => {
    user = createTestUser()
    await registerAndLogin(page, user)
  })

  test.afterAll(() => {
    cleanupTestUsers()
  })

  test("shows Empezar curso CTA when not enrolled", async ({ page }) => {
    await page.goto(`/courses/${FIRST_COURSE_SLUG}`)

    await expect(
      page.getByRole("button", { name: /empezar curso/i }),
    ).toBeVisible()
  })

  test("module 1 renders the lesson with all its sections", async ({ page }) => {
    await page.goto(`/courses/${FIRST_COURSE_SLUG}/modules/1`)

    const lesson = page.getByTestId("lesson-content")
    for (const section of [
      "Objetivos",
      "Contexto",
      "Explicación",
      "Práctica",
      "Recursos",
      "Criterios de finalización",
    ]) {
      await expect(lesson.getByRole("heading", { level: 2, name: section, exact: true })).toBeVisible()
    }
    const external = lesson.locator('a[href^="https://"]').first()
    await expect(external).toHaveAttribute("rel", /noopener/)
    await expect(external).toHaveAttribute("target", "_blank")
  })

  test("enrolling redirects to first module", async ({ page }) => {
    await page.goto(`/courses/${FIRST_COURSE_SLUG}`)

    await page.getByRole("button", { name: /empezar curso/i }).click()

    await expect(page).toHaveURL(
      new RegExp(`/courses/${FIRST_COURSE_SLUG}/modules/\\d+`),
    )
  })

  test("after enrolling, CTA changes to Continuar curso", async ({ page }) => {
    await page.goto(`/courses/${FIRST_COURSE_SLUG}`)
    await page.getByRole("button", { name: /empezar curso/i }).click()
    await page.waitForURL(/\/modules\//)

    await page.goto(`/courses/${FIRST_COURSE_SLUG}`)

    await expect(
      page.getByRole("link", { name: /continuar curso|empezar curso/i }),
    ).toBeVisible()
  })
})
