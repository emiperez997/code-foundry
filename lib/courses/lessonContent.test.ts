import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { LessonContent } from "@/components/lesson-content"
import { loadLesson } from "@/lib/courses/lessonLoader"

const render = (markdown: string) => renderToStaticMarkup(createElement(LessonContent, { markdown }))

describe("LessonContent", () => {
  it("renders headings, GFM tables and task lists", () => {
    const html = render("## Objetivos\n\n| a | b |\n| - | - |\n| 1 | 2 |\n\n- [ ] Hecho\n")
    expect(html).toContain("<h2")
    expect(html).toContain("<table")
    expect(html).toContain('type="checkbox"')
  })

  it("opens external links safely", () => {
    const html = render("[OWASP](https://owasp.org/)")
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
  })

  it("does not render raw HTML, scripts, javascript: links or images", () => {
    const html = render('<script>alert(1)</script>\n\n[x](javascript:alert(1))\n\n![img](https://example.com/a.png)\n')
    expect(html).not.toContain("<script")
    expect(html).not.toContain("javascript:")
    expect(html).not.toContain("<img")
  })

  it("renders the real first lesson with its six sections", () => {
    const html = render(loadLesson("real-world-auth", 1)!.body)
    for (const s of ["Objetivos", "Contexto", "Explicación", "Práctica", "Recursos", "Criterios de finalización"]) {
      expect(html).toMatch(new RegExp(`<h2[^>]*>${s}</h2>`))
    }
  })
})
