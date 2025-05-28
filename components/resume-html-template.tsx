import { ResumeData } from "@/types/resume";

export function generateResumeHtml(data: ResumeData): React.ReactElement {
  return (
    <div className="resume-content bg-white px-6 py-8 text-base">
    {/* 个人信息 */}
    <div className="mb-6">
      {/* 调整个人信息字体大小 */}
      <h1 className="text-xl font-bold">
        {data.personalInfo.firstName} {data.personalInfo.lastName}
      </h1>
      <div className="text-gray-600 text-sm">
        <p>{data.personalInfo.email}</p>
        <p>{data.personalInfo.phone}</p>
      </div>
    </div>

    {/* 教育经历 */}
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-3">{data.educationHistory.title}</h2>
      {data.educationHistory.blocks.map((block, index) => (
        <div key={index} className="mb-4">
          <div className="flex justify-between text-sm">
            <h3 className="font-medium">{block.school}</h3>
            <span className="text-gray-600">{block.start} - {block.end}</span>
          </div>
          <p className="text-gray-600 text-sm">{block.degree}</p>
          <p className="mt-2 text-sm">{block.content}</p>
        </div>
      ))}
    </div>

    {/* 工作经历 */}
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-3">{data.employmentHistory.title}</h2>
      {data.employmentHistory.blocks.map((block, index) => (
        <div key={index} className="mb-4">
          <div className="flex justify-between text-sm">
            <h3 className="font-medium">{block.company}</h3>
            <span className="text-gray-600">{block.start} - {block.end}</span>
          </div>
          <p className="text-gray-600 text-sm">{block.jobTitle}</p>
          <p className="mt-2 text-sm">{block.content}</p>
        </div>
      ))}
    </div>

    {/* 技能 */}
    <div>
      <h2 className="text-lg font-semibold mb-3">Skills</h2>
      {data.skills.map((skill, index) => (
        <div key={index} className="mb-4">
          <h3 className="font-medium mb-2 text-sm">{skill.group}</h3>
          <div className="flex flex-wrap gap-2">
            {skill.content.map((item, itemIndex) => (
              <span key={itemIndex} className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                {item}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
  )
} 
