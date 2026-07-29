import type { SrgbColor, WcagPass, WcagTarget } from './types.js'

/** WCAG 2.1 contrast ratio thresholds. */
export const WCAG_THRESHOLDS: Record<WcagTarget, number> = {
  AA: 4.5,
  'AA-large': 3,
  AAA: 7,
  'AAA-large': 4.5,
}

/**
 * Relative luminance per WCAG 2.1 relative luminance formula.
 * Channels are sRGB 0–1.
 */
export function relativeLuminance(color: SrgbColor): number {
  const r = linearize(color.r)
  const g = linearize(color.g)
  const b = linearize(color.b)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function linearize(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
}

/**
 * WCAG 2.1 contrast ratio between two colors (order-independent).
 * Returns a value in [1, 21].
 */
export function contrastRatio(fg: SrgbColor, bg: SrgbColor): number {
  const l1 = relativeLuminance(fg)
  const l2 = relativeLuminance(bg)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export function wcagPassLevels(ratio: number): WcagPass {
  return {
    aa: ratio >= WCAG_THRESHOLDS.AA,
    aaLarge: ratio >= WCAG_THRESHOLDS['AA-large'],
    aaa: ratio >= WCAG_THRESHOLDS.AAA,
    aaaLarge: ratio >= WCAG_THRESHOLDS['AAA-large'],
  }
}

export function wcagMetLevels(pass: WcagPass): WcagTarget[] {
  const levels: WcagTarget[] = []
  if (pass.aa) levels.push('AA')
  if (pass.aaLarge) levels.push('AA-large')
  if (pass.aaa) levels.push('AAA')
  if (pass.aaaLarge) levels.push('AAA-large')
  return levels
}

export function meetsWcagTarget(ratio: number, target: WcagTarget): boolean {
  return ratio >= WCAG_THRESHOLDS[target]
}

export function isWcagTarget(target: string): target is WcagTarget {
  return target in WCAG_THRESHOLDS
}
