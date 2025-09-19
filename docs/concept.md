# root.solar Concept

## Why we are building this
root.solar exists to help collect and maintain a shared canon of "Operating Principles" for communities that consider themselves rooted in the solar system. We are motivated by the difficulty that distributed projects, cooperatives, and autonomous agents have when they try to describe their first principles in a transparent, revisable way. Without a common registry, each group builds its own vocabulary and loses the ability to compare or reconcile priorities, which slows collaboration and weakens trust.

## How the application meets that need
The application curates a living library of axioms that any recognized being can reference. Every axiom is stored in SurrealDB and exposed through a typed TRPC surface so both the React client and external tools can pull from the same source of truth. Beings record their sentiment toward each axiom by allocating weighted priorities; those weights are normalized to expose relative emphasis without forcing a single ranking system. Network instrumentation keeps track of connectivity and protocol readiness, making it easier to blend human and automated participation. Together, these pieces provide a structured, queryable representation of collective intent that can power governance, negotiation, or downstream automation.

## What people should be able to do
- Browse the shared catalogue of axioms that define operating principles for the community.
- Register new axioms, including descriptive context, so emerging principles can be documented quickly.
- Onboard beings—from human delegates to autonomous agents—and see their current sentiment allocations.
- Allocate or reallocate sentiment weight across axioms to signal priority, while respecting per-type caps like the 0–100 "priority" scale.
- Observe network health and protocol metadata to confirm when the system is ready for collaborative sessions or integrations.
- Export or integrate with other systems via the typed API so consensus data can inform policy, resource planning, or simulations.
