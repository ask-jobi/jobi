import { ReactElement } from "react";
import { ResumeData } from "@/types/resume";

export interface ResumeTemplate {
  name: string;
  styles: any;
  renderHeader: (data: ResumeData) => ReactElement;
  renderSection: (sectionId: string, data: ResumeData) => ReactElement;
  renderDocument: (data: ResumeData) => ReactElement;
}

export const getOrderedSections = (data: ResumeData) => {
  return [
    { id: "education", order: data.educationHistory.order },
    { id: "employment", order: data.employmentHistory.order },
    { id: "skills", order: data.skills.order }
  ].sort((a, b) => a.order - b.order);
};
