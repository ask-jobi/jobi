import { diffWords } from 'diff';

function splitMarkdownPrefix(line: string): [string, string] {
  // 匹配标题、无序列表、有序列表
  const match = line.match(/^\s*(?<flag>#{1,6} |[-*+] |\d+\. )\s*/);
  if (match) {
    return [match.groups?.flag ?? "", line.slice(match[0].length)];
  }
  return ["", line];
}

function joinDiffParts(parts: ReturnType<typeof diffWords>) {
  let result = '';
  for (const part of parts) {
    if (part.added) {
      // 新增块保留原始空格
      result += `[+${part.value}+]`;
    } else if (part.removed) {
      // 删除块不加空格
      result += `[-${part.value}-]`;
    } else {
      result += part.value;
    }
  }
  return result;
}

export function diffMarkdown(oldStr: string, newStr: string): string {
  const oldLines = oldStr.split('\n');
  const newLines = newStr.split('\n');
  const maxLen = Math.max(oldLines.length, newLines.length);
  const result: string[] = [];
  for (let i = 0; i < maxLen; i++) {
    const oldLine = oldLines[i] ?? '';
    const newLine = newLines[i] ?? '';
    const [oldPrefix, oldContent] = splitMarkdownPrefix(oldLine);
    const [newPrefix, newContent] = splitMarkdownPrefix(newLine);
    if (oldLine === newLine) {
      result.push(oldLine);
    } else if (oldPrefix && newPrefix && oldPrefix === newPrefix) {
      // 结构符号相同，内容diff
      const wordDiff = joinDiffParts(diffWords(oldContent, newContent));
      result.push((oldPrefix + wordDiff).trim());
    } else if (oldPrefix !== newPrefix) {
      // 结构符号不同，整行diff，分两行
      if (oldLine) result.push(`${oldPrefix}[-${oldContent}-]`);
      if (newLine) result.push(`${newPrefix}[+${newContent}+]`);
    } else {
      // 普通行word diff
      const wordDiff = joinDiffParts(diffWords(oldLine, newLine));
      result.push(wordDiff);
    }
  }
  return result.filter(line => line !== '').join('\n');
}
