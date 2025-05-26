import { NextRequest } from "next/server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { createResumeRecord, uploadResumeFile } from "@/server/resume";
import { JobInfoFormType } from "@/components/client-components/job-information-form";

const processingStatus = new Map<
  string,
  {
    progress: number;
    message: string;
    data?: any;
    error?: string;
  }
>();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const jobInfo = JSON.parse(
      formData.get("jobInfo") as string
    ) as JobInfoFormType;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    // 生成处理 ID
    const processId = Date.now().toString();
    processingStatus.set(processId, { progress: 0, message: "Starting..." });

    // 开始处理
    processFile(processId, file, jobInfo).catch((error) => {
      processingStatus.set(processId, {
        progress: 0,
        message: "Failed",
        error: error.message,
      });
    });

    return Response.json({ processId });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// 状态查询接口
export async function GET(request: NextRequest) {
  const processId = request.nextUrl.searchParams.get("processId");

  if (!processId) {
    return Response.json({ error: "No process ID provided" }, { status: 400 });
  }

  const status = processingStatus.get(processId);

  if (!status) {
    return Response.json({ error: "Process not found" }, { status: 404 });
  }

  return Response.json(status);
}

// 处理文件
async function processFile(
  processId: string,
  file: File,
  jobInfo: JobInfoFormType
) {
  try {
    // 更新状态
    processingStatus.set(processId, {
      progress: 10,
      message: "Uploading file...",
    });
    const uploadResult = await uploadResumeFile(file);

    processingStatus.set(processId, {
      progress: 30,
      message: "Creating resume record...",
    });
    const { jobData, resumeData } = await createResumeRecord(
      jobInfo,
      uploadResult
    );

    processingStatus.set(processId, {
      progress: 60,
      message: "Analyzing PDF content...",
    });

    // 解析 PDF
    const arrayBuffer = await file.arrayBuffer();
    const loader = new PDFLoader(new Blob([arrayBuffer]), {
      splitPages: false,
    });

    const docs = await loader.load();

    console.log(docs);

    // AI 分析
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // 更新简历数据到表单
    processingStatus.set(processId, {
      progress: 90,
      message: "Updating resume data...",
    });

    await new Promise((resolve) => setTimeout(resolve, 5000));

    processingStatus.set(processId, {
      progress: 100,
      message: "Analysis completed!",
      data: "resumeContent",
    });
  } catch (error: any) {
    processingStatus.set(processId, {
      progress: 0,
      message: "Failed",
      error: error.message,
    });
  }
}
