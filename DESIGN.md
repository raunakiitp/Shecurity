# DESIGN.md — Shecurity

## Art direction thesis
"Quiet confidence." The marketing site feels like a calm, trustworthy editorial
product (warm paper, ink navy, teal reassurance, coral reserved strictly for
danger). The in-app dashboard is a dark "cockpit" (Ink) where the only loud thing
is the danger meter. Nothing flashy; motion is functional and short.

## Color tokens (CSS variables + Tailwind)
| Token | Hex | Use |
|---|---|---|
| ink | #14213D | primary dark, dashboard bg |
| slate-surface | #1F2E4D | cards on dark |
| paper | #F7F4EE | light bg (marketing) |
| sand | #EDE7DB | cards on light |
| teal | #1F7A6D | primary action / safe |
| teal-hover | #186559 | |
| coral | #D1495B | danger/SOS |
| coral-hover | #B83A4B | |
| amber | #E9A23B | caution/watch |
| text-dark | #1B1F2A | text on light |
| muted | #5B6475 | secondary text |
| border | #D8D2C4 | borders on light |
Forbidden: purple/neon gradients, glassmorphism overload, rainbow gradients, gradient buttons.

## Typography
- Headings: **Fraunces** (700, optical size axis) — editorial warmth.
- Body: **Inter** (400/500/600).
- Self-hosted Fraunces + Inter via `public/fonts/fonts.css` (`display=swap` kept). Originally loaded from Google Fonts; moved local after a review found the stylesheet throws a console error whenever fonts.googleapis.com is unreachable (offline demo/sandbox).
- Scale: 12/14/16/20/24/32/48/64 (px). Line-height 1.1 for display, 1.6 body.

## Spacing & shape
- 4px base grid. Section padding 64-96px desktop, 40-56px mobile.
- Radius: buttons/inputs 10px; cards 16px; pills 999px.
- Shadows: layered subtle — `0 1px 2px rgba(20,33,61,.06), 0 8px 24px rgba(20,33,61,.08)`.
- Hover lift on cards: translateY(-2px) max.

## Components (spec)
- **Buttons**: variants primary(teal)/danger(coral)/ghost(outline); sizes sm(36) md(44) lg(52); radius 10px; focus ring `2px teal outline + 2px offset`; press scale .98; loading spinner; disabled 50% opacity. No gradients.
- **Inputs**: label above, helper/error below, focus ring, password show/hide, phone input with country-code select (default +91).
- **Dropdown/select**: custom, keyboard accessible (arrow keys, enter, esc), same field styling.
- **Toggle**: 44×24 track, teal when on, coral when "danger on" (monitoring).
- **Tabs, modal, toast, tooltip, badge, progress bar, stepper**: all in `components/ui`.
- **Cards**: 1px border, layered shadow, 16px radius.

## Motion rules (Framer Motion)
- Page transitions: fade+slide 200-300ms, easeOut.
- Marketing reveals: staggered on scroll (whileInView), 60ms stagger.
- Danger meter: spring-animated needle/arc; danger zone gets a subtle coral pulse (opacity .85↔1, 1.2s) — nothing flashy.
- SOS ring: pulsing ring while holding.
- All gated by `prefers-reduced-motion` (render final states instantly).

## Imagery rules
- Real royalty-free photos (Unsplash/Pexels), downloaded to `public/images/` as WebP, `alt` text, lazy except hero. CREDITS.md with photographer + source.
- Dignified, calm, everyday scenes: women commuting, walking in city streets, using phones, friends supporting each other, calculator on a desk. Never graphic, never violence or distress.
- Inline SVG diagrams (brand colors) for: waveform, rolling buffer timeline, dual verification, duress PIN flow, location share flow.
- Never leave empty image boxes.

## Theme split
- Marketing pages: light (paper bg, ink text).
- App pages (dashboard/vault/settings/calculator): dark Ink theme.
- Danger accents identical across themes for instant recognition.
