"use client"

import { ResumeData } from "@/types/resume";
import { createContext, useContext, useState, ReactNode } from "react";

interface ResumeContextType {
  resumeData: ResumeData;
  updateResumeData: (data: ResumeData) => void;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

export function useResume() {
  const context = useContext(ResumeContext);
  if (context === undefined) {
    throw new Error("useResume must be used within a ResumeProvider");
  }
  return context;
}

interface ResumeProviderProps {
  children: ReactNode;
  initialData: ResumeData;
}

export function ResumeProvider({ children, initialData }: ResumeProviderProps) {
  const [resumeData, setResumeData] = useState<ResumeData>(initialData);

  const updateResumeData = (data: ResumeData) => {
    setResumeData(data);
  };

  return (
    <ResumeContext.Provider value={{ resumeData, updateResumeData }}>
      {children}
    </ResumeContext.Provider>
  );
} 