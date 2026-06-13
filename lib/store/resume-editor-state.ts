/**
 * Resume Editor State Module — Jotai atoms
 *
 * Owns all atoms that track the current editor selection state:
 *  - which section/entry is selected
 *
 * These atoms replace the inline definitions previously scattered in
 * {@link lib/store/resume.ts}. The Editor State hook
 * ({@link useResumeEditorState}) wraps them for consumers.
 */

import { atom } from "jotai"
import type { ResumeSectionKey } from "@/types/resume"
import { applicationResumeDataAtom } from "./resume"

// ─── Primitive selection atoms ────────────────────────────────────────────────

export const selectedSectionIdAtom = atom<ResumeSectionKey | null>(null)
export const selectedEntryIdAtom = atom<string | null>(null)
const selectedEntryIndexStateAtom = atom<number | null>(null)

// ─── Derived selection index ──────────────────────────────────────────────────

/**
 * Computed entry index.
 * When explicitly set (via write), stores directly.
 * When NOT explicitly set, resolves from selectedSectionId + selectedEntryId
 * by looking up the entry in the current resume data.
 */
export const selectedEntryIndexAtom = atom(
  (get) => {
    const explicitIndex = get(selectedEntryIndexStateAtom)

    if (explicitIndex !== null) {
      return explicitIndex
    }

    const sectionId = get(selectedSectionIdAtom)
    const entryId = get(selectedEntryIdAtom)
    const resumeData = get(applicationResumeDataAtom)

    if (!sectionId || !entryId || !resumeData) {
      return null
    }

    const section = resumeData[sectionId]

    if (!section || !("entries" in section)) {
      return null
    }

    const entryIndex = section.entries.findIndex(
      (entry: { entryId: string }) => entry.entryId === entryId
    )

    return entryIndex >= 0 ? entryIndex : null
  },
  (_get, set, index: number | null) => {
    set(selectedEntryIndexStateAtom, index)
  }
)

// ─── Selection actions ────────────────────────────────────────────────────────

/** Clear all editor selection state at once */
export const clearEditorSelectionAtom = atom(null, (_get, set) => {
  set(selectedSectionIdAtom, null)
  set(selectedEntryIdAtom, null)
  set(selectedEntryIndexAtom, null)
})

/**
 * Focus (select) a section and optionally an entry within it.
 *
 * This atom is PURE state management — no DOM side effects.
 * Scrolling is a separate UI adapter concern (see useEntryEditWorkflow).
 */
export const focusSectionAtom = atom(
  null,
  (
    get,
    set,
    id: ResumeSectionKey,
    entryIndex?: number,
    entryId?: string | null
  ) => {
    const resumeData = get(applicationResumeDataAtom)
    set(selectedSectionIdAtom, id)
    set(
      selectedEntryIndexAtom,
      typeof entryIndex === "number" ? entryIndex : null
    )
    if (typeof entryIndex === "number" && resumeData) {
      const section = resumeData[id]
      if (section && "entries" in section) {
        set(
          selectedEntryIdAtom,
          entryId ?? section.entries[entryIndex]?.entryId ?? null
        )
      } else {
        set(selectedEntryIdAtom, entryId ?? null)
      }
    } else {
      set(selectedEntryIdAtom, null)
    }
  }
)
