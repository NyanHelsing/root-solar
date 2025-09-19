---
epic: docs/roadmap/epics/axiom-origination-pilot-copilot-integration.md
points: 5
dependencies:
  - docs/roadmap/stories/axiom-origination-pilot-copilot-integration-03-service-wrapper.md
---
# Story: Implement safety guardrails and filters

## Background
Add toxicity filtering, dissent detection, and escalation paths for problematic suggestions.

## Acceptance Criteria
- Moderation service screens outputs and logs flagged content
- Escalation flow notifies facilitators on critical hits
- Test suite covers malicious prompt attempts
