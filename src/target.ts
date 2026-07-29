import { APCA_THRESHOLDS, isApcaTarget, meetsApcaTarget } from './apca.js'
import { ContrastError } from './errors.js'
import type { CheckResult, ContrastMode, ContrastTarget } from './types.js'
import { isWcagTarget, meetsWcagTarget, WCAG_THRESHOLDS } from './wcag2.js'

export function resolveTarget(mode: ContrastMode, target?: ContrastTarget): ContrastTarget {
  if (target) {
    if (mode === 'wcag2' && !isWcagTarget(target)) {
      throw new ContrastError(
        `Target "${target}" is not valid for WCAG 2 mode. Use one of: ${Object.keys(WCAG_THRESHOLDS).join(', ')}`,
      )
    }
    if (mode === 'apca' && !isApcaTarget(target)) {
      throw new ContrastError(
        `Target "${target}" is not valid for APCA mode. Use one of: ${Object.keys(APCA_THRESHOLDS).join(', ')}`,
      )
    }
    return target
  }
  return mode === 'apca' ? 'body' : 'AA'
}

export function meetsContrastTarget(result: CheckResult, target: ContrastTarget): boolean {
  if (result.mode === 'wcag2') {
    if (!isWcagTarget(target)) {
      throw new ContrastError(`Target "${target}" is not valid for WCAG 2 mode`)
    }
    return meetsWcagTarget(result.ratio, target)
  }
  if (!isApcaTarget(target)) {
    throw new ContrastError(`Target "${target}" is not valid for APCA mode`)
  }
  return meetsApcaTarget(result.lc, target)
}

export function validateOptionalTarget(mode: ContrastMode, target?: ContrastTarget): void {
  if (!target) return
  resolveTarget(mode, target)
}
