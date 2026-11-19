// A post's content, written in Markdown (**bold**, _italic_, `code`, lists, links...).
//
// Posts are written by users, so their text is UNTRUSTED. An attacker could write
// <img src=x onerror=alert(1)> and hope our page runs it (stored XSS, see docs/learn/07-xss.md).
// We have two locks:
//   1. react-markdown builds React elements, never an HTML string: raw HTML in the text is not
//      turned into elements, and unsafe links (javascript:...) are removed.
//   2. rehype-sanitize keeps only a safe list of elements and attributes (GitHub's list). If someone
//      later turns on raw HTML by mistake, this lock still holds.
// The unsafe way, an HTML string in dangerouslySetInnerHTML, is shown in tests/unit/markdown.test.tsx.
import Markdown, { type Components } from "react-markdown";
import rehypeSanitize from "rehype-sanitize";

const components: Components = {
  // The post's title is the page's only <h1>, so Markdown headings start one level lower.
  h1: ({ children }) => <h2 className="text-h2">{children}</h2>,
  h2: ({ children }) => <h3 className="text-h3">{children}</h3>,
  h3: ({ children }) => <h4 className="text-body font-semibold">{children}</h4>,
  h4: ({ children }) => <h4 className="text-body font-semibold">{children}</h4>,
  h5: ({ children }) => <h4 className="text-body font-semibold">{children}</h4>,
  h6: ({ children }) => <h4 className="text-body font-semibold">{children}</h4>,
  a: ({ href, children }) => (
    // "nofollow ugc": search engines learn this link was added by a user (it fights link spam).
    <a
      href={href}
      rel="nofollow ugc"
      className="font-medium text-primary-hover underline underline-offset-2"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="flex list-disc flex-col gap-1.5 pl-6">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="flex list-decimal flex-col gap-1.5 pl-6">{children}</ol>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-border pl-4 text-muted-foreground">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-[0.9em]">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="overflow-x-auto rounded-lg bg-muted p-4 font-mono text-small leading-6 [&>code]:bg-transparent [&>code]:p-0">
      {children}
    </pre>
  ),
  hr: () => <hr className="border-border" />,
};

export function PostMarkdown({ content }: { content: string }) {
  return (
    <div className="flex flex-col gap-5 text-reading [overflow-wrap:anywhere]">
      <Markdown
        components={components}
        // No images: they would load from any website (tracking pixels), and we have no upload storage.
        disallowedElements={["img"]}
        rehypePlugins={[rehypeSanitize]}
      >
        {content}
      </Markdown>
    </div>
  );
}
