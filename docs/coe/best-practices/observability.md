# Observability Canon

Observability keeps consensus honest. We do not guess whether the network is healthy—we measure, visualize, and automate responses. This canon outlines how to instrument root.solar’s distributed architecture.

## Pillars
1. **Metrics** – Quantitative signals for pipelines, messaging, and frontend performance.
2. **Tracing** – Distributed traces linking React interactions, TRPC calls, NATS commands, and libp2p flows.
3. **Logging** – Structured, context-rich logs for debugging and audits.

## Instrumentation Standards
- Use `@root-solar/observability` helpers; never instantiate OpenTelemetry primitives directly unless extending the SDK.
- Correlate everything with `correlationId` and `credentialId` (when appropriate). Apply hashing for personally identifiable tokens.
- Tag logs with `plane` (`consensus`, `coordination`, `persistence`) to speed forensic investigations.

## Key Dashboards
| Dashboard | Purpose | Owner |
| --- | --- | --- |
| **Sentiment Pipeline Lag** | Track CDC → analytics freshness | Data Platform |
| **Messaging Health** | NATS lag, libp2p peer availability | Network Operations |
| **Credential Issuance** | Issuance latency, failure rates | Credential Team |
| **Cohort Guardrail** | Policy decisions, overrides, incident counts | Governance |

## Alert Philosophy
- Alerts must trigger action; silence the ones that do not influence response.
- Pager-worthy: NATS command backlog >30s, libp2p peer drop >40%, SurrealDB replication lag >60s.
- Slack-worthy: Dashboard data stale >5m, credential issuance failure >5% hourly.

## Data Retention
- Metrics: 90 days tier-1 retention; 1-year aggregated archives for trend analysis.
- Traces: Sample at 5% during steady state, 100% when `X-Trace-Override` header present.
- Logs: 30-day hot storage, 1-year cold storage with compression to satisfy compliance.

## Observability Onboarding Checklist
1. Add metrics/traces/logs when creating new services or protocols.
2. Register dashboards in the Observability Atlas (Notion index) and link back here.
3. Create runbooks with screenshots for each alert.
4. Schedule a review with observability stewards before launch.

## Tooling
- **Grafana/Prometheus** for metrics.
- **Tempo/Jaeger** for traces.
- **Loki** for logs with structured JSON output.
- **OpenTelemetry Collector** for cross-plane aggregation.

Observability is how we keep the promise of transparent consensus. Instrument early, revisit often, and treat clarity as a shared resource.
