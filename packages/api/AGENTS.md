# @root-solar/api Guidelines

This guidance applies to everything inside `packages/api/`.

## Purpose
- Expose the canonical tRPC router used by servers and edge runtimes.
- Aggregate persistence, auth, and network models into a single request context so callers never reach directly into Surreal or libp2p.
- Provide lightweight Express bindings (`middleware`, `createContext`) without taking on full server concerns.

## Architectural Boundaries
- Keep routers and procedures framework-agnostic; only the `middleware.ts` file should touch Express types.
- Build all persistence through the model factories in `src/persistence/**`; avoid ad-hoc Surreal queries inside procedures.
- Use `createAppLogger` with descriptive tags for observability, and make sure logging middleware wraps every new procedure entry point.
- Extend the `Context` class instead of exporting loose helpers so the server package can reuse it unchanged.

## Implementation Practices
- Define inputs with `zod` schemas that enforce minimum lengths and structural constraints; never rely on client validation alone.
- Prefer small helpers (`createFooResolver`) that receive the request-scoped context rather than capturing global state.
- When sharing logic across procedures, extract composable utilities under `src/data/` or `src/net/` rather than duplicating code in the router.
- Update TypeScript exports in `src/index.ts` whenever you add new public helpers so other packages can consume them consistently.

## Testing & Tooling
- Add new unit tests under `src/**/__tests__` and run them with the Node test runner (`pnpm --filter @root-solar/api test`).
- For integration coverage, spin up an in-memory context via `new Context({ db: await getDb() })` and avoid hitting real network peers.
- Keep fixtures small and deterministic; tests should not mutate shared Surreal state outside isolated namespaces.
