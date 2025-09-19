---
initiatives:
  - docs/initiatives/axiom-origination-pilot.md
---

# Epic: Origination Copilot Integration

## Summary
Embed an AI assistant that suggests improvements, highlights inconsistencies, and captures rationale snippets in real time during drafting sessions.

## Deliverables
- Prompt pipelines tuned for axiom language polishing, conflict detection, and dissent summarization.
- UI affordances for accepting, rejecting, or editing copilot suggestions with clear attribution.
- Telemetry on suggestion quality, acceptance rates, and user trust indicators.

## Key Dependencies
- Access to compliant LLM inference infrastructure with latency SLAs.
- Legal/privacy review covering storage of prompt/response transcripts and opt-in consent flows.
- Safety guardrails to prevent hallucinations, including fallback heuristics and user report channels.

## Milestones & Exit Criteria
1. **Prompt Library** – Documented prompt templates validated against representative drafting scenarios.
2. **In-Canvas Pilot** – Copilot available behind a feature flag; collect qualitative feedback from internal sessions.
3. **Trust Gate** – Achieve ≥70% helpfulness rating and <5% critical error rate before expanding to external pilots.
