import { resumeDataAtom } from "@/lib/store/resume"
import { DefaultTemplate } from "@/components/resume-templates/default-template"
import { useEffect, useState } from "react"
import { BaseTemplate } from "@/components/resume-templates/base-template"
import { useAtom } from "jotai/index"
import { ResumeData } from "@/types/resume"
import { useTranslations } from "next-intl"

function useResumeTemplate(data?: ResumeData) {
  const [resumeData] = useAtom(resumeDataAtom)
  const [template, setTemplate] = useState<BaseTemplate | null>(null)
  const t = useTranslations("monthPicker")

  useEffect(() => {
    const dataTemp = data ?? resumeData

    if (dataTemp) {
      const tmp = new DefaultTemplate(dataTemp)
      setTemplate(tmp)
    }
  }, [resumeData, data, t])

  return template
}

export default useResumeTemplate
