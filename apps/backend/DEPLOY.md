# Deploy Remi backend (Render — ~5 minutes)

[Render](https://render.com) is the fastest path: connect GitHub, set env vars, get an HTTPS URL. Free tier sleeps after inactivity (first request may take ~30s).

## Option A — Blueprint (recommended)

1. Push this repo to GitHub.
2. Go to [dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint**.
3. Connect the repo. Render reads `/render.yaml` at the repo root.
4. When prompted, set secrets:
   - `ANTHROPIC_API_KEY`
   - `OPENAI_API_KEY` (required for voice)
5. Click **Apply**. Wait for deploy (~2–3 min).
6. Copy your service URL, e.g. `https://remi-backend-xxxx.onrender.com`.

**Verify:**

```bash
curl https://YOUR_URL.onrender.com/health
```

Expect JSON with `"status":"ok"`.

## Option B — Manual web service

1. **New** → **Web Service** → connect repo.
2. Settings:

   | Field | Value |
   |-------|--------|
   | Root Directory | `apps/backend` |
   | Build Command | `npm install --include=dev && npm run build` |
   | Start Command | `npm start` |
   | Health Check Path | `/health` |

3. **Environment** → add:

   | Key | Value |
   |-----|--------|
   | `NODE_ENV` | `production` |
   | `TRUST_PROXY` | `1` |
   | `ANTHROPIC_API_KEY` | your key |
   | `OPENAI_API_KEY` | your key |
   | `ANTHROPIC_MODEL` | `claude-sonnet-4-6` (optional) |

4. Deploy and copy the `.onrender.com` URL.

## Point the mobile app at production

1. Open `apps/mobile/services/config.ts` and set production URL, **or** set EAS env (better for APK builds):

   ```bash
   cd apps/mobile
   eas secret:create --name EXPO_PUBLIC_API_URL --value https://YOUR_URL.onrender.com --scope project
   ```

   Or add to `eas.json` under `preview` / `production`:

   ```json
   "env": {
     "EXPO_PUBLIC_API_URL": "https://YOUR_URL.onrender.com"
   }
   ```

2. Rebuild the app (`eas build ...`) so the URL is baked in.

## Notes

- **HTTPS only** in production builds — Render provides TLS automatically.
- **Never commit** `.env`; use Render’s Environment tab only.
- Free instances **spin down** when idle; upgrade to a paid plan for always-on.
- Rate limits still apply (`RATE_LIMIT_*` env vars optional).

## Other hosts

Same commands work on **Railway**, **Fly.io**, or **Heroku**: root `apps/backend`, build `npm run build`, start `npm start`, set the same env vars and `TRUST_PROXY=1`.
