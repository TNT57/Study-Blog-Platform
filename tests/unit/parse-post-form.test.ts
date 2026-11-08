// parsePostForm() (src/lib/validation/post.ts). The "validation failed" branch was
// Task 2 of the M2 pair tasks (see docs/learn/02-posts-crud.md).
import { describe, expect, it } from "vitest";

import { parsePostForm } from "@/lib/validation/post";

function form(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    formData.append(name, value);
  }
  return formData;
}

describe("parsePostForm", () => {
  it("returns the clean data when the form is valid (green after Task 1)", () => {
    const result = parsePostForm(
      form({
        title: "  Big-O  ",
        content: "Count the steps for n = 10 and n = 1000.",
      }),
    );

    expect(result).toEqual({
      success: true,
      data: {
        title: "Big-O",
        content: "Count the steps for n = 10 and n = 1000.",
      },
    });
  });

  describe("when the form is invalid (Task 2)", () => {
    it("treats a missing field as empty text", () => {
      const result = parsePostForm(
        form({ content: "Count the steps for n = 10." }),
      );

      expect(result.success).toBe(false);
    });

    it("returns success: false with one message list per field", () => {
      const result = parsePostForm(form({ title: "   ", content: "short" }));

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.state.errors).toEqual({
        title: ["Title is required."],
        content: ["Content must be at least 10 characters."],
      });
    });

    it("gives back exactly what the user typed, so the form can show it again", () => {
      const typed = { title: "   ", content: "  short  " };

      const result = parsePostForm(form(typed));

      expect(result.success).toBe(false);
      if (result.success) return;
      // Not trimmed: the user sees their own text, unchanged.
      expect(result.state.values).toEqual(typed);
    });

    it("only lists the fields that have a problem", () => {
      const result = parsePostForm(
        form({ title: "A good title", content: "short" }),
      );

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.state.errors).toEqual({
        content: ["Content must be at least 10 characters."],
      });
    });
  });
});
