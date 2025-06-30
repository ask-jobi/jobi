export const translations = {
  zh: {
    // Header
    login: "登录",
    signUp: "免费注册",
    pricing: "定价",
    home: "首页",
    dashboard: "控制台",
    
    // Hero Section
    aiDriven: "AI 驱动的简历优化",
    heroTitle: "打造完美简历",
    heroSubtitle: "获得理想工作",
    heroDescription: "使用先进的 AI 技术，智能分析您的简历，提供个性化建议，让您的简历在众多求职者中脱颖而出。",
    startFreeTrial: "开始免费试用",
    learnMore: "了解更多",
    
    // Features Section
    whyChooseJobi: "为什么选择 Jobi？",
    featuresDescription: "我们提供最先进的 AI 技术，帮助您创建专业、有竞争力的简历",
    aiAnalysis: "AI 智能分析",
    aiAnalysisDesc: "先进的 AI 算法深度分析您的简历，识别改进空间并提供具体建议",
    personalizedOptimization: "个性化优化",
    personalizedOptimizationDesc: "根据目标职位和行业特点，提供量身定制的简历优化建议",
    privacyProtection: "隐私保护",
    privacyProtectionDesc: "您的个人信息和简历内容完全加密，确保数据安全",
    
    // Stats Section
    successCases: "成功案例",
    interviewRate: "面试通过率",
    templates: "行业模板",
    aiSupport: "AI 支持",
    
    // CTA Section
    readyToStart: "准备好提升您的职业发展了吗？",
    ctaDescription: "加入数千名成功求职者的行列，让 AI 帮助您打造完美简历",
    getStarted: "立即开始",
    
    // Footer
    copyright: "© 2025 Jobi. 保留所有权利。",
    
    // Language Switcher
    language: "语言",
    chinese: "中文",
    english: "English",
  },
  en: {
    // Header
    login: "Login",
    signUp: "Sign Up Free",
    pricing: "Pricing",
    home: "Home",
    dashboard: "Dashboard",
    
    // Hero Section
    aiDriven: "AI-Powered Resume Optimization",
    heroTitle: "Create Perfect Resume",
    heroSubtitle: "Land Your Dream Job",
    heroDescription: "Use advanced AI technology to intelligently analyze your resume, provide personalized suggestions, and make your resume stand out among job seekers.",
    startFreeTrial: "Start Free Trial",
    learnMore: "Learn More",
    
    // Features Section
    whyChooseJobi: "Why Choose Jobi?",
    featuresDescription: "We provide the most advanced AI technology to help you create professional and competitive resumes",
    aiAnalysis: "AI Smart Analysis",
    aiAnalysisDesc: "Advanced AI algorithms deeply analyze your resume, identify improvement areas and provide specific suggestions",
    personalizedOptimization: "Personalized Optimization",
    personalizedOptimizationDesc: "Provide tailored resume optimization suggestions based on target positions and industry characteristics",
    privacyProtection: "Privacy Protection",
    privacyProtectionDesc: "Your personal information and resume content are fully encrypted to ensure data security",
    
    // Stats Section
    successCases: "Success Cases",
    interviewRate: "Interview Pass Rate",
    templates: "Industry Templates",
    aiSupport: "AI Support",
    
    // CTA Section
    readyToStart: "Ready to Boost Your Career?",
    ctaDescription: "Join thousands of successful job seekers and let AI help you create the perfect resume",
    getStarted: "Get Started",
    
    // Footer
    copyright: "© 2025 Jobi. All rights reserved.",
    
    // Language Switcher
    language: "Language",
    chinese: "中文",
    english: "English",
  }
};

export type Language = 'zh' | 'en';
export type TranslationKey = keyof typeof translations.zh; 