import { describe, expect, it } from "vitest"
import { LESSON_SECTIONS, LessonValidationError, parseLesson } from "@/lib/courses/lessonSchema"

function build(opts?: { skip?: string; extra?: string; resources?: string; frontmatter?: string; reorder?: boolean }) {
  const content: Record<string, string> = {
    Objetivos: "- Aprender algo",
    Contexto: "Un contexto.",
    "Explicación": "Una explicación.\n\n### Subtítulo\n\nTexto.",
    "Práctica": "1. Haz algo.",
    Recursos: opts?.resources ?? "- [OWASP](https://owasp.org/) — Referencia general.",
    "Criterios de finalización": "- [ ] Hecho",
  }
  let names: string[] = [...LESSON_SECTIONS]
  if (opts?.skip) names = names.filter((n) => n !== opts.skip)
  if (opts?.reorder) names = [names[1], names[0], ...names.slice(2)]
  const body = names.map((n) => `## ${n}\n${content[n]}`).join("\n\n")
  const fm = opts?.frontmatter ?? "title: Lección de prueba\nmodule: 2"
  return `---\n${fm}\n---\n\n${body}\n${opts?.extra ?? ""}`
}

const parse = (md: string) => parseLesson(md, "test.md")

describe("parseLesson", () => {
  it("parses a valid lesson", () => {
    const lesson = parse(build())
    expect(lesson.title).toBe("Lección de prueba")
    expect(lesson.module).toBe(2)
    expect(Object.keys(lesson.sections)).toEqual([...LESSON_SECTIONS])
    expect(lesson.resources).toEqual([
      { text: "OWASP", url: "https://owasp.org/", comment: "Referencia general." },
    ])
    expect(lesson.body.startsWith("## Objetivos")).toBe(true)
  })

  it("accepts CRLF line endings", () => {
    expect(parse(build().replace(/\n/g, "\r\n")).module).toBe(2)
  })

  it.each([...LESSON_SECTIONS])("rejects a lesson missing the section %s", (section) => {
    expect(() => parse(build({ skip: section }))).toThrow(`falta la sección "${section}"`)
  })

  it("rejects sections out of order", () => {
    expect(() => parse(build({ reorder: true }))).toThrow(/orden/)
  })

  it("rejects duplicated and unknown sections", () => {
    expect(() => parse(build({ extra: "\n## Objetivos\nOtra vez" }))).toThrow(/duplicada/)
    expect(() => parse(build({ extra: "\n## Extras\nAlgo" }))).toThrow(/no permitida/)
  })

  it("rejects empty sections", () => {
    const md = build().replace("## Contexto\nUn contexto.", "## Contexto\n\n")
    expect(() => parse(md)).toThrow(/"Contexto" está vacía/)
  })

  it("ignores headings inside code fences", () => {
    const md = build({ extra: "" }).replace("Texto.", "Texto.\n\n```md\n## Objetivos\n# Título\n```")
    expect(() => parse(md)).not.toThrow()
  })

  it("rejects level-1 headings and content before the first section", () => {
    expect(() => parse(build({ extra: "\n# Título" }))).toThrow(/nivel 1/)
    expect(() => parse(build().replace("\n\n## Objetivos", "\n\nTexto suelto\n\n## Objetivos"))).toThrow(/antes de la primera sección/)
  })

  it("requires frontmatter with title and a positive integer module", () => {
    expect(() => parse("## Objetivos\nx")).toThrow(/frontmatter/)
    expect(() => parse(build({ frontmatter: "module: 1" }))).toThrow(/title/)
    expect(() => parse(build({ frontmatter: "title: X\nmodule: 0" }))).toThrow(/module/)
    expect(() => parse(build({ frontmatter: "title: X\nmodule: uno" }))).toThrow(/module/)
  })

  it("rejects raw HTML but allows it in code", () => {
    expect(() => parse(build({ extra: "\n<script>alert(1)</script>" }))).toThrow(/HTML/)
    expect(() => parse(build({ extra: "\n`<div>` es HTML y\n\n```html\n<div></div>\n```" }))).not.toThrow()
  })

  describe("resources", () => {
    it("rejects non-https links", () => {
      expect(() => parse(build({ resources: "- [X](http://example.com) — comentario" }))).toThrow(/https/)
      expect(() => parse(build({ resources: "- [X](javascript:alert(1)) — comentario" }))).toThrow(/https/)
    })

    it("rejects links with embedded credentials", () => {
      expect(() => parse(build({ resources: "- [X](https://user:pass@example.com) — comentario" }))).toThrow(/credenciales/)
    })

    it("rejects resources without comment or in the wrong format", () => {
      expect(() => parse(build({ resources: "- [X](https://example.com)" }))).toThrow(/formato inválido/)
      expect(() => parse(build({ resources: "https://example.com" }))).toThrow(/formato inválido/)
    })

    it("rejects non-https links anywhere in the body", () => {
      expect(() => parse(build({ extra: "\nMira [esto](http://example.com)." }))).toThrow(/enlace no permitido/)
      expect(() => parse(build({ extra: "\nMira [esto](https://example.com)." }))).not.toThrow()
    })
  })

  it("throws LessonValidationError with the source name", () => {
    try {
      parse(build({ skip: "Recursos" }))
      expect.unreachable()
    } catch (error) {
      expect(error).toBeInstanceOf(LessonValidationError)
      expect((error as Error).message).toContain("test.md")
    }
  })
})
