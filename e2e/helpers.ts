import { expect, type Locator, type Page } from "@playwright/test";

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

/** Logs out with the header's button (on phones, it's inside the menu). */
export async function logOut(page: Page) {
  const button = page.getByRole("button", { name: "Log out" });
  if (!(await button.isVisible())) await page.getByLabel("Menu").click();
  await button.click();
  // Some pages have more than one status message (the timer has its own), so pick ours.
  await expect(
    page.getByRole("status").filter({ hasText: "Logged out." }),
  ).toBeVisible();
}

/** Writes a post through the real editor. Returns its title and its address, like "/posts/12". */
export async function writePost(page: Page, title = `A post ${Date.now()}`) {
  await page.goto("/posts/new");
  await page.getByRole("textbox", { name: "Title" }).fill(title);
  await page
    .getByRole("textbox", { name: "Content" })
    .fill("Written by a Playwright test, to check who may change it.");
  await page.getByRole("button", { name: "Publish post" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: title }),
  ).toBeVisible();
  const url = new URL(page.url()).pathname; // without ?toast=published
  return { title, url };
}

/**
 * Presses Tab until `target` has the keyboard focus, like a keyboard user would.
 * Fails if it takes more than `maxPresses` (the target can't be reached by keyboard).
 */
export async function tabTo(page: Page, target: Locator, maxPresses = 40) {
  await expect(target).toBeVisible(); // fail fast if it isn't on the page at all
  for (let presses = 0; presses < maxPresses; presses++) {
    if (await target.evaluate((element) => element === document.activeElement))
      return;
    await page.keyboard.press("Tab");
  }
  await expect(target, `not reachable with ${maxPresses} Tabs`).toBeFocused();
}
