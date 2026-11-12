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

  it("doesn't let another user edit someone else's post", () => {
    expect(canEditPost(lan, trungsPost)).toBe(false);
  });

  it("never lets a guest edit", () => {
    expect(canEditPost(null, trungsPost)).toBe(false);
  });

  it("lets an admin edit anyone's post (Task 2)", () => {
    const admin: Actor = { id: 3, role: "admin" }; // not the author
    expect(canEditPost(admin, trungsPost)).toBe(true);
  });
});
