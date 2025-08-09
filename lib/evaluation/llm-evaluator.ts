import { EvaluationResult, LLMEvaluatorConfig } from './types';

// LLM Evaluator class
export class LLMEvaluator {
  private config: LLMEvaluatorConfig;

  constructor(config: LLMEvaluatorConfig = {}) {
    this.config = {
      model: 'gpt-3.5-turbo',
      temperature: 0.3,
      maxTokens: 500,
      ...config
    };
  }

  /**
   * Evaluate text content using LLM
   * @param content Content to evaluate
   * @param evaluationPrompt Evaluation prompt
   * @param ruleName Rule name
   * @returns Promise<EvaluationResult>
   */
  async evaluateContent(
    content: string,
    evaluationPrompt: string,
    ruleName: string
  ): Promise<EvaluationResult> {
    try {
      if (!this.config.apiKey) {
        return {
          passed: false,
          ruleName,
          message: 'LLM API key not configured',
          type: 'subjective'
        };
      }

      const response = await this.callLLM(content, evaluationPrompt);
      return this.parseLLMResponse(response, ruleName);
    } catch (error) {
      return {
        passed: false,
        ruleName,
        message: `LLM evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'subjective'
      };
    }
  }

  /**
   * Call LLM API
   */
  private async callLLM(content: string, prompt: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional resume evaluation expert. Please evaluate resume content according to the given criteria and return results in JSON format.'
          },
          {
            role: 'user',
            content: `${prompt}\n\nContent: ${content}\n\nPlease return JSON format: {"passed": boolean, "score": number, "message": string, "suggestion": string}`
          }
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      })
    });

    if (!response.ok) {
      throw new Error(`LLM API call failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  /**
   * Parse LLM response
   */
  private parseLLMResponse(response: string, ruleName: string): EvaluationResult {
    try {
      // Try to extract JSON part
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          passed: false,
          ruleName,
          message: 'LLM response format error',
          type: 'subjective'
        };
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        passed: parsed.passed || false,
        ruleName,
        message: parsed.message || 'Evaluation completed',
        suggestion: parsed.suggestion,
        score: parsed.score,
        type: 'subjective'
      };
    } catch (error) {
      return {
        passed: false,
        ruleName,
        message: `Response parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'subjective'
      };
    }
  }
}

// Predefined evaluation prompts
export const EVALUATION_PROMPTS = {
  // Employment content clarity evaluation
  EMPLOYMENT_CLARITY: `
Please evaluate the clarity and professionalism of the following employment description:

Evaluation criteria:
1. Whether the content is clearly expressed and logically coherent
2. Whether appropriate professional terminology is used
3. Whether descriptions are specific rather than vague
4. Whether key achievements and skills are highlighted

Please provide a score (0-100) and suggestions.
`,

  // Skill description evaluation
  SKILL_DESCRIPTION: `
Please evaluate the quality of the following skill description:

Evaluation criteria:
1. Whether skills match common industry classifications
2. Whether descriptions are specific rather than overly vague
3. Whether actual application of skills is demonstrated
4. Whether skill combinations are reasonable

Please provide a score (0-100) and suggestions.
`,

  // Project experience evaluation
  PROJECT_DESCRIPTION: `
Please evaluate the quality of the following project experience description:

Evaluation criteria:
1. Whether project description is clear and understandable
2. Whether personal contributions and achievements are highlighted
3. Whether technical stack description is accurate
4. Whether results are quantifiable

Please provide a score (0-100) and suggestions.
`
};

// Create default LLM evaluator instance
export const defaultLLMEvaluator = new LLMEvaluator(); 