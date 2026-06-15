# BSV Remote Signer — Design System

Last updated: 2026-06-15

## Direction & Feel

**Product:** Desktop webapp for pairing a mobile BSV wallet as a remote signer via encrypted QR.

**Human:** Developer or power user at a desktop machine, security-conscious, needs clarity about connection state before signing.

**Task:** Choose connection method → scan QR → execute wallet requests with confidence.

**Feel:** Calm, secure, precise — like setting up a hardware wallet or 2FA device. Not playful crypto-bro; not cold terminal either.

**Signature element:** QR scan frame with animated corner brackets, pulse ring, and scan line while awaiting pairing. This is the one visual that could only belong to this product.

## Depth Strategy

**Surface color shifts** — no drop shadows on layout surfaces. Hierarchy via whisper-quiet elevation steps on the same cool hue family. Borders at low opacity (`color-mix`) for structure; brand-tinted borders for emphasis only.

Exception: QR code area uses a white inset (real QR needs contrast) wrapped in the scan frame.

## Spacing

**Base unit:** 4px (Tailwind default). Use multiples consistently:

| Context | Scale |
|---------|-------|
| Micro (icon gaps, badge dot) | 2px (`gap-0.5`, `gap-2`) |
| Component internal | 12–16px (`p-3`, `p-3.5`, `p-4`, `gap-3`) |
| Card padding | 24–32px (`p-6`, `p-8`) |
| Section separation | 24–32px (`gap-6`, `gap-8`) |
| Page margins | 16–24px (`px-4 sm:px-6`, `py-8 sm:py-10`) |

**Max content width:** `max-w-6xl` for main shell; `max-w-lg` for modals; `max-w-sm` for focused panels.

## Typography

| Role | Family | Size / Weight |
|------|--------|---------------|
| UI text | DM Sans (`font-sans`) | body `text-sm`, headings `text-base`–`text-xl font-semibold` |
| Data / session IDs / log | JetBrains Mono (`font-mono`) | `text-xs` |
| Section labels | DM Sans | `text-[11px] font-medium uppercase tracking-wider text-ink-muted` |
| Metadata | DM Sans | `text-xs text-ink-tertiary` |

Fonts loaded in `frontend/index.html` via Google Fonts.

## Color Tokens

Defined in `frontend/src/index.css` `@theme` block. Use Tailwind classes (`bg-canvas`, `text-ink-secondary`, etc.) — never raw hex in components.

### Surfaces (dark mode, higher = lighter)

| Token | Hex | Role |
|-------|-----|------|
| `canvas` | `#0a0e17` | Page background |
| `surface` | `#111827` | Cards, header, modal body |
| `surface-raised` | `#1a2234` | Hover states, secondary cards |
| `surface-inset` | `#070b12` | Inputs, chips, icon wells |

### Text hierarchy

| Token | Hex | Role |
|-------|-----|------|
| `ink` | `#f1f5f9` | Primary text |
| `ink-secondary` | `#94a3b8` | Supporting copy |
| `ink-tertiary` | `#64748b` | Metadata, descriptions |
| `ink-muted` | `#475569` | Disabled, placeholders, labels |

### Borders

| Token | Role |
|-------|------|
| `border` | Standard separation (12% slate mix) |
| `border-soft` | Softer dividers (6% slate mix) |
| `border-emphasis` | Brand-tinted emphasis (35% amber mix) |

### Brand & semantic

| Token | Hex | Role |
|-------|-----|------|
| `brand` / `brand-hover` | `#f59e0b` / `#fbbf24` | Primary actions, scan frame, active step |
| `brand-muted` | 12% amber mix | Icon wells, hover backgrounds |
| `success` / `success-muted` | `#34d399` | Connected state, completed steps |
| `warning` / `warning-muted` | `#fbbf24` | Pending / awaiting scan |
| `error` / `error-muted` | `#f87171` | Errors, expired sessions |

Color temperature: cool slate structure + warm amber accent. Semantic greens/desaturated reds for state only.

## Border Radius

| Element | Radius |
|---------|--------|
| Buttons, chips, inputs | `rounded-lg` (8px) |
| Cards, panels, modals | `rounded-2xl` (16px) |
| Icon wells | `rounded-lg` or `rounded-xl` |
| Status badges | `rounded-full` |
| Step indicators | `rounded-full` (7×7 circle) |

## Animation

| Class | Duration | Use |
|-------|----------|-----|
| `animate-fade-up` | 0.5s, ease-out | Page sections on load |
| `animate-fade-up-delay-1` | +0.08s delay | Staggered column 1 |
| `animate-fade-up-delay-2` | +0.16s delay | Staggered column 2 |
| `animate-pulse-ring` | 2.4s loop | QR scan frame outer ring |
| `animate-scan-line` | 2.8s loop | QR scan line sweep |

Easing: `cubic-bezier(0.16, 1, 0.3, 1)` for entrances; no spring/bounce.

## Layout Patterns

### App shell (`DesktopView`)

```
┌─ Header (sticky, border-b, surface/60 + blur) ─────────────┐
│  Logo well + title                    StatusBadge          │
├─ Main (max-w-6xl, px-4 sm:px-6) ─────────────────────────┤
│  StepProgress (Choose → Pair → Authorize)                  │
│  ┌─ Pairing card ──┐  ┌─ Actions card ──┐                 │
│  │  QR / connected  │  │  WalletActions  │                 │
│  └──────────────────┘  ├─ Activity log ──┤                 │
│                         │  RequestLog     │                 │
│                         └─────────────────┘                 │
└────────────────────────────────────────────────────────────┘
```

Grid: `lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]` — pairing column slightly narrower.

### Connection modal

- Full-screen overlay: `bg-canvas/80 backdrop-blur-md`
- Card: `max-w-lg`, `rounded-2xl border border-border bg-surface`
- Header block with icon well + copy, separated by `border-b border-border-soft`
- Two choice cards (install link + mobile QR button) in `p-4 sm:p-6` body
- Security footer: lock icon + encryption note

## Component Patterns

### StatusBadge (`components/ui/StatusBadge.tsx`)

Pill with colored dot + label. Maps `SessionStatus | 'detecting'` to semantic colors. Reused in header and QR panel.

### StepProgress (`components/ui/StepProgress.tsx`)

Horizontal 3-step indicator. Active step: `bg-brand-muted ring-1 ring-border-emphasis`. Complete: green checkmark in `bg-success-muted`. Connector lines between steps.

### ScanFrame (`components/ui/ScanFrame.tsx`)

Wraps QR image. White `p-3` inset, amber corner brackets (`w-5 h-5 border-2`), optional pulse ring (`-inset-3`) and scan line when `active={true}`.

### QRDisplay (`components/QRDisplay.tsx`)

- **Pending:** ScanFrame + hidden base status/button (custom refresh for expired/disconnected)
- **Connected:** Phone icon with success badge, StatusBadge, SessionIdChip, disconnect button
- **SessionIdChip:** Truncated mono ID, copy on click, `bg-surface-inset border-border-soft`

### WalletActions (`components/WalletActions.tsx`)

Grouped action cards (Identity / Tokens / Event Tickets). Each card:
- `p-3.5 rounded-xl border border-border bg-surface-raised`
- Icon well `w-9 h-9 rounded-lg bg-surface-inset`
- Label + description; chevron on hover
- Entire group `opacity-50 pointer-events-none` when locked

### RequestLog (`components/RequestLog.tsx`)

Timeline entries with `before:` pseudo dot (pending pulses). State via `data-[state=*]` selectors on entries from `@bsv/wallet-relay/react`. Empty state: dashed border card with icon + copy (pass `children` to `RequestLogBase`, not `emptyProps.children`).

### WalletConnectionModal (`components/WalletConnectionModal.tsx`)

Wraps `@bsv/wallet-relay/react` modal with custom `children`. Mobile QR choice card uses `border-border-emphasis bg-brand-muted/40` to visually recommend the demo path.

## Controls

| Control | Style |
|---------|-------|
| Primary CTA | `bg-brand text-canvas font-semibold hover:bg-brand-hover rounded-lg` |
| Secondary / ghost | `border border-border text-ink-secondary hover:bg-surface-raised rounded-lg` |
| Choice card (hover) | `hover:border-border-emphasis hover:bg-brand-muted/20` or `/30` |
| Disabled group | `opacity-50 pointer-events-none` on container |

## States Checklist

Every interactive surface needs: default, hover, disabled (where applicable).

Data states covered:
- Session: detecting, pending, connected, disconnected, expired
- Log entries: pending (pulse dot), ok, error, empty
- Wallet actions: locked (not connected) vs unlocked

## Files Reference

| File | Purpose |
|------|---------|
| `frontend/src/index.css` | Token definitions, base styles, animations |
| `frontend/index.html` | Font imports, `theme-color`, page title |
| `frontend/src/views/DesktopView.tsx` | App shell, header, layout grid |
| `frontend/src/components/ui/*` | Reusable primitives |
| `frontend/src/components/*.tsx` | Feature components styled to this system |

## Consistency Rules

1. No raw hex in TSX — use theme tokens only.
2. One accent color (amber/brand) — semantic colors for state only.
3. Borders over shadows for layout depth.
4. Symmetric padding unless content dictates asymmetry.
5. Section labels always uppercase tracked `text-[11px]`.
6. Mono font only for IDs, log output, and technical data.
7. When wrapping `@bsv/wallet-relay/react` headless components, hide default UI via CSS selectors (`[&_[data-qr-status]]:hidden`) and render custom states alongside.