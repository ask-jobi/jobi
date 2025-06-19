import React, {useEffect} from 'react';
import {useTour} from "@/components/tour";
import {AISuggestion} from "@/types/resume";
import {Button} from "@/components/ui/button";
import {diffWords} from "diff";
import {UseFormGetValues, UseFormSetValue} from "react-hook-form";
import {ResumeData} from "@/types/resume";
import {useSetAtom} from "jotai";
import {appendPatchHistoryAtom, undoPatchAtom} from "@/lib/store/suggestion-patch-history";
import { ChevronLeft, ChevronRight } from 'lucide-react';

function SuggestionPatch({
  section,
  getValues,
  setValue
                           }: {
  section: AISuggestion,
  getValues: UseFormGetValues<ResumeData>,
  setValue: UseFormSetValue<ResumeData>
}) {
  const { currentStep, gotoStep, previousStep, nextStep, removeStep, insertStep, steps } = useTour();
  const appendPatchHistory = useSetAtom(appendPatchHistoryAtom);
  const undoPatch = useSetAtom(undoPatchAtom);
  const words = diffWords(section.originalContent, section.optimizedContent ?? "")

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        undoPatch((history) => {
          const {action, suggestion, step, stepIndex} = history
          if (action === 'apply') {
            setValue(
              `${suggestion.section}.blocks.${suggestion.blockIndex}.content` as any,
              suggestion.originalContent
            );
          }

          insertStep(step, stepIndex)
          gotoStep(stepIndex)
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setValue, undoPatch]);

  const handleApplyPatch = () => {
    const formData = getValues();
    const block = formData[section.section].blocks[section.blockIndex];

    if (block) {
      appendPatchHistory({
        suggestion: section,
        step: steps[currentStep],
        stepIndex: currentStep,
        action: 'apply'
      });

      setValue(`${section.section}.blocks.${section.blockIndex}.content`, section.optimizedContent ?? "", {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true
      });
    }

    removeStep();
  }

  const handleRejectPatch = () => {
    appendPatchHistory({
      suggestion: section,
      step: steps[currentStep],
      stepIndex: currentStep,
      action: 'reject'
    });

    removeStep();
  }

  return (
    <div>
      <div>
        <section className="mb-2">
          {section.reason}
        </section>
        <section>
          {words.map((it, index) => {
            if (it.added) {
              return <span key={index} className="bg-green-200">{it.value}</span>
            } else if (it.removed) {
              return <span key={index} className="bg-red-200">{it.value}</span>
            } else {
              return <span key={index}>{it.value}</span>
            }
          })}
        </section>
      </div>
      <div className="mt-4 flex justify-between">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-emerald-500 hover:text-emerald-700"
            onClick={handleApplyPatch}
          >
            Apply
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-500 hover:text-red-700"
            onClick={handleRejectPatch}
          >
            Reject
          </Button>
        </div>
      	<div className="flex gap-2">
          {currentStep > 0 && (
            <Button
              size="sm"
              onClick={previousStep}
              disabled={currentStep === 0}
              variant="ghost"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          { currentStep < steps.length - 1 &&
            <Button
              size="sm"
              onClick={nextStep}
              variant="ghost"
              aria-label={"Next"}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          }
        </div>
      </div>
    </div>
  );
}

export default SuggestionPatch;
