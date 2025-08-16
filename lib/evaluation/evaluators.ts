import { RuleConfig } from './types';
import { ModuleEvaluator } from './module-evaluator';
import type { PersonalInfo, EducationBlock, EmploymentBlock, SkillBlock } from '@/types/resume';
import {
  checkEmailFormat,
  checkPhoneFormat,
  checkRequiredFields,
  checkWebsiteFormat
} from './rules/objective-rules';
import {
  checkEducationContentLength,
  checkEducationRequiredFields,
  checkEducationTimeLogic
} from './rules/objective-rules';
import {
  checkEmploymentContentLength,
  checkEmploymentRequiredFields,
  checkEmploymentTimeLogic
} from './rules/objective-rules';
import {
  checkSkillContentLength,
  checkSkillGroup
} from './rules/objective-rules';

// ========== Personal Information Evaluator ==========

const personalInfoRules: RuleConfig<PersonalInfo>[] = [
  {
    name: 'Email Format Check',
    rule: checkEmailFormat,
    weight: 2,
    enabled: true
  },
  {
    name: 'Phone Number Format Check',
    rule: checkPhoneFormat,
    weight: 1,
    enabled: true
  },
  {
    name: 'Required Fields Completeness Check',
    rule: checkRequiredFields,
    weight: 3,
    enabled: true
  },
  {
    name: 'Website Link Format Check',
    rule: checkWebsiteFormat,
    weight: 1,
    enabled: true
  }
];

export const personalInfoEvaluator = new ModuleEvaluator<PersonalInfo>({
  moduleName: 'personalInfo',
  rules: personalInfoRules
});

// ========== Education Experience Evaluator ==========

const educationRules: RuleConfig<EducationBlock>[] = [
  {
    name: 'Education Content Length Check',
    rule: checkEducationContentLength,
    weight: 2,
    enabled: true
  },
  {
    name: 'Education Required Fields Check',
    rule: checkEducationRequiredFields,
    weight: 3,
    enabled: true
  },
  {
    name: 'Education Time Logic Check',
    rule: checkEducationTimeLogic,
    weight: 2,
    enabled: true
  }
];

export const educationEvaluator = new ModuleEvaluator<EducationBlock>({
  moduleName: 'education',
  rules: educationRules
});

// ========== Employment Experience Evaluator ==========

const employmentRules: RuleConfig<EmploymentBlock>[] = [
  {
    name: 'Employment Content Length Check',
    rule: checkEmploymentContentLength,
    weight: 2,
    enabled: true
  },
  {
    name: 'Employment Required Fields Check',
    rule: checkEmploymentRequiredFields,
    weight: 3,
    enabled: true
  },
  {
    name: 'Employment Time Logic Check',
    rule: checkEmploymentTimeLogic,
    weight: 2,
    enabled: true
  }
];

export const employmentEvaluator = new ModuleEvaluator<EmploymentBlock>({
  moduleName: 'employment',
  rules: employmentRules
});

// ========== Skills Evaluator ==========

const skillRules: RuleConfig<SkillBlock>[] = [
  {
    name: 'Skill Description Length Check',
    rule: checkSkillContentLength,
    weight: 1,
    enabled: true
  },
  {
    name: 'Skill Group Check',
    rule: checkSkillGroup,
    weight: 1,
    enabled: true
  }
];

export const skillEvaluator = new ModuleEvaluator<SkillBlock>({
  moduleName: 'skills',
  rules: skillRules
});

// ========== Evaluator Registry ==========

export const evaluatorRegistry = {
  personalInfo: personalInfoEvaluator,
  education: educationEvaluator,
  employment: employmentEvaluator,
  skills: skillEvaluator
};
