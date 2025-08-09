import { evaluateResume, evaluateResumeObjective, evaluateResumeSubjective } from '../index';
import { defaultLLMEvaluator } from '../llm-evaluator';
import type { ResumeData } from '@/types/resume';

// Build a reusable valid sample resume
const baseResume: ResumeData = {
  personalInfo: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '138-1234-5678',
    website: 'https://johndoe.dev',
    linkedin: 'https://linkedin.com/in/johndoe'
  },
  education: {
    title: 'Education',
    order: 1,
    blocks: [
      {
        content:
          'Computer Science major focusing on data structures, algorithms, software engineering. Graduated with honors and participated in multiple projects.',
        school: 'Tsinghua University',
        degree: 'Bachelor of Computer Science',
        start: '2018-09',
        end: '2022-06'
      }
    ]
  },
  employment: {
    title: 'Work Experience',
    order: 2,
    blocks: [
      {
        content:
          'Built high-concurrency microservices with Node.js & TypeScript. Improved DB query performance, reducing API latency by 40%. Led a 5-person team to deliver a refactor 2 weeks early.',
        company: 'Tencent',
        jobTitle: 'Senior Backend Engineer',
        start: '2022-07',
        end: '2024-01'
      }
    ]
  },
  skills: {
    title: 'Skills',
    order: 3,
    blocks: [
      { group: 'Programming Languages', content: 'JavaScript, TypeScript, Python' },
      { group: 'Frameworks', content: 'React, Next.js' }
    ]
  }
};

// Helper to deep clone resume
const clone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

// Helper to mock LLM responses consistently
const mockSubjectiveResult = {
  passed: true,
  ruleName: 'Mock Subjective Rule',
  type: 'subjective' as const,
  score: 85,
  message: 'Mock evaluation passed',
  suggestion: 'Mock suggestion'
};

describe('Resume Evaluation (with LLM mocked)', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test('Objective only evaluation should not call LLM and should produce valid report', async () => {
    const spy = jest.spyOn(defaultLLMEvaluator as any, 'evaluateContent').mockResolvedValue(mockSubjectiveResult);

    const result = await evaluateResumeObjective(baseResume);

    expect(spy).not.toHaveBeenCalled();
    expect(result.modules.length).toBeGreaterThan(0);
    expect(result.summary).toContain('Overall Score');
    // Ensure at least personal info and one other module are present
    const hasPersonal = result.modules.some(m => m.module.includes('Personal') || m.module.includes('Information'));
    expect(hasPersonal).toBe(true);
    // All results should be objective only
    result.modules.forEach(m => m.results.forEach(r => expect(r.type).toBe('objective')));
  });

  test('Subjective only evaluation should call LLM and include overall professionalism', async () => {
    const spy = jest.spyOn(defaultLLMEvaluator as any, 'evaluateContent').mockResolvedValue(mockSubjectiveResult);

    const result = await evaluateResumeSubjective(baseResume, {
      llmConfig: { apiKey: 'test-key', model: 'gpt-3.5-turbo' }
    });

    expect(spy).toHaveBeenCalled();
    const hasOverall = result.modules.some(m => m.module.includes('Overall Professionalism'));
    expect(hasOverall).toBe(true);

    // Should contain subjective results
    const hasSubjective = result.modules.some(m => m.results.some(r => r.type === 'subjective'));
    expect(hasSubjective).toBe(true);

    expect(result.summary).toContain('Overall Score');
  });

  test('Full evaluation (objective + subjective) should call LLM and return mixed results', async () => {
    const spy = jest
      .spyOn(defaultLLMEvaluator as any, 'evaluateContent')
      .mockImplementation(async (...args: any[]) => ({
        ...mockSubjectiveResult,
        ruleName: args[2]
      }));

    const result = await evaluateResume(baseResume, {
      includeObjective: true,
      includeSubjective: true,
      llmConfig: { apiKey: 'test-key', model: 'gpt-3.5-turbo' }
    });

    expect(spy).toHaveBeenCalled();
    expect(result.modules.length).toBeGreaterThan(0);

    // Should contain detailed module entries like Employment Experience 1, Skills 1, etc.
    const hasEmployment = result.modules.some(m => m.module.includes('Employment'));
    const hasSkills = result.modules.some(m => m.module.includes('Skills'));
    expect(hasEmployment || hasSkills).toBe(true);

    // Verify at least one objective and one subjective rule result
    const hasObjective = result.modules.some(m => m.results.some(r => r.type === 'objective'));
    const hasSubjective = result.modules.some(m => m.results.some(r => r.type === 'subjective'));
    expect(hasObjective && hasSubjective).toBe(true);

    expect(result.summary).toContain('Overall Score');
  });

  test('Personal info invalid fields should fail corresponding objective rules with suggestions', async () => {
    const bad = clone(baseResume);
    bad.personalInfo.firstName = '';
    bad.personalInfo.email = 'not-an-email';
    bad.personalInfo.phone = 'abc';

    const res = await evaluateResume(bad, { includeObjective: true, includeSubjective: false });

    const pi = res.modules.find(m => m.module.includes('Personal'))!;
    expect(pi).toBeTruthy();
    const emailRule = pi.results.find(r => r.ruleName === 'Email Format Check');
    const phoneRule = pi.results.find(r => r.ruleName === 'Phone Number Format Check');
    const requiredRule = pi.results.find(r => r.ruleName === 'Required Fields Completeness Check');

    expect(emailRule?.passed).toBe(false);
    expect(phoneRule?.passed).toBe(false);
    expect(requiredRule?.passed).toBe(false);
    [emailRule, phoneRule, requiredRule].forEach(r => expect(r?.suggestion).toBeTruthy());

    expect(pi.passed).toBe(false);
    expect(typeof pi.overallScore).toBe('number');
    expect((pi.overallScore ?? 100)).toBeLessThan(100);
  });

  test('Employment time logic invalid should fail the time rule', async () => {
    const bad = clone(baseResume);
    bad.employment.blocks[0].start = '2024-02';
    bad.employment.blocks[0].end = '2024-01'; // invalid: end before start

    const res = await evaluateResume(bad, { includeObjective: true, includeSubjective: false });
    const emp = res.modules.find(m => m.module.startsWith('Employment'))!;
    expect(emp).toBeTruthy();
    const timeRule = emp.results.find(r => r.ruleName === 'Employment Time Logic Check');
    expect(timeRule?.passed).toBe(false);
    expect(timeRule?.suggestion).toBeTruthy();
    expect(emp.passed).toBe(false);
  });

  test('Education content length should influence score', async () => {
    const bad = clone(baseResume);
    bad.education.blocks[0].content = 'Too short';

    const res = await evaluateResume(bad, { includeObjective: true, includeSubjective: false });
    const edu = res.modules.find(m => m.module.startsWith('Education'))!;
    const lengthRule = edu.results.find(r => r.ruleName === 'Education Content Length Check');
    expect(lengthRule).toBeTruthy();
    expect((lengthRule!.score ?? 0)).toBeLessThan(100);
  });

  test('Disabling subjective rules should produce no subjective results', async () => {
    const spy = jest.spyOn(defaultLLMEvaluator as any, 'evaluateContent').mockResolvedValue(mockSubjectiveResult);
    const res = await evaluateResume(baseResume, { includeObjective: true, includeSubjective: false });

    expect(spy).not.toHaveBeenCalled();
    const hasSubjective = res.modules.some(m => m.results.some(r => r.type === 'subjective'));
    expect(hasSubjective).toBe(false);
  });

  test('Subjective rule error should be captured as failed result', async () => {
    jest.spyOn(defaultLLMEvaluator as any, 'evaluateContent').mockRejectedValue(new Error('network error'));

    const res = await evaluateResume(baseResume, {
      includeObjective: false,
      includeSubjective: true,
      llmConfig: { apiKey: 'test-key', model: 'gpt-3.5-turbo' }
    });

    const hasFailedSubjective = res.modules.some(m => m.results.some(r => r.type === 'subjective' && r.passed === false));
    expect(hasFailedSubjective).toBe(true);
  });

  test('Overall score should increase after fixing errors', async () => {
    const bad = clone(baseResume);
    bad.personalInfo.email = 'invalid';
    bad.personalInfo.firstName = '';

    const resBad = await evaluateResume(bad, { includeObjective: true, includeSubjective: false });
    const resGood = await evaluateResume(baseResume, { includeObjective: true, includeSubjective: false });

    expect((resGood.overallScore ?? 0)).toBeGreaterThan((resBad.overallScore ?? 0));
  });
});
