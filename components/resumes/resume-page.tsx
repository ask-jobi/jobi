"use client"

import ResumeEditor from "./resume-editor"
import { ResumeRightPanel } from "@/components/resumes/resume-right-panel"
import { ResumeSectionEditModal } from "@/components/resumes/resume-section-edit-modal"

export default function ResumePage() {
  return (
    <>
      <div className="relative flex h-[calc(100vh-3rem)] overflow-hidden">
        <div className="flex h-full flex-1 flex-col lg:flex-row">
          <div className="min-w-0 flex-1 overflow-y-auto">
            <div className="flex h-full flex-col gap-4 divide-y overflow-y-auto">
              <ResumeEditor />
            </div>
          </div>
          <aside className="h-[360px] overflow-hidden bg-background lg:h-full lg:min-w-[380px] lg:max-w-[600px] lg:w-[600px]">
            <div className="right h-full min-h-0">
              <ResumeRightPanel />
            </div>
          </aside>
        </div>
      </div>
      <ResumeSectionEditModal />
    </>
  )
}
