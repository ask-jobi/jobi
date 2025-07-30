/**
 * @jest-environment node
 */
import { POST } from './route';
import { loginAsNormalUser } from '@/test/utils';
import * as quota from '@/server/quota';
import path from "node:path";
import * as fs from "node:fs";

async function readStreamAndParseDataLines(
  stream: ReadableStream<Uint8Array>
): Promise<Array<any>> {
  if (!stream) {
    throw new Error('Stream is null or undefined.');
  }

  const reader = stream.getReader()

  const textDecoder = new TextDecoder();
  let accumulatedResult = '';
  const parsedData: Array<any> = [];

  const dataLineRegex = /^data:\s*(?<jsonData>\{.*\})$/m;

  const webReader = reader as ReadableStreamDefaultReader<Uint8Array>;
  while (true) {
    const { done, value } = await webReader.read();
    if (done) break;
    accumulatedResult += textDecoder.decode(value);

    // Process accumulated result line by line
    const lines = accumulatedResult.split('\n');
    accumulatedResult = lines.pop() || ''; // Keep the last (incomplete) line

    for (const line of lines) {
      const match = line.match(dataLineRegex);
      if (match && match.groups?.jsonData) {
        try {
          parsedData.push(JSON.parse(match.groups.jsonData));
        } catch (e) {
          console.error('Error parsing JSON from stream line:', line, e);
          // Decide how to handle parsing errors: skip, throw, or push null
        }
      }
    }
  }

  return parsedData;
}

jest.mock("@/server/langchain/resume-parser", () => ({
  parseResume: jest.fn().mockResolvedValue([
    {
      personalInfo: {
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        phone: "1234567890",
      },
      education: { title: "Education", order: 0, blocks: [] },
      employment: { title: "Employments", order: 1, blocks: [] },
      skills: { title: "Skills", order: 2, blocks: [] },
    },
    "en"
  ]),
}))

describe('test upload resume api', () => {
  beforeAll(async () => {
    await loginAsNormalUser();
  });

  it('should return 400 if no file provided', async () => {
    const formData = new FormData();
    // 不添加file字段
    const request = {
      formData: async () => formData,
    } as any;

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('No file provided');
  });

  it('should return error if file is not pdf', async () => {
    const file = new File([Buffer.from('not a pdf')], 'test.txt', { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('jobInfo', JSON.stringify({ jobTitle: 'test', company: 'test' }));
    const newController = new AbortController();
    const request = {
      formData: async () => formData,
      signal: newController
    } as any;
    const response = await POST(request);
    if (!response.body) throw new Error('No response body');
    const results = await readStreamAndParseDataLines(response.body)
    expect(results[0].progress).toBe(0);
    expect(results[0].error).toBeDefined();
  });

  it('should return error if quota is exceeded', async () => {
    jest.spyOn(quota, 'consumeQuota').mockImplementationOnce(() => {
      throw new Error('Limit reached');
    });
    const file = new File([Buffer.from('test')], 'test.pdf', { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('jobInfo', JSON.stringify({ jobTitle: 'test', company: 'test' }));
    const newController = new AbortController();
    const request = {
      formData: async () => formData,
      signal: newController
    } as any;
    const response = await POST(request);
    if (!response.body) throw new Error('No response body');
    const results = await readStreamAndParseDataLines(response.body)

    expect(results[1].error).toBe('Limit reached');
  });

  it('should return progress and data for valid pdf', async () => {
    const pdfPath = path.resolve('test/test_pdf.pdf');
    if (!fs.existsSync(pdfPath)) {
      console.warn('test.pdf not found, skip this test');
      return;
    }
    const buffer = fs.readFileSync(pdfPath);
    const file = new File([buffer], 'test.pdf', { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('jobInfo', JSON.stringify({ name: 'test', company: 'test', description: "test description" }));
    const newController = new AbortController();
    const request = {
      formData: async () => formData,
      signal: newController
    } as any;
    const response = await POST(request);
    if (!response.body) throw new Error('No response body');
    const results = await readStreamAndParseDataLines(response.body)

    expect(results.length).toBe(5);
    expect(results[results.length - 1].message).toContain('Analysis completed!');
  });
});
