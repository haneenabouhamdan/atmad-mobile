# ATMAD Mobile

The ATMAD Luxury Magazine mobile app — built with [Expo](https://expo.dev) (React Native), Supabase (auth + codes + DB) and Sanity (CMS).

This is a standalone repo. The web app and backend (Supabase migrations / Edge Functions / Sanity Studio) live in a separate repo — this project only contains the iOS + Android client.

---

## Quick start (local dev)

Requirements: Node 22+, npm, [Expo Go](https://expo.dev/client) on your phone (or an Android emulator / iOS simulator).

```bash
nvm use                  # picks up Node 22 from .nvmrc
cp .env.example .env     # then fill in the four EXPO_PUBLIC_* values
npm install
npm run start            # then press `a` for Android, `i` for iOS, or scan the QR
```

The four env vars come from your Supabase project (URL + anon key) and your Sanity project (project id + dataset). See the backend repo's `SETUP_CHECKLIST.md` if you haven't provisioned them yet.

---

## Project layout

```
.
├── App.tsx                  Root component (fonts, gesture/safe-area providers, navigation)
├── index.ts                 Expo entry
├── app.json                 Expo config (bundle id, permissions, plugins, splash, icons)
├── eas.json                 EAS Build/Submit profiles (dev / preview / production)
├── babel.config.js          Babel preset for Expo + Reanimated
├── tsconfig.json
├── assets/                  App icon, adaptive icon, splash, favicon
└── src/
    ├── auth/                AuthProvider, OTP flow, biometrics
    ├── components/          Shared UI primitives
    ├── data/                Sanity + Supabase service layers (codes, content)
    ├── hooks/               Reusable hooks
    ├── lib/                 Env, supabase client, sanity client, secure storage
    ├── navigation/          RootNavigator + stacks + tabs
    ├── screens/             auth / home / issue / profile / vault / wallet
    ├── store/               Zustand stores
    └── theme/               Design tokens (colors, type, spacing)
```

---

## Deploying to Google Play (Android)

### One-time setup

1. **Install EAS CLI**

   ```bash
   npm install -g eas-cli
   eas login
   ```

2. **Create the EAS project** (writes the `projectId` into `app.json → expo.extra.eas`)

   ```bash
   eas init
   ```

3. **Reserve the package name on Play Console**
   - Go to [play.google.com/console](https://play.google.com/console) → **Create app**.
   - Set the package name to `com.atmad.luxurymagazine` (matches `app.json → android.package`).
   - Fill in the store listing basics (title, short description, screenshots, content rating, privacy policy URL, data safety form). You don't need a finished build yet — drafts are fine.

4. **Create a Google Play service account** (so EAS can upload builds for you)
   - Play Console → **Setup → API access** → **Create new service account** → follow the link to Google Cloud → create a service account with role *Service Account User* → download a JSON key.
   - Back in Play Console → **Grant access** to that account with permission *Release manager*.
   - Save the JSON key in this folder as `play-service-account.json` (already gitignored).

### Build a release `.aab`

```bash
eas build --profile production --platform android
```

EAS builds in the cloud (~10–20 min), signs with an EAS-managed keystore, and gives you a `.aab` URL. Download it if you want to upload manually, or skip straight to:

### Submit to the Play Store

```bash
eas submit --profile production --platform android --latest
```

This uploads the latest production build to the **Internal testing** track (per `eas.json → submit.production.android.track`). Promote to **Closed testing → Open testing → Production** from the Play Console UI when you're ready.

### Subsequent releases

```bash
eas build --profile production --platform android
eas submit --profile production --platform android --latest
```

`autoIncrement: true` in `eas.json` means EAS bumps `versionCode` automatically each build. Bump `expo.version` in `app.json` when you ship a user-visible release (e.g. `1.0.0` → `1.0.1`).

### OTA updates (no rebuild required)

For JS-only changes you can ship updates over-the-air without going through Play review:

```bash
eas update --branch production --message "fix: typo on home screen"
```

---

## Deploying to the App Store (iOS) — for completeness

```bash
eas build --profile production --platform ios
eas submit --profile production --platform ios --latest
```

Fill in `appleId`, `ascAppId`, `appleTeamId` in `eas.json → submit.production.ios` first.

---

## Useful commands

| Command                                  | What it does                                       |
|------------------------------------------|----------------------------------------------------|
| `npm run start`                          | Start Metro bundler (Expo Go)                      |
| `npm run android` / `npm run ios`        | Boot Android emulator / iOS simulator              |
| `npx expo start --tunnel`                | Tunnel for testing on a real device on a hotspot   |
| `npx expo prebuild`                      | Generate native `ios/` + `android/` folders        |
| `eas build --profile preview -p android` | Build a shareable internal `.apk`                  |
| `eas build --profile production -p android` | Build a Play Store `.aab`                       |
| `eas submit --profile production -p android --latest` | Upload latest build to Play Console   |
| `eas update --branch production -m "..."`| Ship a JS/asset OTA update                         |

---

## Backend dependencies

The app talks to two backends:

| Service  | Used for                              | Configured via              |
|----------|---------------------------------------|-----------------------------|
| Supabase | Phone-OTP auth, profiles, code redeem | `EXPO_PUBLIC_SUPABASE_*`    |
| Sanity   | Articles, brands, influencers, issues | `EXPO_PUBLIC_SANITY_*`      |

Provisioning instructions live in the backend repo (`SETUP_CHECKLIST.md`). The mobile app ships only the public anon key — the service role key and HMAC secret stay server-side as Edge Function secrets.
