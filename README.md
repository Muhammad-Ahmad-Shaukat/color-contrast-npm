# color-contrast-kit

Check whether two colors are compatible to use together — with **WCAG 2.1** contrast ratios by default and optional **APCA** scoring. Fix failing pairs, pick the best text color from a palette, and validate design-token maps (including a CI-friendly CLI).

## Install

```bash
npm install color-contrast-kit
```

## Quick start

```ts
import { check, suggest, bestText, validatePalette } from 'color-contrast-kit'

const report = check('#1a1a1a', '#ffffff')
// {
//   mode: 'wcag2',
//   ratio: 18.58,
//   pass: { aa: true, aaLarge: true, aaa: true, aaaLarge: true },
//   levels: ['AA', 'AA-large', 'AAA', 'AAA-large'],
//   foreground: '#1a1a1a',
//   background: '#ffffff'
// }

check('oklch(50% 0.1 40)', 'white', { mode: 'apca' })
```

Accepts common CSS color forms: hex, `rgb()`, `hsl()`, named colors, `oklch()`, `lch()`, and more (via [culori](https://culorijs.org/)).

## API

### `check(foreground, background, options?)`

Returns pass/fail for each level plus the contrast score.

| Mode | Score | Pass keys |
|------|--------|-----------|
| `wcag2` (default) | `ratio` (1–21) | `aa`, `aaLarge`, `aaa`, `aaaLarge` |
| `apca` | signed `lc` | `body`, `large`, `ui`, `nonText` |

**WCAG 2.1 thresholds:** AA 4.5 · AA-large 3 · AAA 7 · AAA-large 4.5

**APCA absolute Lc defaults used here:** body 75 · large 60 · ui 45 · nonText 30  
(APCA is not a W3C Recommendation yet; treat these as practical defaults.)

### `suggest({ foreground, background, fix?, target?, mode? })`

Adjusts lightness in OKLCH for `foreground` (default) or `background` until the target is met. Returns the closest passing color, or the best achievable with `met: false`.

```ts
suggest({
  foreground: '#777',
  background: '#fff',
  fix: 'foreground',
  target: 'AA',
})
```

Targets: WCAG `AA` | `AA-large` | `AAA` | `AAA-large` · APCA `body` | `large` | `ui` | `nonText`

### `bestText(background, palette, options?)`

Ranks candidates by contrast; optional `target` prefers colors that pass.

```ts
bestText('#0f172a', ['#fff', '#e2e8f0', '#94a3b8', '#64748b'])
```

### `validatePalette(tokens, { pairs, target?, mode? })`

Validate design-token pairs for CI / design systems.

```ts
validatePalette(
  { bg: '#fff', text: '#767676', muted: '#999', brand: '#2563eb' },
  {
    pairs: [
      ['text', 'bg'],
      ['muted', 'bg'],
      ['brand', 'bg'],
    ],
    target: 'AA',
  },
)
```

### Errors

- `ColorParseError` — invalid color string (`error.input`)
- `ContrastError` — empty palette, unknown tokens, invalid mode/target

## CLI

```bash
npx color-contrast "#fff" "#767676"
npx color-contrast check "#fff" "#767676" --mode apca
npx color-contrast suggest --fg "#777" --bg "#fff" --fix foreground --target AA
npx color-contrast best-text --bg "#0f172a" --palette "#fff,#94a3b8,#64748b"
npx color-contrast palette tokens.json --pairs text:bg,muted:bg --target AA
```

Add `--json` for machine-readable output. Exit code `1` when the default/required target is not met (CI-friendly).

Example `tokens.json`:

```json
{
  "bg": "#ffffff",
  "text": "#111111",
  "muted": "#999999"
}
```

## WCAG vs APCA

- **WCAG 2.1** is what most audits, legal requirements, and tooling expect today. Use it as the default for compliance checks.
- **APCA** models perceived contrast more accurately for modern displays. Use `{ mode: 'apca' }` for research, design exploration, or forward-looking systems — not as a drop-in legal replacement for WCAG 2.

**Large text (WCAG):** typically ≥18pt regular or ≥14pt bold.

## Runtime

Library core is isomorphic (Node + browsers). The CLI is Node ≥ 18 only.

## License

MIT
