# UI-GUIDELINES.md — AIVault Design System

## 1. Visual Direction & SaaS Aesthetic

AIVault adheres to a modern, restrained light theme tailored for developer and enterprise productivity.

- **Theme Baseline:** Clean white and light slate surfaces with subtle contrast boundaries.
- **Tone:** Professional, precise, confident, spacious, and readable.
- **Restraints:** Strictly avoid cyberpunk neon glows, chaotic color clashes, excessive glassmorphism, or noisy decorative elements.

---

## 2. Color Tokens

### Primary & Accent Palette
- **Primary Brand Blue:** `#2563EB` (Accessible contrast on light backgrounds)
- **Primary Hover:** `#1D4ED8`
- **Primary Light Tint:** `#EFF6FF` (Used for active tabs, category pills, subtle highlights)
- **Cyan Accent:** `#0284C7` (Used for gradients and secondary brand notes)

### Neutral Surface Tokens (Light Theme)
- **Page Background:** `#F8FAFC` (Slate 50)
- **Card / Surface Background:** `#FFFFFF` (Pure White)
- **Subtle Surface:** `#F1F5F9` (Slate 100)
- **Hover Surface:** `#F8FAFC`
- **Modal Overlay:** `rgba(15, 23, 42, 0.45)` with 4px backdrop blur

### Typography Slate Ramp
- **Text Primary (Headings, titles):** `#0F172A` (Slate 900)
- **Text Secondary (Body, descriptions):** `#475569` (Slate 600)
- **Text Muted (Subtitles, meta counts):** `#64748B` (Slate 500)
- **Text Subtle (Placeholders, inactive icons):** `#94A3B8` (Slate 400)

### Border & Divider Tokens
- **Subtle Border:** `#E2E8F0` (Slate 200)
- **Medium Border:** `#CBD5E1` (Slate 300)
- **Active Focus Ring:** `#2563EB` with 2px offset

### Pricing Status Badges
- **Free:** Background `#ECFDF5`, Text `#059669`, Border `#A7F3D0`
- **Freemium:** Background `#EFF6FF`, Text `#2563EB`, Border `#BFDBFE`
- **Paid:** Background `#FAF5FF`, Text `#7E22CE`, Border `#E9D5FF`
- **Trending:** Background `#FFF7ED`, Text `#C2410C`, Border `#FED7AA`

---

## 3. Typography Scale

- **Display Headline:** `2.75rem` (44px), weight 800, line-height 1.15, tracking -0.035em
- **Section Titles:** `1.5rem` (24px), weight 700, tracking -0.025em
- **Card Titles:** `1.15rem` (18px), weight 700, tracking -0.02em
- **Body Regular:** `0.95rem` (15px), weight 400, line-height 1.6
- **Meta / Badges:** `0.72rem` (11.5px), weight 600, tracking 0.04em
- **Font Stack:** System UI font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`) for instantaneous zero-latency rendering.

---

## 4. Elevation & Shadows

- **Level 1 (Card Resting):** `0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)`
- **Level 2 (Dropdown / Popover):** `0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)`
- **Level 3 (Card Hover):** `0 12px 24px -4px rgba(15, 23, 42, 0.08), 0 4px 8px -2px rgba(15, 23, 42, 0.03)`
- **Level 4 (Modal Dialog):** `0 25px 50px -12px rgba(15, 23, 42, 0.25)`

---

## 5. Responsive Grid Breakpoints

- **Desktop (>= 1536px):** 4 card columns
- **Standard Desktop (1025px - 1535px):** 3 card columns
- **Tablet (769px - 1024px):** 2 card columns; condensed sidebar
- **Mobile (<= 768px):** 1 card column; off-canvas slide-out navigation drawer; full-width search and filters
