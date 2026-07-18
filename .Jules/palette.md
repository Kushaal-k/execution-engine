# Palette's Journal

## 2024-05-14 - Accessible Accordion Interactions in InputArea
**Learning:** When using standard `div` elements with `onClick` handlers for toggleable panels (like the `InputArea`), screen reader users lack context on whether the area is expanded, and keyboard users can't tab to it. Also, when conditional rendering unmounts the controlled element completely, `aria-controls` points to a missing ID.
**Action:** Always convert functional `div` toggles to native `<button>` elements, add `aria-expanded` attributes tied to the component's open/close state, include `aria-controls` for context (consider using CSS visibility hiding instead of unmounting for strict ARIA compliance), and apply clear `focus-visible` styling (e.g. `focus-visible:ring-2`) to ensure full accessibility.
