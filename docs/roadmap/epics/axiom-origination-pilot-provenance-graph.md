---
initiatives:
  - docs/initiatives/axiom-origination-pilot.md
---

# Epic: Origination Provenance Graph

## Summary
Persist rich provenance for every drafted axiom—authors, references, dissent, session transcripts—so future readers trust and audit the canon.

## Deliverables
- SurrealDB schema extensions (`axiom_origin`, `axiom_origin_event`) with referential integrity checks.
- API and admin tooling for inspecting provenance, replaying sessions, and exporting context bundles.
- Data retention and privacy policies governing transcript storage and redaction workflows.

## Key Dependencies
- Collaboration canvas emitting structured events for every meaningful interaction.
- Security review of stored transcripts, including encryption-at-rest and access controls.
- Documentation assistance to capture schema diagrams and data catalog entries.

## Milestones & Exit Criteria
1. **Schema Migration** – Database changes deployed with backfill scripts for historical axioms where possible.
2. **Review Interface** – Internal auditors can browse provenance timelines and annotate notable events.
3. **Compliance Sign-off** – Privacy/legal approve retention policies; complete two successful audit drills.
