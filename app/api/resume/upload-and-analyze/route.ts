import {NextRequest, NextResponse} from "next/server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { createResumeRecord, uploadResumeFile } from "@/server/resume";
import { JobInfoFormType } from "@/components/client-components/job-information-form";
import {parseResume} from "@/server/langchain/resume-parser";
import {verifyJobApplicationLimit} from "@/server/quota";
import {
  registerWriter,
  sendData,
  closeWriter,
} from "@/server/sse/writer-manager";
import { evaluateAndSaveResume } from "@/server/evaluation";

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const processId = Date.now().toString();
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  registerWriter(processId, writer);

  try {
    await verifyJobApplicationLimit()

    const formData = await request.formData()
    const file = formData.get("file") as File
    const jobInfo = JSON.parse(
      formData.get("jobInfo") as string
    ) as JobInfoFormType

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    request.signal.onabort = async () => {
      closeWriter(processId)
    }

    await processFile(processId, file, jobInfo)
  } catch (error: any) {
    console.log('error', error)
    sendData(processId, {
      progress: 0,
      message: "Failed",
      error: error.message,
    })
    closeWriter(processId)
  }

  return new NextResponse(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}


async function processFile(
  processId: string,
  file: File,
  jobInfo: JobInfoFormType
) {
  try {
    if (file.type !== 'application/pdf') {
      throw new Error("Only support upload pdf file as resume")
    }

    // 更新状态
    sendData(processId, {
      progress: 10,
      message: "Uploading file...",
    });
    const uploadResult = await uploadResumeFile(file);

    sendData(processId, {
      progress: 30,
      message: "Analyzing resume file...",
    });

    const arrayBuffer = await file.arrayBuffer();
    const loader = new PDFLoader(new Blob([arrayBuffer]), {
      splitPages: false,
    });

    const docs = await loader.load();

    sendData(processId, {
      progress: 50,
      message: "AI processing...",
    });

    const [resumeTextData, language] = await parseResume(docs[0].pageContent);

    sendData(processId, {
      progress: 70,
      message: "Prepare resume data...",
    });

    const {resumeData, jobData} = await createResumeRecord(
      jobInfo,
      uploadResult,
      resumeTextData,
      language
    );

    sendData(processId, {
      progress: 85,
      message: "Evaluating resume...",
    });

    await evaluateAndSaveResume(resumeData.id, resumeData.resume_json!!, jobData.description)

    sendData(processId, {
      progress: 100,
      message: "Analysis completed!",
      data: resumeData,
    });
  } catch (error: any) {
    console.error(error)
    sendData(processId, {
      progress: 0,
      message: "Failed",
      error: error.message,
    });
  } finally {
    closeWriter(processId);
  }
}
