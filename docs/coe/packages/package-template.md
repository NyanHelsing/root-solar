# Package Template & Examples

Use this template when bootstrapping a new package in the root.solar workspace. It is tuned for TypeScript-first development with strict linting and portable builds.

## Directory Layout
```
packages/
  your-package/
    package.json
    tsconfig.json
    src/
      index.ts
      your-feature.ts
    tests/
      your-feature.test.ts
    README.md
    CHANGELOG.md
```

## `package.json`
```json
{
  "name": "@root-solar/your-package",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsup src/index.ts --dts",
    "lint": "eslint 'src/**/*.ts'",
    "test": "vitest run"
  },
  "dependencies": {},
  "devDependencies": {
    "tsup": "^7",
    "typescript": "^5"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

## `src/index.ts`
```ts
export * from "./your-feature.ts";
```

## `README.md` Skeleton
```
# @root-solar/your-package

## Purpose
Explain the problem the package solves and the type of consumer (app, agent, partner).

## Quick Start
```ts
import { doThing } from "@root-solar/your-package";

await doThing();
```

## API
Document exported functions, types, and configuration knobs.

## Testing
Outline how to run tests and any required environment variables.

## Changelog
Link to `CHANGELOG.md` and summarize major releases.
```

## Example Package Types
1. **Messaging Adapter** – `@root-solar/nats-bridge`
   - Wraps common publish/subscribe patterns with observability baked in.
   - Exposes `createPublisher()` and `createConsumer()` factories with default subjects and tracing hooks.
2. **Domain Orchestrator** – `@root-solar/credential-orchestrator`
   - Coordinates credential issuance flows across SurrealDB, NATS, and signature services.
   - Exports `issueCredential`, `revokeCredential`, and `loadCredentialHistory`.
3. **UI Primitives** – `@root-solar/consensus-chart`
   - Provides React components for sentiment heatmaps with theming tokens.
   - Ships ESM and CJS bundles for compatibility.

## Build & Publish Workflow
1. `pnpm install` – Ensure workspace dependencies are hoisted.
2. `pnpm --filter @root-solar/your-package build` – Produce dist artifacts.
3. `pnpm changeset` – Record semantic version bump if publishable outside the monorepo.
4. Merge PR with passing CI (`lint`, `build`, `test`).

## Quality Gates
- No default exports—favor named exports for tree-shaking clarity.
- All public APIs documented with TSDoc comments.
- Include example usage in tests to double as documentation.

## Linking From Packages to CoE
Add a `Resources` section in `README.md` referencing:
- Relevant CoE pages (architecture, messaging, best practices).
- ADRs that informed design decisions.

Consistency compounds. When every package starts with the same scaffolding, we spend creativity on problem solving instead of spelunking through divergent setups.
