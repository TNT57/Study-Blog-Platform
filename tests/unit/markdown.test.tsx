// Markdown posts (src/components/post-markdown.tsx): what we show, and the attacks we stop.
import { render, screen } from "@testing-library/react";
import { marked } from "marked";
import { describe, expect, it } from "vitest";

import { PostMarkdown } from "@/components/post-markdown";
import { markdownToText } from "@/lib/markdown-text";

/** Everything that could run code or load something from another site. */
const DANGEROUS =
  "script, iframe, object, embed, img, style, [onerror], [onload], [onclick], a[href^='javascript' i]";

describe("PostMarkdown shows Markdown", () => {
  it("turns **bold**, _italic_, `code` and lists into elements", () => {
    const { container } = render(
      <PostMarkdown
        content={"Learn **SQL** with _joins_ and `SELECT`.\n\n- one\n- two"}
      />,
    );

    expect(container.querySelector("strong")).toHaveTextContent("SQL");
    expect(container.querySelector("em")).toHaveTextContent("joins");
    expect(container.querySelector("code")).toHaveTextContent("SELECT");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("starts headings at <h2>, because the post title is the page's <h1>", () => {
    render(<PostMarkdown content={"# Big idea\n\n## Detail"} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Big idea" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Detail" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  });

  it("marks links as added by a user (nofollow ugc)", () => {
    render(
      <PostMarkdown content="Read [the docs](https://nextjs.org/docs)." />,
    );

    const link = screen.getByRole("link", { name: "the docs" });
    expect(link).toHaveAttribute("href", "https://nextjs.org/docs");
    expect(link).toHaveAttribute("rel", "nofollow ugc");
  });
});

describe("PostMarkdown stops XSS", () => {
  it.each([
    ["an image with an onerror script", "<img src=x onerror=alert(1)>"],
    ["a script tag", "<script>alert(1)</script>"],
    ["a javascript: link in Markdown", "[click me](javascript:alert(1))"],
    ["a javascript: link in HTML", '<a href="javascript:alert(1)">click</a>'],
    ["an iframe", '<iframe src="https://evil.example"></iframe>'],
    ["a click handler", '<div onclick="alert(1)">click</div>'],
    ["a tracking image", "![pixel](https://evil.example/pixel.png)"],
  ])("never turns %s into something that runs", (_name, attack) => {
    const { container } = render(
      <PostMarkdown content={`Hello!\n\n${attack}\n\nBye!`} />,
    );

    expect(container.querySelector(DANGEROUS)).toBeNull();
    // The rest of the post still shows.
    expect(screen.getByText("Hello!")).toBeInTheDocument();
    expect(screen.getByText("Bye!")).toBeInTheDocument();
  });
});

// Why we don't do the "easy" thing: turn Markdown into an HTML string and inject it.
describe("the unsafe way (never do this)", () => {
  it("marked + dangerouslySetInnerHTML lets the attack straight through", async () => {
    const html = await marked.parse("Hello! <img src=x onerror=alert(1)>");

    // The HTML string still carries the attacker's code...
    expect(html).toContain("onerror=alert(1)");

    // ...and injecting it creates a real <img> with the onerror handler. In a browser it would run.
    const { container } = render(
      <div dangerouslySetInnerHTML={{ __html: html }} />,
    );
    expect(container.querySelector("img[onerror]")).not.toBeNull();
  });
});

describe("markdownToText (the excerpts on the post list)", () => {
  it.each([
    ["**SQL** joins, _explained_", "SQL joins, explained"],
    ["# Title\n\nFirst line.\n\n- one\n- two", "Title First line. one two"],
    ["Read [the docs](https://nextjs.org/docs).", "Read the docs."],
    ["```\nSELECT 1;\n```", "SELECT 1;"],
  ])("turns %o into plain words", (markdown, text) => {
    expect(markdownToText(markdown)).toBe(text);
  });
});
