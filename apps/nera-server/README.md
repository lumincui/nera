# Nera Server

Local MVP server.

It receives events from `apps/sidecar`, stores them in memory, exposes pending
events for `touchpoint-ios`, accepts touchpoint responses, and lets sidecar poll
responses.

APNs is represented as a provider boundary for now. The server logs the push
intent, but does not call Apple APNs until credentials and device tokens are
added.

## Run

```bash
npm run server
```

Default URL: `http://127.0.0.1:8787`.

## Feature Flags

Debug and simulation capabilities are explicit environment flags:

| Flag | Default | Purpose |
| --- | --- | --- |
| `NERA_ENABLE_DEBUG_ROUTES` | `0` | Enables `/debug/state` for local inspection. |
| `NERA_PUSH_PROVIDER` | `mock` | Uses the in-memory mock push boundary. Set to `apns` only when the APNs provider is implemented and configured. |

Enable debug routes during local testing:

```bash
NERA_ENABLE_DEBUG_ROUTES=1 npm run server
```
