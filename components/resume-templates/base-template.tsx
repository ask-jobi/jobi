import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { ResumeData } from "@/types/resume";

export interface ResumeTemplate {
  name: string;
  styles: any;
  renderHeader: (data: ResumeData) => JSX.Element;
  renderSection: (sectionId: string, data: ResumeData) => JSX.Element;
  renderDocument: (data: ResumeData) => JSX.Element;
}

export const createBaseStyles = () => StyleSheet.create({
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

export const getOrderedSections = (data: ResumeData) => {
  return [
    { id: "education", order: data.educationHistory.order },
    { id: "employment", order: data.employmentHistory.order },
    { id: "skills", order: data.skills.order }
  ].sort((a, b) => a.order - b.order);
}; 