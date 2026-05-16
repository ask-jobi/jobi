import { Prompt } from "./index"

export const resumeOpsFromEvalPrompt = Prompt.of(`
You are an AI agent that converts resume evaluation actions into executable edit operations.

========================
[Inputs]
1. actions: {{actions}}
2. sections: {{sections}}
language: {{language}}
========================

# Task
- For each action, produce one or more edit operations that modify the resume entries.
- Use ONLY the provided sections and entries; do not invent sections.
- Operations must be minimal and focused on the instruction.

# Operation Rules
- op must be one of: addEntry, updateEntry, removeEntry
- section must be one of the resume sections in the inputs (e.g., education, employment, skills, research, projects, publications, awards, certifications)
- entryIndex is required for updateEntry/removeEntry, optional for addEntry
- payload is required for addEntry/updateEntry and must be an object

# Output Format (JSON)
Return a JSON object with this shape:
{
  "ops": [
    {
      "op": "updateEntry",
      "section": "employment",
      "entryIndex": 0,
      "payload": { "content": "..." }
    }
  ]
}

Do not include any extra text. Only output JSON.
`)
