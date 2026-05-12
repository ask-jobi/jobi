import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"
import { ResumeData } from "@/types/resume"
import { createClient } from "@/lib/supabase/server"
import { getResumeThumbnailSections } from "@/lib/resume-thumbnail"

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
    const sections = getResumeThumbnailSections(parsedData)

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

        {sections.map((section) => (
          <div
            key={section.id}
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
              {section.title}
            </h2>

            {section.blocks.map((block, index) => (
              <div
                key={`${section.id}-${index}`}
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
                    {block.heading}
                  </h3>
                  {block.meta && (
                    <span style={{ fontSize: "12px", color: "#666" }}>
                      {block.meta}
                    </span>
                  )}
                </div>

                {block.subheading && (
                  <p
                    style={{ fontSize: "12px", color: "#666", margin: "2px 0" }}
                  >
                    {block.subheading}
                  </p>
                )}

                {block.tags && block.tags.length > 0 && (
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}
                  >
                    {block.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: "10px",
                          backgroundColor: "#f0f0f0",
                          padding: "2px 6px",
                          borderRadius: "12px",
                          color: "#666"
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
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
