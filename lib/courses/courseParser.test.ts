import { describe, expect, it } from "vitest"
import { parseCourse } from "@/lib/courses/courseParser"

function buildCourseMarkdown(overrides?: Partial<Record<string, string>>) {
  const title = overrides?.title ?? "Real-World Testing"
  const slug = overrides?.slug ?? "real-world-testing"
  const summary = overrides?.summary ?? "Learn testing with real scenarios."
  const level = overrides?.level ?? "Junior"
  const published = overrides?.published ?? "true"
  const modules =
    overrides?.modules ??
    [
      "1. First Module",
      "   - First context",
      "   - First reasoning",
      "",
      "2. Second Module",
      "   - Second context",
      "   - Second reasoning",
    ].join("\n")

  return [
    `# ${title}`,
    "",
    "## Slug",
    slug,
    "",
    "## Summary",
    summary,
    "",
    "## Target Level",
    level,
    "",
    "## Published",
    published,
    "",
    "## Modules",
    modules,
  ].join("\n")
}

describe("parseCourse", () => {
  it("parses a valid course markdown", () => {
    const markdown = buildCourseMarkdown()

    const result = parseCourse(markdown, "content/courses/example/README.md")

    expect(result.slug).toBe("real-world-testing")
    expect(result.title).toBe("Real-World Testing")
    expect(result.summary).toBe("Learn testing with real scenarios.")
    expect(result.level).toBe("Junior")
    expect(result.isPublished).toBe(true)
    expect(result.modules).toHaveLength(2)
    expect(result.modules[0]).toEqual({
      order: 1,
      title: "First Module",
      description: "First context First reasoning",
    })
  })

  it("defaults published to false when section is missing", () => {
    const markdown = buildCourseMarkdown().replace(
      "## Published\ntrue\n\n",
      ""
    )

    const result = parseCourse(markdown, "content/courses/example/README.md")

    expect(result.isPublished).toBe(false)
  })

  it("throws when title is missing", () => {
    const markdown = buildCourseMarkdown().replace("# Real-World Testing\n\n", "")

    expect(() => parseCourse(markdown, "file.md")).toThrow(
      "Missing title (# Heading)"
    )
  })

  it("throws when modules section is missing", () => {
    const markdown = buildCourseMarkdown().replace("## Modules", "## Lessons")

    expect(() => parseCourse(markdown, "file.md")).toThrow(
      "Missing ## Modules section"
    )
  })

  it("throws when published value is invalid", () => {
    const markdown = buildCourseMarkdown({ published: "maybe" })

    expect(() => parseCourse(markdown, "file.md")).toThrow(
      "Invalid ## Published value"
    )
  })
})
