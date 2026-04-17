/**
 * courseLoader.ts
 *
 * Reads all course README.md files from content/courses/ and returns
 * parsed course objects ready to be seeded into the database.
 */

import fs from "fs";
import path from "path";
import { parseCourse, type ParsedCourse } from "./courseParser";

// Resolved relative to the project root (where Next.js / Node runs from)
const COURSES_DIR = path.join(process.cwd(), "content", "courses");

/**
 * Returns the absolute path to each course README.md found under
 * content/courses/<slug>/README.md.
 *
 * Ignores non-directory entries and directories that have no README.md
 * (e.g. the index.md at the root of content/courses/).
 */
function getCourseReadmePaths(): string[] {
  const entries = fs.readdirSync(COURSES_DIR, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isDirectory())
    .map((dir) => path.join(COURSES_DIR, dir.name, "README.md"))
    .filter((readmePath) => fs.existsSync(readmePath));
}

/**
 * Loads and parses all courses from the content/courses directory.
 * Throws on any parse error so seed failures are loud and explicit.
 */
export function loadCourses(): ParsedCourse[] {
  const readmePaths = getCourseReadmePaths();

  if (readmePaths.length === 0) {
    throw new Error(
      `[courseLoader] No course directories found in ${COURSES_DIR}`
    );
  }

  return readmePaths.map((filePath) => {
    const markdown = fs.readFileSync(filePath, "utf-8");
    return parseCourse(markdown, filePath);
  });
}
