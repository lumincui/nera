#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

PROJECT="NeraTouchpoint.xcodeproj"
SCHEME="NeraTouchpoint"
APP_BUNDLE_ID="app.nera.touchpoint"
DERIVED_DATA_PATH="${DERIVED_DATA_PATH:-$PWD/.derived-data}"

if ! xcodebuild -version >/dev/null 2>&1; then
  cat >&2 <<'EOF'
Full Xcode is required. Install Xcode from the App Store, then run:
  sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
  sudo xcodebuild -runFirstLaunch
  xcodebuild -downloadPlatform iOS
EOF
  exit 1
fi

if ! xcrun simctl help >/dev/null 2>&1; then
  cat >&2 <<'EOF'
simctl is unavailable. Make sure xcode-select points at full Xcode:
  sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
EOF
  exit 1
fi

if command -v xcodegen >/dev/null 2>&1; then
  xcodegen generate
fi

DEVICE_NAME="${1:-}"
if [[ -z "$DEVICE_NAME" ]]; then
  DEVICE_NAME="$({
    xcrun simctl list devices available | grep -E 'iPhone (16|15|14)' || true
  } | head -1 | sed -E 's/^[[:space:]]*([^\(]+).*/\1/' | xargs)"
fi

if [[ -z "$DEVICE_NAME" ]]; then
  echo "No available iPhone simulator found. Install an iOS simulator runtime in Xcode Settings > Platforms." >&2
  exit 1
fi

DESTINATION="platform=iOS Simulator,name=$DEVICE_NAME"

echo "Using simulator: $DEVICE_NAME"

xcodebuild \
  -project "$PROJECT" \
  -scheme "$SCHEME" \
  -destination "$DESTINATION" \
  -derivedDataPath "$DERIVED_DATA_PATH" \
  build

APP_PATH="$DERIVED_DATA_PATH/Build/Products/Debug-iphonesimulator/$SCHEME.app"

xcrun simctl boot "$DEVICE_NAME" 2>/dev/null || true
xcrun simctl bootstatus "$DEVICE_NAME" -b
xcrun simctl install "$DEVICE_NAME" "$APP_PATH"
xcrun simctl launch "$DEVICE_NAME" "$APP_BUNDLE_ID"
open -a Simulator
