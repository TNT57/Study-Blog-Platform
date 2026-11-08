// The rules for a post (src/lib/validation/post.ts).
// Task 1 of the M2 pair tasks (see docs/learn/02-posts-crud.md).
import { describe, expect, it } from "vitest";

import { postSchema } from "@/lib/validation/post";

const valid = {
  title: "SQL joins explained",
  content: "An INNER JOIN keeps only the rows that match.",
};

/** The first error message for one field, or undefined when that field is fine. */
function errorFor(input: unknown, field: "title" | "content") {
  const result = postSchema.safeParse(input);
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("postSchema (Task 1)", () => {
  it("accepts a normal post", () => {
    expect(postSchema.safeParse(valid).success).toBe(true);
  });

  it("removes spaces around the title and the content", () => {
    const result = postSchema.parse({
      title: "  SQL joins  ",
      content: "\n  An INNER JOIN keeps only the rows that match.  \n",
    });

    expect(result).toEqual({
      title: "SQL joins",
      content: "An INNER JOIN keeps only the rows that match.",
    });
  });

  it.each(["", "     "])("rejects the empty title %j", (title) => {
    expect(errorFor({ ...valid, title }, "title")).toBe("Title is required.");
  });

  it("accepts 120 characters in the title, but not 121", () => {
    expect(
      errorFor({ ...valid, title: "a".repeat(120) }, "title"),
    ).toBeUndefined();
    expect(errorFor({ ...valid, title: "a".repeat(121) }, "title")).toBe(
      "Title must be 120 characters or fewer.",
    );
  });

  it("needs at least 10 characters of content (spaces don't count)", () => {
    expect(errorFor({ ...valid, content: "  joins   " }, "content")).toBe(
      "Content must be at least 10 characters.",
    );
    expect(
      errorFor({ ...valid, content: "0123456789" }, "content"),
    ).toBeUndefined();
  });

  it("accepts 20 000 characters of content, but not 20 001", () => {
    expect(
      errorFor({ ...valid, content: "a".repeat(20_000) }, "content"),
    ).toBeUndefined();
    expect(errorFor({ ...valid, content: "a".repeat(20_001) }, "content")).toBe(
      "Content must be 20 000 characters or fewer.",
    );
  });

  it("reports both fields at once, so the user can fix everything in one go", () => {
    const result = postSchema.safeParse({ title: "", content: "short" });

    expect(result.success).toBe(false);
    const fields = result.error?.issues.map((issue) => issue.path[0]);
    expect(fields).toEqual(expect.arrayContaining(["title", "content"]));
  });
});
