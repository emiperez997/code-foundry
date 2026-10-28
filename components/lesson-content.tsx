import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/**
 * Renders validated lesson Markdown on the server.
 * - No raw HTML (react-markdown ignores it; `skipHtml` makes that explicit).
 * - No images.
 * - Typography is styled here because @tailwindcss/typography is not installed.
 */
const components: Components = {
  h2: ({ children }) => (
    <h2 className="mt-10 mb-4 scroll-m-20 border-b pb-2 text-xl font-semibold tracking-tight first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-6 mb-3 scroll-m-20 text-lg font-semibold tracking-tight">{children}</h3>
  ),
  h4: ({ children }) => <h4 className="mt-4 mb-2 font-semibold">{children}</h4>,
  p: ({ children }) => <p className="my-4 leading-7">{children}</p>,
  ul: ({ children, className }) => (
    <ul className={cn("my-4 ml-6 list-disc space-y-2 marker:text-muted-foreground", className?.includes("contains-task-list") && "ml-0 list-none")}>
      {children}
    </ul>
  ),
  ol: ({ children }) => <ol className="my-4 ml-6 list-decimal space-y-2">{children}</ol>,
  li: ({ children, className }) => (
    <li className={cn("leading-7", className?.includes("task-list-item") && "flex items-start gap-2")}>{children}</li>
  ),
  input: ({ type, checked }) =>
    type === "checkbox" ? (
      <input type="checkbox" checked={!!checked} readOnly disabled aria-label="Criterio de finalización" className="mt-2 h-4 w-4 shrink-0" />
    ) : null,
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-4 pl-4 text-muted-foreground italic">{children}</blockquote>
  ),
  hr: () => <hr className="my-8" />,
  a: ({ href, children }) => {
    const external = typeof href === "string" && /^https?:\/\//i.test(href);
    return (
      <a
        href={href}
        className="font-medium underline underline-offset-4 hover:text-primary/80"
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  },
  pre: ({ children }) => (
    <pre className="my-4 overflow-x-auto rounded-lg border bg-muted p-4 text-sm leading-6">{children}</pre>
  ),
  code: ({ children, className }) =>
    className ? (
      <code className={cn("font-mono", className)}>{children}</code>
    ) : (
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.875em]">{children}</code>
    ),
  table: ({ children }) => (
    <div className="my-6 w-full overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border px-3 py-2 text-left font-semibold bg-muted/50">{children}</th>,
  td: ({ children }) => <td className="border px-3 py-2 align-top">{children}</td>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
};

export function LessonContent({ markdown }: { markdown: string }) {
  return (
    <article data-testid="lesson-content" className="text-base text-foreground">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={components}
        skipHtml
        disallowedElements={["img"]}
        unwrapDisallowed
      >
        {markdown}
      </Markdown>
    </article>
  );
}
