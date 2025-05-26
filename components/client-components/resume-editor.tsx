"use client"

import {ResumeData} from "@/types/resume";
import {useForm} from "react-hook-form";
import {Input} from "../ui/input";
import {useDebouncedCallback} from "use-debounce";
import {toast} from "sonner";
import {CollapsibleCard} from "../ui/collapsible-card";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {useState} from "react";
import {restrictToVerticalAxis} from "@dnd-kit/modifiers";

interface ResumeEditorProps {
  initialData: ResumeData;
}

export default function ResumeEditor({initialData}: ResumeEditorProps) {
  const form = useForm<ResumeData>({
    defaultValues: initialData,
  });

  const [sections, setSections] = useState([
    { id: "education", title: form.watch("educationHistory.title") },
    { id: "employment", title: form.watch("employmentHistory.title") },
    { id: "skills", title: "Skills" },
  ]);

  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const {active, over} = event;
    
    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
    setActiveId(null);
  };

  const handleChange = async () => {
    try {
      // await onSave(form.getValues());
      toast.success("Auto saved");
    } catch (error) {
      console.error("Auto save failed:", error);
      toast.error("Auto save failed");
    }
  }
  const dubouncedChange = useDebouncedCallback(handleChange, 3000);

  return (
    <form className="space-y-6" onChange={dubouncedChange}>
      <CollapsibleCard 
        title="Personal Information"
        id="personal"
        draggable={false}
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">First Name</label>
            <Input
              {...form.register("personalInfo.firstName")}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Last Name</label>
            <Input
              {...form.register("personalInfo.lastName")}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              {...form.register("personalInfo.email")}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone</label>
            <Input
              {...form.register("personalInfo.phone")}
            />
          </div>
        </div>
      </CollapsibleCard>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext
          items={sections.map(section => section.id)}
          strategy={verticalListSortingStrategy}
        >
          {sections.map((section) => {
            if (section.id === "education") {
              return (
                <CollapsibleCard
                  key={section.id}
                  id={section.id}
                  title={section.title}
                  draggable={true}
                >
                  {form.watch("educationHistory.blocks").map((block, blockIndex) => (
                    <div key={blockIndex} className="space-y-4 p-4 border rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">School</label>
                          <Input
                            {...form.register(`educationHistory.blocks.${blockIndex}.school`)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Degree</label>
                          <Input
                            {...form.register(`educationHistory.blocks.${blockIndex}.degree`)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Start Date</label>
                          <Input
                            {...form.register(`educationHistory.blocks.${blockIndex}.start`)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">End Date</label>
                          <Input
                            {...form.register(`educationHistory.blocks.${blockIndex}.end`)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Content</label>
                        <Input
                          {...form.register(`educationHistory.blocks.${blockIndex}.content`)}
                        />
                      </div>
                    </div>
                  ))}
                </CollapsibleCard>
              );
            }
            
            if (section.id === "employment") {
              return (
                <CollapsibleCard
                  key={section.id}
                  id={section.id}
                  title={section.title}
                  draggable={true}
                >
                  {form.watch("employmentHistory.blocks").map((block, blockIndex) => (
                    <div key={blockIndex} className="space-y-4 p-4 border rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Company</label>
                          <Input
                            {...form.register(`employmentHistory.blocks.${blockIndex}.company`)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Position</label>
                          <Input
                            {...form.register(`employmentHistory.blocks.${blockIndex}.position`)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Start Date</label>
                          <Input
                            {...form.register(`employmentHistory.blocks.${blockIndex}.start`)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">End Date</label>
                          <Input
                            {...form.register(`employmentHistory.blocks.${blockIndex}.end`)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Content</label>
                        <Input
                          {...form.register(`employmentHistory.blocks.${blockIndex}.content`)}
                        />
                      </div>
                    </div>
                  ))}
                </CollapsibleCard>
              );
            }
            
            if (section.id === "skills") {
              return (
                <CollapsibleCard
                  key={section.id}
                  id={section.id}
                  title={section.title}
                  draggable={true}
                >
                  {form.watch("skills").map((skill, skillIndex) => (
                    <div key={skillIndex} className="space-y-4 p-4 border rounded-lg">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Group</label>
                        <Input
                          {...form.register(`skills.${skillIndex}.group`)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Content</label>
                        <Input
                          {...form.register(`skills.${skillIndex}.content`)}
                        />
                      </div>
                    </div>
                  ))}
                </CollapsibleCard>
              );
            }
            
            return null;
          })}
        </SortableContext>
        <DragOverlay>
          {activeId ? (
            <CollapsibleCard
              id={activeId}
              title={sections.find(section => section.id === activeId)?.title || ""}
              draggable={true}
            >
              <div className="h-32" />
            </CollapsibleCard>
          ) : null}
        </DragOverlay>
      </DndContext>
    </form>
  );
} 