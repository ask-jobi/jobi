import { NextRequest } from "next/server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { createResumeRecord, uploadResumeFile } from "@/server/resume";
import { JobInfoFormType } from "@/components/client-components/job-information-form";
import { ResumeParser } from "@/server/langchain/resume-parser";

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const writers: Record<string, WritableStreamDefaultWriter> = {};

function sendData(processId: string, data: any) {
  const encoder = new TextEncoder();
  const writer = writers[processId];

  if (!writer) {
    console.error('Writer is not initialized for client:', processId);
    return;
  }

  const formattedData = `data: ${JSON.stringify(data)}\n\n`;
  writer.write(encoder.encode(formattedData));
}

function closeWriter(processId: string) {
  const writer = writers[processId];
  if (!writer) {
    console.warn(`Writer not found for processId: ${processId}`);
    return;
  }

  try {
    writer.close();
  } catch (error) {
    console.error(`Error closing writer for processId: ${processId}`, error);
  } finally {
    delete writers[processId];
  }
}

export async function POST(request: NextRequest) {
  const processId = Date.now().toString();
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  writers[processId] = writer;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const jobInfo = JSON.parse(
      formData.get("jobInfo") as string
    ) as JobInfoFormType;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    request.signal.onabort = async () => {
      await writer.ready;
      await writer.abort();
      delete writers[processId];
    };

    processFile(processId, file, jobInfo)

    return new Response(responseStream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache, no-transform',
      },
    });
  } catch (error: any) {
    sendData(processId, {
      progress: 0,
      message: "Failed",
      error: error.message,
    })
    return Response.json({ error: error.message }, { status: 500 });
  }
}


async function processFile(
  processId: string,
  file: File,
  jobInfo: JobInfoFormType
) {
  try {
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

    const resumeData = await ResumeParser.getInstance().parseResume(docs[0].pageContent);

    sendData(processId, {
      progress: 80,
      message: "Prepare resume data...",
    });

    await createResumeRecord(
      jobInfo,
      uploadResult,
      resumeData
    );

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
