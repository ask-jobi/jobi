"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type {
  ResumeData,
  SortableSectionKey,
  ResumeSection
} from "@/types/resume"
import { ResumeSectionActionButtonGroup } from "@/components/resume-templates/resume-section-action-button-group"
import { ResumeSectionDragHandle } from "@/components/resume-templates/resume-section-drag-handle"
import { ResumeSectionReorderControls } from "@/components/resume-templates/resume-section-reorder-controls"
import { useIsMobile } from "@/lib/hooks/use-mobile"
import { useIsResumeAiActionActive } from "@/lib/store/chat"
import { cn } from "@/lib/utils"

type ExtractEntry<ID extends SortableSectionKey> = (NonNullable<
  ResumeData[ID]
> extends ResumeSection<infer Entry>
  ? Entry
  : never) & { entryId: string }

interface SectionEntriesProps<ID extends SortableSectionKey> {
  sectionId: ID
  section?: ResumeData[ID] | null
  sectionTitle: string
  isInteractive?: boolean
  onEntryAdd?: (id: ID, index: number) => void
  onEntryDelete?: (id: ID, index: number) => void
  onEntryClick?: (id: ID, index?: number) => void
  onEntryReorder?: (
    id: ID,
    fromIndex: number,
    toIndex: number
  ) => void | Promise<boolean>
  onSectionMoveUp?: (id: ID) => void | Promise<boolean>
  onSectionMoveDown?: (id: ID) => void | Promise<boolean>
  canMoveSectionUp?: boolean
  canMoveSectionDown?: boolean

  headRender: (entry: ExtractEntry<ID>, index: number) => React.ReactNode
  entryRender: (entry: ExtractEntry<ID>, index: number) => React.ReactNode

  sectionClassName?: string
  sectionStyle?: React.CSSProperties
  sectionContainerRender?: (children: React.ReactNode) => React.ReactNode
  titleRender?: (title: string) => React.ReactNode
  dragDisabled?: boolean

  /** 没有 section 时是否隐藏整个区块 */
  hideIfEmpty?: boolean
  /** 没有 section 时的占位 UI（比如“暂无工作经历”） */
  emptyFallback?: React.ReactNode
}

interface SortableSectionEntryProps<ID extends SortableSectionKey> {
  entry: ExtractEntry<ID>
  index: number
  isInteractive?: boolean
  isDraggable: boolean
  onEntryAdd?: (id: ID, index: number) => void
  onEntryDelete?: (id: ID, index: number) => void
  onEntryClick?: (id: ID, index?: number) => void
  sectionId: ID
  headRender: (entry: ExtractEntry<ID>, index: number) => React.ReactNode
  entryRender: (entry: ExtractEntry<ID>, index: number) => React.ReactNode
}

function SortableSectionEntry<ID extends SortableSectionKey>({
  entry,
  index,
  isInteractive,
  isDraggable,
  onEntryAdd,
  onEntryDelete,
  onEntryClick,
  sectionId,
  headRender,
  entryRender
}: SortableSectionEntryProps<ID>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: entry.entryId,
    disabled: !isDraggable
  })

  return (
    <div
      ref={setNodeRef}
      data-testid={`resume-entry-${entry.entryId}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition
      }}
      className={cn(isDragging && "z-10")}
    >
      <ResumeSectionActionButtonGroup
        key={entry.entryId}
        id={`section-${sectionId}-${index}`}
        className={cn(
          "mb-4 rounded-lg p-2 transition-colors",
          isInteractive && "hover:bg-muted/40 focus-within:bg-muted/40",
          isDragging && "bg-background opacity-90 shadow-lg"
        )}
        actionClassName="top-full right-0 mt-2"
        dragHandle={
          isDraggable ? (
            <ResumeSectionDragHandle
              attributes={attributes}
              listeners={listeners}
            />
          ) : undefined
        }
        isInteractive={isInteractive}
        onAdd={onEntryAdd ? () => onEntryAdd(sectionId, index) : undefined}
        onDelete={
          onEntryDelete ? () => onEntryDelete(sectionId, index) : undefined
        }
        onEdit={onEntryClick ? () => onEntryClick(sectionId, index) : undefined}
      >
        <div id={`${sectionId}-${index}-head`}>
          {headRender(entry as ExtractEntry<ID>, index)}
        </div>
        {entryRender(entry as ExtractEntry<ID>, index)}
      </ResumeSectionActionButtonGroup>
    </div>
  )
}

export function SectionEntries<ID extends SortableSectionKey>({
  sectionId,
  section,
  sectionTitle,
  isInteractive,
  onEntryAdd,
  onEntryDelete,
  onEntryClick,
  onEntryReorder,
  onSectionMoveUp,
  onSectionMoveDown,
  canMoveSectionUp = false,
  canMoveSectionDown = false,
  headRender,
  entryRender,
  sectionClassName = "",
  sectionStyle,
  sectionContainerRender,
  titleRender,
  dragDisabled = false,
  hideIfEmpty = true,
  emptyFallback
}: SectionEntriesProps<ID>) {
  const isMobile = useIsMobile()
  const isResumeAiActionActive = useIsResumeAiActionActive()
  const entries = useMemo(
    () => (section?.entries ?? []) as unknown as Array<ExtractEntry<ID>>,
    [section]
  )
  const persistedEntryIds = useMemo(
    () => entries.map((entry) => entry.entryId),
    [entries]
  )
  const persistedEntryIdsKey = persistedEntryIds.join("::")
  const [orderedEntryIds, setOrderedEntryIds] = useState(persistedEntryIds)
  const orderedEntryIdsRef = useRef(orderedEntryIds)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4
      }
    })
  )

  useEffect(() => {
    orderedEntryIdsRef.current = persistedEntryIds
    setOrderedEntryIds(persistedEntryIds)
  }, [persistedEntryIds, persistedEntryIdsKey])

  if (!section || section.entries.length === 0) {
    if (hideIfEmpty) return null
    return emptyFallback ? (
      <div className="mb-5 p-2 text-sm text-gray-400">{emptyFallback}</div>
    ) : null
  }

  const canReorderSection =
    !!isInteractive &&
    !!onEntryReorder &&
    !dragDisabled &&
    !isMobile &&
    !isResumeAiActionActive &&
    entries.length > 1 &&
    persistedEntryIds.every((entryId) => typeof entryId === "string" && entryId)

  const entriesById = new Map(
    entries.map((entry) => [entry.entryId, entry] as const)
  )
  const orderedEntries = canReorderSection
    ? orderedEntryIds
        .map((entryId) => entriesById.get(entryId))
        .filter((entry): entry is ExtractEntry<ID> => Boolean(entry))
    : entries
  const visibleEntries =
    orderedEntries.length === entries.length ? orderedEntries : entries

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || active.id === over.id) {
      return
    }

    setOrderedEntryIds((currentIds) => {
      const fromIndex = currentIds.indexOf(String(active.id))
      const toIndex = currentIds.indexOf(String(over.id))

      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        return currentIds
      }

      const nextIds = arrayMove(currentIds, fromIndex, toIndex)
      orderedEntryIdsRef.current = nextIds
      return nextIds
    })
  }

  const resetOrderPreview = () => {
    orderedEntryIdsRef.current = persistedEntryIds
    setOrderedEntryIds(persistedEntryIds)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) {
      resetOrderPreview()
      return
    }

    const fromIndex = persistedEntryIds.indexOf(String(active.id))
    const toIndex = orderedEntryIdsRef.current.indexOf(String(active.id))

    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
      resetOrderPreview()
      return
    }

    void onEntryReorder?.(sectionId, fromIndex, toIndex)
  }

  const entryList = visibleEntries.map((entry, index) => (
    <SortableSectionEntry
      key={entry.entryId ?? `${sectionId}-${index}`}
      entry={entry}
      index={index}
      isInteractive={isInteractive}
      isDraggable={canReorderSection}
      onEntryAdd={onEntryAdd}
      onEntryDelete={onEntryDelete}
      onEntryClick={onEntryClick}
      sectionId={sectionId}
      headRender={headRender}
      entryRender={entryRender}
    />
  ))

  const sectionMoveDisabled = dragDisabled || isResumeAiActionActive
  const titleNode = titleRender ? (
    titleRender(sectionTitle)
  ) : (
    <h2 className="text-lg font-bold mb-2">{sectionTitle}</h2>
  )

  const content = (
    <div
      id={`section-${sectionId}`}
      className={cn("mb-5 rounded-xl p-3", sectionClassName)}
      style={sectionStyle}
    >
      <ResumeSectionActionButtonGroup
        actionClassName="right-0 top-0"
        className={cn(
          "rounded-lg pr-20 transition-colors",
          isInteractive && "hover:bg-muted/40 focus-within:bg-muted/40"
        )}
        customActions={
          (onSectionMoveUp || onSectionMoveDown) && (
            <ResumeSectionReorderControls
              disableMoveUp={sectionMoveDisabled || !canMoveSectionUp}
              disableMoveDown={sectionMoveDisabled || !canMoveSectionDown}
              onMoveUp={
                onSectionMoveUp
                  ? () => void onSectionMoveUp(sectionId)
                  : undefined
              }
              onMoveDown={
                onSectionMoveDown
                  ? () => void onSectionMoveDown(sectionId)
                  : undefined
              }
            />
          )
        }
        isInteractive={isInteractive}
      >
        {titleNode}
      </ResumeSectionActionButtonGroup>

      {canReorderSection ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragCancel={resetOrderPreview}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
        >
          <SortableContext
            items={orderedEntryIds}
            strategy={verticalListSortingStrategy}
          >
            {entryList}
          </SortableContext>
        </DndContext>
      ) : (
        entryList
      )}
    </div>
  )

  return sectionContainerRender ? sectionContainerRender(content) : content
}
