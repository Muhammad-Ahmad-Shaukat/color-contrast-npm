import { check } from './check.js'
import { ContrastError } from './errors.js'
import { normalizeColor } from './parse.js'
import { meetsContrastTarget, validateOptionalTarget } from './target.js'
import type {
  BestTextOptions,
  BestTextResult,
  CheckResult,
  ColorInput,
  ContrastMode,
} from './types.js'

/**
 * Pick the best text (foreground) color from a palette for a given background.
 * Ranking uses contrast score (WCAG ratio or |APCA Lc|). If `target` is set,
 * prefers candidates that meet it; otherwise returns the highest-scoring color.
 */
export function bestText(
  background: ColorInput,
  palette: ColorInput[],
  options: BestTextOptions = {},
): BestTextResult {
  if (palette.length === 0) {
    throw new ContrastError('Palette must contain at least one color')
  }

  const mode: ContrastMode = options.mode ?? 'wcag2'
  const target = options.target
  validateOptionalTarget(mode, target)

  const bg = normalizeColor(background)
  const ranked = palette.map((color) => {
    const normalized = normalizeColor(color)
    const result = check(normalized, bg, { mode })
    return {
      color: normalized,
      score: contrastScore(result),
      check: result,
      met: target ? meetsContrastTarget(result, target) : true,
    }
  })

  ranked.sort((a, b) => {
    if (target) {
      if (a.met !== b.met) return a.met ? -1 : 1
    }
    return b.score - a.score
  })

  const winner = ranked[0]
  if (!winner) {
    throw new ContrastError('Palette must contain at least one color')
  }

  return {
    mode,
    color: winner.color,
    met: target ? winner.met : true,
    check: winner.check,
    ranked: ranked.map(({ color, score, check: c }) => ({ color, score, check: c })),
  }
}

function contrastScore(result: CheckResult): number {
  return result.mode === 'wcag2' ? result.ratio : Math.abs(result.lc)
}
