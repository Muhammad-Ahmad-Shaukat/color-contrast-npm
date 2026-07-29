export class ColorParseError extends Error {
  readonly input: string

  constructor(input: string, message?: string) {
    super(message ?? `Unable to parse color: ${JSON.stringify(input)}`)
    this.name = 'ColorParseError'
    this.input = input
  }
}

export class ContrastError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ContrastError'
  }
}
