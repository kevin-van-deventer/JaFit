# Premium Web Animations & Transitions Playbook

Rules and utility guidelines to make interface elements feel tactile, alive, and responsive to user interaction.

## 1. Physics-Based Transitions

Always apply transitions with modern easing variables to prevent visual jarring:

```css
/* Tactile Hover Curve (Brings elements forward) */
.tactile-hover {
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), 
              box-shadow 0.3s ease, 
              background-color 0.2s ease;
}

.tactile-hover:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.15);
}

.tactile-hover:active {
  transform: translateY(-1px) scale(0.99);
}
```

---

## 2. Keyframe-Driven Page Entrances

Use dynamic entrances to animate page content as it hydrates:

```css
@keyframes slideUpFade {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-entrance {
  animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
```

---

## 3. High-Quality Loading States

For server-rendered dynamic forms (e.g., login, registering, data-fetching):

```css
@keyframes pulseGlow {
  0%, 100% {
    opacity: 0.6;
    background-color: var(--color-sage);
  }
  50% {
    opacity: 1;
    background-color: var(--color-forest);
  }
}

.shimmer-placeholder {
  animation: pulseGlow 1.8s infinite ease-in-out;
}
```
