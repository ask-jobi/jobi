import React from 'react';
import FloatingToolbarOptions from "@/components/blocks/editor-00/plugins/toolbar-plugin/floating-toolbar-options";
import FloatingToolbarAi from "@/components/blocks/editor-00/plugins/toolbar-plugin/floating-toolbar-ai";

function Toolbar({
                   setMode,
                   mode
                 }: {
  mode: 'default' | 'ai' | 'closed',
  setMode: (state: 'default' | 'ai' | 'closed') => void
}) {


  return (
    <>
      {
        mode === 'default' &&
        <FloatingToolbarOptions
          setMode={setMode}
        />
      }
      {
        mode === 'ai' &&
        <FloatingToolbarAi setMode={setMode}/>
      }
    </>
  );
}

export default Toolbar;
