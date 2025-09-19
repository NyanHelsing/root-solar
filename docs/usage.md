# Usage Guide

Once the application is running (either through Podman or local scripts), keep these routines handy:

## Readiness Checks
- API health: `curl http://localhost:3000/health`
- Web UI: open `http://localhost:3000/`

## Working With SurrealDB Data
- Open a shell: `pnpm dlx surrealdb sql --ns root-solar --db root-solar`
- Common queries:
  - List axioms: `SELECT * FROM axiom ORDER BY title;`
  - Inspect sentiments: `SELECT * FROM sentiment WHERE beingId = 'being:1';`

## Hot Reload Development Loop
- UI + API together: `mise run dev`
- API only: `mise run start`
- Client only: run `pnpm run dev:snb` for the remote and `pnpm run dev:shell` for the shell host
- Production remotes: shell assets serve from `/static/modules/shell/*`, and the SNB remote from `/static/modules/snb/*`. Override `SNB_REMOTE_URL` if you relocate the remote entry (default `/static/modules/snb`). Adjust `SHELL_HTML` if your host template uses a different filename (defaults to `index.html`).

## Observability Quick Wins
- Tail server logs: `pnpm start -- --inspect` (local dev)
- Watch sentiment ingest: check dashboards referenced in the [Observability Canon](docs/coe/best-practices/observability.md)

Refer back here before demos or production rollouts to ensure core flows are healthy.
