import React from 'react';
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkPreserveBlockquote from "@/components/resume-templates/markdown/plugins";

type MarkdownRenderProps = {
  markdown: string
}

function MarkdownRender({
                          markdown
                        }: MarkdownRenderProps) {
  return (
    <Markdown
      remarkPlugins={[remarkPreserveBlockquote, remarkGfm]}>
      {markdown}
    </Markdown>
  );
}

export default MarkdownRender;
