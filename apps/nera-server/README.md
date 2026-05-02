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
