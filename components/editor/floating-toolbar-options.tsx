import React, {useEffect, useState} from 'react';
import {Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue} from "@/components/ui/select";
import {
  ALargeSmallIcon, BoldIcon, CodeIcon,
  ItalicIcon, ListIcon, ListOrderedIcon, StrikethroughIcon
} from "lucide-react";
import {Toggle} from "@/components/ui/toggle";
import { Editor } from '@tiptap/react'
import Image from "next/image";
import {Button} from "@/components/ui/button";

function FloatingToolbarOptions({
                                  setMode,
                                  editor
                                }: {
  setMode: (state: 'default' | 'ai') => void,
  editor: Editor
}) {

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
    const updateState = () => {
      // text format
      setIsBold(editor.isActive('bold'));
      setIsItalic(editor.isActive('italic'));
      setIsStrikethrough(editor.isActive('strike'));
      setIsCode(editor.isActive('code'));

      // block type
      if (editor.isActive('bulletList')) {
        setBlockType('bullet');
      } else if (editor.isActive('orderedList')) {
        setBlockType('number');
      } else if (editor.isActive('heading', { level: 1 })) {
        setBlockType('h1');
      } else if (editor.isActive('heading', { level: 2 })) {
        setBlockType('h2');
      } else if (editor.isActive('heading', { level: 3 })) {
        setBlockType('h3');
      } else {
        setBlockType('paragraph');
      }
    };

    editor.on('selectionUpdate', updateState);
    editor.on('update', updateState);
    updateState(); // 初始更新

    return () => {
      editor.off('selectionUpdate', updateState);
      editor.off('update', updateState);
    };
  }, [editor]);

  /**
   * 更新选中文本的格式
   */
  const formatText = (type: 'bold' | 'italic' | 'strike' | 'code') => {
    if (type === 'bold') {
      editor.chain().focus().toggleBold().run();
    }
    // else if (type === 'italic') {
    //   editor.chain().focus().toggleItalic().run();
    // } else if (type === 'strike') {
    //   editor.chain().focus().toggleStrike().run();
    // } else if (type === 'code') {
    //   editor.chain().focus().toggleCode().run();
    // }
  };

  /**
   * 设置为段落
   */
  const formatParagraph = () => {
    editor.chain().focus().setParagraph().run();
  };

  /**
   * 设置为无序列表
   */
  const formatUnorderedList = () => {
    editor.chain().focus().toggleBulletList().run();
  };

  /**
   * 设置为有序列表
   */
  const formatOrderedList = () => {
    editor.chain().focus().toggleOrderedList().run();
  };

  const handleBlockTypeChange = (type: string) => {
    setBlockType(type);
    if (type === 'paragraph') {
      formatParagraph();
    }
    if (type === 'bullet') {
      formatUnorderedList();
    }
    if (type === 'number') {
      formatOrderedList();
    }
  };

  const intoAiMode = () => {
    editor.commands.expandSelectionToNodeEdge()
    setMode("ai")
  }

  return (
    <div className="flex items-center px-2 py-1.5 rounded-lg shadow-xl border bg-white pointer-events-auto">
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
          <SelectItem value="bullet" icon={ListIcon}>Bullet List</SelectItem>
          <SelectItem value="number" icon={ListOrderedIcon}>Ordered List</SelectItem>
        </SelectContent>
      </Select>
      <div className="w-px h-5 mx-2 bg-gray-200 rounded"></div>
      <div className="flex gap-x-1">
        <Toggle
          aria-label="Bold"
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
          onPressedChange={() => formatText('strike')}
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
