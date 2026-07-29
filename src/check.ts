import { apcaContrast, apcaMetLevels, apcaPassLevels } from './apca.js'
import { normalizeColor, parseColor } from './parse.js'
import type { CheckOptions, CheckResult, ColorInput } from './types.js'
import { contrastRatio, wcagMetLevels, wcagPassLevels } from './wcag2.js'

/**
 * Check contrast compatibility between a foreground and background color.
 *
 * @param foreground - Any CSS color (hex, rgb, hsl, named, oklch, lch, …)
 * @param background - Any CSS color
 * @param options - `{ mode: 'wcag2' | 'apca' }` (default `'wcag2'`)
 */
export function check(
  foreground: ColorInput,
  background: ColorInput,
  options: CheckOptions = {},
): CheckResult {
  const mode = options.mode ?? 'wcag2'
  const fg = parseColor(foreground)
  const bg = parseColor(background)
  const fgHex = normalizeColor(foreground)
  const bgHex = normalizeColor(background)

  if (mode === 'apca') {
    const lc = apcaContrast(fg, bg)
    const pass = apcaPassLevels(lc)
    return {
      mode: 'apca',
      foreground: fgHex,
      background: bgHex,
      lc: round(lc, 2),
      pass,
      levels: apcaMetLevels(pass),
    }
  }

  const ratio = contrastRatio(fg, bg)
  const pass = wcagPassLevels(ratio)
  return {
    mode: 'wcag2',
    foreground: fgHex,
    background: bgHex,
    ratio: round(ratio, 2),
    pass,
    levels: wcagMetLevels(pass),
  }
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}
