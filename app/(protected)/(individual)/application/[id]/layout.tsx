import React from "react"
import { notFound } from "next/navigation"
import { Provider } from "jotai"

import { ResumeInitializer, store } from "@/components/resumes/resume-context"
import { requireVerifiedUserIdentity } from "@/server/auth-helper"
import { getApplicationEditorData } from "@/server/data/applications"

async function Layout(props: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { children, params } = props
  const { id } = await params
  const user = await requireVerifiedUserIdentity()
  const jobApplication = await getApplicationEditorData(user.id, id)

  if (!jobApplication) {
    notFound()
  }

  return (
    <Provider store={store}>
      <ResumeInitializer jobApplication={jobApplication as any}>
        {children}
      </ResumeInitializer>
    </Provider>
  )
}

export default Layout
