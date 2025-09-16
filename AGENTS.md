# Repository Guidelines

## Project Structure & Module Organization
TypeScript sources live in `src/`. `src/server.ts` boots the Express API and wires TRPC middleware from `src/api/`, while React UI modules sit alongside styling in `.tsx` and `.module.scss` pairs. Helpers sit in `src/data` and `src/data-providers`. SurrealDB persistence lives in `src/api/persistence`, with entity models under `entities/` and connection helpers in `db.ts`. Static assets go in `assets/`, automation in `infra/`, and `root-solar/rpc/` holds RPC contracts.

## Build, Test, and Development Commands
- `mise run dev` (alias: `pnpm rsbuild dev`): launches the RSBuild dev server with React reloading.
- `mise run start` (alias: `pnpm start`): runs the production Express entry point on `PORT` (defaults to 3000).
- `pnpm dlx surrealdb sql --ns root-solar --db root-solar`: open an interactive Surreal shell against the embedded SurrealKV store for data inspection.

## Coding Style & Naming Conventions
Follow TypeScript strictness and keep 2-space indentation, double-quoted strings, and terminating semicolons to match existing files. React components should live in PascalCase files (`Main.tsx`, `Hero.tsx`) the export the component as default to support React.lazy, with matching SCSS modules (`Hero.module.scss`). Co-locate hooks and utilities next to the features that consume them, with kebab-cased filename, for kebab-cased file, prefer named exports. Keep Surreal queries encapsulated inside repository helpers under `src/api/persistence`.

## SurrealDB Usage
All persistence flows use the native Surreal driver via `surrealkv://root-solar`, so development runs without an external daemon. Fetch a database handle with `getDb()` and scope queries to the `root-solar` namespace/database. Wrap mutations in reusable functions (for example, `Axiom.find` / `Axiom.persist`) so callers avoid raw query strings. When you need new tables or relations, document the schema in `entities/` and include a helper to seed representative data.

## Testing Guidelines
Automated tests are not yet wired up; until a Vitest harness lands, validate changes by running the dev server and exercising endpoints manually. Confirm the readiness probe with `curl http://localhost:3000/health` and verify new Surreal queries through TRPC before submitting changes. When adding tests, group them under `src/**/__tests__` and adopt descriptive, kebab-cased filenames mirroring the module under test (for example, `axiom-router.test.ts`).

## Commit & Pull Request Guidelines
Commits should be concise, present-tense summaries (the history currently uses short imperative lines such as “initial commit”). Scope each commit to one logical change and include schema or seed updates alongside related code. PRs must describe the user-facing impact, list manual verification steps, link to tracking issues, and attach screenshots or terminal captures when UI or API responses change. Call out follow-up tasks explicitly.
