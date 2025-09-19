---
epic: docs/roadmap/epics/credential-ledger-mvp-verification-layer.md
points: 3
dependencies:
  - docs/roadmap/stories/credential-ledger-mvp-verification-layer-02-resolver-implementation.md
---
# Story: Add verification caching layer

## Background
Introduce caching to reduce repeated verification load while honoring revocation updates.

## Acceptance Criteria
- Cache invalidates on revocation within acceptable SLA
- Hit rate metrics instrumented
- Stale cache protection documented
