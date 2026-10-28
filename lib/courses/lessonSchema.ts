/**
 * lessonSchema.ts
 *
 * Pure parsing and validation of lesson Markdown files (no filesystem access).
 *
 * A lesson file looks like:
 *
 *   ---
 *   title: Registro de usuarios
 *   module: 2
 *   ---
 *
 *   ## Objetivos
 *   ...
 *
 * The six sections below are mandatory, non-empty and must appear in this
 * order. Sections are level-2 headings; deeper headings (###) are free.
 */

export const LESSON_SECTIONS = [
  "Objetivos",
  "Contexto",
  "Explicación",
  "Práctica",
  "Recursos",
  "Criterios de finalización",
] as const;

export type LessonSectionName = (typeof LESSON_SECTIONS)[number];

export interface LessonResource {
  text: string;
  url: string;
  comment: string;
}

export interface ParsedLesson {
  title: string;
  module: number;
  /** Markdown body (everything after the frontmatter). */
  body: string;
  sections: Record<LessonSectionName, string>;
  resources: LessonResource[];
}

export class LessonValidationError extends Error {
  constructor(message: string, readonly source: string) {
    super(`[lesson] ${source}: ${message}`);
    this.name = "LessonValidationError";
  }
}

const RESOURCE_LINE = /^[-*]\s+\[([^\]\n]+)\]\((\S+?)\)\s+[—–-]\s+(\S.*)$/;

function normalize(markdown: string): string {
  return markdown.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
}

function parseFrontmatter(
  markdown: string,
  source: string,
): { data: Record<string, string>; body: string } {
  const match = markdown.match(/^---\n([\s\S]*?)\n---[ \t]*(?:\n|$)/);
  if (!match) {
    throw new LessonValidationError("falta el frontmatter (--- … ---)", source);
  }

  const data: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    if (!line.trim()) continue;
    const kv = line.match(/^([a-z]+):\s*(.*)$/);
    if (!kv) {
      throw new LessonValidationError(`línea de frontmatter inválida: "${line}"`, source);
    }
    data[kv[1]] = kv[2].trim().replace(/^"(.*)"$/, "$1");
  }
  return { data, body: markdown.slice(match[0].length) };
}

/** Lines of the body with a flag telling if each one is inside a code fence. */
function scanLines(body: string): { line: string; inCode: boolean }[] {
  let fence: string | null = null;
  return body.split("\n").map((line) => {
    const m = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (m) {
      if (fence === null) {
        fence = m[1][0];
        return { line, inCode: true };
      }
      if (m[1][0] === fence) {
        fence = null;
        return { line, inCode: true };
      }
    }
    return { line, inCode: fence !== null };
  });
}

function splitSections(body: string, source: string) {
  const scanned = scanLines(body);
  const found: { name: string; lines: string[] }[] = [];

  for (const { line, inCode } of scanned) {
    if (!inCode) {
      if (/^#\s/.test(line)) {
        throw new LessonValidationError(
          "no uses títulos de nivel 1 (#): el título viene del frontmatter",
          source,
        );
      }
      const h2 = line.match(/^##\s+(.+?)\s*#*\s*$/);
      if (h2) {
        found.push({ name: h2[1], lines: [] });
        continue;
      }
    }
    if (found.length > 0) found[found.length - 1].lines.push(line);
    else if (line.trim()) {
      throw new LessonValidationError(
        "hay contenido antes de la primera sección",
        source,
      );
    }
  }

  const names = found.map((s) => s.name);
  const expected = LESSON_SECTIONS as readonly string[];
  for (const required of expected) {
    if (!names.includes(required)) {
      throw new LessonValidationError(`falta la sección "${required}"`, source);
    }
  }
  const duplicate = names.find((n, i) => names.indexOf(n) !== i);
  if (duplicate) {
    throw new LessonValidationError(`sección duplicada "${duplicate}"`, source);
  }
  const unknown = names.find((n) => !expected.includes(n));
  if (unknown) {
    throw new LessonValidationError(`sección no permitida "${unknown}"`, source);
  }
  if (names.join("|") !== expected.join("|")) {
    throw new LessonValidationError(
      `las secciones deben aparecer en este orden: ${expected.join(", ")}`,
      source,
    );
  }

  const sections = {} as Record<LessonSectionName, string>;
  for (const s of found) {
    const content = s.lines.join("\n").trim();
    if (!content) {
      throw new LessonValidationError(`la sección "${s.name}" está vacía`, source);
    }
    sections[s.name as LessonSectionName] = content;
  }
  return sections;
}

function parseResources(section: string, source: string): LessonResource[] {
  const resources: LessonResource[] = [];
  for (const raw of section.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(RESOURCE_LINE);
    if (!m) {
      throw new LessonValidationError(
        `recurso con formato inválido (usa "- [texto](https://…) — comentario"): "${line}"`,
        source,
      );
    }
    let url: URL;
    try {
      url = new URL(m[2]);
    } catch {
      throw new LessonValidationError(`URL inválida en recursos: ${m[2]}`, source);
    }
    if (url.protocol !== "https:" || url.username || url.password) {
      throw new LessonValidationError(
        `los recursos deben usar https y no incluir credenciales: ${m[2]}`,
        source,
      );
    }
    resources.push({ text: m[1].trim(), url: url.href, comment: m[3].trim() });
  }
  if (resources.length === 0) {
    throw new LessonValidationError("debe haber al menos un recurso", source);
  }
  return resources;
}

/** Raw HTML is not rendered, so it is rejected at validation time. */
function assertNoRawHtml(body: string, source: string) {
  const prose = scanLines(body)
    .filter((l) => !l.inCode)
    .map((l) => l.line.replace(/`[^`]*`/g, ""))
    .join("\n");
  if (/<\/?[a-zA-Z!][^>]*>/.test(prose)) {
    throw new LessonValidationError("no se permite HTML crudo en las lecciones", source);
  }
}

/** Rejects non-https (and non-relative-anchor) links anywhere in the lesson. */
function assertSafeLinks(body: string, source: string) {
  const prose = scanLines(body)
    .filter((l) => !l.inCode)
    .map((l) => l.line.replace(/`[^`]*`/g, ""))
    .join("\n");
  for (const m of prose.matchAll(/!?\[[^\]]*\]\(\s*<?([^)\s>]+)/g)) {
    if (!m[1].startsWith("https://") && !m[1].startsWith("#")) {
      throw new LessonValidationError(
        `enlace no permitido (solo https o anclas internas): ${m[1]}`,
        source,
      );
    }
  }
}

export function parseLesson(markdown: string, source: string): ParsedLesson {
  const { data, body } = parseFrontmatter(normalize(markdown), source);

  const title = data.title?.trim();
  if (!title) throw new LessonValidationError("falta `title` en el frontmatter", source);

  if (!/^[1-9]\d*$/.test(data.module ?? "")) {
    throw new LessonValidationError("`module` debe ser un entero positivo", source);
  }
  const moduleOrder = Number(data.module);

  assertNoRawHtml(body, source);
  assertSafeLinks(body, source);
  const sections = splitSections(body, source);
  const resources = parseResources(sections["Recursos"], source);

  return { title, module: moduleOrder, body: body.trim(), sections, resources };
}
