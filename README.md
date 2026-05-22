# Remi

**Remi** is an AI thought partner: dump messy thoughts (text or voice), and get structured tasks, mood, focus, and insights. The mobile app talks to a small Express backend powered by Claude (and Whisper for transcription).

## What's in the repo

| Path | Description |
|------|-------------|
| `apps/mobile` | Expo (React Native) app — dump screen, voice, history, insights |
| `apps/backend` | Express API — `/api/process`, `/api/transcribe`, rate limiting |

## Features

- **Brain dump → organize** — Claude turns raw text into summary, mood, focus item, and tasks (with inferred due dates, projects, action types)
- **Contextual processing** — last 3 dump summaries sent as context for pattern-aware insights
- **Voice input** — record → Whisper transcription → edit → organize
- **History** — local storage of past dumps
- **Insights** — 7-day mood trend, task categories, stats, and “your patterns”
- **Dev fallback** — mock parser when `ANTHROPIC_API_KEY` is unset

## Prerequisites

- **Node.js** 20+ and npm
- **Expo Go** on a physical device, or iOS Simulator / Android emulator
- API keys (see below)
- For **release builds**: [Expo account](https://expo.dev/signup) (free tier works) and [EAS CLI](https://docs.expo.dev/build/setup/)

---

## Local development

### 1. Backend

```bash
cd apps/backend
cp .env.example .env
```

Edit `.env`:

```env
ANTHROPIC_API_KEY=sk-ant-...          # Required for real AI processing
OPENAI_API_KEY=sk-...                 # Required for voice transcription
ANTHROPIC_MODEL=claude-sonnet-4-6     # Optional
PORT=3001
```

```bash
npm install
npm run dev
```

Server runs at `http://localhost:3001`. Health check: `GET /health`.

Without `ANTHROPIC_API_KEY`, the process route uses a local mock parser (fine for UI dev).

### 2. Mobile app

```bash
cd apps/mobile
npm install
npx expo start
```

- Press `i` / `a` for simulator, or scan the QR code with **Expo Go**.
- In dev, the app picks the API host from the Metro debugger (same machine as Expo). Android emulator uses `10.0.2.2:3001`; iOS simulator uses `localhost:3001`.
- **Physical device**: phone and laptop must be on the same Wi‑Fi; backend must listen on `0.0.0.0` (default for `npm run dev`).

### 3. Production API URL (before store builds)

Update the non-dev base URL in `apps/mobile/services/config.ts`:

```ts
export const API_BASE_URL = __DEV__
  ? `http://${getDevApiHost()}:3001`
  : 'https://api.yourdomain.com';   // ← your deployed backend
```

Deploy the backend somewhere with HTTPS (Railway, Render, Fly.io, AWS, etc.), set env vars there, and optionally `TRUST_PROXY=1` if behind a reverse proxy.

---

## Generate an Android APK

Expo SDK 54 uses **EAS Build** for reliable release binaries. You build in the cloud (no local Android Studio required for the first APK).

### One-time setup

```bash
npm install -g eas-cli
eas login
cd apps/mobile
eas build:configure
```

This creates `eas.json`. For a **test APK** (easy to sideload), use a profile like:

```json
{
  "cli": { "version": ">= 16.0.0" },
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### Build the APK

```bash
cd apps/mobile
eas build -p android --profile preview
```

- Wait for the build on [expo.dev](https://expo.dev) → your project → **Builds**.
- Download the `.apk` when finished.
- Install on a device: enable **Install unknown apps**, transfer the APK, open it.

### Local APK (advanced)

If you need a fully local build:

```bash
cd apps/mobile
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`. You must configure signing (keystore) for installs and Play Store. EAS is simpler for most teams.

---

## Publishing checklist

### Before you ship

- [ ] Set production `API_BASE_URL` in `apps/mobile/services/config.ts` (or move to `app.config` / env via `expo-constants`)
- [ ] Deploy backend with HTTPS, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, and secrets not in git
- [ ] Bump `version` in `apps/mobile/app.json` (and `versionCode` / build numbers via EAS or `app.json` android section)
- [ ] Replace placeholder icons/splash if needed (`apps/mobile/assets/`)
- [ ] Test voice, organize, history, and insights on a **release** build (not only Expo Go)

### Backend in production

- Run `npm run build && npm start` in `apps/backend`, or use the platform’s Node start command.
- Set: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `PORT`, optional rate limit env vars (`RATE_LIMIT_*`), `TRUST_PROXY=1` behind nginx/load balancer.
- Never commit `.env`; rotate keys if exposed.

---

## API overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Status and process mode (anthropic vs mock) |
| `/api/process` | POST | `{ text, previousContext? }` → structured dump JSON |
| `/api/transcribe` | POST | `{ audio: base64, mimeType? }` → `{ text }` |

Rate limits apply per IP on `/api/*` (see `apps/backend/src/middleware/rateLimit.ts`).

---

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| Organize fails on device | Same Wi‑Fi as dev machine; check backend URL in Metro logs; use inline error on dump screen |
| 401 from Anthropic | Valid `ANTHROPIC_API_KEY` in backend `.env`; restart `npm run dev` |
| Voice fails | `OPENAI_API_KEY` set; microphone permission granted |
| Android emulator can’t reach API | Backend on host; app uses `10.0.2.2:3001` in dev |

---

## License

Private / hackathon project — add a license file if you open-source.
