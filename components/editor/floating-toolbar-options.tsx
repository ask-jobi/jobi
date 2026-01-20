import React, {useEffect, useState} from 'react';
import {Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue} from "@/components/ui/select";
import {
  ALargeSmallIcon, BoldIcon, ListIcon, ListOrderedIcon
} from "lucide-react";
import {Toggle} from "@/components/ui/toggle";
import { Editor } from '@tiptap/react'
import Image from "next/image";
import {Button} from "@/components/ui/button";

function FloatingToolbarOptions({
                                  editor
                                }: {
  editor: Editor
}) {
  const [open, setOpen] = useState<boolean>(false)
  const [isBold, setIsBold] = useState(false);
  const [blockType, setBlockType] = useState('paragraph');

  /**
   * 注册一个编辑器状态更新的回调函数，在回调函数内读取选中文本的状态
   */
  useEffect(() => {
    const updateState = () => {
      // text format
      setIsBold(editor.isActive('bold'));

      // block type
      if (editor.isActive('bulletList')) {
        setBlockType('bullet');
      } else if (editor.isActive('orderedList')) {
        setBlockType('number');
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
      editor.chain()
        .focus()
        .toggleBold()
        .run();
    }
  };

  const stopBubbleClose = (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

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
    editor.chain()
      .expandSelectionToNodeEdge()
      .setMode("ai")
      .run()
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
      <Select open={open} onOpenChange={(open) => {
        setOpen(open)
      }} value={blockType} onValueChange={handleBlockTypeChange}>
        <SelectTrigger onPointerDown={(e) => {
          stopBubbleClose(e)
        }} className="w-[180px]">
          <SelectValue placeholder=""/>
        </SelectTrigger>
        <SelectContent onPointerDown={stopBubbleClose} className="shadow-xl z-102">
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
          onPointerDown={stopBubbleClose}
          onPressedChange={() => formatText('bold')}
        >
          <BoldIcon/>
        </Toggle>
      </div>
    </div>
  );
}

export default FloatingToolbarOptions;
