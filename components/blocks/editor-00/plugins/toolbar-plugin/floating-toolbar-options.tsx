import React, {useEffect, useState} from 'react';
import {Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue} from "@/components/ui/select";
import {
  ALargeSmallIcon, BoldIcon, CodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  Heading5Icon,
  Heading6Icon, ItalicIcon, ListIcon, ListOrderedIcon, StrikethroughIcon
} from "lucide-react";
import {Toggle} from "@/components/ui/toggle";
import {useLexicalComposerContext} from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  FORMAT_TEXT_COMMAND,
  LexicalNode,
  TextFormatType
} from "lexical";
import {$findMatchingParent} from "@lexical/utils";
import {$isListNode, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND} from "@lexical/list";
import {$createHeadingNode, $createQuoteNode, $isHeadingNode, HeadingTagType} from "@lexical/rich-text";
import {$setBlocksType} from "@lexical/selection";
import Image from "next/image";
import {Button} from "@/components/ui/button";

function FloatingToolbarOptions({
                                  setMode
                                }: {
  setMode: (state: 'default' | 'ai' | 'closed') => void
}) {
  const [editor] = useLexicalComposerContext();

  /**
   * 当前选中文本的格式，如 bold、italic 等
   */
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);

  /**
   * 当前选中文本的类型，如 h1、h2、p、blockquote 等
   */
  const [blockType, setBlockType] = useState('paragraph');

  /**
   * 注册一个编辑器状态更新的回调函数，在回调函数内读取选中文本的状态
   */
  useEffect(() => {
    const unregister = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return;
        }

        // text format
        setIsBold(selection.hasFormat('bold'));
        setIsItalic(selection.hasFormat('italic'));
        setIsStrikethrough(selection.hasFormat('strikethrough'));
        setIsCode(selection.hasFormat('code'));

        // block type
        const anchorNode = selection.anchor.getNode();
        let element =
          anchorNode.getKey() === 'root'
            ? anchorNode
            : $findMatchingParent(anchorNode, (node: LexicalNode) => {
              const parent = node.getParent();
              return parent !== null && $isRootOrShadowRoot(parent);
            });
        if (element === null) {
          element = anchorNode.getTopLevelElementOrThrow();
        }

        if ($isListNode(element)) {
          setBlockType(element.getListType());
        } else if ($isHeadingNode(element)) {
          setBlockType(element.getTag());
        } else {
          setBlockType(element.getType());
        }
      });
    });

    return unregister;
  }, [editor]);

  /**
   * 更新选中文本的格式
   */
  const formatText = (type: TextFormatType) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, type);
  };

  /**
   * 设置为段落
   */
  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  };

  /**
   * 设置为标题
   */
  const formatHeading = (headingSize: HeadingTagType) => {
    editor.update(() => {
      const selection = $getSelection();
      $setBlocksType(selection, () => $createHeadingNode(headingSize));
    });
  };

  /**
   * 设置为引用
   */
  const formatQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      $setBlocksType(selection, () => $createQuoteNode());
    });
  };

  /**
   * 设置为无序列表
   */
  const formatUnorderedList = () => {
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
  };

  /**
   * 设置为有序列表
   */
  const formatOrderedList = () => {
    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
  };

  const handleBlockTypeChange = (type: string) => {
    setBlockType(type);
    if (type === 'paragraph') {
      formatParagraph();
    }
    if (
      type === 'h1' ||
      type === 'h2' ||
      type === 'h3' ||
      type === 'h4' ||
      type === 'h5' ||
      type === 'h6'
    ) {
      formatHeading(type);
    }
    if (type === 'quote') {
      formatQuote();
    }
    if (type === 'bullet') {
      formatUnorderedList();
    }
    if (type === 'number') {
      formatOrderedList();
    }
  };

  const intoAiMode = () => {
    setMode('ai')
    console.log("switch ai mode")
  }

  return (
    <div className="flex items-center px-2 py-1.5 rounded-lg shadow-xl border bg-white">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={intoAiMode}
      >
        <Image src="/gemini-color.svg" alt="Gemini" width={16} height={16} />
      </Button>
      <div className="w-px h-5 mx-2 bg-gray-200 rounded"></div>
      <Select value={blockType} onValueChange={handleBlockTypeChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder=""/>
        </SelectTrigger>
        <SelectContent className="shadow-xl z-102">
          <SelectItem value="paragraph" icon={ALargeSmallIcon}>Normal</SelectItem>
          <SelectSeparator/>
          <SelectItem value="h1" icon={Heading1Icon}>Heading 1</SelectItem>
          <SelectItem value="h2" icon={Heading2Icon}>Heading 2</SelectItem>
          <SelectItem value="h3" icon={Heading3Icon}>Heading 3</SelectItem>
          <SelectItem value="h4" icon={Heading4Icon}>Heading 4</SelectItem>
          <SelectItem value="h5" icon={Heading5Icon}>Heading 5</SelectItem>
          <SelectItem value="h6" icon={Heading6Icon}>Heading 6</SelectItem>
          <SelectSeparator/>
          <SelectItem value="bullet" icon={ListIcon}>Bullet List</SelectItem>
          <SelectItem value="number" icon={ListOrderedIcon}>Ordered List</SelectItem>
        </SelectContent>
      </Select>
      <div className="w-px h-5 mx-2 bg-gray-200 rounded"></div>
      <div className="flex gap-x-1">
        <Toggle
          aria-label="Blod"
          pressed={isBold}
          onPressedChange={() => formatText('bold')}
        >
          <BoldIcon/>
        </Toggle>
        <Toggle
          aria-label="Italic"
          pressed={isItalic}
          onPressedChange={() => formatText('italic')}
        >
          <ItalicIcon/>
        </Toggle>
        <Toggle
          aria-label="Strikethrough"
          pressed={isStrikethrough}
          onPressedChange={() => formatText('strikethrough')}
        >
          <StrikethroughIcon/>
        </Toggle>
        <Toggle
          aria-label="Code"
          pressed={isCode}
          onPressedChange={() => formatText('code')}
        >
          <CodeIcon/>
        </Toggle>
      </div>
    </div>
  );
}

export default FloatingToolbarOptions;
