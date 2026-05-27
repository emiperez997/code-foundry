/**
 * courseParser.ts
 *
 * Parses a course README.md into a structured object.
 * The README format is defined in content/courses/<slug>/README.md.
 */

export interface ParsedModule {
  title: string;
  order: number;
  description: string;
}

export interface ParsedCourse {
  slug: string;
  title: string;
  summary: string;
  level: string;
  isPublished: boolean;
  modules: ParsedModule[];
}

function parsePublished(value: string, filePath: string): boolean {
  if (!value) return false;

  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;

  throw new Error(
    `[courseParser] Invalid ## Published value in ${filePath}. Use true or false.`
  );
}

/**
 * Extracts the text content of a section identified by a `## Heading`.
 * Returns everything between that heading and the next `##` heading (or EOF).
 */
function extractSection(markdown: string, heading: string): string {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `##\\s+${escapedHeading}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`,
    "i"
  );
  const match = markdown.match(pattern);
  return match ? match[1].trim() : "";
}

/**
 * Parses the `## Modules` section into an array of ParsedModule.
 *
 * Expected format per module:
 *   1. Module Title
 *      - First bullet (problem context)
 *      - Second bullet (what the student reasons about)
 *
 * The two bullets are joined as the module description.
 */
function parseModules(modulesSection: string): ParsedModule[] {
  const modules: ParsedModule[] = [];

  // Parse line by line to avoid regex lookahead issues with end-of-line anchors.
  // A numbered item (e.g. "1. Title") starts a new module; indented "- bullet"
  // lines accumulate as the description for the current module.
  const lines = modulesSection.split("\n");
  let current: { order: number; title: string; bullets: string[] } | null =
    null;

  for (const line of lines) {
    const numMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (numMatch) {
      if (current) {
        modules.push({
          order: current.order,
          title: current.title,
          description: current.bullets.join(" "),
        });
      }
      current = {
        order: parseInt(numMatch[1], 10),
        title: numMatch[2].trim(),
        bullets: [],
      };
    } else if (current) {
      const bulletMatch = line.match(/^\s+-\s+(.+)$/);
      if (bulletMatch) current.bullets.push(bulletMatch[1].trim());
    }
  }

  if (current) {
    modules.push({
      order: current.order,
      title: current.title,
      description: current.bullets.join(" "),
    });
  }

  return modules;
}

/**
 * Parses a full course README.md string into a ParsedCourse object.
 * Throws if required fields (slug, title, summary, modules) are missing.
 */
export function parseCourse(markdown: string, filePath: string): ParsedCourse {
  // Normalize line endings to LF so all regex and string operations work
  // consistently regardless of whether the file was saved with CRLF or LF.
  markdown = markdown.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Title: first `# Heading` in the file
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  if (!titleMatch) {
    throw new Error(`[courseParser] Missing title (# Heading) in ${filePath}`);
  }
  const title = titleMatch[1].trim();

  const slug = extractSection(markdown, "Slug");
  if (!slug) {
    throw new Error(`[courseParser] Missing ## Slug section in ${filePath}`);
  }

  const summary = extractSection(markdown, "Summary");
  if (!summary) {
    throw new Error(`[courseParser] Missing ## Summary section in ${filePath}`);
  }

  const level = extractSection(markdown, "Target Level");
  if (!level) {
    throw new Error(
      `[courseParser] Missing ## Target Level section in ${filePath}`
    );
  }

  const isPublished = parsePublished(
    extractSection(markdown, "Published"),
    filePath
  );

  const modulesSection = extractSection(markdown, "Modules");
  if (!modulesSection) {
    throw new Error(
      `[courseParser] Missing ## Modules section in ${filePath}`
    );
  }

  const modules = parseModules(modulesSection);
  if (modules.length === 0) {
    throw new Error(
      `[courseParser] No modules found in ## Modules section in ${filePath}`
    );
  }

  return { slug, title, summary, level, isPublished, modules };
}
