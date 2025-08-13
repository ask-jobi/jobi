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
    type: 'objective',
    rule: checkEmailFormat,
    weight: 2,
    enabled: true
  },
  {
    name: 'Phone Number Format Check',
    type: 'objective',
    rule: checkPhoneFormat,
    weight: 1,
    enabled: true
  },
  {
    name: 'Required Fields Completeness Check',
    type: 'objective',
    rule: checkRequiredFields,
    weight: 3,
    enabled: true
  },
  {
    name: 'Website Link Format Check',
    type: 'objective',
    rule: checkWebsiteFormat,
    weight: 1,
    enabled: true
  }
];

export const personalInfoEvaluator = new ModuleEvaluator<PersonalInfo>({
  moduleName: 'Personal Information',
  rules: personalInfoRules
});

// ========== Education Experience Evaluator ==========

const educationRules: RuleConfig<EducationBlock>[] = [
  {
    name: 'Education Content Length Check',
    type: 'objective',
    rule: checkEducationContentLength,
    weight: 2,
    enabled: true
  },
  {
    name: 'Education Required Fields Check',
    type: 'objective',
    rule: checkEducationRequiredFields,
    weight: 3,
    enabled: true
  },
  {
    name: 'Education Time Logic Check',
    type: 'objective',
    rule: checkEducationTimeLogic,
    weight: 2,
    enabled: true
  }
];

export const educationEvaluator = new ModuleEvaluator<EducationBlock>({
  moduleName: 'Education Experience',
  rules: educationRules
});

// ========== Employment Experience Evaluator ==========

const employmentRules: RuleConfig<EmploymentBlock>[] = [
  {
    name: 'Employment Content Length Check',
    type: 'objective',
    rule: checkEmploymentContentLength,
    weight: 2,
    enabled: true
  },
  {
    name: 'Employment Required Fields Check',
    type: 'objective',
    rule: checkEmploymentRequiredFields,
    weight: 3,
    enabled: true
  },
  {
    name: 'Employment Time Logic Check',
    type: 'objective',
    rule: checkEmploymentTimeLogic,
    weight: 2,
    enabled: true
  }
];

export const employmentEvaluator = new ModuleEvaluator<EmploymentBlock>({
  moduleName: 'Employment Experience',
  rules: employmentRules
});

// ========== Skills Evaluator ==========

const skillRules: RuleConfig<SkillBlock>[] = [
  {
    name: 'Skill Description Length Check',
    type: 'objective',
    rule: checkSkillContentLength,
    weight: 1,
    enabled: true
  },
  {
    name: 'Skill Group Check',
    type: 'objective',
    rule: checkSkillGroup,
    weight: 1,
    enabled: true
  }
];

export const skillEvaluator = new ModuleEvaluator<SkillBlock>({
  moduleName: 'Skills',
  rules: skillRules
});

// ========== Evaluator Registry ==========

export const evaluatorRegistry = {
  personalInfo: personalInfoEvaluator,
  education: educationEvaluator,
  employment: employmentEvaluator,
  skills: skillEvaluator
};
