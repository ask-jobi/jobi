import { Font } from '@react-pdf/renderer';
import { ResumeData } from "@/types/resume";
import { DefaultTemplate } from './resume-templates/default-template';

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

const defaultTemplate = new DefaultTemplate();

export function generateResumePdf(data: ResumeData) {
  return defaultTemplate.renderDocument(data);
}
