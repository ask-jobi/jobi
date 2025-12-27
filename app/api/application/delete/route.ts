import { NextRequest, NextResponse } from "next/server";
import { deleteJobApplication } from "@/server/resume";
import { z } from "zod";

const deleteJobApplicationSchema = z.object({
  id: z.uuid("Invalid job application ID format"),
});

export const dynamic = 'force-dynamic'

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 使用 Zod 进行参数校验
    const validationResult = deleteJobApplicationSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid request parameters",
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const { id } = validationResult.data;

    await deleteJobApplication(id);

    return NextResponse.json({
      success: true,
      message: "Job application deleted successfully"
    });
  } catch (error: any) {
    console.error('Delete job application failed:', error);
    
    // 根据错误类型返回不同的状态码
    if (error.message.includes("not authenticated")) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }
    
    if (error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    
    if (error.message.includes("not found")) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to delete job application" },
      { status: 500 }
    );
  }
}

