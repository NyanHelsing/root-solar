---
initiatives:
  - docs/initiatives/credential-ledger-mvp.md
---

# Epic: Credential Issuer Service

## Summary
Implement the backend services that mint, sign, and store credentials in response to verified contribution events, ensuring integrity and auditability.

## Deliverables
- Issuance service with automated triggers from SurrealDB event streams and manual override tooling.
- Signature infrastructure using DIDs or equivalent cryptographic primitives, including key rotation processes.
- Audit logs and dashboards tracking issuance volume, failure modes, and revocation actions.

## Key Dependencies
- Finalized credential schema and policies.
- Secure key management (HSM, KMS) provisioned by infra/DevOps.
- Integration with observability stack for monitoring and alerting.

## Milestones & Exit Criteria
1. **Service Alpha** – Manual issuance via admin interface to validate flows and signatures.
2. **Automated Triggers** – Event-driven issuance live in staging; regression tests cover positive/negative paths.
3. **Production Launch** – Service processes ≥95% of eligible events automatically with documented runbooks.
