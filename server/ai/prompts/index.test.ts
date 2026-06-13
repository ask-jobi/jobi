/**
 * @vitest-environment node
 */
import { describe, it, expect } from "vitest"
import { Prompt } from "./index"

describe("Prompt", () => {
  describe("constructor and factory method", () => {
    it("should create a new Prompt instance with static of method", () => {
      const template = "Hello {{name}}"
      const prompt = Prompt.of(template)

      expect(prompt).toBeInstanceOf(Prompt)
      expect(prompt.template).toBe(template)
    })

    it("should store template correctly", () => {
      const template = "This is a template with {{variable}}"
      const prompt = Prompt.of(template)

      expect(prompt.template).toBe(template)
    })

    it("should handle empty template", () => {
      const prompt = Prompt.of("")

      expect(prompt.template).toBe("")
      expect(prompt.format({})).toBe("")
    })

    it("should handle template with no placeholders", () => {
      const template = "This is a plain text template"
      const prompt = Prompt.of(template)

      const result = prompt.format({ name: "John" })

      expect(result).toBe(template)
    })
  })

  describe("format method - basic string replacement", () => {
    it("should replace single placeholder", () => {
      const prompt = Prompt.of("Hello {{name}}")
      const result = prompt.format({ name: "John" })

      expect(result).toBe("Hello John")
    })

    it("should replace multiple placeholders with same value", () => {
      const prompt = Prompt.of("{{name}} is {{name}}")
      const result = prompt.format({ name: "Test" })

      expect(result).toBe("Test is Test")
    })

    it("should preserve dollar signs in replacement values", () => {
      const prompt = Prompt.of("Price: {{value}}")
      const result = prompt.format({ value: "$1, $&, $$" })

      expect(result).toBe("Price: $1, $&, $$")
    })

    it("should replace multiple different placeholders", () => {
      const prompt = Prompt.of("{{greeting}} {{name}}, welcome to {{place}}")
      const result = prompt.format({
        greeting: "Hello",
        name: "Alice",
        place: "Wonderland"
      })

      expect(result).toBe("Hello Alice, welcome to Wonderland")
    })

    it("should handle all placeholders at once", () => {
      const template = `
# Role
You are {{role}}.

# Task
{{task}}

# Context
{{context}}
`
      const prompt = Prompt.of(template)
      const result = prompt.format({
        role: "a helpful assistant",
        task: "answer questions",
        context: "general knowledge"
      })

      expect(result).toContain("You are a helpful assistant.")
      expect(result).toContain("answer questions")
      expect(result).toContain("general knowledge")
    })
  })

  describe("format method - complex values", () => {
    it("should stringify object values", () => {
      const prompt = Prompt.of("Data: {{data}}")
      const result = prompt.format({
        data: { key: "value", nested: { deep: true } }
      })

      expect(result).toContain('"key": "value"')
      expect(result).toContain('"deep": true')
    })

    it("should stringify array values with indentation", () => {
      const prompt = Prompt.of("Items: {{items}}")
      const result = prompt.format({
        items: ["apple", "banana", "cherry"]
      })

      expect(result).toContain("apple")
      expect(result).toContain("banana")
      expect(result).toContain("cherry")
    })

    it("should format nested objects correctly", () => {
      const prompt = Prompt.of("User: {{user}}")
      const result = prompt.format({
        user: {
          name: "John",
          profile: {
            age: 30,
            city: "NYC"
          }
        }
      })

      expect(result).toContain("John")
      expect(result).toContain("30")
      expect(result).toContain("NYC")
    })
  })

  describe("format method - edge cases", () => {
    it("should handle numbers", () => {
      const prompt = Prompt.of("Count: {{count}}")
      const result = prompt.format({ count: 42 })

      expect(result).toBe("Count: 42")
    })

    it("should handle booleans", () => {
      const prompt = Prompt.of("Enabled: {{enabled}}")
      const result = prompt.format({ enabled: true })

      expect(result).toBe("Enabled: true")
    })

    it("should handle null values", () => {
      const prompt = Prompt.of("Value: {{value}}")
      const result = prompt.format({ value: null })

      expect(result).toBe("Value: null")
    })

    it("should handle empty string values", () => {
      const prompt = Prompt.of("Name: '{{name}}'")
      const result = prompt.format({ name: "" })

      expect(result).toBe("Name: ''")
    })

    it("should handle undefined values", () => {
      const prompt = Prompt.of("Value: {{value}}")
      const result = prompt.format({ value: undefined })

      expect(result).toBe("Value: undefined")
    })
  })

  describe("format method - order independence", () => {
    it("should format correctly regardless of parameter order", () => {
      const prompt = Prompt.of("{{first}} {{second}}")

      const result1 = prompt.format({ first: "A", second: "B" })
      const result2 = prompt.format({ second: "B", first: "A" })

      expect(result1).toBe("A B")
      expect(result2).toBe("A B")
    })

    it("should only replace matching placeholders", () => {
      const prompt = Prompt.of("{{a}} and {{b}}")
      const result = prompt.format({ a: "Only A" })

      expect(result).toBe("Only A and {{b}}")
    })
  })

  describe("format method - multiple calls", () => {
    it("should allow multiple format calls on same instance", () => {
      const prompt = Prompt.of("Hello {{name}}")

      const result1 = prompt.format({ name: "John" })
      const result2 = prompt.format({ name: "Jane" })
      const result3 = prompt.format({ name: "Bob" })

      expect(result1).toBe("Hello John")
      expect(result2).toBe("Hello Jane")
      expect(result3).toBe("Hello Bob")
    })

    it("should not modify original template", () => {
      const template = "Hello {{name}}"
      const prompt = Prompt.of(template)

      prompt.format({ name: "John" })
      prompt.format({ name: "Jane" })

      expect(prompt.template).toBe(template)
    })
  })

  describe("format method - real world examples", () => {
    it("should format resume rewrite prompt correctly", () => {
      const prompt = Prompt.of(`
# Role
You are {{role}}.

# Context
- Original Content: {{originalContent}}
- Job Description: {{jd}}
- Instruction: {{instruction}}
`)

      const result = prompt.format({
        role: "Resume Expert",
        originalContent: "Improved website performance",
        jd: "Looking for frontend developers",
        instruction: "Make it more impactful"
      })

      expect(result).toContain("Resume Expert")
      expect(result).toContain("Improved website performance")
      expect(result).toContain("Looking for frontend developers")
      expect(result).toContain("Make it more impactful")
    })

    it("should format resume evaluation prompt with structured data", () => {
      const prompt = Prompt.of(`
Resume Content:
{{resumeContent}}

Job Description:
{{jobDescription}}
`)

      const resumeContent = `
Name: John Doe
Experience: 5 years
Skills: React, TypeScript
`

      const result = prompt.format({
        resumeContent,
        jobDescription: "Frontend Developer position"
      })

      expect(result).toContain("John Doe")
      expect(result).toContain("5 years")
      expect(result).toContain("Frontend Developer position")
    })

    it("should handle complex prompt with JSON data", () => {
      const prompt = Prompt.of(`
Analyze this resume data:
{{resumeData}}

Provide feedback on:
1. Structure
2. Content
3. Keywords
`)

      const resumeData = {
        personalInfo: { firstName: "John", lastName: "Doe" },
        education: [{ school: "MIT", degree: "Bachelor" }],
        skills: ["JavaScript", "Python"]
      }

      const result = prompt.format({ resumeData })

      expect(result).toContain("John")
      expect(result).toContain("Doe")
      expect(result).toContain("MIT")
      expect(result).toContain("JavaScript")
    })
  })
})
