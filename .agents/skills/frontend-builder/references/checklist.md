# Frontend Compliance & Visual Audit Checklist

Always execute this audit before finalizing any visual changes to components or layout templates.

## 1. Visual Alignment & Precision
- [ ] No default system colors (pure blue, red, green) are visible.
- [ ] Harmony is established using tailored biophilic HSL shades or the brand's direct hex maps.
- [ ] Glassmorphism cards utilize high-precision border structures (`1px solid rgba(255, 255, 255, 0.4)`) to separate themselves from backgrounds.
- [ ] Margins and padding scales use uniform factors of 4 (`0.25rem`, `0.5rem`, `1rem`, `1.5rem`, `2rem`, `3rem`).

## 2. Responsiveness & Accessibility
- [ ] Columns drop cleanly to single-column blocks on mobile screens (`grid-cols-1 md:grid-cols-3`).
- [ ] Interactive touch points (buttons, link items) satisfy the `48px` minimum dimensions requirement.
- [ ] Text elements preserve legible contrast scales (satisfying WCAG AA criteria).
- [ ] Page layouts avoid horizontal scrollbars on low-resolution viewports (`w-full overflow-x-hidden`).

## 3. Feedback & Animation States
- [ ] Links and buttons carry explicit hover transition parameters.
- [ ] Server actions and network requests hook into dynamic load states (spinners or disabled triggers).
- [ ] Validation errors are printed in real-time beneath form inputs in warm HSL error tones.
