export interface ResumeEvaluationOutput {
  gates: {
    ats: "pass" | "borderline" | "fail";
    hr: "pass" | "borderline" | "fail";
    hiringManager: "pass" | "borderline" | "fail";
  };

  gaps: {
    dimension: "experience" | "skills" | "structure" | "metrics" | "keywords";
    severity: "critical" | "important" | "minor";
    description: string;
    evidence?: string;   // 来自简历或 JD 的具体证据
  }[];
  
  actions: {
    priority: "1" | "2" | "3";
    targetSection: "work_experience" | "projects" | "skills" | "education";
    instruction: string;   // 给 agent 的明确指令
  }[];
}
x