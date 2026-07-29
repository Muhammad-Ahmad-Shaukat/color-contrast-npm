import { converter, formatHex, parse } from 'culori'
import { ColorParseError } from './errors.js'
import type { ColorInput, OklchColor, SrgbColor } from './types.js'

const toRgb = converter('rgb')
const toOklch = converter('oklch')

export function parseColor(input: ColorInput): SrgbColor {
  const parsed = parse(input)
  if (!parsed) {
    throw new ColorParseError(input)
  }

  const rgb = toRgb(parsed)
  if (!rgb || rgb.r == null || rgb.g == null || rgb.b == null) {
    throw new ColorParseError(input)
  }

  return {
    r: clamp01(rgb.r),
    g: clamp01(rgb.g),
    b: clamp01(rgb.b),
    alpha: rgb.alpha,
  }
}

export function toOklchColor(input: ColorInput | SrgbColor): OklchColor {
  const rgb =
    typeof input === 'string'
      ? parseColor(input)
      : input

  const oklch = toOklch({ mode: 'rgb', ...rgb })
  if (!oklch || oklch.l == null) {
    throw new ColorParseError(typeof input === 'string' ? input : formatSrgb(rgb))
  }

  return {
    l: clamp01(oklch.l),
    c: oklch.c ?? 0,
    h: oklch.h ?? 0,
    alpha: oklch.alpha,
  }
}

export function oklchToHex(color: OklchColor): string {
  return formatHex({
    mode: 'oklch',
    l: clamp01(color.l),
    c: Math.max(0, color.c),
    h: color.h,
    alpha: color.alpha,
  })
}

export function formatSrgb(color: SrgbColor): string {
  return formatHex({
    mode: 'rgb',
    r: clamp01(color.r),
    g: clamp01(color.g),
    b: clamp01(color.b),
    alpha: color.alpha,
  })
}

export function normalizeColor(input: ColorInput): string {
  return formatSrgb(parseColor(input))
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0
  return Math.min(1, Math.max(0, value))
}
