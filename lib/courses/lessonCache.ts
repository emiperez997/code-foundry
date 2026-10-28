import { cache } from "react";
import { loadLesson } from "./lessonLoader";

/** Request-scoped memoized lesson lookup for Server Components. */
export const getLesson = cache((slug: string, order: number) => loadLesson(slug, order));
