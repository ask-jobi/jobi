import { SubjectiveRule } from '../types';
import { defaultLLMEvaluator, EVALUATION_PROMPTS } from '../llm-evaluator';
import type { EmploymentBlock, SkillBlock, EducationBlock } from '@/types/resume';

// ========== Employment Experience Subjective Rules ==========

/**
 * Evaluate employment experience content clarity and professionalism
 */
export const evaluateEmploymentClarity: SubjectiveRule<EmploymentBlock> = async (data) => {
  const evaluationText = `
Position: ${data.jobTitle}
Company: ${data.company}
Work Content: ${data.content}
`;

  return await defaultLLMEvaluator.evaluateContent(
    evaluationText,
    EVALUATION_PROMPTS.EMPLOYMENT_CLARITY,
    'Employment Content Clarity Evaluation'
  );
};

/**
 * Evaluate employment experience achievement orientation
 */
export const evaluateEmploymentAchievements: SubjectiveRule<EmploymentBlock> = async (data) => {
  const prompt = `
Please evaluate the achievement orientation of the following employment experience:

Evaluation criteria:
1. Whether it contains specific quantifiable results (such as numbers, percentages, time, etc.)
2. Whether it highlights personal contributions and impact
3. Whether it uses action-oriented verbs
4. Whether it demonstrates actual application of skills

Please provide a score (0-100) and suggestions.
`;

  return await defaultLLMEvaluator.evaluateContent(
    data.content,
    prompt,
    'Employment Achievement Orientation Evaluation'
  );
};

/**
 * Evaluate employment experience technical depth
 */
export const evaluateEmploymentTechnicalDepth: SubjectiveRule<EmploymentBlock> = async (data) => {
  const prompt = `
Please evaluate the technical depth of the following employment experience:

Evaluation criteria:
1. Whether specific technology stacks and tools are mentioned
2. Whether technical descriptions are accurate and professional
3. Whether technical problem-solving abilities are demonstrated
4. Whether technical growth and progress are shown

Please provide a score (0-100) and suggestions.
`;

  return await defaultLLMEvaluator.evaluateContent(
    data.content,
    prompt,
    'Employment Technical Depth Evaluation'
  );
};

// ========== Skills Subjective Rules ==========

/**
 * Evaluate skill description quality and relevance
 */
export const evaluateSkillDescription: SubjectiveRule<SkillBlock> = async (data) => {
  const evaluationText = `
Skill Group: ${data.group}
Skill Description: ${data.content}
`;

  return await defaultLLMEvaluator.evaluateContent(
    evaluationText,
    EVALUATION_PROMPTS.SKILL_DESCRIPTION,
    'Skill Description Quality Evaluation'
  );
};

/**
 * Evaluate skill industry match
 */
export const evaluateSkillIndustryMatch: SubjectiveRule<SkillBlock> = async (data) => {
  const prompt = `
Please evaluate the match between the following skills and common industries:

Evaluation criteria:
1. Whether skills are relevant to target industry
2. Whether skill descriptions demonstrate actual application scenarios
3. Whether skill combinations are reasonable and complementary
4. Whether industry-recognized skill certifications or standards are included

Please provide a score (0-100) and suggestions.
`;

  return await defaultLLMEvaluator.evaluateContent(
    data.content,
    prompt,
    'Skill Industry Match Evaluation'
  );
};

// ========== Education Experience Subjective Rules ==========

/**
 * Evaluate education experience relevance and value
 */
export const evaluateEducationRelevance: SubjectiveRule<EducationBlock> = async (data) => {
  const prompt = `
Please evaluate the relevance of the following education experience to career goals:

Evaluation criteria:
1. Whether the major is relevant to target position
2. Whether school reputation and ranking help with job search
3. Whether course content matches industry requirements
4. Whether continuous learning ability is demonstrated

Please provide a score (0-100) and suggestions.
`;

  const evaluationText = `
School: ${data.school}
Major: ${data.degree}
Education Experience: ${data.content}
`;

  return await defaultLLMEvaluator.evaluateContent(
    evaluationText,
    prompt,
    'Education Relevance Evaluation'
  );
};

/**
 * Evaluate education experience achievement description
 */
export const evaluateEducationAchievements: SubjectiveRule<EducationBlock> = async (data) => {
  const prompt = `
Please evaluate the quality of achievement description in the following education experience:

Evaluation criteria:
1. Whether academic achievements and honors are highlighted
2. Whether relevant projects and research results are mentioned
3. Whether leadership and teamwork abilities are demonstrated
4. Whether descriptions are specific rather than general

Please provide a score (0-100) and suggestions.
`;

  return await defaultLLMEvaluator.evaluateContent(
    data.content,
    prompt,
    'Education Achievement Evaluation'
  );
};

// ========== Overall Resume Subjective Rules ==========

/**
 * Evaluate overall resume professionalism and consistency
 */
export const evaluateResumeProfessionalism = async (resumeData: any): Promise<any> => {
  const prompt = `
Please evaluate the overall professionalism and consistency of the following resume:

Evaluation criteria:
1. Whether overall style is professional and consistent
2. Whether information organization is logical and clear
3. Whether language expression is accurate and professional
4. Whether core competitive advantages are highlighted
5. Whether it meets target position requirements

Please provide a score (0-100) and suggestions.
`;

  // Convert resume data to text format
  const resumeText = `
Personal Information:
Name: ${resumeData.personalInfo?.firstName || ''} ${resumeData.personalInfo?.lastName || ''}
Email: ${resumeData.personalInfo?.email || ''}
Phone: ${resumeData.personalInfo?.phone || ''}

Education Experience:
${resumeData.education?.blocks?.map((edu: any) => 
  `${edu.school} - ${edu.degree}\n${edu.content}`
).join('\n\n') || 'None'}

Employment Experience:
${resumeData.employment?.blocks?.map((emp: any) => 
  `${emp.company} - ${emp.jobTitle}\n${emp.content}`
).join('\n\n') || 'None'}

Skills:
${resumeData.skills?.blocks?.map((skill: any) => 
  `${skill.group}: ${skill.content}`
).join('\n') || 'None'}
`;

  return await defaultLLMEvaluator.evaluateContent(
    resumeText,
    prompt,
    'Resume Overall Professionalism Evaluation'
  );
}; 