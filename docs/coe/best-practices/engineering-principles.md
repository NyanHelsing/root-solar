# Engineering Principles

These principles are the cultural firmware powering root.solar’s engineering work. They align our day-to-day choices with the project’s long-term mission of harmonizing consensus.

## 1. Design for Traceable Intent
- Every change must make the underlying intent obvious. Use ADRs, comment breadcrumbs, and descriptive commit messages.
- Align TRPC procedures, NATS subjects, and libp2p protocols with clear naming to trace flows end-to-end.

## 2. Bias Toward Determinism
- When in doubt, choose deterministic approaches: deterministic IDs (`nanoid` with namespaces), deterministic guardrail decisions, deterministic simulation seeds.
- Log decision inputs alongside outputs so future audits can reproduce context.

## 3. Progressive Disclosure of Complexity
- Start contributors with high-level interfaces (`@root-solar/*` packages) before exposing them to raw protocols.
- Wrap complex flows (guardrails, federation sync) in small, composable functions with descriptive names.

## 4. Observability Is a Feature
- Instrument code with OpenTelemetry spans and structured logs before rollout.
- Treat missing metrics as bugs. Dashboards should tell the story of the system without spelunking through logs.

## 5. Secure by Construction
- Credential checks are not optional. Lean on the credential ledger and RBAC helpers instead of ad-hoc authorization.
- Ensure encrypted transport for libp2p and NATS connections; prefer rotating secrets and enforce TLS by default.

## 6. Lead with Empathy for Hybrid Actors
- Assume both human stewards and autonomous agents rely on the same APIs. Build consistent experiences that respect cognitive load and machine efficiency.

## 7. Ritualize Postmortems & Retrospectives
- Treat every incident as a chance to add to the CoE. Update guidance documents promptly and socialize learnings.

## 8. Keep Feedback Loops Tight
- Ship small slices, test hypotheses quickly, and bring metrics to every decision meeting.
- Feedback loops should cross planes: analytics insights inform guardrails; guardrail outcomes inform credential policies.

Apply these principles to every initiative, and root.solar will continue to feel like a responsive, living system rather than a brittle codebase.
