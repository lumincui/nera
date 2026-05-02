# MVP Test Plan

This plan tracks the three core user-facing scenarios.

## Scenario 1: Permission Approval

Goal:

```text
Codex PermissionRequest
  -> sidecar
  -> nera-server
  -> touchpoint-ios
  -> approve / deny
  -> nera-server
  -> sidecar
  -> Codex hook decision
```

Status: not implemented.

TODO:

- Add `permission_request` event support to `nera-server`.
- Add `approval_response` support to `nera-server`.
- Add Codex `PermissionRequest` hook adapter to `apps/sidecar`.
- Add permission actionable notification UI to `touchpoint-ios`.
- Return Codex hook stdout for allow / deny.
- Handle timeout, duplicate response, stale request, and sidecar restart cases.

Acceptance cases:

| Case | Action | Expected |
| --- | --- | --- |
| P1 approve | User approves permission request | Codex hook returns allow |
| P2 deny | User denies permission request | Codex hook returns deny |
| P3 timeout | User does not answer | Request expires or Codex timeout path runs |
| P4 duplicate | Same response is submitted twice | Only first response is applied |
| P5 stale | Response arrives after sidecar restart | Response is ignored or marked stale |

## Scenario 2: Question Clarification

Goal:

```text
sidecar question
  -> nera-server
  -> touchpoint-ios
  -> selected choices / text
  -> nera-server
  -> sidecar poll
```

Status: implemented locally.

Acceptance cases:

| Case | Action | Expected |
| --- | --- | --- |
| Q1 single choice | Select `Question action` and send | sidecar receives `answer_question` with one choice |
| Q2 multiple choices | Select multiple choices and send | sidecar receives all selected choices |
| Q3 text | Enter text and send | sidecar receives text |
| Q4 text only | Send with no selected choices but text | sidecar receives text and empty choices |
| Q5 empty submit | Send with no choices and no text | UI blocks submit |
| Q6 duplicate submit | Tap send twice | Only one response is posted |

Known gap:

- Q6 was observed during manual testing. The first response was correct, the second was empty.

## Scenario 3: Idle Completion

Goal:

```text
Codex Stop hook
  -> sidecar codex stop
  -> nera-server
  -> touchpoint-ios completion notification
  -> Review
  -> nera-server
  -> sidecar poll
```

Status: partially implemented.

Implemented:

- Codex `Stop` hook reaches sidecar.
- Sidecar posts `idle` to server.
- Server creates `NERA_IDLE` mock push intent.
- iOS can schedule local idle notification.

Acceptance cases:

| Case | Action | Expected |
| --- | --- | --- |
| I1 Codex Stop | Codex turn ends | server receives `idle` event |
| I2 iOS pull idle | iOS pulls idle event | local completion notification is scheduled |
| I3 Review | User taps Review | server receives `open_review` response |
| I4 notification denied | User denies notification permission | app records completion message and shows denied status |
| I5 multiple idle | Multiple turns finish | server records separate idle events |
