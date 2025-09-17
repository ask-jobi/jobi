import { ObjectiveRule } from '../types';
import type { PersonalInfo, EducationBlock, EmploymentBlock, SkillBlock } from '@/types/resume';

// ========== Personal Information Objective Rules ==========

/**
 * Check if email format is valid
 */
export const checkEmailFormat: ObjectiveRule<PersonalInfo> = (data) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(data.email);

  return {
    passed: isValid,
    message: isValid ? 'Email format is correct' : 'Email format is incorrect',
    suggestion: isValid ? undefined : 'Please check email format, ensure it contains @ symbol and valid domain',
    score: isValid ? 100 : 0
  };
};

/**
 * Check if phone number is valid numeric string
 */
export const checkPhoneFormat: ObjectiveRule<PersonalInfo> = (data) => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  const isValid = phoneRegex.test(data.phone) && data.phone.length >= 10;

  return {
    passed: isValid,
    message: isValid ? 'Phone number format is correct' : 'Phone number format is incorrect',
    suggestion: isValid ? undefined : 'Please ensure phone number only contains digits, spaces, hyphens, plus signs and parentheses',
    score: isValid ? 100 : 0
  };
};

/**
 * Check if required fields are complete
 */
export const checkRequiredFields: ObjectiveRule<PersonalInfo> = (data) => {
  const requiredFields = [
    { field: 'firstName', value: data.firstName, name: 'First Name' },
    { field: 'lastName', value: data.lastName, name: 'Last Name' },
    { field: 'email', value: data.email, name: 'Email' },
    { field: 'phone', value: data.phone, name: 'Phone' }
  ];

  const missingFields = requiredFields.filter(field => !field.value.trim());

  return {
    passed: missingFields.length === 0,
    message: missingFields.length === 0
      ? 'All required fields are filled'
      : `Missing required fields: ${missingFields.map(f => f.name).join(', ')}`,
    suggestion: missingFields.length === 0
      ? undefined
      : `Please fill in the following required fields: ${missingFields.map(f => f.name).join(', ')}`,
    score: missingFields.length === 0 ? 100 : Math.max(0, 100 - missingFields.length * 25)
  };
};

/**
 * Check website link format (if provided)
 */
export const checkWebsiteFormat: ObjectiveRule<PersonalInfo> = (data) => {
  if (!data.website) {
    return {
      passed: true,
      message: 'No website link provided',
      score: 100
    };
  }

  const urlRegex = /^https?:\/\/.+/;
  const isValid = urlRegex.test(data.website);

  return {
    passed: isValid,
    message: isValid ? 'Website link format is correct' : 'Website link format is incorrect',
    suggestion: isValid ? undefined : 'Please ensure website link starts with http:// or https://',
    score: isValid ? 100 : 0
  };
};

// ========== Education Experience Objective Rules ==========

/**
 * Check education experience content length
 */
export const checkEducationContentLength: ObjectiveRule<EducationBlock> = (data) => {
  const minLength = 50;
  const contentLength = data.content.trim().length;
  const isValid = contentLength >= minLength;

  return {
    passed: isValid,
    message: isValid
      ? `Education content length is appropriate (${contentLength} characters)`
      : `Education content is too short (${contentLength}/${minLength} characters)`,
    suggestion: isValid ? undefined : 'Please provide detailed description of your education experience, including main courses, achievements, etc.',
    score: Math.min(100, Math.round((contentLength / minLength) * 100))
  };
};

/**
 * Check education experience required fields
 */
export const checkEducationRequiredFields: ObjectiveRule<EducationBlock> = (data) => {
  const requiredFields = [
    { field: 'school', value: data.school, name: 'School Name' },
    { field: 'degree', value: data.degree, name: 'Degree' },
    { field: 'start', value: data.start, name: 'Start Date' },
    { field: 'end', value: data.end, name: 'End Date' }
  ];

  const missingFields = requiredFields.filter(field => !field.value.trim());

  return {
    passed: missingFields.length === 0,
    message: missingFields.length === 0
      ? 'Education information is complete'
      : `Missing fields: ${missingFields.map(f => f.name).join(', ')}`,
    suggestion: missingFields.length === 0
      ? undefined
      : `Please fill in the following fields: ${missingFields.map(f => f.name).join(', ')}`,
    score: missingFields.length === 0 ? 100 : Math.max(0, 100 - missingFields.length * 25)
  };
};

/**
 * Check education time logic
 */
export const checkEducationTimeLogic: ObjectiveRule<EducationBlock> = (data) => {
  if (!data.start || !data.end) {
    return {
      passed: false,
      message: 'Missing start or end date',
      suggestion: 'Please provide complete education dates',
      score: 0
    };
  }

  const startDate = new Date(data.start);
  const endDate = data.end === 'present' ? new Date() : new Date(data.end);
  const isValid = startDate <= endDate;

  return {
    passed: isValid,
    message: isValid ? 'Education time logic is correct' : 'End date cannot be earlier than start date',
    suggestion: isValid ? undefined : 'Please check education start and end dates',
    score: isValid ? 100 : 0
  };
};

// ========== Employment Experience Objective Rules ==========

/**
 * Check employment experience content length
 */
export const checkEmploymentContentLength: ObjectiveRule<EmploymentBlock> = (data) => {
  const minLength = 100;
  const contentLength = data.content.trim().length;
  const isValid = contentLength >= minLength;

  return {
    passed: isValid,
    message: isValid
      ? `Employment content length is appropriate (${contentLength} characters)`
      : `Employment content is too short (${contentLength}/${minLength} characters)`,
    suggestion: isValid ? undefined : 'Please provide detailed description of your work responsibilities, achievements and skill applications',
    score: Math.min(100, Math.round((contentLength / minLength) * 100))
  };
};

/**
 * Check employment experience required fields
 */
export const checkEmploymentRequiredFields: ObjectiveRule<EmploymentBlock> = (data) => {
  const requiredFields = [
    { field: 'company', value: data.company, name: 'Company Name' },
    { field: 'jobTitle', value: data.jobTitle, name: 'Job Title' },
    { field: 'start', value: data.start, name: 'Start Date' },
    { field: 'end', value: data.end, name: 'End Date' }
  ];

  const missingFields = requiredFields.filter(field => !field.value.trim());

  return {
    passed: missingFields.length === 0,
    message: missingFields.length === 0
      ? 'Employment information is complete'
      : `Missing fields: ${missingFields.map(f => f.name).join(', ')}`,
    suggestion: missingFields.length === 0
      ? undefined
      : `Please fill in the following fields: ${missingFields.map(f => f.name).join(', ')}`,
    score: missingFields.length === 0 ? 100 : Math.max(0, 100 - missingFields.length * 25)
  };
};

/**
 * Check employment time logic
 */
export const checkEmploymentTimeLogic: ObjectiveRule<EmploymentBlock> = (data) => {
  if (!data.start || !data.end) {
    return {
      passed: false,
      message: 'Missing start or end date',
      suggestion: 'Please provide complete employment dates',
      score: 0
    };
  }

  const startDate = new Date(data.start);
  const endDate = data.end === 'present' ? new Date() : new Date(data.end);
  const isValid = startDate <= endDate;

  return {
    passed: isValid,
    message: isValid ? 'Employment time logic is correct' : 'End date cannot be earlier than start date',
    suggestion: isValid ? undefined : 'Please check employment start and end dates',
    score: isValid ? 100 : 0
  };
};

// ========== Skills Objective Rules ==========

/**
 * Check skill description length
 */
export const checkSkillContentLength: ObjectiveRule<SkillBlock> = (data) => {
  const minLength = 10;
  const contentLength = data.content.trim().length;
  const isValid = contentLength >= minLength;

  return {
    passed: isValid,
    message: isValid
      ? `Skill description length is appropriate (${contentLength} characters)`
      : `Skill description is too short (${contentLength}/${minLength} characters)`,
    suggestion: isValid ? undefined : 'Please provide detailed description of your skill level or application scenarios',
    score: Math.min(100, Math.round((contentLength / minLength) * 100))
  };
};

/**
 * Check skill grouping
 */
export const checkSkillGroup: ObjectiveRule<SkillBlock> = (data) => {
  const isValid = data.group.trim().length > 0;

  return {
    passed: isValid,
    message: isValid ? 'Skill group is set' : 'Skill group cannot be empty',
    suggestion: isValid ? undefined : 'Please set skill group (e.g., Programming Languages, Frameworks, Tools, etc.)',
    score: isValid ? 100 : 0
  };
};
