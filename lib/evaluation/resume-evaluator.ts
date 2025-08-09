import { 
  ResumeEvaluationReport, 
  ModuleEvaluationReport, 
  EvaluationOptions 
} from './types';
import { evaluatorRegistry } from './evaluators';
import { evaluateResumeProfessionalism } from './rules/subjective-rules';
import type { ResumeData } from '@/types/resume';

/**
 * Resume Evaluator class
 * Responsible for integrating all module evaluators and generating unified evaluation reports
 */
export class ResumeEvaluator {
  private options: EvaluationOptions;

  constructor(options: EvaluationOptions = {}) {
    this.options = {
      includeObjective: true,
      includeSubjective: true,
      enableScoring: true,
      ...options
    };
  }

  /**
   * Evaluate complete resume
   * @param resumeData Resume data
   * @returns Promise<ResumeEvaluationReport>
   */
  async evaluateResume(resumeData: ResumeData): Promise<ResumeEvaluationReport> {
    const moduleReports: ModuleEvaluationReport[] = [];

    // Evaluate personal information
    if (resumeData.personalInfo) {
      const personalInfoReport = await evaluatorRegistry.personalInfo.evaluate(
        resumeData.personalInfo,
        { 
          includeObjective: this.options.includeObjective,
          includeSubjective: false // Personal info usually doesn't need subjective evaluation
        }
      );
      moduleReports.push(personalInfoReport);
    }

    // Evaluate education experience
    if (resumeData.education?.blocks?.length > 0) {
      const educationReports = await this.evaluateSectionBlocks(
        resumeData.education.blocks,
        evaluatorRegistry.education,
        'Education Experience'
      );
      moduleReports.push(...educationReports);
    }

    // Evaluate employment experience
    if (resumeData.employment?.blocks?.length > 0) {
      const employmentReports = await this.evaluateSectionBlocks(
        resumeData.employment.blocks,
        evaluatorRegistry.employment,
        'Employment Experience'
      );
      moduleReports.push(...employmentReports);
    }

    // Evaluate skills
    if (resumeData.skills?.blocks?.length > 0) {
      const skillReports = await this.evaluateSectionBlocks(
        resumeData.skills.blocks,
        evaluatorRegistry.skills,
        'Skills'
      );
      moduleReports.push(...skillReports);
    }

    // Overall professionalism evaluation (subjective)
    if (this.options.includeSubjective) {
      try {
        const overallReport = await evaluateResumeProfessionalism(resumeData);
        moduleReports.push({
          module: 'Overall Professionalism',
          results: [overallReport],
          overallScore: overallReport.score,
          passed: overallReport.passed
        });
      } catch (error) {
        moduleReports.push({
          module: 'Overall Professionalism',
          results: [{
            passed: false,
            ruleName: 'Overall Professionalism Evaluation',
            message: 'Overall evaluation failed',
            type: 'subjective'
          }],
          passed: false
        });
      }
    }

    // Calculate overall score and status
    const overallScore = this.calculateOverallScore(moduleReports);
    const passed = moduleReports.every(report => report.passed);
    const summary = this.generateSummary(moduleReports);

    return {
      modules: moduleReports,
      overallScore,
      passed,
      summary
    };
  }

  /**
   * Evaluate multiple data blocks in a module
   */
  private async evaluateSectionBlocks<T>(
    blocks: T[],
    evaluator: any,
    moduleName: string
  ): Promise<ModuleEvaluationReport[]> {
    const reports: ModuleEvaluationReport[] = [];

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const report = await evaluator.evaluate(block, {
        includeObjective: this.options.includeObjective,
        includeSubjective: this.options.includeSubjective
      });
      
      // Add index identifier for each block
      report.module = `${moduleName} ${i + 1}`;
      reports.push(report);
    }

    return reports;
  }

  /**
   * Calculate overall score
   */
  private calculateOverallScore(moduleReports: ModuleEvaluationReport[]): number {
    if (moduleReports.length === 0) return 0;

    const totalScore = moduleReports.reduce((sum, report) => {
      return sum + (report.overallScore || 0);
    }, 0);

    return Math.round(totalScore / moduleReports.length);
  }

  /**
   * Generate evaluation summary
   */
  private generateSummary(moduleReports: ModuleEvaluationReport[]): string {
    const passedModules = moduleReports.filter(report => report.passed);
    const failedModules = moduleReports.filter(report => !report.passed);
    
    const totalModules = moduleReports.length;
    const passedCount = passedModules.length;
    const overallScore = this.calculateOverallScore(moduleReports);

    let summary = `Resume evaluation completed!\n\n`;
    summary += `📊 Overall Score: ${overallScore}/100\n`;
    summary += `✅ Passed Modules: ${passedCount}/${totalModules}\n`;
    
    if (failedModules.length > 0) {
      summary += `❌ Modules Needing Improvement: ${failedModules.map(r => r.module).join(', ')}\n`;
    }

    // Add specific suggestions
    const suggestions = moduleReports
      .flatMap(report => report.results)
      .filter(result => !result.passed && result.suggestion)
      .map(result => `• ${result.suggestion}`)
      .slice(0, 5); // Show at most 5 suggestions

    if (suggestions.length > 0) {
      summary += `\n💡 Key Suggestions:\n${suggestions.join('\n')}`;
    }

    return summary;
  }

  /**
   * Update evaluation options
   */
  updateOptions(newOptions: Partial<EvaluationOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Get current evaluation options
   */
  getOptions(): EvaluationOptions {
    return { ...this.options };
  }
}

// Create default evaluator instance
export const defaultResumeEvaluator = new ResumeEvaluator(); 