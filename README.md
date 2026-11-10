# Study Blog Platform

[![CI](https://github.com/TNT57/Study-Blog-Platform/actions/workflows/ci.yml/badge.svg)](https://github.com/TNT57/Study-Blog-Platform/actions/workflows/ci.yml)

A study blog where students write about what they learn and track their focus time with a Pomodoro timer.

**Live:** <https://study-blog-platform.vercel.app>

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
| Auth            | Built by hand: Argon2id + database sessions                   |
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

You need **Node.js 24** (see `.nvmrc`) and **Docker Desktop** (for the local database).
pnpm comes with Node 24 through Corepack.
(Node 25 and later no longer include Corepack. There, run `npm install --global corepack` first.)

```bash
corepack enable
```

```bash
pnpm install
```

Copy the example settings (it has the right values for the Docker database):

```bash
cp .env.example .env.local
```

Start PostgreSQL, create the tables, and add demo data (one command runs `db:up`, `db:migrate` and `db:seed`):

```bash
pnpm db:setup
```

```bash
pnpm dev
```

Then open <http://localhost:3000>.

## Deploy

Vercel builds every push: `main` goes to production, and every pull request gets its own preview link.
The database is Neon PostgreSQL (added from the Vercel Marketplace), with a separate database branch for each preview.
The build command in `vercel.json` runs the migrations first, so a failed migration never goes live.
How it works: [`docs/learn/01b-deploy.md`](docs/learn/01b-deploy.md).

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
| `pnpm test`         | Run all tests once (needs the database running)         |
| `pnpm test:unit`    | Run only the fast unit tests (no database needed)       |
| `pnpm test:db`      | Run only the database tests                             |
| `pnpm test:e2e`     | Click through the app in a real browser (Playwright)    |
| `pnpm test:watch`   | Run the tests again every time you save a file          |
| `pnpm check`        | Run format check, lint, typecheck and tests in one step |
| `pnpm db:up`        | Start PostgreSQL in Docker (`db:down` stops it)         |
| `pnpm db:migrate`   | Run new migrations from `db/migrations/`                |
| `pnpm db:seed`      | Add a demo user and demo posts                          |
| `pnpm db:reset`     | Wipe the local database, then migrate and seed again    |
| `pnpm db:setup`     | Start PostgreSQL, create the tables, add the demo data  |
| `pnpm db:psql`      | Open a SQL prompt on the local database                 |

## Project structure

```
src/
├─ app/              Pages and routes (View)
├─ components/       PostCard, PostForm, skeletons, and ui/ from shadcn/ui (View)
├─ controllers/      Reads (*.queries.ts) and Server Actions (*.actions.ts) (Controller)
├─ models/           The only files with SQL (Model)
└─ lib/              Shared helpers: validation/, format.ts, env.ts, db.ts (pool), migrations.ts
db/migrations/       Numbered SQL files that build the database
scripts/             db:migrate, db:seed, db:reset
tests/unit/          Fast tests (no database)
tests/db/            Model and controller tests on a real PostgreSQL
e2e/                 Browser tests (Playwright)
docs/learn/          One learning note per milestone
docs/architecture.md   The MVC layers and their rules
docs/design-tokens.md  Design name → CSS variable → Tailwind class
.github/             CI workflow + Dependabot
docker-compose.yml   The local PostgreSQL 17
```

An ESLint rule keeps the MVC borders: a page can't import a model, and a model can't import Next.js.
See [`docs/architecture.md`](docs/architecture.md).

## Roadmap

- [x] **D** Design every screen in Claude Design
- [x] **M0** Project setup + CI
- [x] **M1** Database + models (PostgreSQL, raw SQL, migrations, Docker)
- [x] **M1b** First deploy (Vercel + Neon, a preview link for every PR)
- [x] **M2** Posts CRUD with MVC
- [x] **M3** Authentication (register, login, logout, sessions)
- [ ] **M4** Authorization (only the owner or an admin can edit)
- [ ] **M5** Pomodoro timer + study stats
- [ ] **M6** End-to-end tests + accessibility checks
- [ ] **M7** XSS lesson (Markdown, sanitizing, Content Security Policy)
- [ ] **M8** Refactor the Model layer to Drizzle ORM

## How we work

1. Make a branch, never commit straight to `main`. One branch per milestone, named after the
   Conventional Commit type, for example `feat/m3-auth` or `fix/login-redirect`. It is deleted after the merge.
2. Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/), for example `feat: add post list`. A Git hook checks this, and CI checks it again.
3. Before each commit, a hook formats and lints the changed files.
4. Open a pull request. CI must pass before merging. We squash merge, so the PR title must be a Conventional Commit too.
