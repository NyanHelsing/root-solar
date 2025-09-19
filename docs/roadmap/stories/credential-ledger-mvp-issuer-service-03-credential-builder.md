---
epic: docs/roadmap/epics/credential-ledger-mvp-issuer-service.md
points: 5
dependencies:
  - docs/roadmap/stories/credential-ledger-mvp-issuer-service-02-event-consumer.md
  - docs/roadmap/stories/credential-ledger-mvp-schema-design-03-claim-model.md
---
# Story: Create credential builder pipeline

## Background
Assemble credential payloads, attach evidence references, and generate signatures.

## Acceptance Criteria
- Builder supports all MVP credential types
- Validation errors logged with actionable messages
- Signatures generated using KMS-stored keys
