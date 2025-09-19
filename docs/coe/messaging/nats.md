# NATS at root.solar

NATS is our control tower: the fabric that keeps high-fidelity command, telemetry, and observability flowing with predictable latency. Where libp2p grants autonomy, NATS enforces choreography—especially for services that must react in near real-time or feed the analytics plane.

## Primary Use Cases
1. **Command Dispatch** – Send authoritative instructions from TRPC or cohort orchestrators to workers and agents when delivery guarantees matter.
2. **Telemetry Streaming** – Funnel change data capture (CDC) events into analytics pipelines for sentiment insights, credential issuance, and simulation logs.
3. **System Heartbeat** – Monitor subsystem health (network status, queue depth, policy violations) with subjects consumed by dashboards and alerting.
4. **Federation Edge Sync** – Relay signed envelopes to partner networks using JetStream persistence to ensure replay and auditability.

## Subject Taxonomy
```
root.solar.
  command.
    sentiment.set
    cohort.assign
    policy.evaluate
  telemetry.
    sentiment.delta
    credential.issued
    libp2p.peer.health
  federation.
    outbound.events
    inbound.acks
  observability.
    pipeline.lag
    cohort.guardrail
```

- Keep subject depth ≤4 levels to avoid wildcard mishaps.
- Reserve `observability.` for signals that feed dashboards; application logic should not subscribe to it.

## JetStream Guidelines
- **Retention**: Prefer `Limits` retention with explicit max-bytes and max-age. Only use `WorkQueue` when replays are unnecessary.
- **Ack Discipline**: Workers must ack within 5 seconds; unacked messages escalate to dead-letter subjects for inspection.
- **Schema Contracts**: Version payloads with `schemaVersion` and publish JSON Schema references so analytics writers can validate inputs.

## Best Practices
- **Idempotent Consumers** – Design consumers to handle duplicate deliveries gracefully. Use message IDs derived from SurrealDB record IDs when possible.
- **Observability Hooks** – Wrap producers and consumers with tracing and metrics (`jetstream.publish.duration`, `jetstream.consumer.lag`).
- **Replay Readiness** – Document replay procedures for every critical stream. If replays are unsafe, you are holding state in the wrong place.
- **Security Posture** – Scope credentials per subject hierarchy; avoid all-access users. Leverage NATS account isolation for partner or cohort-specific channels.

## When Not to Use NATS
- When peers can resolve the conversation autonomously with libp2p and the system can tolerate eventual consistency.
- When payloads exceed 1MB regularly—consider object storage and send references instead.
- For long-term analytical storage; offload to columnar stores after ingestion.

## Reference Consumer Pattern
```ts
const sub = jetstream.subscribe("root.solar.command.cohort.assign", {
  durable: "cohort-assignment-worker",
  manualAck: true,
});

for await (const msg of sub) {
  const payload = decode(msg.data);
  try {
    await guardrails.evaluate(payload);
    await cohorts.assign(payload);
    msg.ack();
  } catch (error) {
    logger.error("Assignment failed", error, { payload });
    msg.term(); // escalate to dead-letter
  }
}
```

## Operational Checklist
- Run daily lag reports and compare against SLA (target <500ms for command subjects, <2s for telemetry).
- Keep subject-level dashboards to avoid noisy aggregates.
- Rotate credentials quarterly; JetStream users often become high-value targets.

NATS is our reliable backbone. Use it when the network must behave like an orchestra: synchronized, accountable, and observable.
