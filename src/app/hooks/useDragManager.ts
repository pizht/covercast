'use client'

import { type PointerEvent as ReactPointerEvent, useRef, useState, useCallback } from 'react'
import {
  handleElementClick,
  isSelected,
  type SelectionState,
  type GuideLine,
  type MeasurementGuide,
  SpatialIndex,
} from '@/domain'

export function useDragManager({
  selection,
  editingTextId,
  setSelection,
  setEditingTextId,
}: {
  selection: SelectionState
  editingTextId: string | null
  setSelection: React.Dispatch<React.SetStateAction<SelectionState>>
  setEditingTextId: React.Dispatch<React.SetStateAction<string | null>>
}) {
  const [guides, setGuides] = useState<GuideLine[]>([])
  const [spacingGuides, setSpacingGuides] = useState<MeasurementGuide[]>([])
  const spatialIndexRef = useRef<SpatialIndex>(new SpatialIndex())

  const handleElementPointerDown = useCallback(
    (elementId: string, event: ReactPointerEvent<SVGGElement>) => {
      const isShiftPressed = event.shiftKey
      const wasSelected = isSelected(selection, elementId)

      if (wasSelected && !isShiftPressed) {
        return
      }

      setSelection(handleElementClick(selection, elementId, isShiftPressed))
      if (editingTextId && editingTextId !== elementId) {
        setEditingTextId(null)
      }
    },
    [selection, editingTextId, setSelection, setEditingTextId],
  )

  return {
    guides,
    spacingGuides,
    spatialIndexRef,
    setGuides,
    setSpacingGuides,
    handleElementPointerDown,
  }
}
