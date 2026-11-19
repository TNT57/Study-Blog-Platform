// Stored XSS (M7): an attacker writes a script into a post. It must never run for readers.
import { test } from "@playwright/test";

// TODO(you): Task 1 in docs/learn/07-xss.md.
// Replace the line inside with a real test: write a post that contains
// <img src=x onerror=alert(1)>, open it like a reader, and prove that no <img> appears
// and that alert(1) never opens a dialog.
test("an XSS attack in a post never runs (Task 1)", async () => {
  throw new Error("TODO(you): write this test (Task 1)");
});
