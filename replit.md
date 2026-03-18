# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains a **穴埋め問題（Fill-in-the-blank Quiz）システム** — a web app for creating and practicing fill-in-the-blank questions.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite, TanStack Query, Framer Motion, react-hook-form

## Features

- **Question registration**: Users type question text with `{{answer}}` placeholders marking blank spots. The content inside `{{}}` is the correct answer.
- **Fill-in-the-blank quiz**: Each blank becomes an input field; all blanks must be correct (complete answer) to count as correct.
- **Two quiz modes**: All questions randomly, or wrong-answers-only randomly.
- **Per-question stats**: totalAttempts, correctAttempts, hasWrongAttempt tracking.
- **Session summary**: Shows correct/total at the end of each quiz session.

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── quiz-app/           # React + Vite frontend (served at /)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/quiz-app` (`@workspace/quiz-app`)

React + Vite frontend. Routes:
- `/` — Home/question list, stats, quiz mode buttons
- `/questions/new` — Create new question
- `/questions/:id/edit` — Edit question
- `/quiz?mode=all` — Quiz mode (all questions)
- `/quiz?mode=wrong` — Quiz mode (wrong-only)

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers
  - `health.ts` — GET /healthz
  - `questions.ts` — CRUD for questions, attempt submission, stats
- Depends on: `@workspace/db`, `@workspace/api-zod`

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/schema/questions.ts` — `questionsTable` with columns: id, title, text, totalAttempts, correctAttempts, hasWrongAttempt, createdAt

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec. Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec.

### `scripts` (`@workspace/scripts`)

Utility scripts package.

## Question Format

Questions use `{{answer}}` placeholders in the text field where the content inside the braces is the correct answer. For example:
- `日本の首都は{{東京}}です。` → blank at "東京", correct answer is "東京"
- `水の化学式は{{H2O}}で、密度は{{1.0}}g/cm³です。` → two blanks
