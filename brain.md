# brain.md — Shecurity

## Project goal
"Shecurity" (formerly Echo Black Box) — a browser-based women-safety app that disguises itself as a calculator, listens on-device for screams/distress (YAMNet via TensorFlow.js), keeps a rolling 30-second black-box audio buffer so evidence of what happened BEFORE the alarm is captured, confirms danger via dual verification (scream + keywords), supports a duress PIN (fake cancel + silent alert), and shares live location with trusted contacts. Every evidence clip gets a tamper-proof SHA-256 hash and timestamp. HERHACK 2026 submission — 100% free, no paid APIs, no API keys, no external dataset, no paid backend. Pure static frontend deployable on Netlify.

## Decisions made (with reasons)
- **Stack**: Vite + React 18 + TypeScript + React Router + Tailwind + Framer Motion + lucide-react + @tensorflow/tfjs + jspdf + leaflet (+ clsx/tailwind-merge for class utils). As required; all free/open-source.
- **Model hosting**: YAMNet TFJS downloaded from TFHub (`tfhub.dev/google/tfjs-model/yamnet/tfjs/1`) into `public/models/yamnet/` via `npm run fetch-model` (model.json + 4 shards + class map CSV). Verified all files serve locally with HTTP 200 — no third-party URL needed at demo time.
- **Audio pipeline**: getUserMedia (echoCancellation/noiseSuppression/AGC off — Web Audio API properties, not branding) → AudioWorklet (`public/audio-worklet.js`, processor `shecurity-worklet`) → mono mixdown → linear resample to 16 kHz → (a) 30 s ring buffer (black box) and (b) 0.975 s windows → YAMNet worker (TFJS, WebGL backend with CPU fallback). ScriptProcessor fallback implemented if AudioWorklet unavailable.
- **Class handling**: indices found by NAME from `yamnet_class_map.csv` (never hardcoded). Weights: Screaming 1.0, Yell 0.9, Shout 0.8, Bellow 0.6, Crying/sobbing 0.4, Whimper 0.4; Alarm* classes excluded. (The class map itself contains AudioSet class 506 "Echo" — model data, untouched.)
- **Scoring**: `screamScore = max(weight·prob)` per window → EMA(α=0.35) → trigger when smoothed ≥ threshold for ≥2 consecutive windows → 30 s cooldown. Thresholds: Low 0.60 / Medium 0.45 / High 0.30.
- **Black box**: raw PCM ring buffer (never MediaRecorder chunks — not independently playable). On alert: freeze 30 s pre-roll, record 30 s post-roll, concatenate → WAV 16-bit @16 kHz (`engine/storage/wav.ts`) → SHA-256 via `crypto.subtle` → IndexedDB `shecurity.clips` (cap 20; one-time migration from legacy `echo-blackbox`).
- **Alert FSM**: idle → prompt ("Are you safe?" 15 s, single signal) OR → countdown (dual signal ≤8 s, or prompt timeout) → 10 s countdown (siren+vibration+PIN pad) → real PIN cancels | duress PIN fakes cancel + silently records evidence + location | timeout proceeds silently. All outcomes logged to alert history.
- **PINs**: PBKDF2-SHA256 150k iterations + 16-byte random salt (same as passwords). Verified round-trip during onboarding.
- **Calculator**: precedence-climbing parser (no eval). Verified 7.5+3=10.5 in the browser. Secret code `1234=` opens `/dashboard`; wrong codes → normal math/Error like a real calculator. Calculator screen stays fully neutral (title "Calculator", no brand strings) — exception honored during the Shecurity rename.
- **Duress unlock on the calculator**: documented as roadmap (v2); duress PIN applies on the alert countdown screen.
- **Location sharing**: one tap per send (browser security) → "Next contact" stepper; message template with Maps link + accuracy; quick-dial 112/1091/181/100.
- **Images**: downloaded from Unsplash into `public/images/` as WebP (no hotlinking) with `CREDITS.md`; alt text everywhere; lazy loading except hero. The auto-rickshaw photo 404'd from the first source and was replaced with a verified alternative (Tom Rumble).
- **Sample sound**: Pixabay CDN blocked direct downloads (HTTP 403), so `fetch-assets.mjs` synthesizes a 2.5 s "scream-like" formant sweep WAV — YAMNet scores it in the Shout/Yell region so the demo works with zero licensing risk. Replaceable with any royalty-free sample; credited in `public/sounds/CREDITS.md`.
- **PWA icons**: pngjs generates real PNGs (192/512); manifest wired in index.html.
- **Favicon**: neutral calculator glyph; the Calculator page sets `document.title = "Calculator"` (stealth), AppLayout restores "Shecurity — Dashboard".
- **Wake Lock**: requested while monitoring is ON, re-acquired on visibilitychange, released on stop.
- **PWA**: manifest + icons only, no service worker (avoids stale-cache issues during demos).
- **Demo user**: "Continue as Demo User" creates/uses a local account `demo@shecurity.app` with 3 sample contacts, unlock code 1234=, Real PIN 1234, Duress PIN 9999 (hashed on creation), onboarded=true.
- **RENAME (Echo → Shecurity)**: provider file/`ShecurityProvider`/`useShecurity`/context values, worklet processor name, WAV/PDF/evidence filenames, share title, demo email, manifest, package.json name, netlify.toml, index.html title+meta, and every UI string (navbar/footer/hero/onboarding/dashboard/vault/PDF/toasts/modals). Storage: `shecurity_users` / `shecurity_session` / `shecurity_alert_history` and IndexedDB `shecurity`, with one-time automatic migrations from the legacy `echo_*` keys and `echo-blackbox` DB (copy-then-delete, never overwrites newer data, no-ops when absent). The rename sweep script (`npm run` equivalent: `node scripts/verify-rename.mjs`) reports 0 unexpected hits repo-wide (only intentional legacy-migration strings, the `echoCancellation` Web Audio property, and AudioSet class-map data remain).
- **CONTRAST (WCAG AA on dark surfaces)**: added tokens in one place — `tailwind.config.ts` + CSS vars: `mist #B4BCCB` (secondary text, 7.1–8.4:1 on ink/surface), `steel #9AA5BC` (icons/placeholders, 5.5–6.5:1), `lineDark #6B7BA6` (borders, 3.2–3.8:1), `teal-light` re-tuned `#3FBFAE` (5.96–7.05:1 as text), new `coral-light #F2A0AB` (6.7–7.9:1 as text). Replaced all `text-paper/40–70` opacity text on dark pages with tokens; alert screens (teal/coral full-bleed) use solid white text (white on teal 5.17:1; white on coral 4.36:1 reserved for large countdown digits, 3:1 large-text rule). `dark` class applied to app shells only; marketing pages untouched. Programmatic check `scripts/verify-contrast.mjs` (alpha-composited backgrounds, WCAG math): 0 failures on dashboard/contacts/vault/settings at 1366px and 375px, 0 horizontal overflow, screenshots in `dist/ui-evidence/`.
- **Fonts**: self-hosted Fraunces + Inter via `public/fonts/fonts.css` (`display=swap` kept). Originally loaded from Google Fonts; moved local after a review found the stylesheet throws a console error whenever fonts.googleapis.com is unreachable (offline demo/sandbox).
- **ESLint**: flat `@typescript-eslint` + react-hooks config added; lint is green (0 errors, 0 warnings, `--max-warnings 0`). Event-handler `Function` types replaced with proper signatures; speech events typed; `any`s removed; the fake `useKeywordSupported()` helper (a rules-of-hooks violation) renamed to plain `keywordSupported()`.
- **Context split**: `useShecurity`/context/constants moved to `src/app/shecurity-context.ts` so `ShecurityProvider.tsx` only exports a component (react-refresh requirement).

## Current phase
COMPLETE — rename + contrast + lint/typecheck/build all green.

## Completed phases checklist
- [x] Phase 0 docs (brain/PRD/TRD/DESIGN/TASKS)
- [x] Phase 1 scaffold + design system (tokens, fonts, UI kit, router, code splitting)
- [x] Phase 1.1 assets (YAMNet local, sample sound, 6 WebP photos + credits, PWA icons)
- [x] Phase 2 auth (PBKDF2), demo user, onboarding stepper, settings
- [x] Phase 3 stealth calculator + secret unlock + panic lock (browser-verified)
- [x] Phase 4 audio engine + YAMNet + danger meter + waveform + test-sound panel
- [x] Phase 5 black box + WAV + SHA-256 + IndexedDB + Vault + PDF + public /verify
- [x] Phase 6 keyword engine + dual-verification FSM
- [x] Phase 7 alert countdown + duress + location share + triggers
- [x] Phase 8 marketing site
- [x] Phase 9 quality: errors handled, PWA manifest, code splitting, netlify.toml + _redirects, README
- [x] RENAME Echo → Shecurity everywhere (repo sweep: 0 unexpected hits) + storage migrations
- [x] CONTRAST AA pass on all dark surfaces (token-based; 0 failures at 1366px/375px)
- [x] Lint 0/0 + typecheck clean + build exit 0 (all three gates re-run after refactor)
- [x] Browser re-verification after refactor: landing/demo/calculator (7.5+3=10.5)/unlock/dashboard/panic-lock/vault/verify all pass, 0 console errors on all 15 routes in both network modes

## Manual test matrix (results)
- Calculator math verified in browser (7.5+3=10.5) — still passing after rename/refactor.
- Secret code unlock verified (1234= → /dashboard, title "Shecurity — Dashboard").
- Lock button verified (dashboard → /calculator instantly, title "Calculator").
- Landing/hero verified with title "Shecurity"; demo, contacts, vault, settings, verify pages render with correct headings.
- Contrast: 0 AA failures (composited check) at both viewports; 0 horizontal overflow.
- All 15 routes crawled: 0 console/page errors, both normal network and external-hosts-blocked.
- NOT verifiable headless (needs real mic/GPS/user gesture — documented for the judge to try live): real scream detection end-to-end, WAV hash Match/Tampered with real file, WhatsApp link opening, vibration.

## Known issues
- Vite warns auth.ts is both statically and dynamically imported (harmless; keeps one chunk).
- "tensorflow"/"leaflet" manual chunks are empty because tfjs is only dynamically imported inside the worker; harmless.
- React Router v7 future-flag warning (informational, dev only).

## Next steps
- Optional polish: swap synthetic sample for a real royalty-free scream; add Playwright E2E; record a demo video for submission.

## Browser limitations
- Mic/location require HTTPS (Netlify provides it; localhost exempt).
- A web page cannot run with the screen off — Wake Lock keeps the screen on while monitoring.
- A web page cannot detect hardware power-button presses (native roadmap; honesty card in Settings).
- Web Speech API sends audio to Google's service in Chrome (disclosed in UI/Settings/Privacy); Safari/Firefox lack it → keyword toggle hidden, scream-only mode.
- iOS requires a user gesture to start DeviceMotion/shake; `navigator.vibrate` is Android-only.
- Browsers open one share link per user tap — the share panel steps contact-by-contact.
- Headless/CI: mic + geolocation prompts can't be granted, so full end-to-end audio tests need a real browser session.
