/**
 * Re-exports ParsedCourse as CourseContent for UI-layer consumption.
 * Avoids duplicating the course shape defined in courseParser.ts.
 */
export type { ParsedCourse as CourseContent } from "./courseParser";
