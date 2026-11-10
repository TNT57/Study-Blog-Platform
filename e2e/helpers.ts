import { expect, type Page } from "@playwright/test";

export const PASSWORD = "coffee and code";

/** A visible password box. (Password inputs have no ARIA role, so getByRole can't find them.) */
export function passwordBox(page: Page) {
  return page.getByLabel("Password").filter({ visible: true });
}

/** Creates a brand-new account through the real register page. Returns its details. */
export async function registerNewUser(page: Page) {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const username = `pw_${id}`.slice(0, 20);
  const email = `${username}@example.com`;

  await page.goto("/register");
  await page.getByRole("textbox", { name: "Username" }).fill(username);
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await passwordBox(page).fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("status")).toContainText("Welcome!");

  return { username, email };
}
