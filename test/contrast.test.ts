import { describe, expect, it } from 'vitest'
import {
  apcaContrast,
  bestText,
  check,
  ColorParseError,
  contrastRatio,
  normalizeColor,
  parseColor,
  suggest,
  validatePalette,
} from '../src/index.js'

describe('parse', () => {
  it('parses hex, rgb, hsl, named, oklch, and lch', () => {
    expect(normalizeColor('#ff0000')).toBe('#ff0000')
    expect(normalizeColor('rgb(255, 0, 0)')).toBe('#ff0000')
    expect(normalizeColor('hsl(0 100% 50%)')).toBe('#ff0000')
    expect(normalizeColor('red')).toBe('#ff0000')
    expect(normalizeColor('oklch(0.628 0.258 29.2)')).toMatch(/^#[0-9a-f]{6}$/)
    expect(normalizeColor('lch(54.29% 106.84 40.86)')).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('throws ColorParseError for invalid input', () => {
    expect(() => parseColor('not-a-color')).toThrow(ColorParseError)
  })
})

describe('wcag2', () => {
  it('returns 21:1 for black on white', () => {
    const black = parseColor('#000')
    const white = parseColor('#fff')
    expect(contrastRatio(black, white)).toBeCloseTo(21, 5)
  })

  it('check reports all WCAG levels for black/white', () => {
    const result = check('#000', '#fff')
    expect(result.mode).toBe('wcag2')
    if (result.mode !== 'wcag2') return
    expect(result.ratio).toBe(21)
    expect(result.pass).toEqual({
      aa: true,
      aaLarge: true,
      aaa: true,
      aaaLarge: true,
    })
    expect(result.levels).toEqual(['AA', 'AA-large', 'AAA', 'AAA-large'])
  })

  it('fails AA for gray #777 on white', () => {
    const result = check('#777', '#fff')
    expect(result.mode).toBe('wcag2')
    if (result.mode !== 'wcag2') return
    expect(result.ratio).toBeLessThan(4.5)
    expect(result.pass.aa).toBe(false)
    expect(result.pass.aaLarge).toBe(true)
  })

  it('passes known mid gray pair around 4.54:1', () => {
    // #767676 on #ffffff is a classic ~4.54:1 AA border case
    const result = check('#767676', '#ffffff')
    expect(result.mode).toBe('wcag2')
    if (result.mode !== 'wcag2') return
    expect(result.ratio).toBeGreaterThanOrEqual(4.5)
    expect(result.pass.aa).toBe(true)
  })
})

describe('apca', () => {
  it('returns high |Lc| for black text on white', () => {
    const lc = apcaContrast(parseColor('#000'), parseColor('#fff'))
    expect(Math.abs(lc)).toBeGreaterThan(100)
  })

  it('check in apca mode returns pass levels', () => {
    const result = check('#000', '#fff', { mode: 'apca' })
    expect(result.mode).toBe('apca')
    if (result.mode !== 'apca') return
    expect(Math.abs(result.lc)).toBeGreaterThan(100)
    expect(result.pass.body).toBe(true)
    expect(result.levels).toContain('body')
  })
})

describe('suggest', () => {
  it('suggests a darker foreground that meets AA', () => {
    const result = suggest({
      foreground: '#777777',
      background: '#ffffff',
      fix: 'foreground',
      target: 'AA',
    })
    expect(result.met).toBe(true)
    expect(result.ratio).toBeGreaterThanOrEqual(4.5)
    expect(result.color).not.toBe('#777777')
  })

  it('can adjust background instead', () => {
    const result = suggest({
      foreground: '#777777',
      background: '#cccccc',
      fix: 'background',
      target: 'AA',
    })
    expect(result.met).toBe(true)
    expect(result.fix).toBe('background')
  })
})

describe('bestText', () => {
  it('picks the highest-contrast candidate', () => {
    const result = bestText('#0f172a', ['#64748b', '#94a3b8', '#ffffff', '#e2e8f0'])
    expect(result.color).toBe('#ffffff')
    expect(result.ranked[0]?.color).toBe('#ffffff')
  })

  it('respects target when ranking', () => {
    const result = bestText('#ffffff', ['#cccccc', '#767676', '#111111'], { target: 'AA' })
    expect(result.met).toBe(true)
    expect(result.color).toBe('#111111')
  })
})

describe('validatePalette', () => {
  it('reports failures for insufficient pairs', () => {
    const result = validatePalette(
      {
        bg: '#ffffff',
        text: '#111111',
        muted: '#cccccc',
        brand: '#2563eb',
      },
      {
        pairs: [
          ['text', 'bg'],
          ['muted', 'bg'],
          ['brand', 'bg'],
        ],
        target: 'AA',
      },
    )
    expect(result.ok).toBe(false)
    expect(result.failures.some((f) => f.foregroundKey === 'muted')).toBe(true)
    expect(result.results.find((r) => r.foregroundKey === 'text')?.met).toBe(true)
  })

  it('passes when all pairs meet target', () => {
    const result = validatePalette(
      { bg: '#fff', text: '#000' },
      { pairs: [['text', 'bg']], target: 'AAA' },
    )
    expect(result.ok).toBe(true)
    expect(result.failures).toHaveLength(0)
  })
})
