'use client'

import { type PointerEvent as ReactPointerEvent, useRef, useCallback } from 'react'
import { type Scene, handleElementClick, type SelectionState, SpatialIndex } from '@/domain'

export function useDragManager({
  scene,
  selection,
  editingTextId,
  setSelection,
  setEditingTextId,
}: {
  scene: Scene
  selection: SelectionState
  editingTextId: string | null
  svgRef: React.RefObject<SVGSVGElement | null>
  saveHistory: (description: string, snapshot: Scene) => void
  markSceneEdited: () => void
  setScene: React.Dispatch<React.SetStateAction<Scene>>
  setSelection: React.Dispatch<React.SetStateAction<SelectionState>>
  setEditingTextId: React.Dispatch<React.SetStateAction<string | null>>
  canvasWidth?: number
  canvasHeight?: number
}) {
  const spatialIndexRef = useRef<SpatialIndex>(new SpatialIndex())

  /** Handles click-to-select on an element. Drag/resize is delegated to react-moveable. */
  const handleElementPointerDown = useCallback(
    (elementId: string, event: ReactPointerEvent<SVGGElement>) => {
      const element = scene.elements.find((item) => item.id === elementId)
      if (!element) return

      const isShiftPressed = event.shiftKey
      setSelection(handleElementClick(selection, elementId, isShiftPressed))

      if (editingTextId && editingTextId !== elementId) {
        setEditingTextId(null)
      }
    },
    [scene, selection, editingTextId, setSelection, setEditingTextId],
  )

  return {
    spatialIndexRef,
    handleElementPointerDown,
  }
}
