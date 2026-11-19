// Who may change a post (M4), checked through the real pages with two real accounts.
import { expect, test } from "@playwright/test";

import { logOut, registerNewUser, writePost } from "./helpers";

test("a second user can't edit or delete my post (Task 1)", async ({
  page,
}) => {
  // 1. Anna signs up and writes a post.
  await registerNewUser(page);
  const post = await writePost(page);

  // 2. Anna logs out, and Binh signs up.
  await logOut(page);
  await registerNewUser(page);

  // 3. Binh can read Anna's post, but sees no Edit link and no Delete button.
  await page.goto(post.url);
  await expect(
    page.getByRole("heading", { level: 1, name: post.title }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Edit", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Delete", exact: true }),
  ).toHaveCount(0);

  // 4. Binh types the edit address directly: the 403 page.
  await page.goto(`${post.url}/edit`);
  await expect(
    page.getByRole("heading", { name: "You can’t change this post" }),
  ).toBeVisible();
});
