export interface RewriteBlockRequest {
    resumeSection: string; // 当前块的全部内容，用来提供参考
    originalContent: string; // 当前块的原始文本内容
    context: {
      sectionType: string;
      jd: string;            // 岗位JD/描述，感觉可以用摘要版本代替
    };
    instruction: string; // 用户在对话框里输入的个性化改写需求，或者是选一些预设的，例如 量化成果、突出技术栈、精炼语言、突出领导力、突出影响力、结构优化
    language?: string;
  }
