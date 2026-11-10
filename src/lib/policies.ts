// AUTHORIZATION rules: WHO may do WHAT.
//
// Authentication (M3) answers "who are you?". These rules answer "what may you do?".
// They are pure functions (no database, no cookies), so they are easy to test, and the
// same rule is used everywhere: in the actions (the real protection), and in the pages
// (only to show or hide buttons).

/** Who is asking: only what the rules need. `null` = a guest (not logged in). */
export type Actor = { id: number; role: "user" | "admin" } | null;

/** The part of a post the rules look at. */
export type OwnedPost = { authorId: number };

/**
 * May this person edit or delete this post?
 *
 * TODO(you): Task 1 in docs/learn/04-authorization.md.
 * Right now this is still M3's rule: anyone who is logged in.
 * The real rule: the post's author, or an admin. A guest never.
 */
export function canEditPost(actor: Actor, post: OwnedPost): boolean {
  void post; // you will need this in Task 1
  return actor !== null;
}
