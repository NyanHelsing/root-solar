# Repository Guidelines

## Project Structure & Module Organization
TypeScript sources live in `src/`. `src/server.ts` starts the Express/TRPC stack, while SurrealDB persistence stays under `src/api/persistence` (entities inside `entities/`, connection helpers in `db.ts`). Prefer feature directories in `src/features/*` that bundle component, hook, style, and client files—treat a feature like a full place setting so related pieces move together. Shared primitives (layout, typography, icons) belong in `src/ui/` or `src/styles/`. Static assets live in `assets/`, infrastructure in `infra/`, and RPC contracts in `root-solar/rpc/`.

## Build, Test, and Development Commands
- `mise run dev` (`pnpm rsbuild dev`): start RSBuild with hot reload.
- `mise run start` (`pnpm start`): run the production Express entry point on `PORT` (defaults to 3000).
- `pnpm dlx surrealdb sql --ns root-solar --db root-solar`: open an interactive Surreal shell against the embedded store.

## Coding Style & Naming Conventions
Use 2-space indentation, double-quoted strings, and terminating semicolons. Feature dirs should expose default React components in PascalCase files (`Axioms.tsx`) alongside matching SCSS modules (`Axioms.module.scss`) and colocated hooks/utilities (`useAxioms.ts`, `axioms.client.ts`). Keep exports tight—surface the main component plus a minimal API, and prefer named exports for helpers. Shared hooks may live in `src/hooks/` only when reused broadly. Leave Surreal query logic in repository helpers under `src/api/persistence` and pass plain functions into UI code.

## SurrealDB Usage
All persistence flows use the native Surreal driver via `surrealkv://root-solar`. Fetch a handle with `getDb()`, scope queries to the `root-solar` namespace/database, and wrap mutations in helpers such as `Axiom.find` or `Axiom.persist` to avoid raw SQL. Document new tables in `entities/` and ship seed helpers with schema changes.

## Testing Guidelines
Automated tests are not wired up yet; until Vitest or another harness lands, validate changes by running the dev server and exercising endpoints manually. Confirm the readiness probe with `curl http://localhost:3000/health`, verify TRPC procedures through the UI, and capture Surreal results in PR notes. New tests belong in `src/**/__tests__` with descriptive, kebab-cased filenames mirroring the module under test (`axiom-router.test.ts`).

## Commit & Pull Request Guidelines
Write concise, present-tense commit messages (history currently favors short imperatives such as “initial commit”). Keep commits scoped to one logical change and bundle schema or seed updates with the code that requires them. PRs should describe user-facing impact, list manual verification steps, link to tracking issues, attach screenshots or terminal captures for UI/API changes, and call out follow-up tasks explicitly.
