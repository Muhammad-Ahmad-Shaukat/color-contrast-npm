/** Contrast calculation mode. WCAG 2.1 is the default. */
export type ContrastMode = 'wcag2' | 'apca'

/** WCAG 2.1 conformance targets. */
export type WcagTarget = 'AA' | 'AA-large' | 'AAA' | 'AAA-large'

/**
 * APCA usage targets (absolute Lc thresholds).
 * body ≈ fluent text, large ≈ large text, ui ≈ icons/controls, nonText ≈ placeholders.
 */
export type ApcaTarget = 'body' | 'large' | 'ui' | 'nonText'

export type ContrastTarget = WcagTarget | ApcaTarget

export type ColorInput = string

export interface CheckOptions {
  /** Contrast engine. Defaults to `'wcag2'`. */
  mode?: ContrastMode
}

export interface WcagPass {
  aa: boolean
  aaLarge: boolean
  aaa: boolean
  aaaLarge: boolean
}

export interface ApcaPass {
  body: boolean
  large: boolean
  ui: boolean
  nonText: boolean
}

export interface WcagCheckResult {
  mode: 'wcag2'
  foreground: string
  background: string
  ratio: number
  pass: WcagPass
  levels: WcagTarget[]
}

export interface ApcaCheckResult {
  mode: 'apca'
  foreground: string
  background: string
  /** Signed APCA lightness contrast (Lc). Absolute value is used for pass checks. */
  lc: number
  pass: ApcaPass
  levels: ApcaTarget[]
}

export type CheckResult = WcagCheckResult | ApcaCheckResult

export interface SuggestOptions {
  foreground: ColorInput
  background: ColorInput
  /** Which color to adjust. Defaults to `'foreground'`. */
  fix?: 'foreground' | 'background'
  /** Conformance target. Defaults to `'AA'` (WCAG) or `'body'` (APCA). */
  target?: ContrastTarget
  mode?: ContrastMode
}

export interface SuggestResult {
  mode: ContrastMode
  target: ContrastTarget
  fix: 'foreground' | 'background'
  /** Suggested color in hex. */
  color: string
  /** Original color that was adjusted. */
  original: string
  /** Whether the suggestion meets the target. */
  met: boolean
  /** WCAG ratio when mode is wcag2. */
  ratio?: number
  /** Absolute APCA Lc when mode is apca. */
  lc?: number
  /** Search iterations used. */
  steps: number
  check: CheckResult
}

export interface BestTextOptions {
  mode?: ContrastMode
  /** Optional minimum target. If set, `met` reflects whether the winner reaches it. */
  target?: ContrastTarget
}

export interface BestTextResult {
  mode: ContrastMode
  color: string
  met: boolean
  check: CheckResult
  /** All candidates ranked best-first. */
  ranked: Array<{ color: string; score: number; check: CheckResult }>
}

export interface ValidatePaletteOptions {
  /** Token pairs as [foregroundKey, backgroundKey]. */
  pairs: Array<[string, string]>
  mode?: ContrastMode
  /** Required target. Defaults to `'AA'` / `'body'`. */
  target?: ContrastTarget
}

export interface PalettePairResult {
  foregroundKey: string
  backgroundKey: string
  foreground: string
  background: string
  met: boolean
  check: CheckResult
}

export interface ValidatePaletteResult {
  ok: boolean
  mode: ContrastMode
  target: ContrastTarget
  results: PalettePairResult[]
  failures: PalettePairResult[]
}

/** Parsed linear-ish RGB in 0–1 range (sRGB channel encoding). */
export interface SrgbColor {
  r: number
  g: number
  b: number
  alpha?: number
}

export interface OklchColor {
  l: number
  c: number
  h: number
  alpha?: number
}
