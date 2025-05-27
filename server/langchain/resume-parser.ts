import'server-only';
import { z } from "zod";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { RunnableSequence } from "@langchain/core/runnables";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ResumeData } from "@/types/resume";

const resumeSchema = z.object({
  personalInfo: z.object({
    firstName: z.string().describe("First name of the candidate"),
    lastName: z.string().describe("Last name of the candidate"),
    email: z.string().email().describe("Email address of the candidate"),
    phone: z.string().describe("Phone number of the candidate"),
  }),
  educationHistory: z.object({
    title: z.string().describe("Title of the education section"),
    order: z.number().describe("Order of the education section"),
    blocks: z.array(
      z.object({
        content: z.string().describe("Description of the education experience"),
        school: z.string().describe("Name of the school"),
        degree: z.string().describe("Degree obtained"),
        start: z.string().describe("Start date in YYYY-MM format"),
        end: z.string().describe("End date in YYYY-MM format"),
      })
    ),
  }),
  employmentHistory: z.object({
    title: z.string().describe("Title of the employment section"),
    order: z.number().describe("Order of the employment section"),
    blocks: z.array(
      z.object({
        content: z.string().describe("Description of the work experience"),
        company: z.string().describe("Name of the company"),
        jobTitle: z.string().describe("Job title"),
        start: z.string().describe("Start date in YYYY-MM format"),
        end: z.string().describe("End date in YYYY-MM format"),
      })
    ),
  }),
  skills: z.array(
    z.object({
      group: z.string().describe("Category of skills"),
      content: z.array(z.string()).describe("List of skills in this category"),
    })
  ),
});

const RESUME_PARSE_PROMPT = `你是一个专业的简历解析专家。请将以下简历内容解析成指定的JSON格式。

简历内容：
{resumeText}

请仔细分析简历内容，提取以下信息：
1. 个人信息：姓名、邮箱、电话
2. 教育经历：学校、学位、时间段、描述
3. 工作经历：公司、职位、时间段、描述
4. 技能：按类别分组

{format_instructions}

注意事项：
1. 确保所有日期格式为 YYYY-MM
2. 如果某些信息在简历中未找到，使用空字符串或空数组
3. 保持JSON格式的完整性
4. 确保提取的信息准确无误
5. 永远确保输出的内容是英文
`;

export class ResumeParser {
  private static instance: ResumeParser;
  private readonly model: ChatGoogleGenerativeAI;
  private readonly parser: StructuredOutputParser<typeof resumeSchema>;
  private chain: RunnableSequence;

  private constructor() {
    this.model = new ChatGoogleGenerativeAI({
      model: "gemini-1.5-flash-8b",
      temperature: 0,
      streaming: false,
      maxRetries: 0
    });

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
