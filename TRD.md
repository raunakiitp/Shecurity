# TRD — Shecurity

## Architecture
Pure static SPA (Vite + React 18 + TS). No backend. All data local.

```
┌─────────────────────────── Browser ───────────────────────────┐
│  React Router SPA                                             │
│   ├ Marketing pages (light theme)  ── /  /features  /how ...  │
│   ├ /calculator (stealth, neutral title/favicon)              │
│   └ /dashboard /vault /verify ... (dark theme)                │
│                                                               │
│  ShecurityProvider (global, mounts at app root, survives routing)  │
│   ├ AudioEngine   : getUserMedia → AudioWorklet → 16k mono    │
│   │                  ├─ ring buffer 30s (pre-roll)            │
│   │                  └─ 0.975s windows → YAMNet worker        │
│   ├ DetectionEngine: EMA smoothing, threshold, cooldown, FSM  │
│   ├ KeywordEngine : SpeechRecognition (optional, disclosed)   │
│   ├ AlertEngine   : countdown, PIN check, siren, vibration    │
│   ├ LocationEngine: getCurrentPosition + watchPosition        │
│   └ EvidenceStore : WAV encode, SHA-256, IndexedDB            │
│                                                               │
│  Web Worker (YAMNet TFJS inference) — UI never freezes        │
└───────────────────────────────────────────────────────────────┘
Persistence: localStorage (users/settings) · IndexedDB "shecurity" (clips)
```

## Folder structure
```
src/
  app/          router.tsx, ShecurityProvider.tsx, ProtectedRoute.tsx, theme
  pages/        Landing, Features, HowItWorks, Demo, Login, Signup, Onboarding,
                Calculator, Dashboard, Contacts, Vault, Settings, VerifyEvidence,
                Privacy, NotFound, AlertScreen
  components/   ui/ (buttons, inputs, dropdown, toggle, modal, toast, tabs,
                badge, progress, stepper, tooltip, keypad)
                layout/ (MarketingLayout, AppLayout, NavBar, Footer)
                marketing/ (hero, stats, feature cards, timeline, diagrams)
                dashboard/ (DangerMeter, WaveformCanvas, VerificationCard,
                MonitorSwitch, TestSoundPanel, AlertsTable)
  engine/       audio/ (capture.ts, worklet-url.ts, resample, ring buffer)
                detection/ (yamnet-worker.ts, classIndex.ts, scoring.ts, fsm.ts)
                alert/ (siren.ts, countdown, duress)
                location/ (geo.ts, share.ts)
                crypto/ (pbkdf2.ts, hash.ts)
                storage/ (localStorage.ts, db.ts, wav.ts)
  hooks/        useWakeLock, useShake, useTripleTap, useHotkey
  lib/          types.ts, format.ts, constants.ts
public/
  models/yamnet/ (model.json + shards + class map)
  sounds/ (sample-scream.webm + credits)
  images/ (webp photos + CREDITS.md)
  audio-worklet.js
  _redirects
netlify.toml
```

## Data models
```ts
interface User { id, name, email, passwordHash, salt, iterations, createdAt,
                 pinHash?, pinSalt?, duressHash?, duressSalt?, contacts: Contact[],
                 settings: Settings }
interface Contact { id, name, relation, phone, email?, primary: boolean }
interface Settings { sensitivity: 'low'|'medium'|'high', siren: boolean,
                     vibration: boolean, keywords: boolean, lang: 'hi-IN'|'en-IN',
                     unlockCode: string, watchIntervalMin: number }
interface Clip { id, createdAt, localTime, duration, trigger: 'scream'|'keyword'|'dual'|'manual'|'shake'|'triple-tap'|'shift'|'countdown',
                 peakScore, location?: {lat,lng,accuracy}, device, sha256, duress?: boolean, note?: string }
IndexedDB: db "shecurity", store "clips" (keyPath id) → { meta: Clip, wav: ArrayBuffer }
localStorage keys: shecurity_users, shecurity_session, shecurity_alert_history
(one-time migration copies legacy echo_users / echo_session / echo_alert_history and the legacy
"echo-blackbox" IndexedDB into the new names before first use, then removes the old data)
```

## Detection pipeline (text diagram)
```
mic 48kHz ──worklet──► mono ──linear resample──► 16k Float32
   │                                        │
   │                                        ├─► ring buffer (30s) ──► (frozen on alert)
   │                                        └─► window 15600 samples / hop 4800
   │                                                │
   │                                                ▼
   │                                     worker: mel? no — YAMNet TFJS accepts raw
   │                                     1-D waveform [1,15600] → embeddings → sigmoid
   │                                                │
   │                                                ▼
   │                              weighted classes (by NAME from class map):
   │                                Screaming 1.0 · Yell 0.9 · Shout 0.8
   │                                Bellow 0.6 · Crying, sobbing 0.4 · Whimper 0.4
   │                              (Alarm* excluded)
   │                                                │
   │                                                ▼
   │                              score = max(weight·prob) → EMA(α=0.35)
   │                                                │
   └─ keyword (SpeechRecognition, optional) ──►     ▼
                                    threshold(0.45·sens) for 2 windows
                                                │
                          FSM: single-signal → 15s "Are you safe?" prompt
                               both ≤8s apart → skip prompt → ALERT
                               cooldown 30s
```

## Alert state machine
```
IDLE ──scream/keyword candidate──► VERIFY_PROMPT(15s) ──no reply──► ALERT
IDLE ──scream+keyword ≤8s──► ALERT (skip prompt)
ALERT(10s countdown, siren, vibrate) ──real PIN──► CANCELLED (logged)
ALERT ──duress PIN──► FAKE_CANCEL screen (silent: alert + share + evidence)
ALERT ──10s no input──► PROCEED (same as duress silent path, logged)
any ──SOS hold / shake / triple-tap / Shift×3──► ALERT directly
ALERT ──after evidence+share──► RESOLVED (history entry)
```

## Browser APIs used
getUserMedia · AudioWorklet (fallback ScriptProcessorNode) · Web Audio (siren) ·
TensorFlow.js (YAMNet, WebGL backend, worker) · crypto.subtle (PBKDF2, SHA-256) ·
IndexedDB · localStorage · Geolocation · Screen Wake Lock · Vibration ·
Web Speech (optional) · DeviceMotion · navigator.share · Notification (optional) ·
Leaflet + OSM tiles (evidence map).

## Error handling
Every capability has a graceful path: mic denied → demo still explorable, clear
instructions to re-enable; model fails to load → monitoring disabled with notice +
retry; no Speech API → keyword toggle hidden, scream-only; storage full → oldest-clip
warning; offline → marketing pages cached by browser, tiles degrade; iOS motion
permission requested on first shake use.

## Security / privacy notes
- Audio never leaves the device (exception: optional Web Speech keywords — disclosed).
- Passwords/PINs: PBKDF2-SHA256, 150k iterations, 16-byte random salt, never plain.
- Evidence: IndexedDB, hash-shown; verify tool recomputes SHA-256.
- No analytics, no external calls except OSM map tiles (fonts are self-hosted in `public/fonts/`; YAMNet loads from `public/models/yamnet/`).

## Performance budget
- Landing LCP < 2.5s on 4G; images WebP + lazy (hero eager).
- TensorFlow.js loaded lazily only when monitoring starts (dynamic import in worker).
- Audio work: worker + AudioWorklet thread; main thread only paints canvas at 30fps.
- Route-level code splitting via React.lazy.
- Bundle (excluding tfjs chunk) < 500KB gz; tfjs chunk loaded on demand.
