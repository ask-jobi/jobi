# Resume Evaluation System

A modular resume evaluation system that supports both objective and subjective metrics, capable of independently evaluating different resume modules and providing detailed improvement suggestions.

## 🎯 Features

- **Modular Design**: Supports independent evaluation of personal information, education experience, work experience, skills and other modules
- **Dual Evaluation**: Supports objective rules (format, length, completeness) and subjective rules (LLM natural language analysis)
- **High Extensibility**: Easy to add new evaluation modules and rules
- **Low Coupling**: Completely decoupled from existing resume structure
- **Smart Suggestions**: Provides specific improvement suggestions and scoring
- **Flexible Evaluation**: Can choose to run objective, subjective, or both evaluations independently

## 📦 Installation and Configuration

### 1. Basic Usage

```typescript
import { evaluateResume, evaluateResumeObjective, evaluateResumeSubjective } from '@/lib/evaluation';

// Full evaluation (including both objective and subjective)
const result = await evaluateResume(resumeData, {
  includeObjective: true,
  includeSubjective: true,
  llmConfig: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-3.5-turbo'
  }
});

// Objective evaluation only (faster)
const objectiveResult = await evaluateResumeObjective(resumeData);

// Subjective evaluation only (LLM-based)
const subjectiveResult = await evaluateResumeSubjective(resumeData, {
  llmConfig: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-3.5-turbo'
  }
});
```

### 2. Configure LLM API

To use subjective evaluation features, you need to configure LLM API key:

```typescript
// Set in environment variables
OPENAI_API_KEY=your-api-key-here

// Or configure in code
const result = await evaluateResume(resumeData, {
  llmConfig: {
    apiKey: 'your-api-key-here',
    model: 'gpt-4',
    temperature: 0.2
  }
});
```

## 🏗️ System Architecture

### Core Components

1. **Type Definitions** (`types.ts`)
   - `EvaluationResult`: Single evaluation result
   - `ModuleEvaluationReport`: Module evaluation report
   - `ResumeEvaluationReport`: Overall evaluation report

2. **Module Evaluator** (`module-evaluator.ts`)
   - `ModuleEvaluator<T>`: Responsible for executing all rules for a specific module

3. **LLM Evaluator** (`llm-evaluator.ts`)
   - `LLMEvaluator`: Handles subjective rule evaluation, calls LLM API

4. **Rule System**
   - `objective-rules.ts`: Objective rule collection
   - `subjective-rules.ts`: Subjective rule collection

5. **Evaluator Instances** (`evaluators.ts`)
   - Pre-configured evaluators for each module

6. **Main Evaluator** (`resume-evaluator.ts`)
   - `ResumeEvaluator`: Integrates all module evaluators

## 📋 Supported Evaluation Modules

### 1. Personal Information (PersonalInfo)

**Objective Rules:**
- ✅ Email format check
- ✅ Phone number format check
- ✅ Required fields completeness check
- ✅ Website link format check

### 2. Education Experience (EducationBlock)

**Objective Rules:**
- ✅ Content length check (≥50 characters)
- ✅ Required fields check
- ✅ Time logic check

**Subjective Rules:**
- ✅ Education relevance evaluation
- ✅ Achievement description quality evaluation

### 3. Employment Experience (EmploymentBlock)

**Objective Rules:**
- ✅ Content length check (≥100 characters)
- ✅ Required fields check
- ✅ Time logic check

**Subjective Rules:**
- ✅ Content clarity evaluation
- ✅ Achievement orientation evaluation
- ✅ Technical depth evaluation

### 4. Skills (SkillBlock)

**Objective Rules:**
- ✅ Description length check (≥10 characters)
- ✅ Group check

**Subjective Rules:**
- ✅ Skill description quality evaluation
- ✅ Industry match evaluation

## 🔧 Usage Methods

### Basic Usage

```typescript
import { evaluateResume } from '@/lib/evaluation';
import type { ResumeData } from '@/types/resume';

const resumeData: ResumeData = {
  personalInfo: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '138-1234-5678'
  },
  education: {
    title: 'Education',
    order: 1,
    blocks: [{
      content: 'Computer Science major...',
      school: 'Tsinghua University',
      degree: 'Bachelor',
      start: '2018-09',
      end: '2022-06'
    }]
  },
  // ... other modules
};

const result = await evaluateResume(resumeData);
console.log(`Overall Score: ${result.overallScore}/100`);
console.log(`Passed: ${result.passed}`);
console.log(result.summary);
```

### Custom Evaluator

```typescript
import { ResumeEvaluator } from '@/lib/evaluation';

const customEvaluator = new ResumeEvaluator({
  includeObjective: true,
  includeSubjective: true,
  enableScoring: true,
  llmConfig: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4',
    temperature: 0.2
  }
});

const result = await customEvaluator.evaluateResume(resumeData);
```

### Evaluate Specific Modules

```typescript
import { personalInfoEvaluator, employmentEvaluator } from '@/lib/evaluation';

// Evaluate personal information
const personalInfoResult = await personalInfoEvaluator.evaluate(resumeData.personalInfo);

// Evaluate employment experience
const employmentResult = await employmentEvaluator.evaluate(employmentBlock, {
  includeObjective: true,
  includeSubjective: true
});
```

### Flexible Evaluation Options

```typescript
// Only objective evaluation (fast, no API calls)
const objectiveOnly = await evaluateResume(resumeData, {
  includeObjective: true,
  includeSubjective: false
});

// Only subjective evaluation (LLM-based analysis)
const subjectiveOnly = await evaluateResume(resumeData, {
  includeObjective: false,
  includeSubjective: true,
  llmConfig: { apiKey: process.env.OPENAI_API_KEY }
});

// Both evaluations
const bothEvaluations = await evaluateResume(resumeData, {
  includeObjective: true,
  includeSubjective: true,
  llmConfig: { apiKey: process.env.OPENAI_API_KEY }
});
```

## 📊 Evaluation Result Format

### Single Evaluation Result

```typescript
interface EvaluationResult {
  passed: boolean;           // Whether passed
  ruleName: string;          // Rule name
  message?: string;          // Evaluation message
  suggestion?: string;       // Improvement suggestion
  type: 'objective' | 'subjective'; // Rule type
  score?: number;            // Score (0-100)
}
```

### Module Evaluation Report

```typescript
interface ModuleEvaluationReport {
  module: string;            // Module name
  results: EvaluationResult[]; // Evaluation result list
  overallScore?: number;     // Module overall score
  passed: boolean;           // Whether module passed
}
```

### Overall Evaluation Report

```typescript
interface ResumeEvaluationReport {
  modules: ModuleEvaluationReport[]; // All module reports
  overallScore?: number;     // Overall score
  passed: boolean;           // Whether passed
  summary?: string;          // Evaluation summary
}
```

## 🚀 Extension Guide

### Adding New Objective Rules

```typescript
// Add in objective-rules.ts
export const checkNewRule: ObjectiveRule<YourDataType> = (data) => {
  // Implement rule logic
  const isValid = /* your validation logic */;
  
  return {
    passed: isValid,
    ruleName: 'New Rule Name',
    message: isValid ? 'Passed' : 'Failed',
    suggestion: isValid ? undefined : 'Improvement suggestion',
    type: 'objective',
    score: isValid ? 100 : 0
  };
};
```

### Adding New Subjective Rules

```typescript
// Add in subjective-rules.ts
export const evaluateNewRule: SubjectiveRule<YourDataType> = async (data) => {
  const prompt = `
  Please evaluate the following content:
  
  Evaluation criteria:
  1. Criterion 1
  2. Criterion 2
  
  Please provide a score (0-100) and suggestions.
  `;

  return await defaultLLMEvaluator.evaluateContent(
    data.content,
    prompt,
    'New Subjective Rule Name'
  );
};
```

### Register New Rules

```typescript
// Add in evaluators.ts
const newModuleRules: RuleConfig<YourDataType>[] = [
  {
    name: 'New Objective Rule',
    type: 'objective',
    rule: checkNewRule,
    weight: 2,
    enabled: true
  },
  {
    name: 'New Subjective Rule',
    type: 'subjective',
    rule: evaluateNewRule,
    weight: 3,
    enabled: true
  }
];

export const newModuleEvaluator = new ModuleEvaluator<YourDataType>({
  moduleName: 'New Module',
  rules: newModuleRules
});
```

## ⚠️ Important Notes

1. **API Key Security**: Do not hardcode API keys in client-side code
2. **LLM Costs**: Subjective evaluation calls LLM API, be mindful of costs
3. **Error Handling**: Recommend adding appropriate error handling mechanisms
4. **Performance Optimization**: For large volumes of resumes, consider caching and batch processing
5. **Type Safety**: Uses existing `@/types/resume` types for better type safety

## 📝 Examples

Check the `example.ts` file for complete usage examples.

## 🤝 Contributing

欢迎提交Issue和Pull Request来改进这个评估系统！ 