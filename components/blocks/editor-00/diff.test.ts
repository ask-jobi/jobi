import { diffMarkdown } from './diff';

describe('diffMarkdown', () => {
  it('heading', () => {
    const oldStr = '## hello world';
    const newStr = '# hello world';
    expect(diffMarkdown(oldStr, newStr)).toBe('## [-hello world-]\n# [+hello world+]');
  });

  it('list', () => {
    const oldStr = '- item1\n- item2';
    const newStr = '- item1\n- item3';
    expect(diffMarkdown(oldStr, newStr)).toBe('- item1\n- [-item2-][+item3+]');
  });

  it('null list', () => {
    const oldStr = '';
    const newStr = '- item1';
    expect(diffMarkdown(oldStr, newStr)).toBe('- [+item1+]');
  });

  it('normal diff', () => {
    const oldStr = 'hello world';
    const newStr = 'hello new world!';
    expect(diffMarkdown(oldStr, newStr)).toBe('hello [+new +]world[+!+]');
  });

  it('混合场景', () => {
    const oldStr = '# title\nhello world';
    const newStr = '# title\nhello new world!';
    expect(diffMarkdown(oldStr, newStr)).toBe('# title\nhello [+new +]world[+!+]');
  });

  it('code', () => {
    const oldStr = '```js\nconsole.log(1);\n```';
    const newStr = '```js\nconsole.log(2);\n```';
    expect(diffMarkdown(oldStr, newStr)).toBe('```js\nconsole.log([-1-][+2+]);\n```');
  });

  it('table', () => {
    const oldStr = '| a | b |\n|---|---|\n| 1 | 2 |';
    const newStr = '| a | b |\n|---|---|\n| 1 | 3 |';
    expect(diffMarkdown(oldStr, newStr)).toBe('| a | b |\n|---|---|\n| 1 | [-2-][+3+] |');
  });
});
