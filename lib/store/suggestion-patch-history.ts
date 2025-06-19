"use client"
import {atom} from "jotai";
import {AISuggestion} from "@/types/resume";
import {TourStep} from "@/components/tour";


type SuggestionPatchHistory = {
  suggestion: AISuggestion
  step: TourStep
  stepIndex: number
  action: 'reject' | 'apply'
}

export const suggestionPatchHistoryAtom = atom<SuggestionPatchHistory[]>([])

export const appendPatchHistoryAtom = atom(
  null,
  (get, set, history: SuggestionPatchHistory) => {
    const currentHistory = get(suggestionPatchHistoryAtom);
    set(suggestionPatchHistoryAtom, [...currentHistory, history]);
  }
)

export const undoPatchAtom = atom(
  null,
  (get, set, undo: (history: SuggestionPatchHistory) => void) => {
    const history = get(suggestionPatchHistoryAtom);
    if (history.length === 0) return;

    const lastPatch = history[history.length - 1];
    undo(lastPatch)

    set(suggestionPatchHistoryAtom, history.slice(0, -1));
  }
)


