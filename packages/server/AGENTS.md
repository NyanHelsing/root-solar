# @root-solar/server Guidelines

This file governs everything in `packages/server/`.

## Purpose
- Compose the production HTTP server that exposes the API router, static frontend, and libp2p sentiment network.
- Provide lifecycle helpers (`startServer`, `createNetwork`, `shutdownNetwork`) that applications and CLIs can call.
- Reflect runtime state back into `@root-solar/net/status` so observers can understand readiness.

## Design Principles
- Keep Express wiring thin: mount the API middleware, health checks, and frontend assets without duplicating business logic.
- Always acquire application resources through the API `Context`; do not instantiate Surreal clients or models directly here.
- Treat libp2p peers and other network services as managed resources—pair every initializer with a shutdown path.
- Use `createAppLogger` for structured logging and include tags (`startup`, `network`, `frontend`, etc.) to aid filtering.

## Implementation Practices
- Add new configuration surfaces to `config.ts` with sane defaults and keep environment parsing centralized there.
- When extending server startup, compose additional steps inside `startServer` in the order: context → network → app → frontend → listen.
- Ensure shutdown remains idempotent; guard against double invocation and catch errors so we never leave resources dangling.
- Export any new lifecycle helpers from `src/index.ts` so other packages can import stable entry points.

## Testing & Operations
- Exercise new behavior with the Node test runner (`pnpm --filter @root-solar/server test`) and mock libp2p when possible.
- Verify health endpoints and readiness state locally with `curl http://localhost:3000/health` after changes to routing or middleware.
- Document manual operational steps (signals, environment toggles) in the package README when you introduce them.
