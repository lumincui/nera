# Nera Server

Local MVP server.

It receives events from `apps/sidecar`, stores them in memory, exposes pending
events for `touchpoint-ios`, accepts touchpoint responses, and lets sidecar poll
responses.

By default APNs is represented as a mock provider boundary for local work. When
`NERA_PUSH_PROVIDER=apns` and APNs credentials plus an iOS device token are
configured, the server sends notifications through Apple APNs.

## Run

```bash
npm run server
```

Default URL: `http://127.0.0.1:8787`.

## Feature Flags

Debug and simulation capabilities are explicit environment flags:

| Flag | Default | Purpose |
| --- | --- | --- |
| `NERA_SERVER_HOST` | `0.0.0.0` | Bind address. Use `0.0.0.0` so a physical iPhone on the LAN can register its device token. |
| `NERA_ENABLE_DEBUG_ROUTES` | `0` | Enables `/debug/state` for local inspection. |
| `NERA_PUSH_PROVIDER` | `mock` | Uses the in-memory mock push boundary. Set to `apns` to deliver through Apple APNs. |
| `NERA_APNS_ENV` | `sandbox` | APNs host, either `sandbox` or `production`. |
| `NERA_APNS_KEY_ID` | unset | Apple APNs auth key ID. |
| `NERA_APNS_TEAM_ID` | unset | Apple Developer Team ID. |
| `NERA_APNS_BUNDLE_ID` | `app.nera.touchpoint` | APNs topic / iOS bundle ID. |
| `NERA_APNS_PRIVATE_KEY_PATH` | unset | Path to the `.p8` APNs auth key. |
| `NERA_APNS_PRIVATE_KEY` | unset | PEM private key content; alternative to `NERA_APNS_PRIVATE_KEY_PATH`. |

Enable debug routes during local testing:

```bash
NERA_ENABLE_DEBUG_ROUTES=1 npm run server
```

Run with APNs enabled:

```bash
NERA_PUSH_PROVIDER=apns \
NERA_APNS_ENV=sandbox \
NERA_APNS_KEY_ID=YOUR_KEY_ID \
NERA_APNS_TEAM_ID=YOUR_TEAM_ID \
NERA_APNS_PRIVATE_KEY_PATH=/path/to/AuthKey_YOUR_KEY_ID.p8 \
npm run server
```

The iOS app registers its APNs device token at `POST /touchpoint/device-token`.
If APNs is enabled but the token or credentials are missing, `/events` still
accepts the event and returns a push intent with `no_device_token` or
`not_configured`.
