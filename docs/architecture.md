# Architecture Primer

root.solar runs on a three-plane architecture:

1. **Consensus Plane** – React + TRPC capture human intent and expose typed APIs.
2. **Coordination Plane** – libp2p and NATS choreograph agent collaboration, command dispatch, and telemetry.
3. **Persistence Plane** – SurrealDB anchors axioms, beings, and sentiments while analytics sinks transform change streams into insight.

Dive deeper in the [Distributed Architecture Overview](docs/coe/architecture/distributed-architecture.md) for topology diagrams, service taxonomy, and ADR guidance.
