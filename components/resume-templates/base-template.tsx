import {ResumeData, SectionBlock, SortableSectionId} from "@/types/resume";
import {store} from "@/components/client-components/resume-context";
import {focusSectionAtom} from "@/lib/store/resume";

export abstract class BaseTemplate {
  data: ResumeData
  isInteractive: boolean;
  abstract name: string;
  presentLabel: string = 'Present';

  abstract renderHeader(): React.ReactNode;

  abstract renderEducation(): React.ReactNode;

  abstract renderEmployment(): React.ReactNode;

  abstract renderSkills(): React.ReactNode;

  protected constructor(data: ResumeData, isInteractive?: boolean) {
    console.log(data)
    this.isInteractive = isInteractive ?? true
    this.data = data
  }

  setPresentLabel(label: string) {
    this.presentLabel = label
  }

  localizePresent(value: string): string {
    const v = value ?? ''
    const isPresent = v.toLowerCase?.() === 'present' || v === '现在' || v === '至今'
    return isPresent ? this.presentLabel : value
  }



  onSectionClick: (id: keyof ResumeData, index?: number) => void = (id, index) => {
    store.set(focusSectionAtom, id, index)
  };

  renderPersonalInfo(): React.ReactNode {
    const handleClick = () => {
      if (this.isInteractive && this.onSectionClick) this.onSectionClick("personalInfo");
    };
    return (
      <div
        id={`section-personalInfo`}
        onClick={handleClick}
        className={`${this.isInteractive ? "hover:bg-gray-200 cursor-pointer" : ""}`}>
        {this.renderHeader()}
      </div>
    )
  }

  renderSectionBlocks<
    ID extends SortableSectionId,
    S extends ResumeData[ID] extends SectionBlock<infer B> ? SectionBlock<B> : never,
    B = S extends SectionBlock<infer U> ? U : never>({
                           sectionId,
                           headRender,
                           blockRender,
                           sectionClassName = "",
                           sectionStyle,
                           sectionContainerRender,
                           titleRender,
                         }: {
    sectionId: ID;
    headRender: (block: B, index: number) => React.ReactNode;
    blockRender: (block: B, index: number) => React.ReactNode;
    sectionClassName?: string;
    sectionStyle?: React.CSSProperties;
    sectionContainerRender?: (children: React.ReactNode) => React.ReactNode;
    titleRender?: (title: string) => React.ReactNode;
  }) {
    const section = this.data[sectionId] as SectionBlock
    const content = (
      <div
        id={`section-${sectionId}`}
        key={`section-${sectionId}`}
        className={`mb-5 p-2 ${sectionClassName}`}
        style={sectionStyle}
      >
        {titleRender ? titleRender(section.title) : <h2 className={`text-lg font-bold mb-2`}>{section.title}</h2>}
        {section.blocks.map((block, index) => {
          const handleClick = () => {
            if (this.isInteractive && this.onSectionClick) this.onSectionClick(sectionId, index);
          };
          return (
            <div
              id={`section-${sectionId}-${index}`}
              key={index}
              className={`mb-4 ${this.isInteractive ? "hover:bg-gray-200 cursor-pointer" : ""}`}
              onClick={handleClick}
              tabIndex={this.isInteractive ? 0 : undefined}
            >
              <div id={`${sectionId}-${index}-head`}>
                {headRender(block, index)}
              </div>
              {blockRender(block, index)}
            </div>
          );
        })}
      </div>
    );
    return sectionContainerRender ? sectionContainerRender(content) : content;
  }

  renderDocument() {
    const {data} = this
    const sections = getOrderedSections(data);
    return (
      <article className="bg-white p-8 pdf">
        {this.renderPersonalInfo()}
        {sections.map(({id}) => {
          switch (id) {
            case "education":
              return this.renderEducation()
            case "employment":
              return this.renderEmployment()
            case "skills":
              return this.renderSkills()
            default:
              return <div className="hidden" key={id}></div>;
          }
        })}
      </article>
    );
  }
}


type OrderedSection = SectionBlock & { id: keyof ResumeData }

export const getOrderedSections = (data: ResumeData): OrderedSection[] => {
  return [
    {id: "education" as const, ...data.education},
    {id: "employment" as const, ...data.employment},
    {id: "skills" as const, ...data.skills}
  ].sort((a, b) => a.order - b.order);
};
