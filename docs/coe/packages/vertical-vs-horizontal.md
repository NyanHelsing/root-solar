# Vertical vs. Horizontal Package Splitting

Choosing how to slice functionality determines whether our system feels modular or brittle. Here’s how we evaluate vertical (feature-centric) versus horizontal (layer-centric) splits at root.solar.

## Vertical Packages
**Definition:** Group by domain or feature journey—everything needed to deliver an outcome lives together.

**Use When:**
- A capability spans the full stack (UI, API, persistence) and will be reused as a cohesive unit (e.g., credential issuance toolkit for internal and external services).
- You expect product teams to own the domain end-to-end and release on a shared cadence.
- The feature requires opinionated defaults that would be diluted if spread across horizontal layers.

**Pros:**
- Clear ownership boundaries.
- Easier onboarding for new contributors—context lives in one place.
- Encourages outcome-based testing.

**Cons:**
- Potential duplication of cross-cutting utilities if not curated.
- Harder to share low-level adapters without explicit exports.

## Horizontal Packages
**Definition:** Group by technical layer or concern—utilities shared across multiple domains.

**Use When:**
- Multiple vertical packages or services need the same low-level capability (e.g., NATS publisher, libp2p handshake helpers).
- You want tight control over runtime dependencies (Node-only vs browser-friendly builds).
- Cross-cutting policies (security, observability) must stay consistent.

**Pros:**
- Reduces duplication of foundational code.
- Centralizes policy enforcement and configuration.
- Simplifies upgrades to underlying dependencies.

**Cons:**
- Risk of “god packages” with unclear scope.
- Changes may require coordination across teams; versioning discipline becomes critical.

## Decision Matrix
| Criteria | Vertical Split | Horizontal Split |
| --- | --- | --- |
| Multiple domains reusing the same logic | ⚠️ | ✅ |
| Feature needs cohesive, opinionated UX + API | ✅ | ⚠️ |
| Deployment cadence varies wildly by consumer | ⚠️ | ✅ |
| Security/policy updates must apply globally | ⚠️ | ✅ |
| Team ownership aligned with user journeys | ✅ | ⚠️ |

## Hybrid Pattern: Capsule Packages
When neither extreme fits, create **capsule packages**:
- A vertical package exports public APIs but internally depends on curated horizontal modules.
- Example: `packages/credential-orchestrator` wraps `packages/nats-bridge`, `packages/libp2p-utils`, and domain models into a single high-level workflow.

## Refactoring Signals
- **Vertical → Horizontal**: Multiple vertical packages reimplement the same transport adapter or validation logic. Extract shared utilities.
- **Horizontal → Vertical**: Consumers must override most behavior, or the package exposes feature decisions better owned by a single team.

## Process for Splitting
1. Draft an ADR capturing motivation, proposed boundaries, and expected consumers.
2. Introduce internal facades that redirect old imports to new modules to ease migration.
3. Run cross-team pairing sessions to socialize the new boundaries and update docs.

Packages should feel like modular spacecraft components: easy to dock, self-contained in purpose, and clear about the missions they support. Split with intent, and keep the seams obvious.
