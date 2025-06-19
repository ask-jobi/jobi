import { ResumeData } from "@/types/resume";
import { ResumeTemplate, getOrderedSections } from './base-template';
import "./default-template.css"
import MarkdownRender from "@/components/resume-templates/markdown/MarkdownRender";

export class DefaultTemplate implements ResumeTemplate {
  name = 'Default';

  renderHeader(data: ResumeData) {
    return (
      <div className="">
        <h1 className="text-2xl font-bold mb-1">
          {data.personalInfo.firstName} {data.personalInfo.lastName}
        </h1>
        <p className="text-sm text-gray-600 mb-0.5">{data.personalInfo.email}</p>
        <p className="text-sm text-gray-600 mb-0.5">{data.personalInfo.phone}</p>
      </div>
    );
  }

  renderSection(sectionId: string, data: ResumeData, onSectionClick?: (id: string) => void) {
    const handleClick = () => {
      if (onSectionClick) {
        onSectionClick(sectionId);
      }
    };

    switch (sectionId) {
      case "education":
        return (
          <div id={`section-${sectionId}`} key={sectionId} className="mb-5 p-2 hover:bg-gray-100 cursor-pointer" onClick={handleClick}>
            <h2 className="text-lg font-bold mb-2">{data.education.title}</h2>
            {data.education.blocks.map((block, index) => (
              <div id={`${sectionId}-${index}`} key={index} className="mb-4">
                <div className="flex justify-between mb-0.5">
                  <h3 className="text-base font-bold">{block.school}</h3>
                  <span className="text-sm text-gray-600">{block.start} - {block.end}</span>
                </div>
                <p className="text-sm text-gray-600 mb-1">{block.degree}</p>
                <MarkdownRender
                  markdown={block.content}
                />
              </div>
              ))}
          </div>
        );
      case "employment":
        return (
          <div id={`section-${sectionId}`} key={sectionId} className="mb-5 p-2 hover:bg-gray-100 cursor-pointer" onClick={handleClick}>
            <h2 className="text-lg font-bold mb-2">{data.employment.title}</h2>
            {data.employment.blocks.map((block, index) => (
              <div id={`${sectionId}-${index}`} key={index} className="mb-4">
                <div className="flex justify-between mb-0.5">
                  <h3 className="text-base font-bold">{block.company}</h3>
                  <span className="text-sm text-gray-600">{block.start} - {block.end}</span>
                </div>
                <p className="text-sm text-gray-600 mb-1">{block.jobTitle}</p>
                <MarkdownRender
                  markdown={block.content}
                />
              </div>
            ))}
          </div>
        );
      case "skills":
        return (
          <div id={`section-${sectionId}`} key={sectionId} className="mb-5 p-2 hover:bg-gray-100 cursor-pointer" onClick={handleClick}>
            <h2 className="text-lg font-bold mb-2">{data.skills.title}</h2>
            {data.skills.blocks.map((block, index) => (
              <div id={`${sectionId}-${index}`} key={index} className="mb-2">
                <h3 className="text-sm font-bold mb-1">{block.group}</h3>
                <div className="flex flex-wrap">
                  {block.content.split(",").map((item, itemIndex) => (
                    <span key={`tag-${itemIndex}`} className="text-xs bg-gray-100 px-2 py-1 rounded-full mr-1 mb-1">
                      {item.trim()}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      default:
        return <div className="hidden"></div>; // Use hidden to avoid rendering empty divs
    }
  }

  renderDocument(data: ResumeData, onSectionClick?: (id: string) => void) {
    const sections = getOrderedSections(data);

    return (
      <article className="bg-white p-8 pdf">
          {this.renderHeader(data)}
          {sections.map(({ id }) => this.renderSection(id, data, onSectionClick))}
      </article>
    );
  }
}
