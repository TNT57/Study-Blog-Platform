// Markdown → plain text, for places that show text only (the excerpts on the post list).
// "**SQL** joins" becomes "SQL joins": the reader sees words, not stars and brackets.
//
// It lives in its own file because the Markdown parser is large: only server code imports it.
import type { Nodes } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { toString } from "mdast-util-to-string";

/** The text of each block (paragraph, heading, code...), in order. */
function blockTexts(node: Nodes): string[] {
  if (node.type === "paragraph" || node.type === "heading") {
    return [toString(node)];
  }
  if (node.type === "code") return [node.value];
  if ("children" in node) return node.children.flatMap(blockTexts);
  return [];
}

/** The words of a Markdown text, on one line, without any Markdown signs. */
export function markdownToText(markdown: string): string {
  return blockTexts(fromMarkdown(markdown))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
