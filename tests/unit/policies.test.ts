// The authorization rules (src/lib/policies.ts). Pure functions, so no database is needed:
// we just make pretend users and posts.
import { describe, expect, it } from "vitest";

import { type Actor, canEditPost } from "@/lib/policies";

const trung: Actor = { id: 1, role: "user" };
const lan: Actor = { id: 2, role: "user" };
const trungsPost = { authorId: 1 };

describe("canEditPost", () => {
  it("lets the author edit their own post", () => {
    expect(canEditPost(trung, trungsPost)).toBe(true);
  });

  // Red until Task 1 (docs/learn/04-authorization.md).
  it("doesn't let another user edit someone else's post", () => {
    expect(canEditPost(lan, trungsPost)).toBe(false);
  });

  it("never lets a guest edit", () => {
    expect(canEditPost(null, trungsPost)).toBe(false);
  });

  // TODO(you): Task 2 in docs/learn/04-authorization.md.
  // Replace the line inside with a real test: make an admin (a new Actor with role "admin"),
  // and check that they may edit Trung's post.
  it("lets an admin edit anyone's post (Task 2)", () => {
    throw new Error("TODO(you): write this test (Task 2)");
  });
});
