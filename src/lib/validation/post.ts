// VALIDATION for posts: the rules a post must follow before it reaches the database.
// The controller (post.actions.ts) uses them, and the view (PostForm) shows their messages.
import { z } from "zod";

// The limits, shared by the form (maxLength, the "12 / 120" counter) and the rules below.
// They must never be looser than the CHECK rules in db/migrations/0002_create_posts.sql.
export const TITLE_MAX = 120;
export const CONTENT_MIN = 10;
export const CONTENT_MAX = 20_000;

/**
 * The rules for a post's title and content.
 *
 * TODO(you): Task 1 in docs/learn/02-posts-crud.md.
 * Right now any text passes, even an empty title. Add the real rules:
 * trim, the minimum and maximum lengths, and the error messages from the table in the note.
 */
export const postSchema = z.object({
  title: z.string(),
  content: z.string(),
});

/** A post after the rules ran: trimmed, and the right lengths. */
export type PostInput = z.infer<typeof postSchema>;

/** What the user typed, exactly as typed (so a failed form never loses their text). */
export type PostFormValues = { title: string; content: string };

/** One list of messages per field, for example { title: ["Title is required."] }. */
export type PostFormErrors = Partial<Record<keyof PostFormValues, string[]>>;

/** What a post form action returns to the form: the typed values, and the errors if any. */
export type PostFormState = {
  values: PostFormValues;
  errors?: PostFormErrors;
  message?: string;
};

export type ParsedPostForm =
  { success: true; data: PostInput } | { success: false; state: PostFormState };

function readText(formData: FormData, name: string): string {
  const value = formData.get(name);
  // A form field can also be a file. We only accept text.
  return typeof value === "string" ? value : "";
}

/**
 * Reads the post form and checks it with postSchema.
 * Never trust the browser: the form's `required` and `maxLength` are only for comfort.
 * Anyone can send any FormData straight to a Server Action.
 */
export function parsePostForm(formData: FormData): ParsedPostForm {
  const values: PostFormValues = {
    title: readText(formData, "title"),
    content: readText(formData, "content"),
  };

  const parsed = postSchema.safeParse(values);
  if (!parsed.success) {
    // TODO(you): Task 2 in docs/learn/02-posts-crud.md.
    // Return { success: false, state: ... } with the typed values and the errors per field.
    throw new Error(
      "TODO(you): the 'validation failed' branch of parsePostForm() is not written yet (Task 2)",
    );
  }

  return { success: true, data: parsed.data };
}
