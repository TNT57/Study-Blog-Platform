import { describe, expect, it } from "vitest";

import { findUserByEmail, findUserById } from "@/models/user.model";

import { expectDbError, makeUser } from "./helpers";

// Postgres error codes: 23505 = unique value already exists, 23514 = CHECK rule failed.
describe("user model", () => {
  it("creates a user and gives it a number id", async () => {
    const user = await makeUser({
      username: "trung",
      email: "trung@example.com",
    });

    expect(user.id).toBeTypeOf("number");
    expect(user.username).toBe("trung");
    expect(user.role).toBe("user");
    expect(user.createdAt).toBeInstanceOf(Date);
  });

  it("refuses a second account with the same email, even in other letter cases", async () => {
    await makeUser({ email: "trung@example.com" });

    const code = await expectDbError(() =>
      makeUser({ email: "TRUNG@example.com" }),
    );
    expect(code).toBe("23505");
  });

  it("refuses a second account with the same username, even in other letter cases", async () => {
    await makeUser({ username: "trung" });

    const code = await expectDbError(() => makeUser({ username: "Trung" }));
    expect(code).toBe("23505");
  });

  it.each(["ab", "has space", "way_too_long_username_123", "emoji😀"])(
    'refuses the username "%s"',
    async (username) => {
      const code = await expectDbError(() => makeUser({ username }));
      expect(code).toBe("23514");
    },
  );

  it("finds a user by email, ignoring upper/lower case", async () => {
    const user = await makeUser({ email: "linh@example.com" });

    expect((await findUserByEmail("LINH@example.com"))?.id).toBe(user.id);
    expect(await findUserByEmail("nobody@example.com")).toBeNull();
  });

  it("finds a user by id, or returns null", async () => {
    const user = await makeUser();

    expect((await findUserById(user.id))?.email).toBe(user.email);
    expect(await findUserById(999_999)).toBeNull();
  });
});
