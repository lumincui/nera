# MVP Local Protocol

Pairing is hardcoded for the first implementation.

## Components

```text
agent / Codex
  -> sidecar
  -> nera-server
  -> APNs provider boundary
  -> touchpoint-ios
  -> nera-server
  -> sidecar
  -> agent / Codex
```

## Hardcoded Pair

```json
{
  "pair_id": "dev-pair-local-001",
  "sidecar_id": "sidecar-mac-dev",
  "touchpoint_id": "touchpoint-ios-dev",
  "relay_channel": "relay-dev-hardcoded",
  "apns_environment": "sandbox"
}
```

## Sidecar To Server

`POST /events`

```json
{
  "event_id": "question-20260502-001",
  "type": "question",
  "sidecar_id": "sidecar-mac-dev",
  "agent": "Codex",
  "session_id": "dev-session",
  "title": "Codex needs clarification",
  "body": "Which interaction should Nera validate first?",
  "choices": ["Question action", "Idle notification"]
}
```

`idle` uses the same endpoint with `type: "idle"` and a summary body.

## Touchpoint To Server

`POST /touchpoint/responses`

```json
{
  "message_id": "msg-dev-001",
  "request_id": "question-20260502-001",
  "type": "answer_question",
  "touchpoint_id": "touchpoint-ios-dev",
  "selected_choices": ["Question action"],
  "text": "Validate notification actions first."
}
```

## Sidecar Polling

`GET /sidecar/responses?sidecar_id=sidecar-mac-dev&after=0`

The server returns ordered responses with numeric `sequence`.
