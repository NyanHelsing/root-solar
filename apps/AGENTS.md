# Apps Guidelines

This file applies to everything under `apps/`.

## Purpose
Applications should stay as thin as possible—ideally wiring together rsbuild configs, routes, and host/remote integration with minimal bespoke logic. Domain behavior belongs in workspace packages so it can be shared and tested centrally.

## Preferred Patterns
- Compose UI and data flows from published packages (for example `@root-solar/server`, `@root-solar/api`, or app-specific packages under `packages/`).
- If a feature feels reusable or complex, factor it into a package before exposing it through an app shell.
- Keep rsbuild configuration colocated in each app (`rsbuild.config.ts` derivatives) and document any overrides inline.
- Avoid duplicating environment or runtime setup that already exists in packages—re-export helpers instead.

## Testing & Tooling
- Use rsbuild-driven dev servers; do not introduce Vite/Vitest.
- For UI smoke tests, rely on Playwright or contract tests that exercise the compiled app from the outside. Keep local assertions in packages using the Node test runner.

## File Organization
- Co-locate entrypoints (`main.tsx`, `bootstrap.ts`, etc.) with minimal glue code and prefer importing shared styles/assets from packages.
- Store app-specific assets in `assets/` or a sibling package when they are shared between apps.
