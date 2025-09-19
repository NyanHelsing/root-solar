# libp2p at root.solar

libp2p gives root.solar a resilient, peer-aware nervous system. It is how autonomous agents discover one another, exchange stateful updates, and coordinate outside of centralized chokepoints. This document captures how we wield libp2p, the patterns that have proven reliable, and the traps we avoid.

## Core Responsibilities
1. **Peer Discovery & Identity** – Maintain authenticated peer sets for agent cohorts, federation edges, and observability scouts. We use peer IDs tied to credential ledger records so authorization can piggyback on reputation signals.
2. **Secure Channels** – Establish encrypted streams with negotiation for protocol versions (`/root-solar/*`). This supports multi-tenancy and incremental upgrades without isolating legacy peers.
3. **Stateful Gossip** – Broadcast consensus hints (e.g., cohort heartbeat, simulation preview deltas) that benefit from eventual consistency without hammering NATS.
4. **Edge Autonomy** – Let remote or intermittently connected participants contribute by syncing when available, reducing load on central infrastructure.

## Canonical Protocols
| Protocol ID | Purpose | Notes |
| --- | --- | --- |
| `/root-solar/sentiment/1.0.0` | Lightweight sentiment deltas for agent cohorts | Keep payloads <32KB; leverage credential signatures |
| `/root-solar/federation/1.0.0` | Schema negotiation handshakes, capability exchange | Requires ADR for major schema changes |
| `/root-solar/telemetry/0.9.0` | Streaming observability metrics from edge nodes | Draft status; wrap metrics in protobuf to reduce overhead |

## Best Practices
- **Credential-Gated Peers** – Gate connection acceptance on credential checks; short-circuit peers missing required badges to protect the mesh.
- **Explicit Protocol Matrix** – Document which services speak which protocol versions; use compatibility tests to prevent accidental regression.
- **Stream Lifecycle Hygiene** – Close streams after bursts; long-lived idle streams cost memory and can entrench stale peers.
- **Edge Backpressure** – Agents should advertise `max-inflight` capability so orchestrators avoid flooding low-resource participants.

## Anti-Patterns
- **Treating libp2p as a Queue** – If you need ordered delivery with at-least-once semantics, pivot to NATS JetStream. libp2p streams excel at conversational patterns, not backlog persistence.
- **Duplicating HTTP APIs** – Do not port TRPC procedures wholesale into libp2p. Instead, publish coarse-grained intents and use TRPC for authoritative mutations.
- **Ignoring Metrics** – Always wrap handlers with OpenTelemetry spans and tag peer IDs (pseudonymized) to debug connectivity issues.

## Design Checklist Before Adding a Protocol
1. Does the conversation require peer awareness or just reliable broadcast?
2. How will you authenticate peers? Which credential types are mandatory?
3. What is the upgrade story? Define version negotiation and deprecation windows.
4. Can the data be summarized for NATS observers to maintain historical context?

## Example: Cohort Negotiation Flow
```
Peer A (Steward) ──handshake──▶ Peer B (Agent)
    │                           │
    ├─ identity challenge ──▶   │
    │                           ├─ credential proof
    ├─ guardrail summary ──▶    │
    │                           └─ acceptance / refusal
    └─ session stream open ─▶ Shared libp2p stream for task intents
```

## Operational Guidance
- Maintain peer allowlists in SurrealDB with TTLs; revoke access by updating credentials.
- Deploy libp2p nodes with circuit relay fallback to aid participants behind restrictive NATs.
- Record handshake transcripts (metadata only) for forensic audits without storing full payloads.

libp2p is where root.solar’s autonomy lives. Use it to make the network feel alive, but anchor every new protocol to credential and governance truths so the mesh scales with integrity.
