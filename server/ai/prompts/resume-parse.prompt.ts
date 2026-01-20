import { Prompt } from "./index"

export const resumeParsePrompt = Prompt.of(`
You are a professional resume parsing expert. Please parse the following resume content into the specified JSON format.
Resume content:

{{resumeText}}

Please analyze the resume content carefully and extract the following information:

1. Personal information: name, email, phone number
2. Education experience: school, degree, time period, description
3. Work experience: company, position, time period, description
4. Skills: grouped by category. If skills are not actively indicated in your resume, try to summarize and extract some key skills and technology stacks.
5. The main language of the resume content (return as 'en' for English, 'zh' for Chinese, or ISO 639-1 code for other languages)

Notes:
1. Ensure all dates are in YYYY-MM format.
2. If some information is not found in the resume, use an empty string or empty array.
3. Ensure the extracted information is accurate.
4. For all content fields, markdown format can be used if necessary. For example, for list display or keyword emphasis.
5. Always ensure the language of the output content is consistent with the original text.
6. skills split by english comma
`)
