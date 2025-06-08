export interface RewriteBlockRequest {
    //blockId: string;
    originalContent: string; // 当前块的原始文本内容
    sectionType?: string;
    context: {
      resumeSummary?: string; // 整体简历摘要（可选，提升AI风格一致性）
      resumeGoal?: string;    // 简历主线/定位（如“突出领导力”，可选）
      jd: string;            // 岗位JD/描述，感觉可以用摘要版本代替
      relatedSkills?: string[]; // 与本块相关的技能
    };
    instruction: string; // 用户在对话框里输入的个性化改写需求，或者是选一些预设的，例如 量化成果、突出技术栈、精炼语言、突出领导力、突出影响力、结构优化
    language?: string;   
  }