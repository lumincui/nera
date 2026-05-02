# Sidecar

Local MVP sidecar CLI.

It sends hardcoded-pairing agent events to `nera-server` and polls responses
that came back from touchpoint.

## Commands

```bash
npm run sidecar:question -- "Which path should we validate first?"
npm run sidecar:idle -- "Codex finished the current turn."
npm run sidecar:poll
```

Codex hook-shaped inputs:

```bash
npm --workspace apps/sidecar run codex:stop < apps/sidecar/fixtures/codex-stop.json
npm --workspace apps/sidecar run codex:question < apps/sidecar/fixtures/codex-question.json
```

Environment:

- `NERA_SERVER_URL`, default `http://127.0.0.1:8787`
- `NERA_SIDECAR_ID`, default `sidecar-mac-dev`
- `NERA_SESSION_ID`, default `dev-session`

`codex:stop` matches the Codex `Stop` hook shape and returns `{"continue": true}`.
`codex:question` is a local test adapter for Nera's question path; Codex does not
currently expose a first-class `question` hook in the same way it exposes `Stop`.

An example Codex hook config is available at `apps/sidecar/examples/codex-hooks.json`.
It is not installed automatically, so it will not affect the current Codex session.
