"use client"

import {JobApplication, ResumeData} from "@/types/resume";
import {createContext, useContext, useState, ReactNode} from "react";

interface ResumeContextType {
  resumeData: ResumeData;
  application: JobApplication;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  updateResumeData: (data: ResumeData) => void;
  selectedSectionId: string | null;
  handleSectionClick: (id: string) => void;
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
  jobApplication: JobApplication;
}

export function ResumeProvider({ children, initialData, jobApplication }: ResumeProviderProps) {
  const [application] = useState<JobApplication>(jobApplication);
  const [resumeData, setResumeData] = useState<ResumeData>(initialData);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  const updateResumeData = (data: ResumeData) => {
    setResumeData(data);
  };

  const handleSectionClick = (id: string) => {
    setSelectedSectionId(id);
    const sectionElement = document.getElementById(`section-${id}`);
    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <ResumeContext.Provider value={{
      resumeData,
      application,
      isLoading,
      setLoading,
      updateResumeData,
      selectedSectionId,
      handleSectionClick
    }}>
      {children}
    </ResumeContext.Provider>
  );
}
