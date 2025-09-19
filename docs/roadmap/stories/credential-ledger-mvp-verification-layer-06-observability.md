---
epic: docs/roadmap/epics/credential-ledger-mvp-verification-layer.md
points: 2
dependencies:
  - docs/roadmap/stories/credential-ledger-mvp-verification-layer-02-resolver-implementation.md
---
# Story: Instrument verification service

## Background
Add logging, metrics, and traces for verification requests, latencies, and errors.

## Acceptance Criteria
- Dashboard tracks QPS, latencies, error breakdown
- Alert thresholds configured for sustained 5xx rates
- Logs redact sensitive payload data
