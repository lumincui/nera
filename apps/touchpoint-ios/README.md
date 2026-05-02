# Nera Touchpoint iOS

Native iOS touchpoint app for the MVP flow.

Pairing is hardcoded through `HardcodedPairing.dev` from `packages/nera-core`.

## Generate Project

```bash
cd apps/touchpoint-ios
xcodegen generate
open NeraTouchpoint.xcodeproj
```

## Current Paths

1. `question` opens an interactive action card, supports multi-select plus text, and creates an `answer_question` message.
2. `question` can also schedule a local actionable notification before APNs is connected.
3. `idle` sends a local completion notification and records a `completion_notification` message.

The local notifications are a development stand-in for APNs. Debug push should
use APNs sandbox; TestFlight and App Store builds should use APNs production.
