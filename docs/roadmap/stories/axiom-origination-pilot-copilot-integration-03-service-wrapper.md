---
epic: docs/roadmap/epics/axiom-origination-pilot-copilot-integration.md
points: 5
dependencies:
  - docs/roadmap/stories/axiom-origination-pilot-copilot-integration-01-llm-options.md
  - docs/roadmap/stories/axiom-origination-pilot-collaboration-canvas-02-data-model.md
---
# Story: Implement copilot service wrapper

## Background
Create backend service that orchestrates prompt calls, handles rate limiting, and stores minimal transcripts with consent tags.

## Acceptance Criteria
- Service exposes REST/TRPC endpoint with authentication
- Requests tagged with session and section identifiers
- Telemetry captures latency, token counts, and error rates
