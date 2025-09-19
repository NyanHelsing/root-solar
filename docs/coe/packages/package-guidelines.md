# Package Guidelines

Packages are the way we encapsulate reusable capabilities across the root.solar workspace. Whether you are shaping a new persistence adapter, a network bridge, or a UI primitive, follow these guidelines to keep the ecosystem elegant and maintainable.

## Package Taxonomy
- **Domain Packages** (`packages/axioms`, `packages/credentials`)
  - Export domain logic, DTOs, and policy evaluators consumed by multiple services.
- **Infrastructure Packages** (`packages/messaging`, `packages/observability`)
  - Provide adapters for libp2p, NATS, SurrealDB, or shared telemetry tooling.
- **Interface Packages** (`packages/ui`, `packages/design-tokens`)
  - Supply cross-app React components, hooks, and styling tokens.

## Naming & Structure
```
packages/
  name-of-package/
    src/
      index.ts
      feature-a/
      feature-b/
    tests/
    package.json
    README.md
```
- Use kebab-case for package directory names.
- Export a single entry-point (`src/index.ts`) that re-exports public APIs.
- Co-locate tests under `tests/` using the same folder structure as `src/`.

## Versioning
- Rely on workspace semver; bump minor versions for additive changes, major for breaking APIs.
- Document release notes in `CHANGELOG.md` and link to ADRs when the change alters behavior or contracts.

## Quality Bars
- **Static Analysis**: `pnpm lint packages/<name>` must pass (TypeScript strict + ESLint).
- **Contract Tests**: Provide consumer-driven tests when packages interface with external systems (libp2p, NATS, SurrealDB).
- **Documentation**: Keep `README.md` lean but informative—purpose, quick start, API reference, and integration examples.

## When to Create a New Package
- Multiple initiatives require the same functionality with different release cadences than the main app.
- The code needs to run in more than one runtime (browser, Node, edge) and bundling it into a feature module would force heavy dependencies.
- You are publishing an SDK or integration surface for partners.

## When to Avoid New Packages
- The logic is tightly coupled to a single feature view or request handler.
- You cannot articulate a clear API surface separate from existing modules.
- Creating the package would introduce premature abstraction (YAGNI). Start with feature-level code and refactor when duplication emerges.

## Decision Workflow
1. Draft a one-pager: purpose, consumers, API sketch, testing plan.
2. Share in `#root-solar-coe` and tag relevant stewards (architecture, security, DX).
3. Align on ownership (which team maintains the package) before merging boilerplate.

Treat packages as civic modules: they should make everyone faster, safer, and more expressive. If a package becomes a drag, evolve it or retire it—do not let friction settle in.
