# PHRI frontend UX design specification

**PHRI (Personal Health Record & Insights) needs to feel like Apple Health meets Perplexity — a calm, trustworthy consumer health app with an AI-powered records assistant.** This specification covers every design decision from color values to component names, animation timing to citation tooltips, giving developers an implementable blueprint. The technology stack remains React 19 + TypeScript + Tailwind CSS 4, retaining shadcn/ui as the component foundation — the single best library for this use case. Every recommendation below is opinionated, justified, and ready to build.

---

## 1. The technology stack: what stays, what changes, what's new

**Component library: shadcn/ui + Radix UI** remains the correct choice. After evaluating seven alternatives — Mantine, Ant Design, MUI, Chakra UI, Park UI/Ark UI, and NextUI/HeroUI — shadcn/ui is the only library with **native Tailwind CSS 4 support AND full React 19 compatibility** without adapters or workarounds. Mantine requires CSS layer configuration hacks to coexist with Tailwind 4. MUI needs a `StyledEngineProvider` and CSS layer ordering workaround. Chakra UI v3 uses Panda CSS, making it fundamentally incompatible with a Tailwind-first architecture. Ant Design has zero Tailwind integration. Park UI is too immature (poor documentation, tiny community). NextUI is mid-rebrand to HeroUI with a v3 still in beta.

shadcn/ui's code-ownership model — components copied into your codebase rather than installed as dependencies — provides the deep customization a health app demands. You can build medication cards, lab range visualizers, and FHIR resource badges without fighting an opinionated design system. Radix UI primitives deliver WAI-ARIA compliance, keyboard navigation, and focus management out of the box. The ecosystem includes every required component: **Dialog, Sheet, Popover, Command (cmdk), DataTable (TanStack Table), Form (React Hook Form + Zod), Tabs, Accordion, DatePicker, Select/Combobox, Toast (Sonner), Skeleton, Badge, Card, and Drawer**.

Supplement with: **React Hook Form + Zod** for form validation, **TanStack Table** for data grids, **Sonner** for toast notifications, and **date-fns** for date handling.

**Chart library: Recharts (primary) + Tremor (dashboard layer).** Recharts is the only library with native `<ReferenceArea>` and `<ReferenceLine>` components — critical for showing lab value normal ranges as shaded bands. It natively supports `type="stepAfter"` on Line and Area components, exactly matching the stepped visualization needed for medication dosage timelines. Tremor wraps Recharts with Tailwind-native styling and adds pre-built KPI cards, sparklines, and tracker components. Both support React 19 and share the same rendering engine, so zero conflicts arise from using them together. Nivo lacks native reference areas. Victory has better accessibility but smaller ecosystem. Visx offers maximum customization but requires building every chart from D3 primitives. Chart.js uses Canvas rendering, limiting accessibility and Tailwind integration.

**Animation library: Motion v12 (primary) + tw-animate-css (lightweight CSS animations).** Motion (formerly Framer Motion) provides `AnimatePresence` for page transitions, `layoutId` for shared element transitions, built-in gesture support for mobile swipe interactions, and the most ergonomic declarative API in the React ecosystem. Use `LazyMotion` with `domAnimation` features for a **~15KB** footprint. tw-animate-css handles simple CSS-only animations (skeleton pulses, toast enter/exit, focus rings) with zero JavaScript overhead — it is already shadcn/ui's default animation solution. React Spring v10 was evaluated but rejected: its React 19 support shipped October 2025 and still has open stability bugs. Motion One has been absorbed into the unified Motion package and is no longer a separate option.

---

## 2. An OKLch color system built for medical trust

Tailwind CSS 4 natively uses OKLch for its entire default palette, making it the natural color space for PHRI. OKLch's perceptual uniformity means equal numeric changes produce equal visual changes — critical when eight FHIR resource types need to be visually distinct at a glance. All values below use the `oklch(L C H)` format where L is 0–1 (lightness), C is 0–0.4 (chroma), and H is 0–360° (hue).

### Primary palette: trust-conveying teal-blue at hue 210

The primary color sits at **`oklch(0.59 0.155 210)`** — a teal-blue that conveys calm, trust, and clinical professionalism without feeling cold. Blue is overwhelmingly the most used color in healthcare design, associated with medical authority and safety. The full 11-step scale follows Tailwind's lightness curve with peak chroma at the 400–600 range:

```css
@theme {
  --color-primary-50:  oklch(0.97 0.01 210);
  --color-primary-100: oklch(0.93 0.025 210);
  --color-primary-200: oklch(0.88 0.055 210);
  --color-primary-300: oklch(0.80 0.09 210);
  --color-primary-400: oklch(0.70 0.13 210);
  --color-primary-500: oklch(0.59 0.155 210);
  --color-primary-600: oklch(0.52 0.145 210);
  --color-primary-700: oklch(0.44 0.125 210);
  --color-primary-800: oklch(0.36 0.10 210);
  --color-primary-900: oklch(0.28 0.08 210);
  --color-primary-950: oklch(0.20 0.06 210);
}
```

Key semantic aliases: **primary** at `oklch(0.59 0.155 210)`, **primary-hover** at `oklch(0.54 0.15 210)`, **primary-active** at `oklch(0.48 0.145 210)`, **primary-foreground** at `oklch(1 0 0)` (white). White text on primary-500 achieves approximately **4.7:1** contrast — passing WCAG AA. Hover and active states deepen lightness, increasing contrast further.

### Neutral surfaces and text

Light mode uses a warm off-white background at `oklch(0.985 0.002 80)` — the slight warmth (hue 80) prevents the sterile coldness of pure gray, aligning with the 2024–2025 trend of "UX that feels like a hug" seen in apps like Hims & Hers. Cards sit at `oklch(0.995 0.001 80)`, elevated cards at pure white `oklch(1 0 0)`. Primary text at `oklch(0.20 0.02 260)` achieves **~16:1** contrast against the background. Secondary text at `oklch(0.45 0.015 260)` and muted text at `oklch(0.55 0.01 260)` both pass WCAG AA for normal text at **~5.5:1**. Borders use `oklch(0.90 0.005 260)` for subtle separation, `oklch(0.82 0.008 260)` for emphasis.

### Semantic status colors with color-blind safety

Every status color must be triple-encoded: color + icon/shape + text label. Never rely on hue alone — **8% of men** have color vision deficiency, most commonly red-green.

- **Active/Success** (active medications, completed): `oklch(0.59 0.17 155)` — green with checkmark icon + "Active" text. Light background: `oklch(0.92 0.04 155)`. Dark text on light: `oklch(0.45 0.14 155)`.
- **Warning/Pending** (pending prescriptions, draft states): `oklch(0.75 0.16 75)` — amber with clock icon + "Pending" text. Uses dark foreground text at `oklch(0.20 0.03 65)` since L>0.72.
- **Error/Stopped** (errors, stopped medications, critical alerts): `oklch(0.57 0.22 25)` — red with X-in-diamond icon + "Stopped" text. Light background: `oklch(0.93 0.03 20)`.
- **Info** (informational states): `oklch(0.59 0.15 240)` — blue with info-circle icon.
- **Muted/Discontinued** (inactive, historical items): `oklch(0.55 0.02 260)` — neutral gray with dash icon + "Discontinued" text.

Use these anxiety-reducing label alternatives: "outside typical range" instead of "abnormal," "needs review" instead of "failed," "not detected" instead of "negative."

### Eight FHIR resource type colors

All eight share **L=0.65 and C≈0.12** with hues spaced ~45° apart for maximum perceptual distinction. Each resource type gets three variants: badge color, light card background (L=0.95, C=0.02), and dark text for labels (L=0.40):

| FHIR Resource | Badge Color | Hue | Card Background | Label Text |
|---|---|---|---|---|
| **Condition** | `oklch(0.65 0.13 18)` | Coral | `oklch(0.95 0.02 18)` | `oklch(0.40 0.10 18)` |
| **DiagnosticReport** | `oklch(0.65 0.12 310)` | Purple | `oklch(0.95 0.02 310)` | `oklch(0.40 0.09 310)` |
| **Encounter** | `oklch(0.65 0.12 240)` | Blue | `oklch(0.95 0.02 240)` | `oklch(0.40 0.09 240)` |
| **Immunization** | `oklch(0.65 0.12 175)` | Teal-green | `oklch(0.95 0.02 175)` | `oklch(0.40 0.09 175)` |
| **Observation** | `oklch(0.65 0.11 220)` | Sky blue | `oklch(0.95 0.02 220)` | `oklch(0.40 0.08 220)` |
| **Procedure** | `oklch(0.65 0.13 275)` | Indigo | `oklch(0.95 0.02 275)` | `oklch(0.40 0.10 275)` |
| **MedicationRequest** | `oklch(0.70 0.14 70)` | Amber | `oklch(0.95 0.025 70)` | `oklch(0.42 0.11 70)` |
| **AllergyIntolerance** | `oklch(0.65 0.13 350)` | Rose | `oklch(0.95 0.02 350)` | `oklch(0.40 0.10 350)` |

Label text (L=0.40) on card backgrounds (L=0.95) achieves approximately **7:1** contrast, passing WCAG AAA. Badge colors (L=0.65) with white text achieve approximately **4.5:1+**, passing AA.

### Dark mode palette

Dark mode uses a dark charcoal background at `oklch(0.145 0.01 260)` — never pure black, which reduces eye strain and allows shadow differentiation between elevation layers. Surface colors step up: base surface at `oklch(0.19 0.01 260)`, raised card at `oklch(0.23 0.012 260)`. Primary text lightens to `oklch(0.93 0.005 260)` (~12:1 contrast). The primary color shifts to `oklch(0.72 0.13 210)` — brighter and slightly desaturated for comfortable readability against dark surfaces. All status colors increase lightness by ~0.13 and decrease chroma by ~0.03 to remain vibrant without glaring. FHIR resource colors shift to L=0.75 with card backgrounds at `oklch(0.22 0.03 H)`.

Implement via Tailwind CSS 4's `@theme` block with `@media (prefers-color-scheme: dark)` or a `.dark` class toggle. Provide graceful degradation for older browsers via `@supports (color: oklch(0 0 0))` with hex fallbacks. Always verify final contrast ratios with OddContrast (oddcontrast.com) or Atmos (atmos.style/contrast-checker), which accept OKLch directly.

---

## 3. Navigation architecture: four tabs, one timeline, progressive depth

### Bottom tab bar with four primary destinations

Research consistently shows **bottom tab bars with 3–5 items** outperform hamburger menus and sidebars on mobile. Redbooth documented a **65% increase in daily active users** after switching from hamburger to bottom tabs. Apple Health uses three tabs; MyChart users specifically complained about overwhelming hamburger-based navigation. PHRI uses four tabs — odd counts create better visual rhythm, but the AI chat feature earns its own primary tab:

1. **Home** (house icon) — personalized dashboard with health highlights, recent activity, quick actions
2. **Records** (folder icon) — browse and search all clinical data by category, timeline view with filters
3. **Chat** (message-bubble icon) — AI assistant with RAG-powered health record analysis
4. **Profile** (person icon) — settings, connected sources, sharing, consent management, Medical ID

On tablet/desktop, convert to a **collapsible sidebar** with expanded labels plus the same four primary sections, following the Apple Health iPad pattern. Maintain identical information architecture across breakpoints. Touch targets minimum **44×44px** on all interactive elements.

### Records information architecture for non-clinical users

FHIR resource types map to seven consumer-friendly categories. This mapping is informed by Apple Health's "Health Records" organization and card-sorting research from MyChart redesign studies:

- **Health Conditions** → Condition + AllergyIntolerance (heart-pulse icon)
- **Medications** → MedicationRequest (pill icon)
- **Lab Results** → Observation (laboratory) + DiagnosticReport (flask icon)
- **Immunizations** → Immunization (syringe-shield icon)
- **Visits & Procedures** → Encounter + Procedure (stethoscope icon)
- **Vitals** → Observation (vitals category) (heart-rate icon)
- **Documents** → DocumentReference + narrative DiagnosticReports (document icon)

The Records tab opens to a **category grid** showing these seven categories with counts and last-updated timestamps. Each category opens a **reverse-chronological filtered list** of individual records. A unified **Timeline** toggle shows all record types interleaved chronologically, with filter chips (Labs, Meds, Visits, etc.) for narrowing. This mirrors Apple Health's Browse → Category → Detail pattern.

### Drill-down and breadcrumb pattern

Navigation depth follows: **Records → Category → Record Summary → Full Detail**. Display breadcrumbs as a contextual header: "Records > Lab Results > CBC Panel (Oct 15, 2025)". Preserve scroll position and filter state when navigating back. For quick record inspection, use the shadcn Sheet component (half-sheet modal) that slides up from the bottom — the user can swipe down to dismiss and return to their position in the timeline. Full detail view uses a dedicated page with platform-native back navigation.

### Home dashboard structure

The home screen follows Apple Health's personalized Summary pattern combined with MyChart's action-oriented prompts:

1. **Greeting + date** ("Good morning, Sarah" — personalization builds trust)
2. **Highlights** — AI-generated health insights: "Your cholesterol dropped 15% since last check," "3 new lab results from Jan 15," "Medication change: Lisinopril dosage updated"
3. **Pinned categories** — user-customizable summary cards showing current medications count, recent lab snapshot, next appointment
4. **Quick actions** — pill-shaped buttons: "Ask about my labs" (→ Chat), "View medications" (→ Records), "Share records" (→ Profile)
5. **Recent activity** — last 5 records added or updated, with FHIR type badges

---

## 4. Health data visualization: specific chart types for each clinical need

### Medication dosage timeline

Use Recharts `<AreaChart>` with `<Area type="stepAfter">` to display dosage levels as a stepped area chart. Each horizontal step represents a dosage period; vertical steps represent dosage changes. For a multi-medication view, use `<ComposedChart>` with stacked step areas, each medication in its FHIR resource color (amber, `oklch(0.70 0.14 70)`). Active medications extend to the current date with a subtle pulse indicator. Stopped medications end with a muted terminal marker. Implement via:

```tsx
<AreaChart data={medicationHistory}>
  <Area type="stepAfter" dataKey="dosageMg" stroke="oklch(0.70 0.14 70)" fill="oklch(0.95 0.025 70)" />
  <XAxis dataKey="date" scale="time" />
  <YAxis label={{ value: "Dosage (mg)", angle: -90 }} />
  <Tooltip content={<CustomMedicationTooltip />} />
</AreaChart>
```

For a Gantt-like view of medication start/stop periods across multiple drugs, use `<BarChart layout="vertical">` with date-range data pairs — each medication is a horizontal bar from start date to end date.

### Lab value trend lines with normal ranges

Use Recharts `<LineChart>` with `<ReferenceArea>` rendering the normal range as a shaded band, and `<ReferenceLine>` for upper/lower bounds:

```tsx
<LineChart data={labResults}>
  <ReferenceArea y1={3.5} y2={5.0} fill="oklch(0.59 0.17 155)" fillOpacity={0.08} />
  <ReferenceLine y={3.5} stroke="oklch(0.59 0.17 155)" strokeDasharray="3 3" />
  <ReferenceLine y={5.0} stroke="oklch(0.59 0.17 155)" strokeDasharray="3 3" />
  <Line type="monotone" dataKey="value" stroke="oklch(0.59 0.155 210)" dot={<CustomDot />} />
  <XAxis dataKey="date" scale="time" />
</LineChart>
```

Color-code dots: green (`oklch(0.59 0.17 155)`) when within range, red (`oklch(0.57 0.22 25)`) when outside. Always include the numerical value in the tooltip alongside the reference range and a plain-language interpretation.

### Summary statistics and sparklines

Use Tremor components for the dashboard layer. Each KPI card combines `<Card>`, `<Metric>`, `<BadgeDelta>` for trend direction, and `<SparkAreaChart>` for a miniature trend visualization:

```tsx
<Card>
  <p className="text-sm text-muted">Hemoglobin A1C</p>
  <div className="flex items-baseline gap-2">
    <Metric>6.2%</Metric>
    <BadgeDelta deltaType="moderateDecrease" size="sm">-0.6</BadgeDelta>
  </div>
  <SparkAreaChart data={a1cHistory} categories={["value"]} index="date"
    colors={["primary"]} className="mt-2 h-8" />
</Card>
```

### Immunization timeline

Use Recharts `<ScatterChart>` with a time-based X-axis. Each immunization plots as a dot, grouped by vaccine type on the Y-axis. Custom dot shapes differentiate vaccine series (filled circle = complete, ring = in-progress, triangle = overdue). Include a tooltip showing vaccine name, dose number, date, and administering provider.

---

## 5. AI chat UX: Perplexity-style citations with medical safety guardrails

### Citation display pattern

Follow Perplexity's established pattern: **inline numbered citations** `[1]`, `[2]` placed after specific claims, each linking to a specific health record. Perplexity's Head of Design describes this philosophy as "there are the sources, then there's the answer." For a health records context, citations link to the user's own data rather than web URLs:

```
Your most recent hemoglobin A1C was 6.2% [1], which is within the typical
range. This represents an improvement from 6.8% [2] six months ago.
```

**Citation popovers:** On hover (desktop) or tap (mobile) of a citation number, display a shadcn Popover containing: record type icon + title ("Lab Result: HbA1c"), date, provider name, the specific value cited, and a "View full record →" deep-link to the Records tab. Use the FHIR resource type color for the popover's left border accent. Follow ShapeofAI's guidance: use metadata (icons, dates, provider names) to support visual scanning, and make broken or missing citations explicit.

### Streaming text display

Use Server-Sent Events for streaming. Before text arrives, show a three-dot pulse animation (tw-animate-css `animate-pulse`). During streaming, render tokens progressively into markdown using a streaming-compatible renderer. Display a blinking cursor (CSS-animated SVG rectangle, 0.5s cycle) at the text boundary. Auto-scroll the chat container to keep the latest content visible. Provide a "Stop" button to abort generation. After streaming completes, remove the cursor, reveal action buttons (copy, thumbs up/down), and make citations interactive.

For reading cadence, buffer streaming tokens and reveal at a **consistent ~200 characters/second** regardless of network chunk timing. This creates a calm, predictable reading experience. Each new chunk wraps in a `<motion.span>` with `initial={{ opacity: 0 }}` and `animate={{ opacity: 1 }}` over 150ms.

### Three-layer medical disclaimer system

Medical disclaimers in LLM outputs dropped from 26.3% to 0.97% between 2022 and 2025 — the app itself must own safety messaging. Multiple US states (California, Illinois, New York) now require user-facing disclosures confirming AI interaction. Implement three layers:

1. **Persistent footer** below the chat input: "AI assistant for informational purposes only. Not medical advice. Always consult your healthcare provider." — small, muted text (`text-muted` at `oklch(0.55 0.01 260)`) but always readable at WCAG AA contrast.
2. **First-message onboarding card** shown once per session: "I can help you understand your health records, but I'm not a doctor. My responses are based on your connected health data and should not replace professional medical advice." Dismissable with a "Don't show again" option.
3. **Per-response badge**: Small "AI-generated" label on each assistant message, visually distinct from user messages via different background color and an AI sparkle icon.

### Emergency crisis detection

Implement a **pre-LLM deterministic safety layer** that pattern-matches crisis keywords (suicidal ideation, chest pain, difficulty breathing, stroke symptoms) before sending to the model. When triggered, bypass the AI entirely and show a hard-coded emergency card with red-highlighted banner: "If you're experiencing a medical emergency, call 911 immediately. 988 Suicide & Crisis Lifeline: Call or text 988." This must never depend on LLM behavior.

### Suggested prompts and session management

**Empty state:** Display 4–6 contextual prompt pills based on the user's actual connected data. If lab results exist: "Explain my latest lab results." If medications exist: "Do any of my medications interact?" If immunizations exist: "Am I up to date on vaccines?" Pills use rounded borders (`rounded-full`), subtle primary-100 background, and an optional emoji prefix for scanning.

**Follow-up suggestions:** After each AI response, show 2–3 context-aware follow-up chips below the message: "Tell me more about this result," "Compare to my previous results," "Is this value normal?" — following Perplexity's "Related" questions pattern.

**Session management:** Desktop: collapsible left sidebar with reverse-chronological chat history grouped by time period (Today, Yesterday, Last 7 days). Auto-title sessions from content: "Lab Results Discussion — Jan 2026." Mobile: chat history accessible via a header button, opening as a full-screen list or Sheet drawer. Each session supports rename, delete, and pin actions. URL routing: `/chat/${threadId}` for deep-linking.

---

## 6. Animation principles: calm, purposeful, anxiety-reducing

Health app animations must feel like a polished medical instrument — reliable, subtle, never flashy. All Motion animations should use **200–400ms durations** with `easeInOut` easing or gentle springs with **high damping (25–30) and no overshoot**. Scale changes cap at **1.02** (not 1.05). Respect `prefers-reduced-motion` via Tailwind's `motion-safe:` / `motion-reduce:` variants and Motion's automatic reduced-motion fallbacks.

### Specific animation implementations

**Page transitions** (Timeline → Record Detail): Wrap the router outlet in `<AnimatePresence mode="wait">`. Enter with `opacity: 0 → 1` and `y: 8 → 0` over 250ms. Exit with reverse. For record cards expanding to full detail, use `layoutId` for shared element transitions — the card morphs smoothly into the detail view header.

**Skeleton loading:** Pure CSS via Tailwind's built-in `animate-pulse` on gray-200 rectangles. No JavaScript needed. Use gentle gray (`oklch(0.88 0.005 260)` on `oklch(0.97 0.002 260)` background). Shape skeletons to match the actual content layout (card shapes for medication cards, line shapes for lab values).

**List stagger** (medication lists, lab results): Motion variants with **60ms stagger** between items. Each item enters with `opacity: 0 → 1` and `y: 12 → 0` over 300ms. Add the `layout` prop for smooth reordering when filters change.

**Modals and drawers:** Motion `AnimatePresence` with spring physics (`damping: 30, stiffness: 300`) for no-overshoot slide-in. Implement swipe-to-dismiss on mobile drawers via Motion's `drag="x"` with `dragConstraints={{ left: 0 }}`.

**Tab switching:** Directional slide based on tab index (moving right = content slides left, and vice versa) over 200ms. This spatial orientation reduces cognitive load when navigating between Records categories.

**Toast notifications:** Use Sonner with tw-animate-css for `animate-in fade-in slide-in-from-top-4 duration-300`. Auto-dismiss after 4 seconds for success, persist for errors until manually dismissed.

**Active state indicators:** CSS-only via `animate-ping` for sync-in-progress dots (teal pulse). Very slow `animate-pulse duration-[2000ms]` for ambient "connected" indicators.

---

## 7. Accessibility: WCAG AA as the non-negotiable floor

HHS finalized rules in May 2024 requiring **WCAG 2.1 Level AA** compliance for all federally funded healthcare organizations' digital properties by **May 2026**. Even for non-regulated apps, health apps serve elderly users, visually impaired users, and users with temporary impairments — accessibility is both ethical and practical.

### Contrast, focus, and touch targets

All text meets WCAG AA: **4.5:1** for normal text, **3:1** for large text (≥18pt or ≥14pt bold), **3:1** for UI components. The OKLch palette above was designed to meet these thresholds — verify every color pairing in production with OddContrast or similar tools. Focus indicators use a **2px solid outline** with **3:1 contrast** against adjacent colors, implemented via Tailwind's `focus-visible:ring-2 focus-visible:ring-primary-400`. Touch targets minimum **44×44px** on all buttons, checkboxes, and toggles — critical for medication checkboxes and consent toggles.

### Screen reader patterns for medical data

Lab result tables require proper semantic HTML: `<caption>` for table purpose and date, `scope="col"` and `scope="row"` for header associations, `aria-label` on status icons providing full context ("Within typical range" rather than just a checkmark symbol). Never rely on color alone for status. Medication lists use `role="list"` with `aria-label="Current Medications"`. Dynamic sync status uses `aria-live="polite"`. Urgent health alerts use `role="alert"` with `aria-live="assertive"`.

### Color-blind safe triple-encoding

Every status indicator uses at minimum three of four encoding channels: color, shape/icon, text label, and position. Active status: green circle + checkmark icon + "Active" text. Warning: amber triangle + exclamation icon + "Needs attention" text. Error: red diamond + X icon + "Stopped" text. For lab range visualizations in charts, supplement color fills with pattern textures (sparse dots for normal range, diagonal lines for caution zone, crosshatch for critical).

### Reduced motion

Implement the `usePrefersReducedMotion` hook. When reduced motion is preferred, replace all Motion animations with instant renders or simple opacity fades. Disable chart entrance animations. Replace the streaming text cursor animation with a static "..." indicator. Replace skeleton pulse with a static gray background with "Loading..." text. Tailwind's `motion-safe:` prefix gates decorative animations: `motion-safe:animate-pulse`.

---

## 8. Trust signals, consent flows, and destructive action patterns

### Trust through design and transparency

Professional, consistent design is itself the strongest trust signal. Generous whitespace, clean typography (system font stack via Tailwind's `font-sans`), and consistent color usage build subconscious credibility. Complement with explicit signals: display **HIPAA Compliant**, **256-bit Encryption**, and **SOC 2 Certified** badges with shield/lock icons near sensitive data entry points (login, consent screens, data sharing). Place these in the app footer and onboarding flow.

Every health record displays its **data provenance**: source provider name, connection method ("via FHIR API"), and last sync timestamp. Example: "From Kaiser Permanente via FHIR · Last synced: Today at 9:42 AM · [Sync now]". Use `aria-live="polite"` on sync status so screen readers announce updates. Stale data (>24 hours since sync) shows a subtle amber indicator with "Data may not be current" messaging.

### Progressive disclosure for concerning results

Present lab results following a **Summary → Detail → Context → Action** disclosure pattern. The summary level says: "Your lab results are ready. 12 of 13 values are within typical ranges. 1 value may need your attention." Users expand to see the specific value with a visual range bar. Further expansion reveals a "What this means" plain-language explanation. The final level shows the action: "Your care team has been notified" or "Schedule a follow-up." This approach, validated by JMIR research, significantly reduces patient anxiety compared to presenting raw numerical tables.

### Consent UX: four-step informed permission

Consent flows follow the **CommonHealth model**: Inform → Select → Confirm → Record.

1. **Inform**: Explain what data will be requested and why, with visual icons for each data type
2. **Granular select**: Toggle-based permissions for each data category. Sensitive categories (mental health, reproductive health, substance use) default to OFF with "Sensitive category" badges
3. **Confirm**: Review summary of all selections with clear revocation instructions
4. **Record**: Time-stamped consent logged; confirmation shown with "Last updated" timestamp

Each toggle includes a "Learn more" expandable. Use plain language throughout — research from NIH shows strong patient preference for non-legal consent language. Always display how to revoke consent prominently. Never use countdown timers or urgency language.

### Destructive action tiers

Destructive actions in PHRI fall into three severity tiers with escalating confirmation patterns:

- **Tier 1 — Undo available** (dismissing notifications, clearing searches): Execute immediately, show an undo toast with 5–10 second window via Sonner. Use `aria-live="polite"` with `role="status"`.
- **Tier 2 — Simple confirmation** (removing a medication from tracking, disconnecting a device): shadcn AlertDialog with specific consequence description: "Remove Metformin from your medication list? This won't affect your provider's records." Safe action ("Keep medication") receives `autofocus`. Destructive button uses error-500 styling.
- **Tier 3 — Enhanced confirmation** (deleting all health records, permanent account deletion): Multi-step dialog showing specific counts of affected items ("156 lab results, 23 medications, 4 connected providers"). Requires typing "DELETE MY DATA" in an input field to enable the deletion button. Consider a **72-hour soft-delete recovery window** for account-level deletions. Use `role="alertdialog"` with `aria-labelledby` and `aria-describedby`.

Never use generic "Are you sure?" language. Always restate the specific action, show what will be affected with concrete numbers, use descriptive button labels ("Delete everything" not "Yes"), and make the safe action the default focused element.

---

## Conclusion: what makes this specification different

This specification makes one recommendation per decision rather than presenting options, because an implementable spec must be opinionated. The core insight driving every choice is that **health apps exist in an anxiety context** — users viewing their medical data are inherently vulnerable. Every design decision, from the calming teal-blue primary at `oklch(0.59 0.155 210)` to the progressive disclosure of lab results to the 60ms list stagger timing, serves the goal of reducing anxiety while maintaining clinical accuracy.

The technology choices reinforce each other: shadcn/ui's code ownership enables the deep customization health data demands. Recharts' native `<ReferenceArea>` makes lab range bands trivial. Motion's `AnimatePresence` enables the page transitions that give users spatial orientation in their health data. Tailwind CSS 4's native OKLch support means the entire color system integrates without conversion layers.

Three patterns distinguish PHRI from typical health portals. First, the Perplexity-style citation system transforms the AI chat from a black box into a verifiable tool — every claim links back to the user's own record. Second, the triple-encoded status system (color + icon + text) makes medication and lab status accessible to the **8% of men with color vision deficiency** who are systematically excluded by green/red-only designs. Third, the pre-LLM crisis detection layer provides safety that doesn't depend on model behavior — a hard requirement for any health-adjacent AI product. Together, these create a health record app that earns trust through transparency, reduces anxiety through thoughtful disclosure, and respects every user's ability to access their own health data.