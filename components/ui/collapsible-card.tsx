import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Input } from "./input";
import Image from "next/image";
import { Button } from "./button";

interface CollapsibleCardProps {
  title: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  className?: string;
  id: string;
  onCollapseChange?: (collapsed: boolean) => void;
  onTitleChange?: (newTitle: string) => void;
  onAssistantAction?: () => void;
}

export function CollapsibleCard({
  title,
  children,
  defaultCollapsed = false,
  className,
  id,
  onCollapseChange,
  onTitleChange,
  onAssistantAction,
}: CollapsibleCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onCollapseChange?.(newCollapsed);
  };

  const handleTitleClick = () => {
    if (!isEditing) {
      setIsEditing(true);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedTitle(e.target.value);
  };

  const handleTitleBlur = () => {
    setIsEditing(false);
    if (editedTitle !== title) {
      onTitleChange?.(editedTitle || "Untitled");
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setIsEditing(false);
      if (editedTitle !== title) {
        onTitleChange?.(editedTitle || "Untitled");
      }
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditedTitle(title);
    }
  };

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className={cn("transition-all group", className)}
    >
      <CardHeader className="flex items-center gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex items-center justify-between flex-1">
          {isEditing ? (
            <Input
              value={editedTitle}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              className="h-8 text-lg font-semibold"
              autoFocus
              placeholder="Enter title..."
            />
          ) : (
            <CardTitle 
              className={cn(
                "text-lg font-semibold min-w-[100px] cursor-text hover:text-primary/80",
                !title && "text-muted-foreground italic"
              )}
              onClick={handleTitleClick}
            >
              {title || "Untitled"}
            </CardTitle>
          )}
          <div className="flex items-center gap-2">
            {onAssistantAction && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onAssistantAction}
                className="opacity-0 group-hover:opacity-100"
              >
                <Image
                  src="/gemini-color.svg"
                  alt="Assistant"
                  width={20}
                  height={20}
                />
              </Button>
            )}
            <div className="cursor-pointer" onClick={handleCollapse}>
              {isCollapsed ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      {!isCollapsed && <CardContent>{children}</CardContent>}
    </Card>
  );
}
