// The security headers (next.config.ts) and the Content Security Policy, in a real browser.
import { expect, test } from "@playwright/test";

import { registerNewUser } from "./helpers";

test("every page is sent with the security headers", async ({ page }) => {
  const response = await page.goto("/");
  const headers = response!.headers();

  const csp = headers["content-security-policy"];
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("object-src 'none'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("form-action 'self'");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
});

test("the policy blocks scripts from other sites, and our own app still works", async ({
  page,
}) => {
  const blocked: string[] = [];
  page.on("console", (message) => {
    if (message.text().includes("Content Security Policy")) {
      blocked.push(message.text());
    }
  });

  // Our own pages, including the parts that stream in: nothing of ours is blocked.
  await registerNewUser(page);
  await page.goto("/study");
  await expect(page.getByRole("timer")).toBeVisible();
  expect(blocked).toEqual([]);

  // A script from another site (what an attacker would inject) is refused by the browser.
  await page.evaluate(() => {
    const script = document.createElement("script");
    script.src = "https://evil.example/steal.js";
    document.body.append(script);
  });
  await expect.poll(() => blocked.length).toBeGreaterThan(0);
  expect(blocked[0]).toContain("evil.example");
});
