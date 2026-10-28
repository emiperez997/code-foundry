/**
 * lessonLoader.ts
 *
 * Reads lesson Markdown files from content/courses/<slug>/lessons/NN-name.md.
 * Server-only (uses fs). The slug usually comes from a URL, so both slug and
 * order are strictly validated before touching the filesystem.
 */

import fs from "fs";
import path from "path";
import { positiveOrder, validSlug } from "../auth/validation";
import { LessonValidationError, parseLesson, type ParsedLesson } from "./lessonSchema";

export const DEFAULT_COURSES_DIR = path.join(process.cwd(), "content", "courses");

const LESSON_FILE = /^(\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;

function lessonsDir(slug: string, coursesDir: string): string | null {
  if (!validSlug(slug)) return null;
  return path.join(coursesDir, slug, "lessons");
}

function listLessonFiles(dir: string): { order: number; file: string }[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile())
    .flatMap((e) => {
      const m = e.name.match(LESSON_FILE);
      return m ? [{ order: Number(m[1]), file: e.name }] : [];
    })
    .sort((a, b) => a.order - b.order);
}

function readLesson(dir: string, order: number, file: string): ParsedLesson {
  const source = `lessons/${file}`;
  const lesson = parseLesson(fs.readFileSync(path.join(dir, file), "utf-8"), source);
  if (lesson.module !== order) {
    throw new LessonValidationError(
      `el frontmatter indica module ${lesson.module} pero el archivo es el ${order}`,
      source,
    );
  }
  return lesson;
}

/**
 * Loads the lesson for a module. Returns null when the slug/order is invalid
 * or when no lesson file exists; throws LessonValidationError when the file
 * exists but is malformed.
 */
export function loadLesson(
  slug: string,
  order: number | string,
  coursesDir: string = DEFAULT_COURSES_DIR,
): ParsedLesson | null {
  const orderNum = typeof order === "number" ? positiveOrder(String(order)) : positiveOrder(order);
  const dir = lessonsDir(slug, coursesDir);
  if (!dir || orderNum === null) return null;

  const matches = listLessonFiles(dir).filter((f) => f.order === orderNum);
  if (matches.length === 0) return null;
  if (matches.length > 1) {
    throw new LessonValidationError(
      `hay más de un archivo para el módulo ${orderNum}`,
      `lessons/${slug}`,
    );
  }
  return readLesson(dir, orderNum, matches[0].file);
}

/**
 * Validates every lesson of a course against its module orders.
 * - Every lesson file must be valid and map to an existing module.
 * - When `requireAll` is true (published courses), every module needs a lesson.
 */
export function validateCourseLessons(
  slug: string,
  moduleOrders: number[],
  { requireAll, coursesDir = DEFAULT_COURSES_DIR }: { requireAll: boolean; coursesDir?: string },
): ParsedLesson[] {
  const dir = lessonsDir(slug, coursesDir);
  if (!dir) throw new Error(`[lesson] slug inválido: ${slug}`);

  const files = listLessonFiles(dir);
  const seen = new Set<number>();
  const lessons = files.map(({ order, file }) => {
    if (seen.has(order)) {
      throw new LessonValidationError(`módulo ${order} duplicado`, `lessons/${file}`);
    }
    seen.add(order);
    if (!moduleOrders.includes(order)) {
      throw new LessonValidationError(`no existe el módulo ${order} en el README`, `lessons/${file}`);
    }
    return readLesson(dir, order, file);
  });

  if (requireAll) {
    const missing = moduleOrders.filter((o) => !seen.has(o));
    if (missing.length > 0) {
      throw new Error(
        `[lesson] ${slug} está publicado pero faltan lecciones para los módulos: ${missing.join(", ")}`,
      );
    }
  }
  return lessons;
}
