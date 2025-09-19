---
initiatives:
  - docs/initiatives/agent-cohort-framework.md
---

# Epic: Cohort Schema Layer

## Summary
Model cohort entities, memberships, and run history in SurrealDB with validation rules that enforce alignment to selected axioms and governance constraints.

## Deliverables
- Database tables (`cohort`, `cohort_membership`, `cohort_run`, `cohort_guardrail`) with referential integrity and migration scripts.
- Validation logic ensuring cohorts reference valid axioms, credential tiers, and telemetry endpoints.
- Admin tooling for data inspection, manual adjustments, and export of cohort state snapshots.

## Key Dependencies
- Input from governance leads on required metadata and lifecycle stages.
- Coordination with credential ledger team to reference credential IDs and trust levels.
- QA coverage for migration safety and schema evolution paths.

## Milestones & Exit Criteria
1. **Schema Proposal** – ERD and migration plan approved by architecture review.
2. **Implementation** – Migrations applied in staging with seeded sample cohorts for testing.
3. **Data Quality Gate** – Automated tests validating constraints run in CI; zero critical failures after production launch.
