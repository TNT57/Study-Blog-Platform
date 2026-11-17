// Accessibility (a11y) checks: can everyone use the app, also with a screen reader or a keyboard?
//
// 1. axe (by Deque) scans each page for problems a machine can find: missing labels, low
//    contrast, broken ARIA, headings out of order... against the WCAG 2.2 AA rules.
// 2. A keyboard-only journey: things axe can't see, like "can I reach this button with Tab?".
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

import {
  logOut,
  PASSWORD,
  passwordBox,
  registerNewUser,
  tabTo,
  writePost,
} from "./helpers";

const WCAG_RULES = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/** Scans the page as it is now. On failure, the message lists each problem and where it is. */
async function expectNoA11yProblems(page: Page, what: string) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(WCAG_RULES)
    .analyze();
  const problems = violations.map(
    (v) =>
      `${v.impact}: ${v.help} (${v.id}) at ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
  );
  expect(problems, `accessibility problems on: ${what}`).toEqual([]);
}

const sizes = [
  { name: "desktop", viewport: { width: 1280, height: 900 } },
  { name: "phone", viewport: { width: 390, height: 844 } },
];

for (const size of sizes) {
  test.describe(`on a ${size.name}`, () => {
    test.use({ viewport: size.viewport });

    test("pages for visitors have no accessibility problems", async ({
      page,
    }) => {
      await page.goto("/");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expectNoA11yProblems(page, "home");

      if (size.name === "phone") {
        await page.getByLabel("Menu").click();
        await expectNoA11yProblems(page, "the phone menu, open");
      }

      await page.goto("/login");
      await page
        .getByRole("textbox", { name: "Email" })
        .fill("nobody@example.com");
      await passwordBox(page).fill("not the password");
      await page.getByRole("button", { name: "Log in" }).click();
      await expect(
        page.getByRole("alert").filter({ hasText: "incorrect" }),
      ).toBeVisible();
      await expectNoA11yProblems(page, "login, with an error");

      await page.goto("/register");
      await expect(
        page.getByRole("button", { name: "Create account" }),
      ).toBeVisible();
      await expectNoA11yProblems(page, "register");

      await page.goto("/no-such-page");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expectNoA11yProblems(page, "404");
    });

    test("pages for members have no accessibility problems", async ({
      page,
    }) => {
      await registerNewUser(page);

      await page.goto("/posts/new");
      await page.getByRole("textbox", { name: "Title" }).fill("   ");
      await page.getByRole("textbox", { name: "Content" }).fill("short");
      await page.getByRole("button", { name: "Publish post" }).click();
      await expect(
        page.getByRole("alert").filter({ hasText: "Please fix" }),
      ).toBeVisible();
      await expectNoA11yProblems(page, "new post, with errors");

      const post = await writePost(page);
      await expectNoA11yProblems(page, "a post, by its author, with a toast");

      await page.getByRole("button", { name: "Delete", exact: true }).click();
      await expect(page.getByRole("alertdialog")).toBeVisible();
      await expectNoA11yProblems(page, "the delete dialog");
      await page.keyboard.press("Escape");

      await page.goto(`${post.url}/edit`);
      await expect(
        page.getByRole("button", { name: "Save changes" }),
      ).toBeVisible();
      await expectNoA11yProblems(page, "edit post");

      await page.goto("/study");
      await expect(page.getByRole("timer")).toBeVisible();
      await expect(
        page.getByRole("region", { name: "Your stats" }),
      ).toBeVisible();
      await expectNoA11yProblems(page, "study");

      await page.getByRole("button", { name: /settings/i }).click();
      await expect(
        page.getByRole("dialog", { name: "Timer settings" }),
      ).toBeVisible();
      await expectNoA11yProblems(page, "study, timer settings");
      await page.keyboard.press("Escape");

      // Someone else's post: the 403 page.
      await logOut(page);
      await registerNewUser(page);
      await page.goto(`${post.url}/edit`);
      await expect(
        page.getByRole("heading", { name: "You can’t change this post" }),
      ).toBeVisible();
      await expectNoA11yProblems(page, "403");
    });
  });
}

test("you can sign up, write and use the timer with only a keyboard", async ({
  page,
}) => {
  await page.goto("/register");

  // The first Tab shows the skip link, so keyboard users can jump over the menu.
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();

  // Sign up: Tab to each field, type, and press Enter to send the form.
  const username = `kb_${Date.now().toString(36)}`;
  await tabTo(page, page.getByRole("textbox", { name: "Username" }));
  await page.keyboard.type(username);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("textbox", { name: "Email" })).toBeFocused();
  await page.keyboard.type(`${username}@example.com`);
  await page.keyboard.press("Tab");
  await expect(passwordBox(page)).toBeFocused();
  await page.keyboard.type(PASSWORD);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText("Welcome!");

  // Write a post: the menu link, then the form, all with Tab and Enter.
  await tabTo(page, page.getByRole("link", { name: "New post" }));
  await page.keyboard.press("Enter");
  await tabTo(page, page.getByRole("textbox", { name: "Title" }));
  await page.keyboard.type("Written with a keyboard");
  await page.keyboard.press("Tab");
  await page.keyboard.type("No mouse was used to write this post.");
  await tabTo(page, page.getByRole("button", { name: "Publish post" }));
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { level: 1, name: "Written with a keyboard" }),
  ).toBeVisible();

  // The timer settings: open with Enter, close with Escape, and the focus comes back.
  await page.goto("/study");
  const settings = page.getByRole("button", { name: /settings/i });
  await tabTo(page, settings);
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Timer settings" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("spinbutton", { name: "Focus" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(settings).toBeFocused();
});
