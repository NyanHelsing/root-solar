---
epic: docs/roadmap/epics/credential-ledger-mvp-verification-layer.md
points: 5
dependencies:
  - docs/roadmap/stories/credential-ledger-mvp-verification-layer-01-api-design.md
  - docs/roadmap/stories/credential-ledger-mvp-issuer-service-03-credential-builder.md
---
# Story: Implement credential resolver

## Background
Build service that validates signatures, checks revocation status, and returns credential summaries.

## Acceptance Criteria
- Resolver verifies signatures using issuer public keys
- Revoked credentials denied with explicit reason
- Unit tests cover valid, expired, and tampered credentials
