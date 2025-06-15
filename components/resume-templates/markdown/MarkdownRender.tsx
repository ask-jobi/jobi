import React from 'react';
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkFlexibleMarkers from "remark-flexible-markers";

type MarkdownRenderProps = {
  markdown: string
}

function MarkdownRender({
                          markdown
                        }: MarkdownRenderProps) {
  return (
    <Markdown remarkPlugins={[remarkGfm, remarkFlexibleMarkers]}>
      {markdown}
    </Markdown>
  );
}

export default MarkdownRender;
