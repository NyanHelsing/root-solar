---
epic: docs/roadmap/epics/agent-cohort-framework-guardrail-engine.md
points: 8
dependencies:
  - docs/roadmap/stories/agent-cohort-framework-guardrail-engine-01-policy-language.md
---
# Story: Implement guardrail parser and runtime

## Background
Build engine that parses policies, evaluates input contexts, and returns deterministic decisions.

## Acceptance Criteria
- Parser handles validation errors gracefully
- Runtime benchmarks meet <50ms per evaluation
- Unit tests cover complex policy combinations
