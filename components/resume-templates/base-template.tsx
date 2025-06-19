import { ReactElement } from "react";
import { ResumeData } from "@/types/resume";

export interface ResumeTemplate {
  name: string;
  renderHeader: (data: ResumeData) => ReactElement;
  renderSection: (sectionId: string, data: ResumeData) => ReactElement;
  renderDocument: (data: ResumeData) => ReactElement;
}

export const getOrderedSections = (data: ResumeData) => {
  return [
    { id: "education", order: data.education.order },
    { id: "employment", order: data.employment.order },
    { id: "skills", order: data.skills.order }
  ].sort((a, b) => a.order - b.order);
};
