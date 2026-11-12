import { expect, test } from "@playwright/test";

import { registerNewUser } from "./helpers";

// Playwright's fake clock: we move time forward ourselves, so a 25-minute round takes a second.
test("a finished focus round is saved and shows in the stats", async ({
  page,
}) => {
  await page.clock.install();
  await registerNewUser(page);
  await page.getByRole("link", { name: "Study", exact: true }).click();

  const timer = page.getByRole("timer");
  // Green after Task 1 (docs/learn/05-pomodoro.md): until then it shows "1500".
  await expect(timer).toHaveText("25:00");
  await expect(page.getByText("No focus rounds yet")).toBeVisible();

  await page
    .getByRole("textbox", { name: /What are you studying/ })
    .fill("SQL joins");
  await page.getByRole("button", { name: "Start" }).click();
  await page.clock.runFor(60_000);
  await expect(timer).toHaveText("24:00");
  await expect(page).toHaveTitle("24:00 Focus · Study Blog");

  await page.clock.runFor(24 * 60_000 + 500);
  await expect(
    page.getByRole("status").filter({ hasText: "Saved:" }),
  ).toHaveText("Saved: 25 min on “SQL joins”. Time for a short break.");
  await expect(page).toHaveTitle("Break time! · Study Blog");
  await expect(timer).toHaveText("05:00");

  // The stats were read again after the save (refresh() in the Server Action).
  const stats = page.getByRole("region", { name: "Your stats" });
  // Green after Task 2: "minutes today" comes from your SQL.
  await expect(stats.getByText("1 of 4 pomodoros (goal)")).toBeVisible();
  await expect(
    stats.getByRole("img", { name: /Focus minutes per day/ }),
  ).toHaveAccessibleName(/today 25$/);
  await expect(stats.getByText("SQL joins")).toBeVisible();
});

test("the study page needs a login", async ({ page }) => {
  await page.goto("/study");
  await expect(page).toHaveURL(/\/login\?next=%2Fstudy/);
});
