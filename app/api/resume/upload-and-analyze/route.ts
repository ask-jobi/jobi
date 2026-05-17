import { NextRequest, NextResponse } from "next/server"
import { createApplicationResumeRecord, uploadResumeFile } from "@/server/resume"
import { parseResumeWithTokenUsage } from "@/server/ai/resume-parser"
import {
  buildChatTokenQuota,
  consumeChatTokens,
  getActiveAccessPass,
  verifyChatTokenQuota,
  verifyJobApplicationLimit
} from "@/server/quota"
import {
  registerWriter,
  sendData,
  closeWriter
} from "@/server/sse/writer-manager"
import { evaluateAndSaveResume } from "@/server/evaluation"
import { loadPdfToDoc } from "@/server/ai/tools"
import { JobInfoFormType } from "@/components/forms/job-information-form"
import { RollbackContext, rollbackStorage } from "@/server/rollback"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const processId = Date.now().toString()
  const responseStream = new TransformStream()
  const writer = responseStream.writable.getWriter()
  registerWriter(processId, writer)

  try {
    await verifyJobApplicationLimit()

    const formData = await request.formData()
    const file = formData.get("file") as File
    const jobInfo = JSON.parse(
      formData.get("jobInfo") as string
    ) as JobInfoFormType

    if (!file) {
      closeWriter(processId)
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    request.signal.onabort = async () => {
      closeWriter(processId)
    }

    processFile(processId, file, jobInfo).catch(async (error) => {
      console.log("error", error)
      await sendData(processId, {
        error: error.message
      })
      closeWriter(processId)
    })
  } catch (error: any) {
    console.log("error", error)
    await sendData(processId, {
      error: error.message
    })
    closeWriter(processId)
  }

  return new NextResponse(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no", // 禁用 nginx 缓冲
      "Transfer-Encoding": "chunked" // 启用分块传输
    }
  })
}

async function processFile(
  processId: string,
  file: File,
  jobInfo: JobInfoFormType
) {
  await rollbackStorage.run(new RollbackContext(), async () => {
    try {
      if (file.type !== "application/pdf") {
        throw new Error("Only support upload pdf file as resume")
      }

      // 更新状态
      await sendData(processId, {
        step: "upload",
        status: "loading"
      })
      const uploadResult = await uploadResumeFile(file)
      await sendData(processId, {
        step: "upload",
        status: "success"
      })
      await new Promise((resolve) => setTimeout(resolve, 1000))

      await sendData(processId, {
        step: "load",
        status: "loading"
      })
      const docs = await loadPdfToDoc(file, {
        splitPages: false
      })
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await sendData(processId, {
        step: "load",
        status: "success"
      })
      await new Promise((resolve) => setTimeout(resolve, 1000))

      await sendData(processId, {
        step: "parse",
        status: "loading"
      })
      const activeAccessPass = await getActiveAccessPass(uploadResult.userId)
      if (activeAccessPass) {
        const chatTokenQuota = buildChatTokenQuota(activeAccessPass)
        verifyChatTokenQuota(chatTokenQuota.used, chatTokenQuota.limit)
      }

      const { resumeData: resumeTextData, language, tokenUsage } =
        await parseResumeWithTokenUsage(docs[0].pageContent)

      if (activeAccessPass && tokenUsage.totalTokens > 0) {
        await consumeChatTokens(activeAccessPass.id, tokenUsage.totalTokens)
      }

      await sendData(processId, {
        step: "parse",
        status: "success"
      })
      await new Promise((resolve) => setTimeout(resolve, 1000))

      await sendData(processId, {
        step: "prepare",
        status: "loading"
      })
      const { resumeData, jobData, applicationData } = await createApplicationResumeRecord(
        jobInfo,
        uploadResult,
        resumeTextData,
        language
      )
      await sendData(processId, {
        step: "prepare",
        status: "success"
      })
      await new Promise((resolve) => setTimeout(resolve, 1000))

      await sendData(processId, {
        step: "evaluate",
        status: "loading"
      })
      const evaluationResult = await evaluateAndSaveResume(
        resumeData.id,
        resumeData.resume_json!!,
        jobData.description
      )
      await sendData(processId, {
        step: "evaluate",
        status: "success",
        resumeId: resumeData.id,
        applicationId: applicationData.id
      })
    } catch (error: any) {
      console.error(error)

      // 执行回滚
      const rollbackCtx = rollbackStorage.getStore()
      if (rollbackCtx) {
        await rollbackCtx.executeRollback()
      }

      await sendData(processId, {
        error: error.message
      })
      throw error
    } finally {
      closeWriter(processId)
    }
  })
}
