---
epic: docs/roadmap/epics/axiom-origination-pilot-collaboration-canvas.md
points: 3
dependencies:
  - docs/roadmap/stories/axiom-origination-pilot-collaboration-canvas-02-data-model.md
  - docs/roadmap/stories/axiom-origination-pilot-collaboration-canvas-04-section-locks.md
---
# Story: Provide offline draft buffer

## Background
Ensure contributors can continue drafting locally during brief disconnects and merge changes gracefully when reconnected.

## Acceptance Criteria
- Local storage captures unsent edits per section
- Reconnect flow surfaces merge diff before apply
- Automated tests cover offline/online transitions
