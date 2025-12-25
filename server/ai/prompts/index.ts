
export class Prompt {
  template: string
  private constructor(template: string) {
    this.template = template
  }

  static of(template: string) {
    return new Prompt(template)
  }

  format(params: Record<string, any>): string {
    const keys = Object.keys(params)
    let prompt = this.template.slice()
    keys.forEach(key => {
      const value = params[key]
      const formattedValue = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
      prompt = prompt.replace(`{{${key}}}`, formattedValue)
    })

    return prompt
  }
}
