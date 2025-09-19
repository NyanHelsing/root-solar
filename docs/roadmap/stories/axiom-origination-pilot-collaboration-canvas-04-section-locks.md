---
epic: docs/roadmap/epics/axiom-origination-pilot-collaboration-canvas.md
points: 5
dependencies:
  - docs/roadmap/stories/axiom-origination-pilot-collaboration-canvas-02-data-model.md
---
# Story: Add section locking and conflict alerts

## Background
Prevent conflicting edits by implementing optimistic locks, conflict detection, and user notifications.

## Acceptance Criteria
- Users cannot overwrite active sections without explicit take-over flow
- Conflict resolution UI tested with paired sessions
- Audit trail records lock acquisition and release events
