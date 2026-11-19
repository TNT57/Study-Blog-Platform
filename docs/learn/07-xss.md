# M7 — XSS: Markdown posts, rendered safely

> **Goal:** posts can use Markdown (**bold**, _italic_, `code`, lists, links), and no post can ever run code in
> a reader's browser.
>
> Metaphor: a **public notice board**. Anyone can pin a note. A note can say anything, but it must never be able to
> **do** anything: no note may open the readers' bags. XSS is a note that reaches out and opens bags.

## What is XSS?

**XSS** (cross-site scripting): an attacker gets **their JavaScript to run on our site**, in other people's browsers.
Once it runs there, it can act as the reader: read the page, change it, send requests as them, or show a fake
login form.

| Kind          | Where the attack lives                                | Example                                            |
| ------------- | ----------------------------------------------------- | -------------------------------------------------- |
| **Stored**    | Saved in our database, shown to every reader          | A post containing `<img src=x onerror=alert(1)>`   |
| **Reflected** | In a link, bounced straight back by the server        | `/search?q=<script>…</script>` printed on the page |
| **DOM-based** | Only in the browser, when our JavaScript misuses data | `element.innerHTML = location.hash`                |

A blog where users write posts is a classic target for **stored** XSS.

Why `<img src=x onerror=alert(1)>`? It has no `<script>` tag, so simple filters miss it. The image `x` fails to load,
so the browser runs the `onerror` code. `alert(1)` is only the harmless proof; a real attacker would send your data to
their server.

## What we built

- **Posts are Markdown now.** `src/components/post-markdown.tsx` shows them with **two locks**:
  1. **react-markdown** builds React elements, never one big HTML string. Raw HTML in a post is **removed**
     (`Hi <img onerror…> there` becomes `Hi there`), and dangerous links (`javascript:…`) lose their address.
  2. **rehype-sanitize** keeps only a safe list of elements and attributes (GitHub's list). If someone ever turns on
     raw HTML by mistake, this lock still holds.
  - Also: Markdown headings start at `<h2>` (the title is the only `<h1>`), links get `rel="nofollow ugc"`, and images
    are not allowed (they could load from any site to track readers, and we have no upload storage).
- **Excerpts** on the post list show plain words: `src/lib/markdown-text.ts` turns "**SQL** joins" into "SQL joins".
- **Security headers** for every page (`next.config.ts`): a **Content Security Policy**, plus `nosniff`, a referrer
  policy, a permissions policy, "no iframes" and "https only".
- **Tests:**
  - 7 attacks that must never produce anything that runs.
  - **The unsafe way**, so you can see it fail: `marked` + `dangerouslySetInnerHTML` lets the attack straight through.
  - Browser tests for the headers, and for "a script from another site is blocked".

**Note for old posts:** in Markdown, a single line break doesn't start a new line; an **empty line** starts a new
paragraph. Posts written as plain text with empty lines between paragraphs look the same as before.

## Key words

| Word                          | Simple meaning                                                       | Metaphor                                         |
| ----------------------------- | -------------------------------------------------------------------- | ------------------------------------------------ |
| **XSS**                       | An attacker's JavaScript runs on our site, in someone else's browser | A note on the board that opens readers' bags     |
| **Escaping**                  | Showing `<b>` as the characters `<b>`, not as bold                   | Putting the note behind glass: read, never touch |
| **Sanitizing**                | Removing every element and attribute that isn't on a safe list       | A guard who cuts off anything sharp from notes   |
| **`dangerouslySetInnerHTML`** | React's way to insert an HTML string. Its scary name is a warning    | Opening the glass case                           |
| **CSP**                       | A header that tells the browser what this site may load and run      | The building's rule: "no outside tools allowed"  |
| **Nonce**                     | A random code per page visit; only scripts with it may run           | Today's password for the staff door              |
| **Defense in depth**          | Several locks, so one mistake isn't a disaster                       | A locked door **and** a safe inside              |

## Why React already protects us (and when it doesn't)

React **escapes** everything you put in `{…}`: `{post.title}` with `<script>` in it shows the characters `<script>`,
it never runs. That's why plain-text posts (M2 to M6) were already safe.

The danger starts when you **turn text into HTML yourself**. The easy Markdown way is:

```tsx
// ❌ NEVER: the HTML string still contains the attacker's onerror=...
<div dangerouslySetInnerHTML={{ __html: marked.parse(post.content) }} />
```

Our test `tests/unit/markdown.test.tsx` → "the unsafe way" proves it: the string keeps `onerror=alert(1)`, and
injecting it creates a real `<img onerror>`. We also tried it in a real browser: **`alert(1)` ran.**

## The Content Security Policy: a trade-off we measured

A CSP is a second lock: even if HTML gets in, the browser refuses what isn't allowed. Next.js 16 offers three ways:

| Option                                      | Blocks inline attacks like `onerror=…`? | Price                                                                                                |
| ------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Nonces** (a new random code per visit)    | ✅ Yes                                  | **Every** page becomes dynamic: no fast static shells                                                |
| **Strict policy + SRI** (file fingerprints) | ✅ Would                                | **Broke our app**: we tested it, and 9 inline scripts were blocked, so the login form never appeared |
| **A fixed policy with `'unsafe-inline'`**   | ❌ No                                   | None: pages stay fast                                                                                |

Why did SRI break it? Next.js streams the parts of a page inside `<Suspense>` with small **inline** scripts. SRI only
fingerprints script **files**, so a strict policy blocks those inline scripts.

**Our choice: the fixed policy.** For a study blog with no payments, fast pages win. What it still blocks:

- scripts and styles from **other sites** (`<script src="https://evil.example/steal.js">`, which a browser test checks);
- **plugins** (`object-src 'none'`);
- **clickjacking**: no other site may show our pages in an iframe (`frame-ancestors 'none'`);
- **stolen forms**: forms can only send to us (`form-action 'self'`);
- `<base>` tricks that redirect our links.

What it **doesn't** block: an inline `onerror=…`. We tried the unsafe renderer with our policy on, and `alert(1)` ran.
So in our app, **safe rendering is the main lock**, and the CSP is the second one. A bank would pay for nonces.

## The journey of an attack

```mermaid
sequenceDiagram
  participant A as Attacker
  participant S as Our server
  participant DB as PostgreSQL
  participant R as Reader's browser
  A->>S: POST a post: "Hello! <img src=x onerror=alert(1)>"
  S->>DB: saved as TEXT (fine: text can't do anything in a database)
  R->>S: GET /posts/12
  S->>DB: read the text
  S->>S: react-markdown: raw HTML removed → "Hello!"; rehype-sanitize: safe list only
  S-->>R: <p>Hello!</p> + CSP header
  Note over R: Nothing to run. Even an injected <script src=evil> would be refused by the CSP.
```

We don't clean the text when **saving** it: we keep exactly what the user wrote, and make it safe when **showing**
it. Why? "Safe" depends on where the text goes (HTML, an email, JSON...). The rule: **escape or sanitize on output**.

## Run it yourself

```bash
pnpm dev
```

Write a post with this content, then open it:

```text
Learn **SQL** with _joins_ and `SELECT`.

- one
- two

Hello! <img src=x onerror=alert(1)> [click me](javascript:alert(2))
```

You see bold, italics, code and a list. No alert opens, there's no image, and "click me" is plain text.
Open DevTools → Network → the page → **Response Headers** to see `content-security-policy`.

## Your turn

### Task 1: the test that proves the attack never runs

In **`e2e/xss.spec.ts`**, replace the placeholder with this frame and fill in the **4 blanks** (`___`):

```ts
import { expect, test } from "@playwright/test";

import { registerNewUser, writePost } from "./helpers";

const ATTACK = "Hello! <img src=x onerror=alert(1)>";

test("an XSS attack in a post never runs (Task 1)", async ({ page }) => {
  // 1. A "spy": if the attack runs, alert(1) opens a dialog. We count dialogs.
  let dialogs = 0;
  page.on("dialog", async (dialog) => {
    dialogs += 1;
    await dialog.dismiss();
  });

  // 2. An attacker signs up and writes a post with the attack in it.
  await registerNewUser(page);
  const post = await writePost(page, "Totally safe post", ___);

  // 3. Open the post, like any reader would, and wait until everything has loaded.
  await page.goto(___);
  await page.waitForLoadState("networkidle");

  // 4. The words show, but there is no <img>, and no dialog ever opened.
  await expect(page.getByText("Hello!")).toBeVisible();
  await expect(page.locator("article img")).___;
  expect(dialogs).___;
});
```

Hints:

- `writePost(page, title, content)`: the content is the attack, and it already has a name at the top of the file.
- `post.url` is the post's address.
- "There are none" is `toHaveCount(0)` (like in M6). For a plain number, use `toBe(…)`.

```bash
pnpm test:e2e xss
```

**Then check that your test can fail:** in `src/components/post-markdown.tsx`, swap our component for the unsafe one
for a moment:

```tsx
import { marked } from "marked";

export function PostMarkdown({ content }: { content: string }) {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: marked.parse(content, { async: false }),
      }}
    />
  );
}
```

Your test must turn **red**: the `<img>` appears, and `alert(1)` runs. Then undo it with `git checkout src/components/post-markdown.tsx`.

### When it's green

```bash
pnpm check
```

```bash
git add e2e/xss.spec.ts
```

```bash
git commit -m "test(e2e): check that an XSS attack in a post never runs"
```

```bash
git push
```

## Common mistakes

- **`dangerouslySetInnerHTML` with user content.** The name is the warning. Use a renderer that builds elements.
- **A home-made filter** ("remove `<script>`"). Attackers have hundreds of ways around it (`onerror`, `javascript:`,
  `<svg onload>`, upper/lower case...). Use a tested sanitizer with a **safe list**, not a blocklist.
- **Sanitizing when saving instead of when showing.** Keep what the user wrote; make it safe for each place it goes.
- **"We have a CSP, so we're safe."** Ours allows inline scripts, so it can't stop `onerror=…`. Know what your
  policy blocks.
- **Forgetting links.** `[click](javascript:…)` is an attack too. react-markdown removes such addresses.

## Interview questions you can now answer

- **What is XSS, and what are its 3 kinds?** Attacker JavaScript running on your site in other users' browsers.
  Stored (saved in the database), reflected (bounced back from a link), DOM-based (in the browser's own code).
- **How does React protect against XSS?** It escapes values in `{…}`, so text is never turned into HTML. The holes are
  `dangerouslySetInnerHTML`, `javascript:` URLs, and code that writes `innerHTML` by hand.
- **How do you render user Markdown safely?** Build elements, not HTML strings (react-markdown), keep raw HTML off,
  and sanitize with a safe list (rehype-sanitize). Test it with real attacks.
- **What is a CSP, and what does it not do?** A header listing what the page may load and run: a second lock. With
  `'unsafe-inline'` it can't stop inline handlers; nonces can, but make every page dynamic in Next.js.
- **Sanitize on input or on output?** On output, for the place it goes. Store what the user wrote.
- **Why are `httpOnly` cookies important here (M3)?** Even if an XSS gets through, its JavaScript can't read the login
  cookie (`document.cookie` doesn't show it), so it can't steal the session.
