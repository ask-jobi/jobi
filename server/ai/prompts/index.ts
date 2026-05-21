const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const escapeReplacement = (value: string) => value.replace(/\$/g, "$$$$")

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

    keys.forEach((key) => {
      const value = params[key]
      const formattedValue =
        typeof value === "string" ? value : JSON.stringify(value, null, 2)
      const replacementValue = escapeReplacement(String(formattedValue))
      const pattern = new RegExp(`\\{\\{${escapeRegExp(key)}\\}\\}`, "g")

      prompt = prompt.replace(pattern, replacementValue)
    })

    return prompt
  }
}
