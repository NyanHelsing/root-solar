# Distributed Architecture Overview

root.solar operates as a layered mesh that balances human-coordinated governance with autonomous execution. The intent is to let principles flow freely while guaranteeing that every action can be traced back to the axioms that authorized it. This page is your macro-level map before you dive into specific messaging or package patterns.

## Planes of the System
1. **Consensus Plane (Application Layer)**
   - React + TRPC compose the human-facing consensus surface and client APIs.
   - Jotai-powered state stores keep client sentiment interactions idempotent and replayable.
   - Feature packages follow a domain-first structure (`src/features/*`) with co-located stores, components, and tests.
2. **Coordination Plane (Messaging & Control)**
   - libp2p handles peer discovery, secure channels, and long-lived agent-to-agent coordination.
   - NATS provides low-latency command and telemetry delivery for services that prefer centralized observability and policy enforcement.
   - TRPC server bridges user intents into persistence and messaging flows, ensuring payload validation via Zod before hitting distributed edges.
3. **Persistence Plane (SurrealDB & Ledgering)**
   - SurrealDB operates as our graph-relational hybrid for axioms, beings, sentiments, credentials, and cohort metadata.
   - Columnar analytics stores (e.g., DuckDB/ClickHouse) sink change events for time-series insight generation.
   - Credential and provenance ledgers layer on top with signed artefacts to preserve trust boundaries.

## Tenets for Architectural Decisions
- **Composability first** – Prefer protocols and packages that can be recombined without bespoke glue code. If an integration demands exotic adapters, reassess boundaries.
- **Fail loudly, recover fast** – Build everything with instrumented failure paths. Coordinated consensus without transparent failure modes erodes trust faster than downtime.
- **Edge-of-network empathy** – Assume some beings or agents run in constrained environments. Architect flows so low-bandwidth participants remain first-class citizens.

## Service Classification
| Classification | Example Responsibilities | Recommended Tech |
| --- | --- | --- |
| **Interaction Services** | React client, TRPC router, webhooks | React, TRPC, Express, Zod |
| **Decision Services** | Guardrail engine, simulation models | TypeScript, Rust (FFI), deterministic schedulers |
| **Observability Services** | Sentiment ingest, analytics pipelines | Node.js workers, DuckDB/ClickHouse, OpenTelemetry |
| **Federation Edges** | Schema negotiation, sync fabric | libp2p, NATS JetStream, signature services |

## Package Placement Heuristics
- If the package will live with HTTP lifecycle concerns, keep it under `src/server` or `src/features` depending on exposure.
- Messaging or streaming adapters belong under `src/net` or a dedicated workspace package (`packages/*`) when reused across multiple surfaces.
- Persistence models and repositories live in the `@root-solar/api` workspace package (`packages/api/src/persistence`), with shared entity definitions exported via `entities/index.ts`.

## Reference Topology
```
┌────────────────────┐          ┌─────────────────────┐
│  React Consensus   │          │  Partner Integrations│
│  (TRPC client)     │          │  (Webhook, SDK)      │
└────────┬───────────┘          └─────────┬───────────┘
         │                                  │
         ▼                                  ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│  TRPC Router & Policies │────▶│  NATS Control Plane     │
└────────┬────────────────┘     └─────────┬──────────────┘
         │                                  │
         ▼                                  ▼
┌────────────────────────┐       ┌────────────────────────┐
│  SurrealDB Persistence │◀──────│  libp2p Agent Mesh     │
└────────┬───────────────┘       └─────────┬─────────────┘
         │                                  │
         ▼                                  ▼
┌────────────────────────┐       ┌────────────────────────┐
│  Analytics Pipelines   │       │  Federation Edge Nodes │
└────────────────────────┘       └────────────────────────┘
```

## When to Propose an ADR
- Introducing a new persistence technology, messaging protocol, or distributed runtime.
- Changing the contract between the coordination plane (libp2p/NATS) and application plane (TRPC, React).
- Splitting or merging workspace packages that affect more than one initiative.

Keep this overview close when designing new capabilities. If your proposal cannot be mapped cleanly onto these planes, schedule an architecture huddle early—the CoE is here to help align bold ideas with dependable execution.
