import {Document, Page, Text, View, StyleSheet, Font} from '@react-pdf/renderer';
import {ResumeData} from "@/types/resume";


Font.register({
  family: 'SourceHanSerifSC',
  src: '/fonts/SourceHanSerifSC-SemiBold.otf',
});

Font.registerHyphenationCallback(word => {
  if (word.length === 1) {
    return [word];
  }

  return Array.from(word)
    .map((char) => [char, ''])
    .reduce((arr, current) => {
      arr.push(...current);
      return arr;
    }, []);
});


// 创建样式
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: ['Helvetica', 'SourceHanSerifSC'],
    backgroundColor: '#ffffff'
  },
  section: {
    marginBottom: 20
  },
  header: {
    marginBottom: 20
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5
  },
  contactInfo: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 3
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  block: {
    marginBottom: 15
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3
  },
  company: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  date: {
    fontSize: 12,
    color: '#666666'
  },
  jobTitle: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 5
  },
  content: {
    fontSize: 12,
    marginTop: 5
  },
  skillsGroup: {
    marginBottom: 10
  },
  skillGroupTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5
  },
  skillTag: {
    fontSize: 10,
    backgroundColor: '#f3f4f6',
    padding: '2 8',
    borderRadius: 10,
    marginRight: 5,
    marginBottom: 5
  }
});

export function generateResumePdf(data: ResumeData) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>
            {data.personalInfo.firstName} {data.personalInfo.lastName}
          </Text>
          <Text style={styles.contactInfo}>{data.personalInfo.email}</Text>
          <Text style={styles.contactInfo}>{data.personalInfo.phone}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{data.educationHistory.title}</Text>
          {data.educationHistory.blocks.map((block, index) => (
            <View key={index} style={styles.block}>
              <View style={styles.blockHeader}>
                <Text style={styles.company}>{block.school}</Text>
                <Text style={styles.date}>{block.start} - {block.end}</Text>
              </View>
              <Text style={styles.jobTitle}>{block.degree}</Text>
              <Text style={styles.content}>{block.content}</Text>
            </View>
          ))}
        </View>

        {/* 工作经历 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{data.employmentHistory.title}</Text>
          {data.employmentHistory.blocks.map((block, index) => (
            <View key={index} style={styles.block}>
              <View style={styles.blockHeader}>
                <Text style={styles.company}>{block.company}</Text>
                <Text style={styles.date}>{block.start} - {block.end}</Text>
              </View>
              <Text style={styles.jobTitle}>{block.jobTitle}</Text>
              <Text style={styles.content}>{block.content}</Text>
            </View>
          ))}
        </View>

        {/* 技能 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          {data.skills.map((skill, index) => (
            <View key={index} style={styles.skillsGroup}>
              <Text style={styles.skillGroupTitle}>{skill.group}</Text>
              <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
                {skill.content.map((item, itemIndex) => (
                  <Text key={itemIndex} style={styles.skillTag}>
                    {item}
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
