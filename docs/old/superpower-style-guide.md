# Superpower.com Style Guide — React Implementation Reference

> **Purpose**: This document is a comprehensive design specification derived from analyzing superpower.com. Use it as your primary styling reference when building React components. Every section includes copy-pasteable tokens, Tailwind classes, and raw CSS so you can match this aesthetic exactly.

---

## 1. Design Philosophy

Superpower.com uses a **section-alternating dark/light pattern** — not a traditional dark-mode toggle. The page is composed of full-width horizontal bands that alternate between a near-black dark theme (the dominant mood) and occasional light/cream sections used for pricing, CTAs, and trust-building content. This creates visual rhythm and prevents dark-mode fatigue.

**Core principles:**

- **Dark-dominant, section-alternating layout** — roughly 70% dark sections, 30% light/cream sections
- **Single accent color (orange)** used sparingly for CTAs, labels, and highlights
- **Oversized, tightly-tracked headings** that feel confident and editorial
- **Generous vertical spacing** — sections breathe with 80–120px padding
- **Rounded card surfaces** elevated on dark backgrounds with subtle 1px borders
- **Pill-shaped CTAs** — always fully rounded, always orange or ghost
- **Photography + UI screenshots** as proof, never stock illustrations

---

## 2. Color System

### 2.1 Dark Mode Palette (Primary — used ~70% of page)

```
Page background:       #0A0A0A  (near-black, the base)
Alt background:        #111111  (slightly lighter for variety)
Card surface:          #141414  (elevated elements)
Card surface hover:    #1A1A1A  (subtle lift on interaction)
Border / divider:      #222222  (barely visible, structural)
Border hover:          #333333  (slightly more visible on hover)

Text primary:          #FFFFFF  (headings, key content)
Text secondary:        #A0A0A0  (body paragraphs, descriptions)
Text muted:            #6B6B6B  (captions, metadata, timestamps)
Text faint:            #444444  (disabled, decorative)
```

### 2.2 Light Mode Palette (Used for ~30% of sections)

These sections appear for: pricing blocks, membership details, FAQ sections, "Just test to make it clear" section, and the bottom CTA. They use a warm cream or clean white.

```
Page background:       #FFFFFF  (clean white sections)
Alt background:        #FAFAFA  (off-white variation)
Cream background:      #F5F0EB  (warm cream, used for softer sections)
Light card surface:    #FFFFFF  (cards on cream backgrounds)
Light card border:     #E8E4DF  (warm gray border on cream)
Alt card border:       #E0E0E0  (neutral gray border on white)

Text primary:          #111111  (headings on light)
Text secondary:        #555555  (body text on light)
Text muted:            #888888  (captions on light)
```

### 2.3 Accent Color

The orange is the ONLY accent color. It's used for primary CTAs, active labels, category tags, and very occasional highlights. Never diluted into gradients on the page (only in icon backgrounds).

```
Accent primary:        #FF6B35  (buttons, links, labels)
Accent hover:          #FF8A5C  (lighter on hover)
Accent active/pressed: #E55A24  (darker on press)
Accent subtle bg:      rgba(255, 107, 53, 0.08)  (tag/badge backgrounds)
Accent subtle border:  rgba(255, 107, 53, 0.2)   (tag/badge borders)
```

### 2.4 CSS Variables Setup

```css
:root {
  /* Dark section tokens (default) */
  --bg-page: #0A0A0A;
  --bg-alt: #111111;
  --bg-card: #141414;
  --bg-card-hover: #1A1A1A;
  --border: #222222;
  --border-hover: #333333;
  --text-primary: #FFFFFF;
  --text-secondary: #A0A0A0;
  --text-muted: #6B6B6B;

  /* Light section tokens */
  --bg-light: #FFFFFF;
  --bg-cream: #F5F0EB;
  --bg-light-alt: #FAFAFA;
  --border-light: #E0E0E0;
  --border-cream: #E8E4DF;
  --text-light-primary: #111111;
  --text-light-secondary: #555555;
  --text-light-muted: #888888;

  /* Accent */
  --accent: #FF6B35;
  --accent-hover: #FF8A5C;
  --accent-active: #E55A24;

  /* Radii */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-pill: 999px;
}
```

### 2.5 Tailwind Config Extension

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        page: '#0A0A0A',
        'page-alt': '#111111',
        surface: '#141414',
        'surface-hover': '#1A1A1A',
        'border-subtle': '#222222',
        accent: {
          DEFAULT: '#FF6B35',
          hover: '#FF8A5C',
          active: '#E55A24',
        },
        cream: '#F5F0EB',
        'cream-border': '#E8E4DF',
      },
      borderRadius: {
        'card': '12px',
        'card-lg': '16px',
        'pill': '999px',
      },
      maxWidth: {
        'content': '1200px',
      },
      letterSpacing: {
        'tighter-custom': '-0.03em',
        'tight-custom': '-0.02em',
      },
    },
  },
};
```

---

## 3. Typography

Superpower uses a sans-serif system stack with Inter-like characteristics. The key technique is the **text treatment hierarchy**, not the font itself — tightly tracked large headings vs comfortable body text.

### 3.1 Font Stack

```css
font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

If you want a close match, use **Inter** (available on Google Fonts). Import weights: 400, 500, 600, 700, 800.

### 3.2 Type Scale

| Role | Size | Weight | Line Height | Letter Spacing | Color (Dark) | Color (Light) |
|---|---|---|---|---|---|---|
| Hero H1 | `clamp(32px, 5vw, 56px)` | 800 | 1.05 | -0.03em | #FFFFFF | #111111 |
| Section H2 | `clamp(24px, 3.5vw, 40px)` | 700 | 1.1 | -0.025em | #FFFFFF | #111111 |
| Card Title H3 | 20–24px | 600 | 1.3 | -0.01em | #FFFFFF | #111111 |
| Card Subtitle H4 | 18px | 600 | 1.3 | -0.01em | #FFFFFF | #111111 |
| Body | 16px | 400 | 1.7 | 0 | #A0A0A0 | #555555 |
| Body Large | 18px | 400 | 1.7 | 0 | #A0A0A0 | #555555 |
| Stat Number | `clamp(48px, 6vw, 72px)` | 800 | 1.0 | -0.04em | #FFFFFF | #111111 |
| Label / Overline | 12px | 500 | 1.4 | 0.1em + uppercase | #FF6B35 | #FF6B35 |
| Nav Link | 14px | 500 | 1.0 | 0.01em | #FFFFFF | #111111 |
| Caption / Metadata | 13px | 400 | 1.5 | 0 | #6B6B6B | #888888 |
| Testimonial Quote | `clamp(20px, 3vw, 28px)` | 500 | 1.4 | -0.01em | #FFFFFF | #111111 |
| Price (large) | 64px | 800 | 1.0 | -0.04em | #FFFFFF | #111111 |
| Price suffix | 18px | 400 | 1.0 | 0 | #A0A0A0 | #555555 |

### 3.3 React Typography Components

```jsx
// Text components you should create
const H1 = ({ children, className = '' }) => (
  <h1 className={`text-[clamp(32px,5vw,56px)] font-extrabold leading-[1.05] tracking-[-0.03em] ${className}`}>
    {children}
  </h1>
);

const H2 = ({ children, className = '' }) => (
  <h2 className={`text-[clamp(24px,3.5vw,40px)] font-bold leading-[1.1] tracking-[-0.025em] ${className}`}>
    {children}
  </h2>
);

const H3 = ({ children, className = '' }) => (
  <h3 className={`text-xl font-semibold leading-snug tracking-[-0.01em] ${className}`}>
    {children}
  </h3>
);

const Body = ({ children, className = '' }) => (
  <p className={`text-base font-normal leading-[1.7] text-[#A0A0A0] ${className}`}>
    {children}
  </p>
);

const Label = ({ children, className = '' }) => (
  <span className={`text-xs font-medium uppercase tracking-[0.1em] text-[#FF6B35] ${className}`}>
    {children}
  </span>
);

const StatNumber = ({ children, className = '' }) => (
  <span className={`text-[clamp(48px,6vw,72px)] font-extrabold leading-none tracking-[-0.04em] ${className}`}>
    {children}
  </span>
);
```

---

## 4. Section Pattern — Dark / Light Alternation

This is the most important layout concept. The page is NOT one continuous dark page. It alternates between dark and light full-width sections.

### 4.1 Section Flow (as observed on the homepage)

```
[DARK]  — Hero (video bg, H1, sub-copy, CTA)
[DARK]  — Quick benefits bar (3 icon+text items)
[DARK]  — "It starts with 100+ labs" (feature showcase with product screenshots)
[DARK]  — Testimonial quote (large italic-style text)
[DARK]  — Stats row (63%, 44%, 70%)
[DARK]  — "How it works" (3-step numbered cards with images)
[DARK]  — Video testimonials carousel
[LIGHT/CREAM] — "Just test to make it clear" (person images + biomarker cards)
[DARK]  — "What's included in your membership" (feature grid)
[DARK]  — "Developed by world-class medical professionals" (doctor profiles)
[DARK]  — Pricing card ($17/month)
[LIGHT] — Membership plan selector (white bg, plan comparison)
[DARK]  — FAQ accordion
[DARK]  — Biomarker list grid
[DARK]  — Final CTA ("Health is your greatest superpower")
[DARK]  — Footer
```

### 4.2 Section Wrapper Components

```jsx
// Dark section (default)
const SectionDark = ({ children, className = '' }) => (
  <section className={`bg-[#0A0A0A] py-20 md:py-28 ${className}`}>
    <div className="max-w-[1200px] mx-auto px-6">
      {children}
    </div>
  </section>
);

// Dark section with alt background (subtle variety)
const SectionDarkAlt = ({ children, className = '' }) => (
  <section className={`bg-[#111111] py-20 md:py-28 ${className}`}>
    <div className="max-w-[1200px] mx-auto px-6">
      {children}
    </div>
  </section>
);

// Light section (white)
const SectionLight = ({ children, className = '' }) => (
  <section className={`bg-white py-20 md:py-28 ${className}`}>
    <div className="max-w-[1200px] mx-auto px-6">
      {children}
    </div>
  </section>
);

// Cream section (warm light)
const SectionCream = ({ children, className = '' }) => (
  <section className={`bg-[#F5F0EB] py-20 md:py-28 ${className}`}>
    <div className="max-w-[1200px] mx-auto px-6">
      {children}
    </div>
  </section>
);
```

### 4.3 How Text Colors Flip Per Section

This is critical. When you enter a light section, ALL text colors must swap:

```jsx
// Utility: determine text classes based on section theme
const darkText = {
  primary: 'text-white',
  secondary: 'text-[#A0A0A0]',
  muted: 'text-[#6B6B6B]',
};

const lightText = {
  primary: 'text-[#111111]',
  secondary: 'text-[#555555]',
  muted: 'text-[#888888]',
};

// Card colors also flip:
const darkCard = {
  bg: 'bg-[#141414]',
  bgHover: 'hover:bg-[#1A1A1A]',
  border: 'border-[#222222]',
};

const lightCard = {
  bg: 'bg-white',
  bgHover: 'hover:bg-[#FAFAFA]',
  border: 'border-[#E0E0E0]',
};

// On cream backgrounds specifically:
const creamCard = {
  bg: 'bg-white',
  bgHover: 'hover:bg-white',
  border: 'border-[#E8E4DF]',
};
```

### 4.4 The Navbar Adapts Too

The sticky nav uses a semi-transparent dark background with blur, keeping the dark-mode logo visible. If you need the nav to adapt to light sections on scroll, track which section is in view and swap:

```jsx
// Navbar stays dark-themed with transparency and blur
const Navbar = () => (
  <nav className="sticky top-0 z-50 h-16 flex items-center px-6
    bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-[#222222]">
    {/* Logo + links */}
  </nav>
);
```

---

## 5. Spacing & Layout

### 5.1 Spacing Scale

| Element | Value | Notes |
|---|---|---|
| Max content width | 1200px | All content centered inside this |
| Container padding (x) | 24px (mobile), 24–48px (desktop) | Prevents edge-hugging |
| Section padding (y) | 80px mobile / 112px desktop | Creates editorial pacing |
| Card internal padding | 24–32px | Consistent feel |
| Card border-radius | 12–16px | 12px for small cards, 16px for large |
| Grid gap | 16–24px | Between grid items |
| H2 to body text gap | 16–24px | Tight but readable |
| Body text max-width | ~680px | For readability in text-heavy sections |
| CTA button height | 48–52px | Via `py-3.5 px-8` or similar |
| CTA border-radius | 999px | Fully rounded pill |
| Image border-radius | 12–16px | Matches card radius |

### 5.2 Grid Patterns

```jsx
// 2-column feature grid (most common)
<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
  {/* Feature cards */}
</div>

// 3-column card grid
<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
  {/* Benefit cards, how-it-works steps */}
</div>

// 3-column stats row
<div className="flex flex-col md:flex-row gap-12 md:gap-16">
  {/* Stat blocks */}
</div>

// Full-width scrolling carousel (testimonials)
<div className="flex gap-4 overflow-x-auto snap-x snap-mandatory
  scrollbar-hide -mx-6 px-6">
  {/* Carousel items with snap-start */}
</div>
```

---

## 6. Component Patterns

### 6.1 Primary CTA Button (Orange Pill)

```jsx
const ButtonPrimary = ({ children, ...props }) => (
  <button
    className="bg-[#FF6B35] hover:bg-[#FF8A5C] active:bg-[#E55A24]
      text-white font-semibold text-[15px]
      rounded-full px-8 py-3.5
      transition-all duration-200
      hover:-translate-y-[1px]
      active:translate-y-0"
    {...props}
  >
    {children}
  </button>
);
```

### 6.2 Secondary / Ghost Button

```jsx
const ButtonSecondary = ({ children, dark = true, ...props }) => (
  <button
    className={`font-semibold text-[15px] rounded-full px-8 py-3.5
      border transition-all duration-200
      ${dark
        ? 'text-white border-[#444] hover:border-[#666] hover:bg-white/5'
        : 'text-[#111] border-[#CCC] hover:border-[#999] hover:bg-black/5'
      }`}
    {...props}
  >
    {children}
  </button>
);
```

### 6.3 Feature Card (Dark Section)

```jsx
const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-[#141414] border border-[#222] rounded-2xl p-7
    transition-all duration-200
    hover:bg-[#1A1A1A] hover:border-[#333]">
    {icon && (
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br
        from-[#FF6B35] to-[#E55A24]
        flex items-center justify-center mb-5 text-xl">
        {icon}
      </div>
    )}
    <h4 className="text-lg font-semibold text-white mb-2 tracking-[-0.01em]">
      {title}
    </h4>
    <p className="text-sm text-[#A0A0A0] leading-relaxed">
      {description}
    </p>
  </div>
);
```

### 6.4 Feature Card (Light Section)

```jsx
const FeatureCardLight = ({ icon, title, description }) => (
  <div className="bg-white border border-[#E0E0E0] rounded-2xl p-7
    transition-all duration-200
    hover:border-[#CCC] hover:shadow-sm">
    {icon && (
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br
        from-[#FF6B35] to-[#E55A24]
        flex items-center justify-center mb-5 text-xl">
        {icon}
      </div>
    )}
    <h4 className="text-lg font-semibold text-[#111] mb-2 tracking-[-0.01em]">
      {title}
    </h4>
    <p className="text-sm text-[#555] leading-relaxed">
      {description}
    </p>
  </div>
);
```

### 6.5 Stat Block

```jsx
const StatBlock = ({ number, suffix = '', description }) => (
  <div>
    <div className="flex items-baseline">
      <span className="text-[clamp(48px,6vw,72px)] font-extrabold
        leading-none tracking-[-0.04em] text-white">
        {number}
      </span>
      {suffix && (
        <span className="text-[clamp(24px,3vw,36px)] font-extrabold
          tracking-[-0.03em] text-white">
          {suffix}
        </span>
      )}
    </div>
    <p className="text-sm text-[#A0A0A0] mt-2 max-w-[220px] leading-relaxed">
      {description}
    </p>
  </div>
);
// Usage: <StatBlock number="63" suffix="%" description="of members find early risk factors for diabetes" />
```

### 6.6 Numbered Step Card (How It Works)

```jsx
const StepCard = ({ stepNumber, title, description, image }) => (
  <div className="bg-[#141414] border border-[#222] rounded-2xl overflow-hidden">
    {image && (
      <div className="aspect-[4/3] overflow-hidden">
        <img src={image} alt={title} className="w-full h-full object-cover" />
      </div>
    )}
    <div className="p-7">
      <span className="inline-flex items-center justify-center
        w-8 h-8 rounded-lg bg-[#FF6B35]/10 border border-[#FF6B35]/20
        text-[#FF6B35] text-sm font-bold mb-4">
        {stepNumber}
      </span>
      <h3 className="text-xl font-semibold text-white mb-2 tracking-[-0.01em]">
        {title}
      </h3>
      <p className="text-sm text-[#A0A0A0] leading-relaxed">
        {description}
      </p>
    </div>
  </div>
);
```

### 6.7 Testimonial Quote Block

```jsx
const TestimonialQuote = ({ quote, author }) => (
  <div className="max-w-3xl mx-auto text-center">
    <p className="text-[clamp(20px,3vw,28px)] font-medium leading-[1.4]
      tracking-[-0.01em] text-white">
      "{quote}"
    </p>
    {author && (
      <p className="text-sm text-[#6B6B6B] mt-6">{author}</p>
    )}
  </div>
);
```

### 6.8 Pricing Card

On dark backgrounds, the pricing card is a dark card with prominent typography:

```jsx
const PricingCard = ({ price, period, billedNote }) => (
  <div className="bg-[#141414] border border-[#222] rounded-2xl p-8 text-center">
    <div className="flex items-baseline justify-center gap-1">
      <span className="text-sm text-[#A0A0A0] font-medium self-start mt-3">$</span>
      <span className="text-[64px] font-extrabold leading-none tracking-[-0.04em] text-white">
        {price}
      </span>
      <span className="text-lg text-[#A0A0A0]">/{period}</span>
    </div>
    {billedNote && (
      <p className="text-sm text-[#6B6B6B] mt-3">{billedNote}</p>
    )}
  </div>
);
```

On light backgrounds (the plan selector), pricing uses dark text:

```jsx
const PricingCardLight = ({ price, period, billedNote }) => (
  <div className="bg-white border border-[#E0E0E0] rounded-2xl p-8 text-center">
    <div className="flex items-baseline justify-center gap-1">
      <span className="text-sm text-[#888] font-medium self-start mt-3">$</span>
      <span className="text-[64px] font-extrabold leading-none tracking-[-0.04em] text-[#111]">
        {price}
      </span>
      <span className="text-lg text-[#555]">/{period}</span>
    </div>
    {billedNote && (
      <p className="text-sm text-[#888] mt-3">{billedNote}</p>
    )}
  </div>
);
```

### 6.9 FAQ Accordion

```jsx
const FAQItem = ({ question, answer, isOpen, onToggle }) => (
  <div className="border-b border-[#222]">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between py-5 text-left"
    >
      <span className="text-base font-semibold text-white pr-4">{question}</span>
      <span className={`text-[#6B6B6B] transition-transform duration-200
        ${isOpen ? 'rotate-45' : ''}`}>
        +
      </span>
    </button>
    {isOpen && (
      <div className="pb-5 text-sm text-[#A0A0A0] leading-relaxed max-w-[680px]">
        {answer}
      </div>
    )}
  </div>
);
```

### 6.10 Category Tag / Badge

Used for biomarker categories like "Heart & Vascular Health":

```jsx
const CategoryTag = ({ children }) => (
  <span className="inline-block text-xs font-medium uppercase tracking-[0.08em]
    text-[#FF6B35] bg-[#FF6B35]/8 border border-[#FF6B35]/20
    rounded-md px-2.5 py-1">
    {children}
  </span>
);
```

---

## 7. Animation & Motion

Superpower uses subtle, performance-friendly animations. Nothing flashy — just polished.

### 7.1 Scroll Reveal (Intersection Observer)

```jsx
import { useEffect, useRef, useState } from 'react';

const useScrollReveal = (options = {}) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.15, ...options }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
};

// Usage in a component:
const RevealSection = ({ children, delay = 0 }) => {
  const [ref, isVisible] = useScrollReveal();
  return (
    <div
      ref={ref}
      className="transition-all duration-700 ease-out"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};
```

### 7.2 Stagger Children Reveal

```jsx
const StaggerReveal = ({ children }) => {
  const [ref, isVisible] = useScrollReveal();
  return (
    <div ref={ref} className="flex flex-col gap-5">
      {React.Children.map(children, (child, i) => (
        <div
          className="transition-all duration-500 ease-out"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
            transitionDelay: `${i * 100}ms`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};
```

### 7.3 Button & Card Interactions

```css
/* Button hover: subtle lift */
.btn-primary {
  transition: background 0.2s ease, transform 0.15s ease;
}
.btn-primary:hover {
  transform: translateY(-1px);
}
.btn-primary:active {
  transform: translateY(0);
}

/* Card hover: background shift + border brighten */
.card-dark {
  transition: background 0.2s ease, border-color 0.2s ease;
}
.card-dark:hover {
  background: #1A1A1A;
  border-color: #333;
}
```

### 7.4 Counter Animation (for Stats)

```jsx
const AnimatedCounter = ({ target, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const [ref, isVisible] = useScrollReveal();

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const duration = 1500;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isVisible, target]);

  return (
    <span ref={ref}>
      {count}{suffix}
    </span>
  );
};
```

---

## 8. Page-Level Layout Template

```jsx
export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white"
      style={{ fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* Sticky Navbar */}
      <nav className="sticky top-0 z-50 h-16 flex items-center justify-between px-6
        bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-[#222]">
        {/* Logo left, nav links center, CTA right */}
      </nav>

      {/* Page content: alternating dark/light sections */}
      <main>{children}</main>

      {/* Footer: dark bg */}
      <footer className="bg-[#0A0A0A] border-t border-[#222] py-16 px-6">
        <div className="max-w-[1200px] mx-auto">
          {/* Footer content */}
        </div>
      </footer>
    </div>
  );
}
```

---

## 9. Quick Reference Cheat Sheet

### Text on Dark Sections
- Heading: `text-white font-bold tracking-[-0.025em]`
- Body: `text-[#A0A0A0] text-base leading-[1.7]`
- Muted: `text-[#6B6B6B] text-sm`
- Label: `text-[#FF6B35] text-xs font-medium uppercase tracking-[0.1em]`

### Text on Light Sections
- Heading: `text-[#111] font-bold tracking-[-0.025em]`
- Body: `text-[#555] text-base leading-[1.7]`
- Muted: `text-[#888] text-sm`
- Label: `text-[#FF6B35] text-xs font-medium uppercase tracking-[0.1em]` (stays orange)

### Cards on Dark
- `bg-[#141414] border border-[#222] rounded-2xl p-7 hover:bg-[#1A1A1A] hover:border-[#333]`

### Cards on Light / Cream
- `bg-white border border-[#E0E0E0] rounded-2xl p-7 hover:border-[#CCC] hover:shadow-sm`

### Primary CTA (always orange)
- `bg-[#FF6B35] hover:bg-[#FF8A5C] text-white font-semibold rounded-full px-8 py-3.5`

### Ghost CTA on Dark
- `border border-[#444] hover:border-[#666] text-white rounded-full px-8 py-3.5`

### Ghost CTA on Light
- `border border-[#CCC] hover:border-[#999] text-[#111] rounded-full px-8 py-3.5`

### Section Wrapper
- Dark: `bg-[#0A0A0A] py-20 md:py-28` → content in `max-w-[1200px] mx-auto px-6`
- Light: `bg-white py-20 md:py-28` → same content wrapper
- Cream: `bg-[#F5F0EB] py-20 md:py-28` → same content wrapper

---

## 10. Do's and Don'ts

### DO
- Use `clamp()` for responsive heading sizes
- Apply negative letter-spacing on all headings (-0.02 to -0.04em)
- Keep body text at #A0A0A0 on dark, #555 on light — never pure white body text
- Use the orange accent ONLY for CTAs, labels, and small highlights
- Make CTAs fully rounded (pill shape, border-radius: 999px)
- Alternate between dark and light sections for visual rhythm
- Use 1px borders on cards (subtle, structural)
- Give sections generous vertical padding (80–112px)
- Animate on scroll with fade-up reveals

### DON'T
- Don't use colored gradients for backgrounds (the bg is always flat: #0A0A0A, #111, or #FFF/#F5F0EB)
- Don't use Inter in a thin/light weight — minimum 400 for body, 600+ for headings
- Don't use rounded-lg for CTAs — always use rounded-full (pill)
- Don't put orange text in body paragraphs — orange is only for labels and accents
- Don't add shadows on dark-section cards — the 1px border creates enough separation
- Don't use serif fonts anywhere
- Don't center body text (only center headings and stat blocks)
- Don't use more than one accent color — the whole system is monochrome + orange
- Don't use gradients on buttons — flat orange background only
- Don't make light sections the same shade as dark cards (#141414 ≠ light section)
