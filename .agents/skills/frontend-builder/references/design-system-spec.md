# Design System Specification Playbook

Established tokens and variables for styling highly aesthetic, responsive, and biophilic user interfaces.

## 1. Custom HSL Theme Architectures

Standardize themes by declaring high-precision HSL variables under the CSS root selector:

```css
:root {
  /* Biophilic HSL Palette */
  --color-forest: 136 34% 16%;      /* Primary Deep Green */
  --color-sage: 138 24% 45%;        /* Accent Soft Green */
  --color-cream: 45 40% 96%;        /* Neutral Light Background */
  --color-sand: 40 28% 88%;         /* Border & Soft Shadow Tint */
  --color-charcoal: 220 20% 12%;    /* Neutral Dark Text */
  
  /* System States */
  --color-success: 142 70% 35%;
  --color-warning: 38 92% 50%;
  --color-error: 0 84% 60%;
  --color-info: 217 91% 60%;

  /* Glassmorphism Specs */
  --glass-bg: rgba(255, 255, 255, 0.75);
  --glass-border: rgba(255, 255, 255, 0.4);
  --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.08);
}
```

## 2. Advanced Typography Scales

Avoid default browser layouts. Utilize standard sizing scales to optimize readability:

| Class | Equivalent Size | Weight | Tracking | Recommended Use |
|---|---|---|---|---|
| **Display Header** | `3rem` (48px) | Bold / Black (900) | `tracking-tight` | Landing page H1 displays |
| **Section Header** | `2rem` (32px) | Semibold (600) | `tracking-normal` | Section headers H2 |
| **Card Header** | `1.25rem` (20px) | Medium (500) | `tracking-wide` | Grid titles & card layouts |
| **Body Standard** | `1rem` (16px) | Regular (400) | `tracking-normal` | Primary text |
| **Caption Detail** | `0.85rem` (13.6px) | Medium / Light | `tracking-wider` | Metadata, inputs, warnings |

---

## 3. High-Premium Glassmorphism Template

To render premium overlay cards, modals, or dropdown navigation paths:

```css
.premium-glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
  border-radius: 1rem;
}
```
