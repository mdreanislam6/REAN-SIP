# REAN SIP

A modern SIP / VoIP softphone for Android and iOS, built with Expo (React Native) and WebRTC.

REAN SIP registers to your own SIP provider over **SIP over WebSocket (WSS/WS)** and places real
audio calls through WebRTC — no server of ours in the middle, no analytics, no tracking. All
accounts, contacts and call history stay on the device.

## Features

- **Multiple SIP accounts** — save several, switch with one tap, enable/disable individually
- **SIP over WebSocket** — digest authentication, automatic re-registration, reconnect on network change
- **Dialer** — keypad, contact matching while typing, backspace, call from contacts or recents
- **Incoming / outgoing call screens** — accept, decline, hang up, live call timer
- **In-call controls** — mute, DTMF keypad, speakerphone
- **Ringtone and vibration** for incoming calls, both switchable in Settings
- **Call log** — All / Missed filters, one-tap call back
- **Contacts** — add, edit, favourite, block
- **Codec preference** — PCMU / PCMA / G.722 / Opus
- **Diagnostics screen** — live SIP trace so you can see exactly why a registration failed
- **Local-only storage** — no backend, no account, no telemetry

## Requirements

- Node.js 20 or newer
- A SIP provider that supports **WebSocket transport** (most hosted PBX and trunk providers do;
  the WebSocket URL usually looks like `wss://sip.example.com:7443/ws`)

## Run locally

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go for UI work. Note that **real calls need a development build**,
because `react-native-webrtc` is a native module and does not run inside Expo Go:

```bash
npx expo run:android      # needs Android Studio / SDK
```

## Build an APK with GitHub Actions (no local Android SDK, no Expo account)

This repository ships `.github/workflows/android-apk.yml`. Every push to `main` builds the APK on
GitHub's own Ubuntu runner — Java 17, the Android SDK and Gradle are set up by the workflow — and
publishes it as a GitHub Release asset. **No Expo account, no `EXPO_TOKEN` and no secrets are
needed.**

1. Push to `main`, or open the **Actions** tab → *Build Android APK* → **Run workflow**.
2. Wait for the run (first build ≈ 15–25 min, later builds faster).
3. Open **Releases** — `rean-sip.apk` is attached to the newest release. The same file is also
   under the workflow run's **Artifacts**.

Install the APK on an Android phone (allow "install from unknown sources" for your browser or file
manager). The release APK is signed with the debug keystore generated on the runner, which is fine
for installing and testing; for Play Store distribution use the EAS production profile below.

## Build an APK from your own machine

With a free Expo account (EAS builds in the cloud, no Android SDK needed):

```bash
npm install
npm run assets
npm install -g eas-cli
eas login
eas init
eas build --platform android --profile preview
```

`eas.json` already defines the `preview` profile as an installable **APK** (not an AAB).

Or build fully locally, with Android Studio / the Android SDK installed:

```bash
npm install
npm run assets
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

## Configure a SIP account

Open **Settings → SIP accounts → Add SIP account** and fill in:

| Field | Example | Notes |
| --- | --- | --- |
| Display name | `Rean` | Shown on outgoing calls |
| SIP domain | `sip.example.com` | Your provider's SIP domain |
| WebSocket URL | `wss://sip.example.com:7443/ws` | Must be the WebSocket endpoint, not the UDP one |
| Username | `1001` | SIP auth username |
| Password | `••••••` | SIP auth password |
| Transport | `WSS` | Use `WS` only for plain-text local testing |

If registration fails, open **Diagnostics** and read the SIP trace — it shows the exact request and
the provider's response code.

## Project layout

```
src/app/            Expo Router screens (tabs, account, contact, diagnostics)
src/components/     UI components and the in-call overlay
src/lib/sip/        SIP client, digest auth (MD5), WebRTC media, types
src/lib/            storage, formatting, config, SIP React context
scripts/            asset generator (app icon + ringtone)
```

## Limitations

- Incoming calls ring while the app is running. Background/killed-app ringing needs a push
  (VoIP push or a push-notification gateway) and is not part of this build.
- Audio goes through WebRTC, so the SIP server must accept WebSocket transport.
- Call recording is not implemented.

## License

MIT
