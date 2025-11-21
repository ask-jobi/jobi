import React from 'react';
import FloatingToolbarOptions from "@/components/blocks/editor-00/plugins/toolbar-plugin/floating-toolbar-options";
import FloatingToolbarAi from "@/components/blocks/editor-00/plugins/toolbar-plugin/floating-toolbar-ai";
import { FocusScope } from '@radix-ui/react-focus-scope';

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
        <FocusScope>
          <FloatingToolbarAi setMode={setMode}/>
        </FocusScope>
      }
    </>
  );
}

export default Toolbar;
