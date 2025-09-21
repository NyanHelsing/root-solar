# @root-solar/flare Guidelines

Applies to the design system under `packages/flare/`.

## Purpose
- Deliver the shared UI primitives used across apps and packages.
- Encapsulate visual decisions (tokens, motion, layout rhythm) so apps only assemble components.
- Provide ergonomic, typed React APIs with sensible defaults and forwardRef support.

## Component Patterns
- Keep components presentational and side-effect free; surface callbacks instead of reaching into global stores.
- Export default components plus typed props from `src/index.ts` so consumers get consistent entry points.
- Use `forwardRef` where native elements expose refs, and preserve passthrough props like `className` and `aria-*` attributes.
- Co-locate stories or usage examples next to the component when adding new primitives for quick discovery.

## Styling
- Author styles with SCSS modules and shared mixins from `src/styles/`; avoid global CSS or inline styles.
- Drive appearance through CSS custom properties (`--flare-*`) so packages and apps can theme via tokens.
- Prefer composition (variants, density, tone props) over branching markup to keep DOM structure stable for testing.

## Accessibility & Testing
- Ensure interactive primitives meet WCAG basics: keyboard focus states, aria labels where appropriate, and semantic HTML elements.
- Add lightweight visual or interaction tests with the Node test runner (`pnpm --filter @root-solar/flare test`) or Playwright component tests when behavior is browser-specific.
- Document any required theme tokens or usage caveats in the package README when introducing new components.
