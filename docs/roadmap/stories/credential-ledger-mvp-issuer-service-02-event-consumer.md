---
epic: docs/roadmap/epics/credential-ledger-mvp-issuer-service.md
points: 5
dependencies:
  - docs/roadmap/stories/credential-ledger-mvp-issuer-service-01-architecture.md
---
# Story: Implement SurrealDB event consumer

## Background
Build consumer that listens for qualifying events and triggers credential issuance workflows.

## Acceptance Criteria
- Consumer handles batching and retries
- Event filtering aligns with policy thresholds
- Integration tests validate correct triggers
