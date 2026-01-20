import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"
import { ResumeData } from "@/types/resume"
import { createClient } from "@/lib/supabase/server"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const resumeId = searchParams.get("resume_id")

    if (!resumeId) {
      return new Response("Missing resume data", { status: 400 })
    }

    const supabase = await createClient()
    const { data: resumeData } = await supabase
      .from("resumes")
      .select("resume_json")
      .eq("id", resumeId)
      .single()

    if (!resumeData) {
      return new Response("Error fetching resume data", { status: 500 })
    }

    const parsedData: ResumeData = resumeData.resume_json!!

    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "white",
          padding: "20px",
          fontFamily: "Arial, sans-serif",
          fontSize: "12px",
          lineHeight: "1.4"
        }}
      >
        {/* 个人信息 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginBottom: "20px"
          }}
        >
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              margin: "0 0 8px 0",
              color: "#1a1a1a"
            }}
          >
            {parsedData.personalInfo.firstName}{" "}
            {parsedData.personalInfo.lastName}
          </h1>
          <p style={{ margin: "4px 0", color: "#666" }}>
            {parsedData.personalInfo.email}
          </p>
          <p style={{ margin: "4px 0", color: "#666" }}>
            {parsedData.personalInfo.phone}
          </p>
        </div>

        {/* 教育经历 */}
        {parsedData.education?.blocks &&
          parsedData.education.blocks.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginBottom: "16px"
              }}
            >
              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  margin: "0 0 8px 0",
                  color: "#1a1a1a",
                  borderBottom: "2px solid #e5e5e5",
                  paddingBottom: "4px"
                }}
              >
                {parsedData.education.title}
              </h2>
              {parsedData.education.blocks.map((block, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    marginBottom: "8px"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "4px"
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "14px",
                        fontWeight: "bold",
                        margin: 0
                      }}
                    >
                      {block.school}
                    </h3>
                    <span style={{ fontSize: "12px", color: "#666" }}>
                      {block.start} - {block.end}
                    </span>
                  </div>
                  <p
                    style={{ fontSize: "12px", color: "#666", margin: "2px 0" }}
                  >
                    {block.degree}
                  </p>
                </div>
              ))}
            </div>
          )}

        {/* 工作经历 */}
        {parsedData.employment?.blocks &&
          parsedData.employment.blocks.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginBottom: "16px"
              }}
            >
              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  margin: "0 0 8px 0",
                  color: "#1a1a1a",
                  borderBottom: "2px solid #e5e5e5",
                  paddingBottom: "4px"
                }}
              >
                {parsedData.employment.title}
              </h2>
              {parsedData.employment.blocks.map((block, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    marginBottom: "8px"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "4px"
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "14px",
                        fontWeight: "bold",
                        margin: 0
                      }}
                    >
                      {block.company}
                    </h3>
                    <span style={{ fontSize: "12px", color: "#666" }}>
                      {block.start} - {block.end}
                    </span>
                  </div>
                  <p
                    style={{ fontSize: "12px", color: "#666", margin: "2px 0" }}
                  >
                    {block.jobTitle}
                  </p>
                </div>
              ))}
            </div>
          )}

        {/* 技能 */}
        {parsedData.skills?.blocks && parsedData.skills.blocks.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h2
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                margin: "0 0 8px 0",
                color: "#1a1a1a",
                borderBottom: "2px solid #e5e5e5",
                paddingBottom: "4px"
              }}
            >
              {parsedData.skills.title}
            </h2>
            {parsedData.skills.blocks.map((block, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  marginBottom: "8px"
                }}
              >
                <h3
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    margin: "0 0 4px 0"
                  }}
                >
                  {block.group}
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {block.content.split(",").map((skill, skillIndex) => (
                    <span
                      key={skillIndex}
                      style={{
                        fontSize: "10px",
                        backgroundColor: "#f0f0f0",
                        padding: "2px 6px",
                        borderRadius: "12px",
                        color: "#666"
                      }}
                    >
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>,
      {
        width: 600,
        height: 824
      }
    )
  } catch (error) {
    console.error("Error generating thumbnail:", error)
    return new Response("Error generating thumbnail", { status: 500 })
  }
}
