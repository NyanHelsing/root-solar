# Packages Guidelines

This file applies to every workspace under `packages/`.

## Purpose
Workspace packages capture shareable capabilities. Aim for clear boundaries, typed contracts, and zero duplication with app-level glue.

## Structure
- Follow `packages/<name>/src` with an `index.ts` barrel exporting the public API.
- Keep runtime code separate from build scripts or tooling (`/scripts`, `/config`, etc.).
- Document peer dependencies and environment requirements in each package's `README.md`.

## Implementation Practices
- Favor composable functions or classes with explicit inputs/outputs. Avoid reaching into app internals.
- Centralize SurrealDB or network access in packages dedicated to those domains (`@root-solar/api`, `@root-solar/net`, etc.).
- Share UI primitives through packages instead of copying components across apps.
- Ensure packages stay framework-agnostic when possible; expose adapters for React or other runtimes separately.

## Testing
- Use the Node test runner (`pnpm test` or `pnpm --filter <pkg> test`) for unit coverage.
- Leverage Playwright only when browser behavior is essential; otherwise, mock boundaries.
- Keep fixtures lightweight and colocated under `tests/` or `__fixtures__/`.

## Release & Versioning
- Update CHANGELOG.md files when behavior changes or APIs evolve.
- Maintain semantic version accuracy if a package is published externally; otherwise, document breaking changes in the repo changelog or release notes.
