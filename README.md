# root.solar

root.solar curates a living canon of operating principles so humans and autonomous agents can coordinate with shared intent across the solar system. Learn more about the vision in [docs/concept.md](docs/concept.md) and explore implementation patterns inside the [Center of Excellence](docs/coe/index.md).

## Documentation Shortcuts
- Consensus vision and backlog: [docs/visions](docs/visions), [docs/initiatives](docs/initiatives)
- Architecture and messaging playbooks: [docs/coe/architecture/distributed-architecture.md](docs/coe/architecture/distributed-architecture.md), [docs/coe/messaging/libp2p-nats-synergy.md](docs/coe/messaging/libp2p-nats-synergy.md)
- Usage and operations: [docs/usage.md](docs/usage.md)

## Quick Start (Podman)
1. Clone the repo:
   ```bash
   git clone https://github.com/<your-org>/root.solar.git
   cd root.solar
   ```
2. Build the image:
   ```bash
   podman build -t root-solar .
   ```
3. Create a persistent volume for SurrealKV data (optional but recommended):
   ```bash
   podman volume create root-solar-data
   ```
4. Launch the stack:
   ```bash
   podman run --rm -it \
     -p 3000:3000 \
     -v root-solar-data:/data \
     --name root-solar \
     root-solar
   ```
5. Visit `http://localhost:3000` and check health with `curl http://localhost:3000/health`.

## Usage Highlights
- Warm up with the [Usage Guide](docs/usage.md) for health checks, SurrealDB tips, and dev server commands.
- Sentiment data lives in SurrealDB; use the provided SQL snippets to inspect axioms and allocations.

## Architecture Snapshot
The project runs on three planes (consensus, coordination, persistence). Read the [Architecture Primer](docs/architecture.md) for a fast overview or jump deeper into the [distributed architecture reference](docs/coe/architecture/distributed-architecture.md).

## Starting Components Individually
- **Everything:** `mise run dev`
- **API only:** `mise run start`
- **Client only:** run `pnpm run dev:snb` (remote) alongside `pnpm run dev:shell` (host)
- **Container baseline:** `podman run root-solar` as shown above for production-style runs.

## Developing
- Coding conventions: [STYLEGUIDE.md](STYLEGUIDE.md)
- Contribution workflow: [CONTRIBUTING.md](CONTRIBUTING.md)
- Roadmap context: [docs/roadmap/horizon.md](docs/roadmap/horizon.md) and [docs/roadmap/epics](docs/roadmap/epics)
- Best practices: [docs/coe/best-practices/engineering-principles.md](docs/coe/best-practices/engineering-principles.md) and [docs/coe/index.md](docs/coe/index.md)
