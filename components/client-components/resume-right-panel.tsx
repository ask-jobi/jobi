import {useAtom} from "jotai/index";
import {rightPanelViewAtom, useResume} from "@/lib/store/resume";
import {PersonalInfoForm} from "@/components/client-components/forms/personal-info-form";
import {EducationForm} from "@/components/client-components/forms/education-form";
import {EmploymentForm} from "@/components/client-components/forms/employment-form";
import {SkillsForm} from "@/components/client-components/forms/skills-form";
import {EvaluationReport} from "@/components/client-components/evaluation-report";
import {Button} from "@/components/ui/button";
import {useState} from "react";
import {Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "../ui/empty";
import { Spinner } from "../ui/spinner";

export function ResumeRightPanel() {
  const [rightPanelView] = useAtom(rightPanelViewAtom)
  const [loading, setLoading] = useState(false)
  const {selectedSectionId, resumeEvaluation, refreshEvaluationReport } = useResume()

  const renderSelectedSectionForm = () => {
    switch (selectedSectionId) {
      case "personalInfo":
        return <PersonalInfoForm/>;
      case "education":
        return <EducationForm/>;
      case "employment":
        return <EmploymentForm/>;
      case "skills":
        return <SkillsForm/>;
      default:
        return <p className="text-gray-500">Select a part of resume to edit。</p>;
    }
  };

  const handleCreateEvaluationReport = async () => {
    setLoading(true)
    await refreshEvaluationReport()
    setLoading(false)
  }

  return <>
    {
      rightPanelView === "evaluation" ? (
        resumeEvaluation ? (
          <EvaluationReport evaluation={resumeEvaluation}/>
        ) : (
          <Empty className="h-full w-full flex flex-col items-center justify-center gap-4">
            <EmptyHeader>
              <EmptyTitle>
                {
                  loading ?
                    'Processing your request' :
                    '暂无评估报告'
                }

              </EmptyTitle>
              <EmptyDescription>
                {
                  loading ?
                    'Please wait while we process your request. Do not refresh the page.' :
                    '请点击以下按钮生成报告'
                }
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" size="sm" disabled={loading} onClick={handleCreateEvaluationReport}>
                { loading && <Spinner/> }
                Evaluate Resume
              </Button>
            </EmptyContent>
          </Empty>
        )
      ) : renderSelectedSectionForm()
    }
  </>;
}
