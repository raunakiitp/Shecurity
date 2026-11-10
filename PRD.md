# PRD — Shecurity

## Problem statement
In an emergency, a woman often cannot make a call, type a message, or even unlock her phone openly. Calling for help audibly can escalate danger. Existing SOS apps require explicit actions that may be impossible in the moment. **Shecurity** flips the model: the phone already in her hand — disguised as a calculator — is listening for distress (on-device), keeps the last 30 seconds of audio as a black box (like an aircraft recorder), and turns the moment into verifiable evidence + live location shared with people she trusts.

## Target users
Women and girls in situations where overtly calling for help is risky; anyone who wants discreet evidence capture with consent-based, on-device processing.

## Personas
1. **Priya, 21, college student commuting at night** — walks 15 minutes from the bus stop; wants something that works without her taking the phone out and typing.
2. **Anita, 34, working woman using auto/cab** — travels alone in cabs late; wants the ride recorded (black box) and location shared automatically if something happens.
3. **Meera, 27, lives alone** — wants a way for family in another city to know immediately if something is wrong, plus tamper-proof evidence.

## User stories
- As a user, I can open a normal-looking calculator that secretly contains the safety app.
- As a user, I type my secret code and the hidden dashboard appears.
- As a user, the app listens **on-device** for screams and shows a live danger meter.
- As a user, the last 30 seconds of audio are always buffered, so evidence of what happened **before** the alert is saved.
- As a user under duress, I can enter a duress PIN that shows "cancelled" while silently sending alerts.
- As a user, my trusted contacts receive my live location via WhatsApp/SMS/share.
- As a user, every evidence clip has a SHA-256 hash + timestamp I can verify (even publicly).
- As a judge, I can test everything in 2 minutes without making noise, using a bundled sample.
- As a user, I can trigger SOS by holding a button, shaking the phone, triple-tapping the calculator display, or pressing Shift 3 times.

## Feature list (priority)
| # | Feature | Priority |
|---|---------|----------|
| 1 | Stealth calculator + secret unlock code | P0 |
| 2 | On-device YAMNet scream detection + danger meter | P0 |
| 3 | Black box 30s pre-roll + 30s post-roll WAV evidence with SHA-256 | P0 |
| 4 | Alert countdown with Real vs Duress PIN | P0 |
| 5 | Location capture + share to trusted contacts (WhatsApp/SMS/share) | P0 |
| 6 | Trusted contacts management (onboarding + settings) | P0 |
| 7 | Evidence Vault (list, play, download, verify, PDF report) | P0 |
| 8 | Public /verify page (hash check, no login) | P1 |
| 9 | Dual verification (scream + keyword) | P1 |
| 10 | Alternate triggers (SOS hold, shake, triple-tap, Shift×3) | P1 |
| 11 | Keyword detection (Web Speech, optional, disclosed) | P1 |
| 12 | Marketing site (landing/features/how/demo/privacy) | P1 |
| 13 | PWA manifest | P2 |
| 14 | Sensitivity settings, siren toggle, silent mode | P2 |

## Success metrics
- Judge can run the full demo flow in ≤2 minutes without a mic (sample scream).
- YAMNet detects the bundled sample scream (danger zone reached) with false positives on normal speech staying below the trigger threshold.
- Evidence clip duration ≈60s (30 pre + 30 post) and hash verifies as "Match".
- All core flows work on Chrome desktop + Android; build passes with no type errors.

## Non-goals (v1)
- Native app (power-button trigger, screen-off operation) — documented roadmap.
- Paid APIs, cloud storage, servers, telemetry.
- Auto-sending messages without user taps (browser limitation).
- Replacing emergency services; the app complements, never replaces, 112.
