---
epic: docs/roadmap/epics/axiom-origination-pilot-collaboration-canvas.md
points: 5
dependencies:
  - docs/roadmap/stories/axiom-origination-pilot-collaboration-canvas-02-data-model.md
---
# Story: Implement presence signalling

## Background
Build lightweight presence service broadcasting participant cursors and active sections.

## Acceptance Criteria
- Presence updates under 250ms for 10 users in staging
- Inactive users timeout after configurable interval
- Load testing report attached
