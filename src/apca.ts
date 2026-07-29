import type { ApcaPass, ApcaTarget, SrgbColor } from './types.js'

/**
 * APCA™ 0.0.98G-4g constants (W3 candidate).
 * Implementation follows the publicly documented APCA-W3 algorithm.
 */
const MAIN_TRC = 2.4
const S_RCO = 0.2126729
const S_GCO = 0.7151522
const S_BCO = 0.072175
const NORM_BG = 0.56
const NORM_TXT = 0.57
const REV_TXT = 0.62
const REV_BG = 0.65
const BLK_THRS = 0.022
const BLK_CLMP = 1.414
const SCALE_BOW = 1.14
const SCALE_WOB = 1.14
const LO_BOW_OFFSET = 0.027
const LO_WOB_OFFSET = 0.027
const LO_CLIP = 0.1
const DELTA_Y_MIN = 0.0005

/**
 * Absolute Lc thresholds for common use cases.
 * See README for guidance; these are practical defaults, not a legal standard.
 */
export const APCA_THRESHOLDS: Record<ApcaTarget, number> = {
  body: 75,
  large: 60,
  ui: 45,
  nonText: 30,
}

function softClampY(y: number): number {
  if (y >= BLK_THRS) return y
  return y + (BLK_THRS - y) ** BLK_CLMP
}

function srgbToY(color: SrgbColor): number {
  const r = color.r ** MAIN_TRC
  const g = color.g ** MAIN_TRC
  const b = color.b ** MAIN_TRC
  return S_RCO * r + S_GCO * g + S_BCO * b
}

/**
 * Signed APCA lightness contrast (Lc) for text on background.
 * Positive ≈ dark text on light bg (BoW); negative ≈ light text on dark bg (WoB).
 */
export function apcaContrast(text: SrgbColor, background: SrgbColor): number {
  const yTxt = softClampY(srgbToY(text))
  const yBg = softClampY(srgbToY(background))

  if (Math.abs(yBg - yTxt) < DELTA_Y_MIN) {
    return 0
  }

  let sapc: number
  let outputContrast: number

  // Normal polarity: dark text on light background
  if (yBg > yTxt) {
    sapc = (yBg ** NORM_BG - yTxt ** NORM_TXT) * SCALE_BOW
    outputContrast = sapc < LO_CLIP ? 0 : sapc - LO_BOW_OFFSET
  } else {
    // Reverse polarity: light text on dark background
    sapc = (yBg ** REV_BG - yTxt ** REV_TXT) * SCALE_WOB
    outputContrast = sapc > -LO_CLIP ? 0 : sapc + LO_WOB_OFFSET
  }

  return outputContrast * 100
}

export function apcaPassLevels(lc: number): ApcaPass {
  const abs = Math.abs(lc)
  return {
    body: abs >= APCA_THRESHOLDS.body,
    large: abs >= APCA_THRESHOLDS.large,
    ui: abs >= APCA_THRESHOLDS.ui,
    nonText: abs >= APCA_THRESHOLDS.nonText,
  }
}

export function apcaMetLevels(pass: ApcaPass): ApcaTarget[] {
  const levels: ApcaTarget[] = []
  if (pass.body) levels.push('body')
  if (pass.large) levels.push('large')
  if (pass.ui) levels.push('ui')
  if (pass.nonText) levels.push('nonText')
  return levels
}

export function meetsApcaTarget(lc: number, target: ApcaTarget): boolean {
  return Math.abs(lc) >= APCA_THRESHOLDS[target]
}

export function isApcaTarget(target: string): target is ApcaTarget {
  return target in APCA_THRESHOLDS
}
