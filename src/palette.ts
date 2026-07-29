import { check } from './check.js'
import { ContrastError } from './errors.js'
import { normalizeColor } from './parse.js'
import { meetsContrastTarget, resolveTarget } from './target.js'
import type {
  ColorInput,
  ContrastMode,
  PalettePairResult,
  ValidatePaletteOptions,
  ValidatePaletteResult,
} from './types.js'

/**
 * Validate foreground/background token pairs in a design-token color map.
 */
export function validatePalette(
  tokens: Record<string, ColorInput>,
  options: ValidatePaletteOptions,
): ValidatePaletteResult {
  const mode: ContrastMode = options.mode ?? 'wcag2'
  const target = resolveTarget(mode, options.target)

  if (!options.pairs.length) {
    throw new ContrastError('At least one token pair is required')
  }

  const results: PalettePairResult[] = options.pairs.map(([foregroundKey, backgroundKey]) => {
    const fgRaw = tokens[foregroundKey]
    const bgRaw = tokens[backgroundKey]

    if (fgRaw == null) {
      throw new ContrastError(`Unknown foreground token: "${foregroundKey}"`)
    }
    if (bgRaw == null) {
      throw new ContrastError(`Unknown background token: "${backgroundKey}"`)
    }

    const foreground = normalizeColor(fgRaw)
    const background = normalizeColor(bgRaw)
    const result = check(foreground, background, { mode })
    const met = meetsContrastTarget(result, target)

    return {
      foregroundKey,
      backgroundKey,
      foreground,
      background,
      met,
      check: result,
    }
  })

  const failures = results.filter((r) => !r.met)

  return {
    ok: failures.length === 0,
    mode,
    target,
    results,
    failures,
  }
}
