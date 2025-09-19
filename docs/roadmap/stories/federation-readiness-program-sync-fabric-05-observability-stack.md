---
epic: docs/roadmap/epics/federation-readiness-program-sync-fabric.md
points: 3
dependencies:
  - docs/roadmap/stories/federation-readiness-program-sync-fabric-02-outbound-service.md
---
# Story: Deploy federation observability stack

## Background
Expose metrics and logs for replication lag, throughput, and partner health.

## Acceptance Criteria
- Dashboards show per-partner lag and failure counts
- Alerting thresholds set for SLA breaches
- Trace IDs propagate across services
