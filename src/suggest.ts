import { check } from './check.js'
import { normalizeColor, oklchToHex, toOklchColor } from './parse.js'
import { meetsContrastTarget, resolveTarget } from './target.js'
import type {
  ContrastMode,
  ContrastTarget,
  SuggestOptions,
  SuggestResult,
} from './types.js'

/**
 * Suggest a nearby color (adjusting lightness in OKLCH) so the pair meets a target.
 * If the target cannot be met, returns the best achievable color with `met: false`.
 */
export function suggest(options: SuggestOptions): SuggestResult {
  const mode: ContrastMode = options.mode ?? 'wcag2'
  const fix = options.fix ?? 'foreground'
  const target = resolveTarget(mode, options.target)

  const fgOriginal = normalizeColor(options.foreground)
  const bgOriginal = normalizeColor(options.background)
  const adjustableOriginal = fix === 'foreground' ? fgOriginal : bgOriginal
  const fixedColor = fix === 'foreground' ? bgOriginal : fgOriginal

  const start = toOklchColor(adjustableOriginal)
  const fixedOklch = toOklchColor(fixedColor)

  // Prefer moving away from the fixed color's lightness
  const preferDarker = fixedOklch.l > 0.5
  const directions = preferDarker ? [-1, 1] : [1, -1]

  let best = evaluateCandidate(start.l, start, fixedColor, fix, mode, target, adjustableOriginal, 0)
  let steps = 0

  for (const direction of directions) {
    let foundPassL: number | null = null
    let prevL = start.l
    let lo = start.l
    let hi = start.l

    const samples = 24
    for (let i = 1; i <= samples; i++) {
      steps++
      const t = i / samples
      const l = direction < 0 ? start.l * (1 - t) : start.l + (1 - start.l) * t

      const result = evaluateCandidate(l, start, fixedColor, fix, mode, target, adjustableOriginal, steps)
      if (better(result, best, start.l)) {
        best = result
      }

      if (result.met) {
        foundPassL = l
        lo = direction < 0 ? l : prevL
        hi = direction < 0 ? prevL : l
        break
      }
      prevL = l
    }

    if (foundPassL !== null) {
      let passL = foundPassL
      for (let i = 0; i < 16; i++) {
        steps++
        const mid = (lo + hi) / 2
        const result = evaluateCandidate(mid, start, fixedColor, fix, mode, target, adjustableOriginal, steps)
        if (result.met) {
          passL = mid
          if (direction < 0) {
            // searching darker: passing region is darker; move toward original (lighter)
            lo = mid
          } else {
            hi = mid
          }
          if (better(result, best, start.l)) {
            best = result
          }
        } else if (direction < 0) {
          // mid too light — need darker
          hi = mid
        } else {
          lo = mid
        }
      }

      const finalResult = evaluateCandidate(passL, start, fixedColor, fix, mode, target, adjustableOriginal, steps)
      if (better(finalResult, best, start.l)) {
        best = finalResult
      }
      break
    }
  }

  return best
}

function evaluateCandidate(
  l: number,
  base: ReturnType<typeof toOklchColor>,
  fixedColor: string,
  fix: 'foreground' | 'background',
  mode: ContrastMode,
  target: ContrastTarget,
  original: string,
  steps: number,
): SuggestResult {
  const candidateHex = oklchToHex({ ...base, l: clamp01(l) })
  const foreground = fix === 'foreground' ? candidateHex : fixedColor
  const background = fix === 'background' ? candidateHex : fixedColor
  const result = check(foreground, background, { mode })
  const met = meetsContrastTarget(result, target)

  return {
    mode,
    target,
    fix,
    color: candidateHex,
    original,
    met,
    ratio: result.mode === 'wcag2' ? result.ratio : undefined,
    lc: result.mode === 'apca' ? Math.abs(result.lc) : undefined,
    steps,
    check: result,
  }
}

function better(candidate: SuggestResult, current: SuggestResult, originalL: number): boolean {
  if (candidate.met !== current.met) return candidate.met
  if (candidate.met && current.met) {
    // Prefer smaller lightness delta from original
    const candDelta = Math.abs(toOklchColor(candidate.color).l - originalL)
    const currDelta = Math.abs(toOklchColor(current.color).l - originalL)
    if (Math.abs(candDelta - currDelta) > 1e-6) return candDelta < currDelta
  }
  const candScore = candidate.ratio ?? candidate.lc ?? 0
  const currScore = current.ratio ?? current.lc ?? 0
  return candScore > currScore
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}
