# Axiom Origination Pilot

## Objective
Prototype a guided collaboration flow that lets small cohorts co-create axioms with embedded provenance, testing the viability of a persistent origination studio.

## Key Outcomes
- Multiplayer drafting session with live co-editing, rationale prompts, and dissent capture shipped to beta users.
- Provenance graph persisted to SurrealDB, linking authors, references, and revision decisions for each drafted axiom.
- Feedback loop that measures participant satisfaction, clarity of captured rationale, and time-to-publication.

## Workstreams
1. **Facilitation Canvas** – Build a React-based drafting surface with structured sections (principle statement, supporting context, dissent).
2. **Guided Copilot** – Integrate an LLM-backed assistant that suggests language improvements and highlights inconsistencies in real time.
3. **Provenance Persistence** – Extend `axiom` entities to store authorship metadata and attach session transcripts via a new `axiom_origin` table.
4. **Beta Cohort** – Recruit 3–5 mission-aligned communities, run orchestrated drafting sessions, and document qualitative learnings.

## Dependencies
- Design assets for the drafting experience and provenance visualizations.
- Budget for hosting the collaborative copilot (evaluate on-prem vs. managed inference).
- Legal/privacy review for storing transcripts and attribution data.

## Success Metrics
- ≥70% of pilot participants report increased confidence in the captured axiom context.
- Average time from session start to axiom publication reduced to under 60 minutes.
- At least two communities commit to using the studio for ongoing doctrine updates post-pilot.
