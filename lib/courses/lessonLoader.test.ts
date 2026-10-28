import fs from "fs"
import os from "os"
import path from "path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { DEFAULT_COURSES_DIR, loadLesson, validateCourseLessons } from "@/lib/courses/lessonLoader"
import { LESSON_SECTIONS } from "@/lib/courses/lessonSchema"
import { loadCourses } from "@/lib/courses/courseLoader"

function lesson(moduleOrder: number) {
  const body = LESSON_SECTIONS.map((s) =>
    `## ${s}\n${s === "Recursos" ? "- [OWASP](https://owasp.org/) — Referencia." : "Contenido."}`,
  ).join("\n\n")
  return `---\ntitle: Módulo ${moduleOrder}\nmodule: ${moduleOrder}\n---\n\n${body}\n`
}

describe("lesson loader (temporary content)", () => {
  let dir: string
  const write = (file: string, content: string, slug = "curso-a") => {
    const d = path.join(dir, slug, "lessons")
    fs.mkdirSync(d, { recursive: true })
    fs.writeFileSync(path.join(d, file), content)
  }

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "lessons-"))
  })
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

  it("loads a lesson by slug and order", () => {
    write("01-intro.md", lesson(1))
    expect(loadLesson("curso-a", 1, dir)?.title).toBe("Módulo 1")
    expect(loadLesson("curso-a", "1", dir)?.module).toBe(1)
  })

  it("returns null for missing lessons or lessons directory", () => {
    write("01-intro.md", lesson(1))
    expect(loadLesson("curso-a", 2, dir)).toBeNull()
    expect(loadLesson("otro-curso", 1, dir)).toBeNull()
  })

  it("rejects path traversal and invalid slugs/orders without touching the filesystem", () => {
    write("01-intro.md", lesson(1))
    fs.writeFileSync(path.join(dir, "secret.md"), "x")
    for (const slug of ["../curso-a", "..", "curso-a/..", "Curso-A", "curso_a", "", "curso-a/lessons"]) {
      expect(loadLesson(slug, 1, dir)).toBeNull()
    }
    for (const order of [0, -1, 1.5, NaN, "../1", "01", "1e1", " 1"]) {
      expect(loadLesson("curso-a", order, dir)).toBeNull()
    }
  })

  it("throws when the file exists but is invalid", () => {
    write("01-intro.md", "---\ntitle: X\nmodule: 1\n---\n\n## Objetivos\nSolo esto")
    expect(() => loadLesson("curso-a", 1, dir)).toThrow(/falta la sección/)
  })

  it("throws when frontmatter module does not match the file name", () => {
    write("02-dos.md", lesson(3))
    expect(() => loadLesson("curso-a", 2, dir)).toThrow(/module 3/)
  })

  it("ignores files that do not follow NN-slug.md", () => {
    write("notas.md", "no es una lección")
    write("1-intro.md", lesson(1))
    expect(loadLesson("curso-a", 1, dir)).toBeNull()
  })

  it("validateCourseLessons requires every module when asked", () => {
    write("01-a.md", lesson(1))
    expect(() => validateCourseLessons("curso-a", [1, 2], { requireAll: true, coursesDir: dir })).toThrow(/módulos: 2/)
    expect(validateCourseLessons("curso-a", [1, 2], { requireAll: false, coursesDir: dir })).toHaveLength(1)
    write("02-b.md", lesson(2))
    expect(validateCourseLessons("curso-a", [1, 2], { requireAll: true, coursesDir: dir })).toHaveLength(2)
  })

  it("validateCourseLessons rejects lessons for non-existing modules and duplicates", () => {
    write("01-a.md", lesson(1))
    write("05-e.md", lesson(5))
    expect(() => validateCourseLessons("curso-a", [1, 2], { requireAll: false, coursesDir: dir })).toThrow(/no existe el módulo 5/)
    write("01-otra.md", lesson(1), "curso-b")
    write("01-dup.md", lesson(1), "curso-b")
    expect(() => validateCourseLessons("curso-b", [1], { requireAll: false, coursesDir: dir })).toThrow(/duplicado/)
  })

  it("returns no lessons when a course has none and none are required", () => {
    expect(validateCourseLessons("sin-lecciones", [1], { requireAll: false, coursesDir: dir })).toEqual([])
  })
})

describe("pilot course content (real files)", () => {
  const courses = loadCourses() // also runs lesson validation for each course
  const pilot = courses.find((c) => c.slug === "real-world-auth")!

  it("only the pilot course is published", () => {
    expect(courses.filter((c) => c.isPublished).map((c) => c.slug)).toEqual(["real-world-auth"])
  })

  it("has the 7 agreed module titles in Spanish", () => {
    expect(pilot.modules.map((m) => m.title)).toEqual([
      "Entender el problema",
      "Registro de usuarios",
      "Almacenamiento de contraseñas",
      "Login y verificación de identidad",
      "Sesiones y logout",
      "Protección de recursos",
      "Roles y permisos",
    ])
  })

  it("has a valid lesson for every module, with https commented resources", () => {
    for (const mod of pilot.modules) {
      const lesson = loadLesson(pilot.slug, mod.order, DEFAULT_COURSES_DIR)
      expect(lesson, `lección del módulo ${mod.order}`).not.toBeNull()
      expect(lesson!.title).toBe(mod.title)
      expect(lesson!.resources.length).toBeGreaterThanOrEqual(3)
      for (const r of lesson!.resources) {
        expect(r.url.startsWith("https://")).toBe(true)
        expect(r.comment.length).toBeGreaterThan(10)
      }
    }
  })

  it("lessons for modules 3, 5 and 7 point to their deliverable", () => {
    const text = (order: number) => loadLesson(pilot.slug, order)!.body
    expect(text(3)).toContain("Entrega 1")
    expect(text(5)).toContain("Entrega 2")
    expect(text(7)).toContain("Entrega 3")
  })
})
