# root.solar Center of Excellence

Welcome to the root.solar Center of Excellence (CoE)—a living field guide for builders who see distributed systems as civic infrastructure. This space curates the shared practices, architectural patterns, and playbooks that keep our constellation aligned while inviting experimentation. Treat it as both a compass and a console: a place to understand why we make the decisions we do, and a toolkit for evolving those decisions responsibly.

## How to Navigate
- **Distributed Architecture** → Start with [the architecture overview](architecture/distributed-architecture.md) to understand the planes of computation, coordination, and storage that power root.solar.
- **Messaging Fabric** → Explore [libp2p patterns](messaging/libp2p.md), [NATS responsibilities](messaging/nats.md), and [their joint orchestration](messaging/libp2p-nats-synergy.md) to design resilient flows.
- **Package Craftsmanship** → Consult [package guidelines](packages/package-guidelines.md), [vertical vs. horizontal splitting heuristics](packages/vertical-vs-horizontal.md), and the [starter template](packages/package-template.md) before shipping new capabilities.
- **Engineering Lore** → Revisit the [best practices playbook](best-practices/engineering-principles.md) and [observability canon](best-practices/observability.md) whenever you are shaping an initiative.

## Intentional Principles
1. **Signals over noise** – Every guideline here is grounded in lessons from building consensus systems under load; if a practice ever becomes ritual without value, raise the flag.
2. **Composable autonomy** – Teams can move independently when interfaces are crisp. The CoE exists to keep those interfaces discoverable and consistent.
3. **Document the why** – Code changes tell us *what*; this CoE captures *why* so future contributors can extend the system without recapitulating historical debates.

## How to Contribute
- Open a doc PR when you discover a pattern others should repeat—or a pitfall we should avoid.
- Add architecture decision records (ADRs) in initiative folders and link them back here under the relevant section.
- Ping `#root-solar-coe` before major structural edits so we can coordinate review and knowledge sharing.

Let this CoE be the place where Alan’s brand of optimistic pragmatism thrives: rigorous enough for production, generous enough to invite new stewards, and bold enough to keep pushing the frontier of distributed consensus.
