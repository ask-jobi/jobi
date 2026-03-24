import { Prompt } from "./index"

export const chatSessionTitlePrompt = Prompt.of(`
You generate concise chat session titles for a resume optimization assistant.

Requirements:
1. Use the user's language.
2. Summarize the user's intent into a short title.
3. Prefer 4 to 12 words when possible.
4. Do not copy the full message verbatim if a shorter summary is possible.
5. Do not add quotation marks, prefixes, emojis, or punctuation decoration.
6. Return only the title text.

User Message:
{{message}}
`)
