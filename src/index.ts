export { check } from './check.js'
export { suggest } from './suggest.js'
export { bestText } from './bestText.js'
export { validatePalette } from './palette.js'
export { ColorParseError, ContrastError } from './errors.js'
export {
  contrastRatio,
  relativeLuminance,
  WCAG_THRESHOLDS,
  meetsWcagTarget,
} from './wcag2.js'
export {
  apcaContrast,
  APCA_THRESHOLDS,
  meetsApcaTarget,
} from './apca.js'
export { parseColor, normalizeColor } from './parse.js'

export type {
  ContrastMode,
  ContrastTarget,
  WcagTarget,
  ApcaTarget,
  ColorInput,
  CheckOptions,
  CheckResult,
  WcagCheckResult,
  ApcaCheckResult,
  WcagPass,
  ApcaPass,
  SuggestOptions,
  SuggestResult,
  BestTextOptions,
  BestTextResult,
  ValidatePaletteOptions,
  ValidatePaletteResult,
  PalettePairResult,
} from './types.js'
