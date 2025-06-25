import {resumeDataAtom} from "@/lib/store/resume";
import {DefaultTemplate} from "@/components/resume-templates/default-template";
import {useEffect, useState} from "react";
import {BaseTemplate} from "@/components/resume-templates/base-template";
import {useAtom} from "jotai/index";
import {ResumeData} from "@/types/resume";

function useResumeTemplate(data?: ResumeData) {
  const [resumeData] = useAtom(resumeDataAtom);
  const [template, setTemplate] = useState<BaseTemplate | null>(null)

  useEffect(() => {
    const dataTemp = data ?? resumeData

    if (dataTemp) {
      setTemplate(new DefaultTemplate(dataTemp))
    }
  }, [resumeData, data]);

  return template
}

export default useResumeTemplate;
