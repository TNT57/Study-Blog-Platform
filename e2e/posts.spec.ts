import { expect, test } from "@playwright/test";

import { registerNewUser } from "./helpers";

// Next.js keeps pages you visited alive but hidden, so the same form can be in the page twice.
// getByRole only finds what is visible (it reads the accessibility tree), so we use it everywhere.

// The whole journey of a post, through the real pages, the Server Actions and the database.
test("write, read, edit and delete a post", async ({ page }) => {
  const title = `A note from Playwright ${Date.now()}`;
  const editedTitle = `${title} (edited)`;
  // Since M3 you must be logged in to write. A fresh account for every run.
  await registerNewUser(page);

  await test.step("write it", async () => {
    await page.getByRole("link", { name: "New post" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "New post" }),
    ).toBeVisible();

    await page.getByRole("textbox", { name: "Title" }).fill(title);
    await page
      .getByRole("textbox", { name: "Content" })
      .fill(
        "Playwright opens a real browser and clicks like a person.\n\nIt checks the whole journey.",
      );
    await page.getByRole("button", { name: "Publish post" }).click();

    await expect(
      page.getByRole("heading", { level: 1, name: title }),
    ).toBeVisible();
    await expect(page.getByRole("status")).toContainText("Post published.");
  });

  await test.step("see it in the list (the cache was cleared)", async () => {
    await page.getByRole("link", { name: "All posts" }).click();
    await expect(page.getByRole("link", { name: title })).toBeVisible();
  });

  await test.step("edit it", async () => {
    await page.getByRole("link", { name: title }).click();
    await page.getByRole("link", { name: "Edit", exact: true }).click();
    await page.getByRole("textbox", { name: "Title" }).fill(editedTitle);
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(
      page.getByRole("heading", { level: 1, name: editedTitle }),
    ).toBeVisible();
    await expect(page.getByRole("status")).toContainText("Changes saved.");
  });

  await test.step("delete it", async () => {
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    const dialog = page.getByRole("alertdialog", { name: "Delete this post?" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Delete post" }).click();

    await expect(page.getByRole("status")).toContainText("Post deleted.");
    await expect(page.getByRole("link", { name: editedTitle })).toHaveCount(0);
  });

  await test.step("the next new post starts empty", async () => {
    // The old "New post" page is kept alive (hidden). After a successful publish it must
    // not show the old text again. (This click also proves the closed dialog left the page usable.)
    await page.getByRole("link", { name: "New post" }).click();
    await expect(page.getByRole("textbox", { name: "Title" })).toHaveValue("");
    await expect(page.getByRole("textbox", { name: "Content" })).toHaveValue(
      "",
    );
  });
});

test("a post that doesn't exist shows the not-found page", async ({ page }) => {
  await page.goto("/posts/999999999");
  await expect(
    page.getByRole("heading", { name: "We can’t find that page" }),
  ).toBeVisible();
});

// The M2 pair tasks: the post rules and the "validation failed" branch.
test("a form with problems explains them and keeps the text", async ({
  page,
}) => {
  await registerNewUser(page);
  await page.goto("/posts/new");
  // Only spaces pass the browser's `required` check, so the server's rules must catch it.
  await page.getByRole("textbox", { name: "Title" }).fill("   ");
  await page.getByRole("textbox", { name: "Content" }).fill("joins");
  await page.getByRole("button", { name: "Publish post" }).click();

  await expect(
    page.getByRole("alert").filter({ hasText: "Please fix" }),
  ).toHaveText("Please fix 2 problems below, then try again.");
  const title = page.getByRole("textbox", { name: "Title" });
  await expect(title).toHaveAttribute("aria-invalid", "true");
  await expect(title).toHaveAccessibleDescription(/Title is required\./);
  await expect(page.getByRole("textbox", { name: "Content" })).toHaveValue(
    "joins",
  );
});
