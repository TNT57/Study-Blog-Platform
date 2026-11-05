# Study Blog Platform

A study blog where students write about what they learn and track their focus time with a Pomodoro timer.

This is a **learning project**. The goal is to practise real Software Engineering skills:
MVC architecture, authentication and authorization, databases (raw SQL first, then an ORM),
security (XSS), testing, CI/CD and a design-first workflow.

Each milestone is one pull request with a short learning note in [`docs/learn/`](docs/learn).

## Tech stack

| Area            | Tool                                                          |
| --------------- | ------------------------------------------------------------- |
| Runtime         | Node.js 24 LTS                                                |
| Framework       | Next.js 16 (App Router) + React 19 + TypeScript               |
| UI              | Tailwind CSS v4 + shadcn/ui (Base UI)                         |
| Design          | Claude Design canvas (style guide + every screen)             |
| Database        | PostgreSQL 17 (from M1): raw SQL with `pg`, Drizzle ORM in M8 |
| Auth            | Built by hand: Argon2id + database sessions (from M3)         |
| Tests           | Vitest + Testing Library, Playwright (from M2)                |
| Code quality    | ESLint, Prettier, Husky + lint-staged, Conventional Commits   |
| CI / CD         | GitHub Actions, Dependabot, Vercel + Neon (from M1)           |
| Package manager | pnpm 11                                                       |

## Design

Every screen is designed first on a [Claude Design canvas](https://claude.ai/artifact/5yqJ2ZRvBvbeVYDgq4ccMC)
(private to the owner): style guide, post list, post detail, editor, login, register, Study page, error states and phone layouts.
The colors, fonts, text sizes and radius in `src/app/globals.css` come from its style guide.
[`docs/design-tokens.md`](docs/design-tokens.md) maps each design name to its CSS variable and Tailwind class.

## Getting started

You need **Node.js 24** (see `.nvmrc`). pnpm comes with Node 24 through Corepack.
(Node 25 and later no longer include Corepack. There, run `npm install --global corepack` first.)

```bash
corepack enable
```

```bash
pnpm install
```

```bash
pnpm dev
```

Then open <http://localhost:3000>.

## Scripts

| Command             | What it does                                            |
| ------------------- | ------------------------------------------------------- |
| `pnpm dev`          | Start the app in development mode (auto-reloads)        |
| `pnpm build`        | Build the app for production                            |
| `pnpm start`        | Run the production build                                |
| `pnpm lint`         | Find code problems with ESLint (fails on any warning)   |
| `pnpm format`       | Format all files with Prettier                          |
| `pnpm format:check` | Check formatting without changing files (used by CI)    |
| `pnpm typecheck`    | Check TypeScript types                                  |
| `pnpm test`         | Run the tests once                                      |
| `pnpm test:watch`   | Run the tests again every time you save a file          |
| `pnpm check`        | Run format check, lint, typecheck and tests in one step |

## Project structure

```
src/
├─ app/              Pages and routes (View)
├─ components/ui/    Reusable UI pieces from shadcn/ui (View)
└─ lib/              Shared helpers
tests/               Vitest tests
docs/learn/          One learning note per milestone
docs/design-tokens.md  Design name → CSS variable → Tailwind class
.github/             CI workflow + Dependabot
```

The `controllers/` and `models/` folders arrive in Milestones 1–2 (MVC).

## Roadmap

- [ ] **D** Design every screen in Claude Design (in review: you approve it before M2)
- [x] **M0** Project setup + CI
- [ ] **M1** Database + models (PostgreSQL, raw SQL, migrations, Docker) + first deploy
- [ ] **M2** Posts CRUD with MVC
- [ ] **M3** Authentication (register, login, logout, sessions)
- [ ] **M4** Authorization (only the owner or an admin can edit)
- [ ] **M5** Pomodoro timer + study stats
- [ ] **M6** End-to-end tests + accessibility checks
- [ ] **M7** XSS lesson (Markdown, sanitizing, Content Security Policy)
- [ ] **M8** Refactor the Model layer to Drizzle ORM

## How we work

1. Make a branch, never commit straight to `main`.
2. Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/), for example `feat: add post list`. A Git hook checks this, and CI checks it again.
3. Before each commit, a hook formats and lints the changed files.
4. Open a pull request. CI must pass before merging. We squash merge, so the PR title must be a Conventional Commit too.
