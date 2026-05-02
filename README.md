# Nera

Nera is organized as a monorepo.

## Layout

- `apps/touchpoint-ios`: native iOS touchpoint app.
- `apps/nera-server`: server app placeholder.
- `apps/sidecar`: local sidecar app placeholder.
- `packages/nera-core`: shared protocol and message models.
- `spec`: architecture and product specs.
- `prototype`: earlier interaction prototypes.

The current implementation focuses on the hardcoded-pairing MVP for two paths:

1. `question` triggers an interactive action response.
2. `idle` sends a completion notification.
