import { expect, test } from "@playwright/test";

import { PASSWORD, passwordBox, registerNewUser } from "./helpers";

test("register, log out, and log in again", async ({ page }) => {
  const { username, email } = await registerNewUser(page);
  await expect(page.getByRole("banner")).toContainText(username);

  await test.step("log out", async () => {
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page.getByRole("status")).toContainText("Logged out.");
    await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
  });

  await test.step("a wrong password gets the general message", async () => {
    await page.getByRole("link", { name: "Log in" }).click();
    await page.getByRole("textbox", { name: "Email" }).fill(email);
    await passwordBox(page).fill("not my password");
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(
      page.getByRole("alert").filter({ hasText: "incorrect" }),
    ).toHaveText("Email or password is incorrect.");
  });

  await test.step("the right password logs in", async () => {
    await passwordBox(page).fill(PASSWORD);
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page.getByRole("status")).toContainText("Logged in.");
    await expect(page.getByRole("banner")).toContainText(username);
  });
});

test("a page that needs a login sends you to log in, then back", async ({
  page,
}) => {
  const { email } = await registerNewUser(page);
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page.getByRole("status")).toContainText("Logged out.");

  await page.goto("/posts/new");
  await expect(page).toHaveURL(/\/login\?next=%2Fposts%2Fnew/);

  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await passwordBox(page).fill(PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page).toHaveURL(/\/posts\/new/);
  await expect(
    page.getByRole("heading", { level: 1, name: "New post" }),
  ).toBeVisible();
});

// Green after your Task 1 (docs/learn/03-auth.md): the real browser stores the cookie safely.
test("the login cookie can't be read by JavaScript in the page", async ({
  page,
  context,
}) => {
  await registerNewUser(page);

  const cookie = (await context.cookies()).find((c) =>
    c.name.endsWith("session"),
  );
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");
  // And the page's own JavaScript really can't see it:
  expect(await page.evaluate(() => document.cookie)).not.toContain("session");
});
