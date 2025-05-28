"use client"

import {ResumeData} from "@/types/resume";
import {useForm, useFieldArray} from "react-hook-form";
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
import {useEffect, useState, useCallback} from "react";
import {restrictToVerticalAxis} from "@dnd-kit/modifiers";
import {useSidebar} from "@/components/ui/sidebar";
import {Textarea} from "@/components/ui/textarea";
import {Button} from "@/components/ui/button";
import {Plus} from "lucide-react";
import {saveResumeChange} from "@/server/resume";

interface EducationFormProps {
  control: any;
  register: any;
}

function EducationForm({ control, register }: EducationFormProps) {
  const { fields, append } = useFieldArray({
    control,
    name: "educationHistory.blocks",
  });

  const handleAddBlock = useCallback(() => {
    append({
      school: "",
      degree: "",
      start: "",
      end: "",
      content: "",
    });
  }, [append]);

  return (
    <>
      {fields.map((field, blockIndex) => (
        <div key={field.id} className="space-y-4 p-4 border rounded-lg mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">School</label>
              <Input
                {...register(`educationHistory.blocks.${blockIndex}.school`)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Degree</label>
              <Input
                {...register(`educationHistory.blocks.${blockIndex}.degree`)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                {...register(`educationHistory.blocks.${blockIndex}.start`)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input
                {...register(`educationHistory.blocks.${blockIndex}.end`)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Content</label>
            <Textarea
              {...register(`educationHistory.blocks.${blockIndex}.content`)}
            />
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        className="w-full mt-4"
        onClick={handleAddBlock}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Education
      </Button>
    </>
  );
}

interface EmploymentFormProps {
  control: any;
  register: any;
}

function EmploymentForm({ control, register }: EmploymentFormProps) {
  const { fields, append } = useFieldArray({
    control,
    name: "employmentHistory.blocks",
  });

  const handleAddBlock = useCallback(() => {
    append({
      company: "",
      jobTitle: "",
      start: "",
      end: "",
      content: "",
    });
  }, [append]);

  return (
    <>
      {fields.map((field, blockIndex) => (
        <div key={field.id} className="space-y-4 p-4 border rounded-lg mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Company</label>
              <Input
                {...register(`employmentHistory.blocks.${blockIndex}.company`)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Job Title</label>
              <Input
                {...register(`employmentHistory.blocks.${blockIndex}.jobTitle`)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                {...register(`employmentHistory.blocks.${blockIndex}.start`)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input
                {...register(`employmentHistory.blocks.${blockIndex}.end`)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Content</label>
            <Textarea
              {...register(`employmentHistory.blocks.${blockIndex}.content`)}
            />
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        className="w-full mt-4"
        onClick={handleAddBlock}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Experience
      </Button>
    </>
  );
}

interface SkillsFormProps {
  control: any;
  register: any;
}

function SkillsForm({ control, register }: SkillsFormProps) {
  const { fields, append } = useFieldArray({
    control,
    name: "skills",
  });

  const handleAddBlock = useCallback(() => {

    append({
      group: "",
      content: [""],
    });
  }, [append]);

  return (
    <>
      {fields.map((field, skillIndex) => (
        <div key={field.id} className="space-y-4 p-4 border rounded-lg mb-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Group</label>
            <Input
              {...register(`skills.${skillIndex}.group`)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Content</label>
            <Input
              {...register(`skills.${skillIndex}.content`)}
            />
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        className="w-full mt-4"
        onClick={handleAddBlock}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Skill Group
      </Button>
    </>
  );
}

interface ResumeEditorProps {
  initialData: ResumeData
  resumeId: string
}

export default function ResumeEditor({initialData, resumeId}: ResumeEditorProps) {
  const sidebar = useSidebar()
  const form = useForm<ResumeData>({
    defaultValues: initialData,
  });

  const [sections, setSections] = useState([
    { id: "education", title: form.watch("educationHistory.title") },
    { id: "employment", title: form.watch("employmentHistory.title") },
    { id: "skills", title: "Skills" },
  ]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [collapsedStates, setCollapsedStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    sidebar.setOpen(false)
  }, []);

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
      await saveResumeChange(resumeId, form.getValues());
      toast.success("Auto saved");
    } catch (error) {
      console.error("Auto save failed:", error);
      toast.error("Auto save failed");
    }
  };
  const dubouncedChange = useDebouncedCallback(handleChange, 3000);

  const handleTitleChange = (sectionId: string, newTitle: string) => {
    if (sectionId === "education") {
      form.setValue("educationHistory.title", newTitle);
    } else if (sectionId === "employment") {
      form.setValue("employmentHistory.title", newTitle);
    }
    setSections(prev => prev.map(section =>
      section.id === sectionId ? { ...section, title: newTitle } : section
    ));
  };

  const renderCardContent = (sectionId: string) => {
    if (sectionId === "education") {
      return <EducationForm control={form.control} register={form.register} />;
    }

    if (sectionId === "employment") {
      return <EmploymentForm control={form.control} register={form.register} />;
    }

    if (sectionId === "skills") {
      return <SkillsForm control={form.control} register={form.register} />;
    }

    return null;
  };

  return (
    <form className="space-y-6" onChange={dubouncedChange}>
      <CollapsibleCard
        title="Personal Information"
        id="personal"
        draggable={false}
        editable={false}
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
        id="resume-editor-dnd"
      >
        <SortableContext
          items={sections.map(section => section.id)}
          strategy={verticalListSortingStrategy}
        >
          {sections.map((section) => (
            <CollapsibleCard
              key={section.id}
              id={section.id}
              title={section.title}
              draggable={true}
              defaultCollapsed={collapsedStates[section.id]}
              onCollapseChange={(collapsed) => {
                setCollapsedStates(prev => ({
                  ...prev,
                  [section.id]: collapsed
                }));
              }}
              onTitleChange={(newTitle) => handleTitleChange(section.id, newTitle)}
              editable={true}
            >
              {renderCardContent(section.id)}
            </CollapsibleCard>
          ))}
        </SortableContext>
        <DragOverlay>
          {activeId ? (
            <CollapsibleCard
              id={activeId}
              title={sections.find(section => section.id === activeId)?.title || ""}
              draggable={true}
              defaultCollapsed={collapsedStates[activeId]}
              editable={true}
            >
              {renderCardContent(activeId)}
            </CollapsibleCard>
          ) : null}
        </DragOverlay>
      </DndContext>
    </form>
  );
}
