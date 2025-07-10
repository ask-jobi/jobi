import React, {useEffect, useRef} from 'react';
import {useLexicalComposerContext} from "@lexical/react/LexicalComposerContext";
import {$getNodeByKey, COMMAND_PRIORITY_LOW, createCommand, LexicalCommand, LexicalNode} from "lexical";
import {$generateNodesFromMarkdown, $replaceNodes} from "@/components/blocks/editor-00/utils";

export const REJECT_DIFF_COMMAND: LexicalCommand<null> = createCommand();
export const APPLY_DIFF_COMMAND: LexicalCommand<null> = createCommand();
export const CACHE_DIFF_NODES_COMMAND: LexicalCommand<CacheDiffNodes> = createCommand();
export const CLEAR_DIFF_NODES_COMMAND: LexicalCommand<null> = createCommand();

type CacheDiffNodes = {
  beforeMarkdown: string,
  afterMarkdown: string,
  diffNodes: string[]
}

function DiffMdPlugin() {
  const [editor] = useLexicalComposerContext()
  const cacheNodesRef = useRef<CacheDiffNodes | null>(null)

  const cacheDiffNodes = (nodes: CacheDiffNodes) => {
    cacheNodesRef.current = nodes
    return true
  }

  const clearDiffNodes = () => {
    cacheNodesRef.current = null
    return true
  }

  const applyDiff = () => {
    if (!cacheNodesRef.current) {
      console.warn("Apply can only be performed when entering diff mode")
      return false
    }
    const diffedNodes = cacheNodesRef.current.diffNodes.map(it => $getNodeByKey(it)!!)
    const afterNodes = $generateNodesFromMarkdown(cacheNodesRef.current.afterMarkdown)
    $replaceNodes(diffedNodes, afterNodes)
    diffedNodes.map(it => it?.remove())
    return true
  }

  const rejectDiff = () => {
    if (!cacheNodesRef.current) {
      console.warn("Reject can only be performed when entering diff mode")
      return false
    }
    const diffedNodes = cacheNodesRef.current.diffNodes.map(it => $getNodeByKey(it)!!)
    const beforeNodes = $generateNodesFromMarkdown(cacheNodesRef.current.beforeMarkdown)
    $replaceNodes(diffedNodes, beforeNodes)
    diffedNodes.map(it => it?.remove())
    return clearDiffNodes()
  }

  useEffect(() => {
    const unregisterCacheDiffCommand = editor.registerCommand(CACHE_DIFF_NODES_COMMAND, cacheDiffNodes, COMMAND_PRIORITY_LOW)
    const unregisterClearDiffCommand = editor.registerCommand(CLEAR_DIFF_NODES_COMMAND, clearDiffNodes, COMMAND_PRIORITY_LOW)
    const unregisterApplyDiffCommand = editor.registerCommand(APPLY_DIFF_COMMAND, applyDiff, COMMAND_PRIORITY_LOW)
    const unregisterRejectDiffCommand = editor.registerCommand(REJECT_DIFF_COMMAND, rejectDiff, COMMAND_PRIORITY_LOW)

    return () => {
      unregisterCacheDiffCommand()
      unregisterClearDiffCommand()
      unregisterApplyDiffCommand()
      unregisterRejectDiffCommand()
    }
  }, []);

  return (
    <></>
  );
}

export default DiffMdPlugin;
