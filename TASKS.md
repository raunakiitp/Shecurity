# TASKS.md — Shecurity

## Phase 0 — Documentation
- [x] brain.md (living memory)
- [x] PRD.md
- [x] TRD.md
- [x] DESIGN.md
- [x] TASKS.md
- [x] README.md (written at the end)

## Phase 1 — Scaffold + design system
- [x] Vite + React 18 + TS + Tailwind + Framer Motion + lucide-react scaffold
- [x] Color tokens (CSS vars + Tailwind), light marketing / dark app theme split
- [x] Fraunces + Inter typography (self-hosted in `public/fonts/`, display=swap)
- [x] UI kit: Button (3 variants × 3 sizes, loading, disabled), Field (labels, errors, password show/hide, strength meter), Select (keyboard accessible), PhoneField (country codes, +91 default), Toggle, Badge, Modal, Toast, Tooltip, ProgressBar, Stepper, Tabs, Cards
- [x] Router shell with all routes + React.lazy code splitting
- [x] Imagery: 6 WebP photos downloaded + CREDITS.md, alt text, lazy loading (hero eager)

## Phase 1.1 — Assets
- [x] `npm run fetch-model` downloads YAMNet TFJS model.json + 4 shards + class map to public/models/yamnet (verified local HTTP 200)
- [x] Sample "scream" in public/sounds (synthesized sweep — Pixabay CDN 403'd; credited)
- [x] PWA icons (pngjs) + manifest

## Phase 2 — Auth + onboarding
- [x] Signup (name, email, PBKDF2 password 150k iters, strength meter, confirm)
- [x] Login (remember me, session token) + protected routes + logout
- [x] "Continue as Demo User" (pre-filled contacts, PINs hashed)
- [x] Onboarding stepper: welcome / permissions (mic, location, notifications, wake-lock check) / contacts (1-5, primary star) / PINs (real+duress, differ, confirm twice, round-trip verified) / calculator unlock code + preview
- [x] Signup-page disclosure note ("Demo build: accounts are stored only on your device.")
- [x] Settings page can change everything later (sensitivity, keywords+disclosure, language, siren, vibration, PINs, unlock code, power-button honesty card)

## Phase 3 — Stealth calculator + hidden dashboard
- [x] Full calculator (digits, +−×÷, %, ±, decimal, ( ), C, backspace, precedence parser, no eval) — verified 7.5+3=10.5 in browser
- [x] Secret code + `=` → dashboard transition (verified) ; wrong codes = normal math
- [x] Lock button (verified) + double-tap title panic return
- [x] Engine in global provider; calculator shows no listening sign; neutral title "Calculator"

## Phase 4 — Audio engine + YAMNet + danger meter
- [x] getUserMedia with echoCancellation/noiseSuppression/AGC off
- [x] AudioWorklet (public/audio-worklet.js) with ScriptProcessor fallback, mono, resample 16k
- [x] YAMNet inference in Web Worker; "Preparing on-device AI…" state
- [x] Class indices by NAME; weights Screaming 1.0/Yell .9/Shout .8/Bellow .6/Crying .4/Whimper .4; Alarm excluded
- [x] EMA smoothing; threshold by sensitivity (0.60/0.45/0.30); ≥2 windows; 30s cooldown
- [x] Semicircular danger gauge 0-100 (canvas, animated), waveform canvas, top-3 labels with confidence bars
- [x] Zones Safe/Watch/Danger + state text (Listening… / Unusual sound / Possible distress)
- [x] "Test with sound" panel + credit + instructions
- [x] Monitoring ON/OFF + status pills + uptime counter
- [x] Wake Lock while monitoring + re-acquire on visibility change

## Phase 5 — Black box + vault + hash
- [x] 30s PCM ring buffer (no MediaRecorder slicing)
- [x] Freeze pre-roll + 30s post-roll → WAV 16-bit @16k
- [x] "Recording evidence… Ns left" indicator
- [x] IndexedDB save with metadata (id, ISO+local time, duration, trigger, peak score, location, device, sha256, duress marker)
- [x] SHA-256 hex + copy button; cap 20 clips with warning
- [x] Vault: waveform preview, play, download, delete-confirm, timestamp, mini OSM map, trigger badges, storage estimate
- [x] PDF report (jsPDF) with hash, map link, verification instructions, disclaimer
- [x] Public /verify page (drag & drop + expected hash → Match/Tampered, no login)

## Phase 6 — Keywords + dual verification
- [x] Web Speech continuous recognition, hi-IN default + en-IN toggle, auto-restart on end
- [x] Keyword list (Hindi/Hinglish/English incl. Devanagari) normalized + fuzzy (levenshtein ≤1) match
- [x] Honest disclosure UI (Settings + Privacy page); optional; hidden when unsupported
- [x] Graceful fallback to scream-only (unsupported browsers)
- [x] FSM: single signal → "Are you safe?" 15s prompt; both ≤8s → straight to alert (95%+)
- [x] Verification card: Sound/Words chips + animated confidence bar

## Phase 7 — Alert flow + duress + location
- [x] 10s countdown ring, siren (Web Audio, mutable), vibration pattern
- [x] Real PIN → cancel + log; Duress PIN → fake "Alert cancelled ✔" + silent evidence+location; wrong → shake + attempts counter
- [x] Location: getCurrentPosition + watchPosition + accuracy in message
- [x] Message template + share panel (checkboxes, WhatsApp/SMS/copy/Web Share, Next-contact stepper)
- [x] "Send location update" button + sharing UI disclosure (tap required per send)
- [x] Quick dial 112/1091/181/100 (tel: links)
- [x] Alert history log with outcome badges (cancelled / silent-duress / proceeded)
- [x] SOS hold 1.5s with progress ring, shake-to-SOS (3 shakes/2s), calculator triple-tap, Shift×3
- [x] Power-button limitation card in Settings (honest, no fake)

## Phase 8 — Marketing site
- [x] Sticky navbar + footer (HERHACK 2026, team placeholder, GitHub link)
- [x] Landing: hero + photo + floating mini danger-meter card + trust badges; problem cards (3, no fake stats); 6-feature grid; 4-step timeline; privacy promise; CTA band
- [x] Features page: 9 alternating split layouts with scroll animations + 5 inline SVG diagrams (waveform, buffer, dual, duress, location)
- [x] How It Works: 6-step walkthrough with deep-link CTAs + Judge Demo Script (collapsible)
- [x] Live Demo page (one-tap demo user → calculator or dashboard)
- [x] Privacy & Limitations page (plain language, honest exceptions)

## Phase 9 — Quality + deploy
- [x] Friendly error states (mic denied w/ re-enable instructions, model load failure + retry hint, no speech API fallback, storage cap warning, offline assets all local)
- [x] PWA manifest + icons + theme color
- [x] Code-split routes; tfjs only in worker chunk; images compressed WebP
- [x] Manual test matrix documented in brain.md
- [x] Build passes: `tsc -b && vite build` exit 0; console clean
- [x] netlify.toml + public/_redirects + README deploy steps (drag-drop + Git)
- [x] Browser-verified: landing render, demo user, calculator math, secret unlock, dashboard render, panic lock

## Rename: Echo → Shecurity
- [x] UI text everywhere (navbar, footer, hero, onboarding, dashboard, vault, PDF header, toasts, modals, share title, document titles)
- [x] `<title>`, meta description, manifest name/short_name, package.json name (+ lockfile), netlify.toml comment
- [x] README.md, PRD.md, TRD.md, DESIGN.md, TASKS.md, brain.md
- [x] Code identifiers: EchoProvider→ShecurityProvider, useEcho→useShecurity, EchoProcessor→ShecurityProcessor, worklet 'shecurity-worklet', clip/PDF filenames, demo email
- [x] Storage keys echo_*→shecurity_* + one-time migration (copy-then-delete, non-destructive)
- [x] IndexedDB echo-blackbox→shecurity + one-time migration (includes databases() availability check)
- [x] Calculator exception honored: neutral title "Calculator", zero branding on screen
- [x] Repo-wide case-insensitive sweep: 0 unexpected hits (`node scripts/verify-rename.mjs`)

## Dashboard contrast (WCAG AA)
- [x] Tokens added centrally: tailwind.config.ts + CSS vars — mist #B4BCCB (secondary text), steel #9AA5BC (icons/placeholders), lineDark #6B7BA6 (borders); teal-light re-tuned #3FBFAE; coral-light #F2A0AB added
- [x] All text-paper/40–70 opacity text on dark pages replaced with tokens (Dashboard, Contacts, Vault, Settings, Onboarding, AlertScreen, dashboard components)
- [x] Canvas labels (danger meter, waveform) use token hexes; state text uses teal-light/amber/coral-light
- [x] Badges, tabs, stepper, modal, tooltip, progress, toggle-off track, selects, inputs dark variants fixed
- [x] Alert screens: solid white text (white-on-teal 5.17:1; white-on-coral 4.36:1 = large-text rule)
- [x] `dark` class on app shells only; marketing pages untouched
- [x] Programmatic AA verification with alpha-composited backgrounds: 0 failures at 1366px + 375px, 0 horizontal overflow (scripts/verify-contrast.mjs, screenshots in dist/ui-evidence/)

## Quality gates (final)
- [x] ESLint configured + 0 errors / 0 warnings (--max-warnings 0)
- [x] Typecheck clean
- [x] Production build exit 0
- [x] Browser re-verification after refactor: full flow + all 15 routes, 0 console errors (normal + blocked-external modes)
