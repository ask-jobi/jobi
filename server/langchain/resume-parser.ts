import'server-only';
import { z } from "zod";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { RunnableSequence } from "@langchain/core/runnables";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ResumeData } from "@/types/resume";

const resumeSchema = z.object({
  personalInfo: z.object({
    firstName: z.string().describe("First name of the candidate").default(""),
    lastName: z.string().describe("Last name of the candidate").default(""),
    email: z.string().describe("Email address of the candidate").default(""),
    phone: z.string().describe("Phone number of the candidate").default(""),
  }),
  educationHistory: z.object({
    title: z.string().describe("Title of the education section").default("Education"),
    order: z.number().describe("Order of the education section").default(0),
    blocks: z.array(
      z.object({
        content: z.string().describe("Description of the education experience, return markdown formatted"),
        school: z.string().describe("Name of the school"),
        degree: z.string().describe("Degree obtained"),
        start: z.string().describe("Start date in YYYY-MM format"),
        end: z.string().describe("End date in YYYY-MM format"),
      })
    ),
  }),
  employmentHistory: z.object({
    title: z.string().describe("Title of the employment section").default("Employments"),
    order: z.number().describe("Order of the employment section").default(1),
    blocks: z.array(
      z.object({
        content: z.string().describe("Description of the work experience, return markdown formatted"),
        company: z.string().describe("Name of the company"),
        jobTitle: z.string().describe("Job title"),
        start: z.string().describe("Start date in YYYY-MM format"),
        end: z.string().describe("End date in YYYY-MM format"),
      })
    ),
  }),
  skills: z.object({
    title: z.string().describe("Title of the skills section").default("Skills"),
    order: z.number().describe("Order of the skills section").default(2),
    blocks: z.array(
      z.object({
        group: z.string().describe("Category of skills"),
        content: z.array(z.string()).describe("List of skills in this category"),
      })
    ),
  })
});

const RESUME_PARSE_PROMPT = `
You are a professional resume parsing expert. Please parse the following resume content into the specified JSON format.
Resume content:

{resumeText}

Please analyze the resume content carefully and extract the following information:

1. Personal information: name, email, phone number
2. Education experience: school, degree, time period, description
3. Work experience: company, position, time period, description
4. Skills: grouped by category

Make sure return data as following formats
{format_instructions}

Notes:
1. Make sure all dates are in YYYY-MM format
2. If some information is not found in the resume, use an empty string or empty array
3. Keep the integrity of the JSON format
4. Make sure the extracted information is accurate
5. Always make sure the output is in English
6. Make sure the extracted description is Markdown format
`;

export class ResumeParser {
  private static instance: ResumeParser;
  private readonly model: ChatGoogleGenerativeAI;
  private readonly parser: StructuredOutputParser<typeof resumeSchema>;
  private chain: RunnableSequence;

  private constructor() {
    this.model = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash-lite",
      temperature: 0,
      streaming: false,
      maxRetries: 0,
      json: true,
    });
    this.model.withStructuredOutput(resumeSchema)

    this.parser = StructuredOutputParser.fromZodSchema(resumeSchema);

    this.chain = RunnableSequence.from([
      ChatPromptTemplate.fromTemplate(RESUME_PARSE_PROMPT),
      this.model,
      this.parser,
    ]);
  }

  static getInstance(): ResumeParser {
    if (!ResumeParser.instance) {
      ResumeParser.instance = new ResumeParser();
    }
    return ResumeParser.instance;
  }

  async parseResume(resumeText: string): Promise<ResumeData> {
    const result = await this.chain.invoke({
      resumeText: resumeText,
      format_instructions: this.parser.getFormatInstructions(),
    });

    // 验证并转换结果
    const validatedData = resumeSchema.parse(result);

    // 转换为 ResumeData 类型
    const resumeData: ResumeData = {
      personalInfo: validatedData.personalInfo,
      educationHistory: validatedData.educationHistory,
      employmentHistory: validatedData.employmentHistory,
      skills: validatedData.skills,
    };

    return resumeData;
  }
}
