# Mercuri Design Guidelines (Canonical: index.html)

This file defines UI standards for all pages.
`index.html` is the canonical source. If a new style conflicts with this file, follow `index.html` and then update this document.

## 1. Canonical Source

- Primary reference: `index.html`
- Shared components must inherit `index.html` styling patterns.
- `features.html`, `wix-sms.html`, and others should not define divergent one-off systems.

## 2. Design Tokens (From index.html)

Use these exact tokens:

- `primary`: `#EB973D`
- `background-light`: `#fdfdfb`
- `background-dark`: `#0f172a`
- `charcoal`: `#1a1a1a`
- Display font: `Instrument Serif` (`serif-text`)
- Body font: `Inter`

## 3. Typography Scale

Use these index-style tiers:

- Hero H1: `serif-text text-4xl sm:text-5xl lg:text-7xl leading-[1.1]`
- Large section heading: `serif-text text-3xl sm:text-4xl md:text-5xl leading-[1.1]`
- Mid section heading: `serif-text text-3xl sm:text-4xl`
- Body: `text-base sm:text-lg text-slate-600 dark:text-slate-400`
- Eyebrow/label: `text-xs font-bold uppercase tracking-[0.2em]`

## 4. Button System (Index-Based)

### 4.1 Primary CTA (default page sections)

```html
<a class="w-full sm:w-auto bg-charcoal dark:bg-primary text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl hover:-translate-y-1 transition-all text-center">
  Get started for free
</a>
```

### 4.2 Primary CTA (marketing blocks in index)

```html
<a class="bg-primary text-white px-8 py-3.5 rounded-xl font-semibold hover:scale-[1.02] transition-transform">
  Start recovering revenue
</a>
```

### 4.3 Secondary CTA

```html
<a class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-8 py-3.5 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
  Book a Demo
</a>
```

Rules:

- Use `<a>` for navigation and conversion actions.
- For dual CTA rows: `flex flex-col sm:flex-row items-center gap-4`.
- Do not introduce new CTA color systems per page.

## 5. Section Layout Patterns

### 5.1 Default content section

```html
<section class="py-16 sm:py-20 lg:py-24 px-6">
  <div class="max-w-7xl mx-auto">...</div>
</section>
```

### 5.2 Bordered light section variant

```html
<section class="py-16 sm:py-20 px-6 bg-white dark:bg-slate-900/40 border-y border-gray-100 dark:border-slate-800">
  <div class="max-w-7xl mx-auto">...</div>
</section>
```

Rules:

- Keep horizontal page padding at `px-6`.
- Use `max-w-7xl mx-auto` for major sections.

## 6. Surfaces, Cards, and Radius

Use index-consistent card recipes:

- Standard card: `bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl`
- Nested card: `bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl`
- Compact list item card: `rounded-xl border border-slate-200 dark:border-slate-800`

Shadow scale:

- `shadow-sm` for supporting cards
- `shadow-lg` for primary cards
- `shadow-2xl` for hero/demo highlights only

Avoid arbitrary radius jumps unless intentionally matching an existing index hero treatment.

## 7. Color Usage Rules

- `primary` is accent/action color, not default full-surface fill everywhere.
- Main text should remain `text-slate-900` / `dark:text-white` on cards.
- Support text should remain `text-slate-600` or `text-slate-500` families.
- Success/green should be limited to success states and confirmations.

## 8. Icon Rules

- Allowed icon sets: `material-icons-outlined`, `material-symbols-outlined` (both used in index).
- Prefer whichever is already used in a given component.
- Do not add a third icon system.

## 9. Reusable Component Rule

If a UI block appears in 2 or more places, extract it into `components/` and load through `js/main.js`.

Current reusable examples:

- `components/header.html`
- `components/footer.html`
- `components/brands.html`
- `components/reviews.html`
- `components/chat-preview.html`
- `components/marketing.html`
- `components/marketing-dashboard-mock.html`

## 10. Pre-Merge Consistency Checklist

Before shipping any page:

- Typography matches section 3.
- Buttons match one of section 4 variants.
- Section shells use section 5 patterns.
- Card/radius/shadow choices follow section 6.
- Dark mode classes are present for new surfaces/text.
- Repeated markup is componentized.

## 11. Do / Don’t

Do:

- Copy class recipes from `index.html` and shared components.
- Reuse existing spacing/radius/typography scales.
- Keep CTA language/style consistent by section type.

Don’t:

- Invent page-specific color/button systems.
- Mix unrelated heading scales in the same section.
- Duplicate large mock blocks inline across multiple files.
