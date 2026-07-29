import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Command } from 'commander'
import { bestText } from './bestText.js'
import { check } from './check.js'
import { ColorParseError, ContrastError } from './errors.js'
import { validatePalette } from './palette.js'
import { suggest } from './suggest.js'
import { meetsContrastTarget } from './target.js'
import type { CheckResult, ContrastMode, ContrastTarget } from './types.js'

const program = new Command()

program
  .name('color-contrast')
  .description('Check color contrast compatibility (WCAG 2.1 + APCA)')
  .version('1.0.0')
  .showHelpAfterError()

program
  .command('check', { isDefault: true })
  .description('Check contrast between two colors')
  .argument('<foreground>', 'Foreground / text color')
  .argument('<background>', 'Background color')
  .option('--mode <mode>', 'Contrast mode: wcag2 | apca', 'wcag2')
  .option('--target <target>', 'Required target (exit 1 if unmet)')
  .option('--json', 'Print JSON')
  .action((foreground: string, background: string, opts: CliOpts) => {
    run(() => {
      const mode = parseMode(opts.mode)
      const result = check(foreground, background, { mode })
      emit(result, Boolean(opts.json))
      exitOnFail(result, opts.target as ContrastTarget | undefined)
    })
  })

program
  .command('suggest')
  .description('Suggest a nearby color that meets a contrast target')
  .requiredOption('--fg <color>', 'Foreground color')
  .requiredOption('--bg <color>', 'Background color')
  .option('--fix <which>', 'Which color to adjust: foreground | background', 'foreground')
  .option('--target <target>', 'Target level', 'AA')
  .option('--mode <mode>', 'Contrast mode: wcag2 | apca', 'wcag2')
  .option('--json', 'Print JSON')
  .action((opts: SuggestCliOpts) => {
    run(() => {
      const mode = parseMode(opts.mode)
      const fix = opts.fix === 'background' ? 'background' : 'foreground'
      const result = suggest({
        foreground: opts.fg,
        background: opts.bg,
        fix,
        target: opts.target as ContrastTarget,
        mode,
      })
      if (opts.json) {
        console.log(JSON.stringify(result, null, 2))
      } else {
        console.log(`Suggested ${result.fix}: ${result.color}`)
        console.log(`Original: ${result.original}`)
        console.log(`Target: ${result.target} (${result.mode}) — ${result.met ? 'met' : 'not met'}`)
        if (result.ratio != null) console.log(`Ratio: ${result.ratio}:1`)
        if (result.lc != null) console.log(`Lc: ${result.lc}`)
      }
      if (!result.met) process.exitCode = 1
    })
  })

program
  .command('best-text')
  .description('Pick the best text color from a palette for a background')
  .requiredOption('--bg <color>', 'Background color')
  .requiredOption('--palette <colors>', 'Comma-separated candidate colors')
  .option('--mode <mode>', 'Contrast mode: wcag2 | apca', 'wcag2')
  .option('--target <target>', 'Optional minimum target')
  .option('--json', 'Print JSON')
  .action((opts: BestTextCliOpts) => {
    run(() => {
      const mode = parseMode(opts.mode)
      const palette = opts.palette
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean)
      const result = bestText(opts.bg, palette, {
        mode,
        target: opts.target as ContrastTarget | undefined,
      })
      if (opts.json) {
        console.log(JSON.stringify(result, null, 2))
      } else {
        console.log(`Best text: ${result.color}`)
        console.log(`Met target: ${result.met}`)
        printCheck(result.check)
      }
      if (opts.target && !result.met) process.exitCode = 1
    })
  })

program
  .command('palette')
  .description('Validate foreground/background pairs in a token JSON map')
  .argument('<file>', 'JSON file of token → color')
  .requiredOption('--pairs <pairs>', 'Comma-separated fg:bg pairs (e.g. text:bg,muted:bg)')
  .option('--mode <mode>', 'Contrast mode: wcag2 | apca', 'wcag2')
  .option('--target <target>', 'Required target', 'AA')
  .option('--json', 'Print JSON')
  .action((file: string, opts: PaletteCliOpts) => {
    run(() => {
      const mode = parseMode(opts.mode)
      const raw = readFileSync(resolve(file), 'utf8').replace(/^\uFEFF/, '')
      const tokens = JSON.parse(raw) as Record<string, string>
      const pairs = opts.pairs.split(',').map((pair) => {
        const [fg, bg] = pair.split(':').map((s) => s.trim())
        if (!fg || !bg) {
          throw new ContrastError(`Invalid pair "${pair}". Expected fg:bg`)
        }
        return [fg, bg] as [string, string]
      })

      const result = validatePalette(tokens, {
        pairs,
        mode,
        target: opts.target as ContrastTarget,
      })

      if (opts.json) {
        console.log(JSON.stringify(result, null, 2))
      } else {
        console.log(`Palette ${result.ok ? 'PASS' : 'FAIL'} — target ${result.target} (${result.mode})`)
        for (const row of result.results) {
          const score =
            row.check.mode === 'wcag2' ? `${row.check.ratio}:1` : `Lc ${row.check.lc}`
          console.log(
            `  ${row.met ? 'OK' : 'FAIL'} ${row.foregroundKey} on ${row.backgroundKey} — ${score}`,
          )
        }
      }
      if (!result.ok) process.exitCode = 1
    })
  })

interface CliOpts {
  mode: string
  target?: string
  json?: boolean
}

interface SuggestCliOpts extends CliOpts {
  fg: string
  bg: string
  fix: string
  target: string
}

interface BestTextCliOpts extends CliOpts {
  bg: string
  palette: string
}

interface PaletteCliOpts extends CliOpts {
  pairs: string
  target: string
}

function parseMode(mode: string): ContrastMode {
  if (mode === 'wcag2' || mode === 'apca') return mode
  throw new ContrastError(`Invalid mode "${mode}". Use wcag2 or apca`)
}

function emit(result: CheckResult, json: boolean): void {
  if (json) {
    console.log(JSON.stringify(result, null, 2))
  } else {
    printCheck(result)
  }
}

function printCheck(result: CheckResult): void {
  console.log(`Foreground: ${result.foreground}`)
  console.log(`Background: ${result.background}`)
  console.log(`Mode: ${result.mode}`)
  if (result.mode === 'wcag2') {
    console.log(`Ratio: ${result.ratio}:1`)
    console.log(
      `Pass: AA=${result.pass.aa} AA-large=${result.pass.aaLarge} AAA=${result.pass.aaa} AAA-large=${result.pass.aaaLarge}`,
    )
    console.log(`Levels: ${result.levels.length ? result.levels.join(', ') : '(none)'}`)
  } else {
    console.log(`Lc: ${result.lc}`)
    console.log(
      `Pass: body=${result.pass.body} large=${result.pass.large} ui=${result.pass.ui} nonText=${result.pass.nonText}`,
    )
    console.log(`Levels: ${result.levels.length ? result.levels.join(', ') : '(none)'}`)
  }
}

function exitOnFail(result: CheckResult, target?: ContrastTarget): void {
  if (target) {
    if (!meetsContrastTarget(result, target)) process.exitCode = 1
    return
  }
  if (result.mode === 'wcag2' && !result.pass.aa) process.exitCode = 1
  if (result.mode === 'apca' && !result.pass.body) process.exitCode = 1
}

function run(fn: () => void): void {
  try {
    fn()
  } catch (error) {
    if (error instanceof ColorParseError || error instanceof ContrastError) {
      console.error(error.message)
      process.exitCode = 1
      return
    }
    if (error instanceof SyntaxError) {
      console.error(`Invalid JSON: ${error.message}`)
      process.exitCode = 1
      return
    }
    if (error && typeof error === 'object' && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error(`File not found: ${(error as NodeJS.ErrnoException).path}`)
      process.exitCode = 1
      return
    }
    throw error
  }
}

program.parse()
