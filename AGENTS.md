# Repository Guidelines

## Project Overview
root.solar curates a living canon of operating principles so humans and autonomous agents can coordinate with shared intent. Start with:
- Concept & vision: `docs/concept.md`, `docs/visions/`
- Center of Excellence (architecture, messaging, packages, engineering playbooks): `docs/coe/index.md`
- Roadmap & initiatives: `docs/roadmap/`, `docs/initiatives/`
- Usage quick wins: `docs/usage.md`

See `README.md` for cloning instructions, Podman quick start, component-specific commands, and development resources.

## Project Structure & Module Organization
TypeScript sources live in `src/`. `src/server.ts` boots the Express API and wires TRPC middleware from `src/api/`, while React UI modules sit alongside styling in `.tsx` and `.module.scss` pairs. Helpers sit in `src/data` and `src/data-providers`. SurrealDB persistence lives in `src/api/persistence`, with entity models under `entities/` and connection helpers in `db.ts`. Static assets go in `assets/`, automation in `infra/`, and `root-solar/rpc/` holds RPC contracts. Workspace packages live under `packages/` (for example, `@root-solar/observability`, `@root-solar/auth`).

## Build, Test, and Development Commands
- `mise run dev` (alias: `pnpm rsbuild dev`): launches the RSBuild dev server with React reloading.
- `mise run start` (alias: `pnpm start`): runs the production Express entry point on `PORT` (defaults to 3000).
- `pnpm dlx surrealdb sql --ns root-solar --db root-solar`: open an interactive Surreal shell against the embedded SurrealKV store for data inspection.
- Package-specific tests: `pnpm --filter <package-name> test` (for example, `@root-solar/auth`).

## Coding Style & Naming Conventions
Follow TypeScript strictness and keep 2-space indentation, double-quoted strings, and terminating semicolons to match existing files. React components live in PascalCase files (`Main.tsx`, `Hero.tsx`) exporting the component as default to support `React.lazy`, with matching SCSS modules (`Hero.module.scss`). Co-locate hooks and utilities next to the features that consume them. For workspace packages, follow `packages/your-package/src` layout with named exports from `src/index.ts`. Keep Surreal queries encapsulated inside repository helpers under `src/api/persistence`.

## SurrealDB Usage
All persistence flows use the native Surreal driver via `surrealkv://root-solar`, so development runs without an external daemon. Fetch a database handle with `getDb()` and scope queries to the `root-solar` namespace/database. Wrap mutations in reusable functions (for example, `Axiom.find` / `Axiom.persist`) so callers avoid raw query strings. When you need new tables or relations, document the schema in `entities/` and include a helper to seed representative data.

## Testing Guidelines
Automated tests are gradually coming online. Until a Vitest harness lands, validate changes by running the dev server and exercising endpoints manually. Confirm the readiness probe with `curl http://localhost:3000/health` and verify new Surreal queries through TRPC before submitting changes. When adding tests, group them under `src/**/__tests__` or inside package-specific `tests/` folders (e.g., `packages/auth/tests/`).

## Commit & Pull Request Guidelines
Commits should be concise, present-tense summaries (the history currently uses short imperative lines such as “initial commit”). Scope each commit to one logical change and include schema or seed updates alongside related code. PRs must describe the user-facing impact, list manual verification steps, link to tracking issues, and attach screenshots or terminal captures when UI or API responses change. Call out follow-up tasks explicitly.
