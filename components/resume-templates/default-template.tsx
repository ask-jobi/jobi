import { Document, Page, Text, View } from '@react-pdf/renderer';
import { ResumeData } from "@/types/resume";
import { ResumeTemplate, createBaseStyles, getOrderedSections } from './base-template';

export class DefaultTemplate implements ResumeTemplate {
  name = 'Default';
  styles = createBaseStyles();

  renderHeader(data: ResumeData) {
    return (
      <View style={this.styles.header}>
        <Text style={this.styles.name}>
          {data.personalInfo.firstName} {data.personalInfo.lastName}
        </Text>
        <Text style={this.styles.contactInfo}>{data.personalInfo.email}</Text>
        <Text style={this.styles.contactInfo}>{data.personalInfo.phone}</Text>
      </View>
    );
  }

  renderSection(sectionId: string, data: ResumeData) {
    switch (sectionId) {
      case "education":
        return (
          <View key={sectionId} style={this.styles.section}>
            <Text style={this.styles.sectionTitle}>{data.educationHistory.title}</Text>
            {data.educationHistory.blocks.map((block, index) => (
              <View key={index} style={this.styles.block}>
                <View style={this.styles.blockHeader}>
                  <Text style={this.styles.company}>{block.school}</Text>
                  <Text style={this.styles.date}>{block.start} - {block.end}</Text>
                </View>
                <Text style={this.styles.jobTitle}>{block.degree}</Text>
                <Text style={this.styles.content}>{block.content}</Text>
              </View>
            ))}
          </View>
        );
      case "employment":
        return (
          <View key={sectionId} style={this.styles.section}>
            <Text style={this.styles.sectionTitle}>{data.employmentHistory.title}</Text>
            {data.employmentHistory.blocks.map((block, index) => (
              <View key={index} style={this.styles.block}>
                <View style={this.styles.blockHeader}>
                  <Text style={this.styles.company}>{block.company}</Text>
                  <Text style={this.styles.date}>{block.start} - {block.end}</Text>
                </View>
                <Text style={this.styles.jobTitle}>{block.jobTitle}</Text>
                <Text style={this.styles.content}>{block.content}</Text>
              </View>
            ))}
          </View>
        );
      case "skills":
        return (
          <View key={sectionId} style={this.styles.section}>
            <Text style={this.styles.sectionTitle}>{data.skills.title}</Text>
            {data.skills.blocks.map((block, index) => (
              <View key={index} style={this.styles.skillsGroup}>
                <Text style={this.styles.skillGroupTitle}>{block.group}</Text>
                <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
                  {block.content.map((item, itemIndex) => (
                    <Text key={`tag-${itemIndex}`} style={this.styles.skillTag}>
                      {item}
                    </Text>
                  ))}
                </View>
              </View>
            ))}
          </View>
        );
      default:
        return null;
    }
  }

  renderDocument(data: ResumeData) {
    const sections = getOrderedSections(data);

    return (
      <Document>
        <Page size="A4" style={this.styles.page}>
          {this.renderHeader(data)}
          {sections.map(({ id }) => this.renderSection(id, data))}
        </Page>
      </Document>
    );
  }
}
