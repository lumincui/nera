# Nera Touchpoint iOS

Native iOS touchpoint app for the MVP flow.

Pairing is hardcoded through `HardcodedPairing.dev` from `packages/nera-core`.

## Local setup

Prerequisites:

```bash
brew install xcodegen mas
```

Install full Xcode from the App Store, then point developer tools at it:

```bash
mas open 497799835 # Xcode
# Complete the App Store install manually if mas cannot install without sudo / Apple ID interaction.
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -runFirstLaunch
xcodebuild -downloadPlatform iOS
```

The current machine had only Command Line Tools selected at first (`/Library/Developer/CommandLineTools`), which does not include `simctl`, so full Xcode is required before simulator testing.

## Generate Project

```bash
cd apps/touchpoint-ios
xcodegen generate
open NeraTouchpoint.xcodeproj
```

## Run in iOS Simulator

After full Xcode and an iOS simulator runtime are installed:

```bash
cd apps/touchpoint-ios
./scripts/run-simulator.sh
```

Optional: pass a specific simulator name:

```bash
./scripts/run-simulator.sh "iPhone 16 Pro"
```

The script regenerates the Xcode project, builds the `NeraTouchpoint` scheme for iOS Simulator, boots the simulator, installs the app, launches `app.nera.touchpoint`, and opens Simulator.app.

## Current Paths

1. `question` opens an interactive action card, supports multi-select plus text, and creates an `answer_question` message.
2. `question` is delivered by APNs when the server runs with `NERA_PUSH_PROVIDER=apns`; quick choice and text reply actions submit in the background without opening the app.
3. `idle` sends a local completion notification and records a `completion_notification` message.
4. `Review` / detail-oriented notification actions intentionally open the app.

## Feature Flags

Debug builds define `NERA_DEV_FEATURES` and show local development tools:

- hardcoded pairing details
- server URL and manual pull control
- event switcher
- local notification trigger buttons
- message payload inspector

Release builds do not define `NERA_DEV_FEATURES`, so those tools are hidden and
the first screen presents the user-facing Nera waiting state.

The local notifications are a development stand-in for APNs. Debug push should
use APNs sandbox; TestFlight and App Store builds should use APNs production.

## APNs

The app has the `aps-environment` entitlement for development builds. On launch
it requests notification permission, registers with APNs, and posts the device
token to `POST /touchpoint/device-token` on the configured nera-server.

For local device testing, `NeraServerURL` is set in `project.yml` to the Mac's
LAN address so the iPhone can reach the local server. Update
`INFOPLIST_KEY_NeraServerURL` if the Mac's IP address changes.

APNs requires a physical iPhone. The iOS simulator can validate local
notification behavior, but it does not provide a real APNs device token for
Apple push delivery.

Push Notifications also require a paid Apple Developer Program team. Personal
development teams cannot create a provisioning profile with the
`aps-environment` entitlement.
