# CivicPulse: Design Tokens

This document registers the design tokens used to coordinate styles between design specifications and the frontend code.

---

## 1. Typography Tokens

```css
--font-family-primary: "Noto Sans", "Noto Sans Devanagari", system-ui, -apple-system, sans-serif;
--font-family-mono: "Noto Sans Mono", monospace; /* Technical traces & Case IDs only */

--font-size-caption: 14px; /* Citizen-facing absolute floor */
--font-size-body: 16px;
--font-size-heading: 20px; /* Scales to 24px on desktop */
--font-size-display: 28px; /* Scales to 32px on desktop */

--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;

--line-height-body: 1.5;
--line-height-heading: 1.3;
```

---

## 2. Spacing & Radius Tokens

```css
/* 4px Base Spacing Scale */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 24px;
--space-6: 32px;
--space-7: 48px;
--space-8: 64px;

/* Border Radii */
--radius-sm: 4px;   /* Panels, table containers */
--radius-md: 8px;   /* Cards, text inputs, evidence images */
--radius-lg: 12px;  /* Modals & Dialogs */
--radius-xl: 16px;  /* Mobile bottom sheets (top corners only) */
--radius-pill: 999px; /* Buttons, FAB, status badges */
```

---

## 3. Elevation & Border Tokens

```css
/* Elevations (Represents Interruption, Not Importance) */
--elevation-0: none;                          /* Default resting state */
--elevation-1: 0 1px 2px rgba(0, 0, 0, 0.08);  /* Card hover / focus states */
--elevation-2: 0 4px 12px rgba(0, 0, 0, 0.12); /* Mobile bottom sheet contextual peeks */
--elevation-3: 0 8px 24px rgba(0, 0, 0, 0.16); /* Dialog modal - highest elevation */

/* Borders */
--border-width-default: 1px;
--border-color-default: var(--color-neutral-200);
```

---

## 4. Color Palette Tokens

Every color pairing must satisfy the contrast ratios defined in [ACCESSIBILITY.md](file:///d:/Projects/CivicPulse/docs/04_UX/ACCESSIBILITY.md).

```css
/* Neutral Scale */
--color-neutral-50:  #FAFAFA; /* Page Background */
--color-neutral-100: #F4F4F5; /* Card background at rest */
--color-neutral-200: #E4E4E7; /* Divider lines / borders */
--color-neutral-700: #3F3F46; /* Captions / secondary text */
--color-neutral-900: #18181B; /* Main body text */

/* Product Branding */
--color-primary-500: #0D9488; /* Teal primary brand color */
--color-primary-700: #0F766E; /* Teal primary focus / active state */

/* Semantic Indicator Hues */
--color-evidence-base: #64748B; /* Slate: photo metadata */
--color-government-base: #1E3A8A; /* Indigo: official responses */
--color-community-base: #7C3AED; /* Violet: aggregate report groupings */
--color-ai-assistance-base: #D97706; /* Amber: machine-derived outputs */
--color-success-base: #15803D; /* Muted Green: verified repair resolutions */
--color-warning-base: #B45309; /* Deep Amber: deadlines & SLAs */
--color-danger-base: #B91C1C; /* Red: rejections & failures */
```

---

## 5. Motion Tokens

```css
/* Durations */
--motion-duration-fast: 120ms; /* Hover, focus shifts */
--motion-duration-base: 200ms; /* Page transitions, sheet slides */
--motion-duration-slow: 320ms; /* Dialog opens, shutter slide-to-thumbnail */

/* Easing */
--motion-easing-standard: cubic-bezier(0.2, 0, 0, 1);
```
