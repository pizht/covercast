'use client'

import { type PointerEvent as ReactPointerEvent, useRef, useState, useCallback } from 'react'
import {
  type Scene,
  handleElementClick,
  type SelectionState,
  type GuideLine,
  type MeasurementGuide,
  type ResizeLabel,
  SpatialIndex,
} from '@/domain'

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
  const [guides, setGuides] = useState<GuideLine[]>([])
  const [spacingGuides, setSpacingGuides] = useState<MeasurementGuide[]>([])
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

  /** No-op – resize is handled by react-moveable's resizable. */
  const handleResizePointerDown = useCallback(
    (_elementId: string, _event: ReactPointerEvent<SVGRectElement>) => {},
    [],
  )

  /** No-op – group resize is handled by react-moveable's resizable. */
  const handleGroupResizePointerDown = useCallback(
    (_handle: string, _event: ReactPointerEvent<SVGRectElement>) => {},
    [],
  )

  /** No-op – group drag is handled by react-moveable's draggable. */
  const handleGroupDragPointerDown = useCallback(
    (_event: ReactPointerEvent<SVGRectElement>) => {},
    [],
  )

  return {
    drag: null as null,
    guides,
    spacingGuides,
    resizeLabel: null as ResizeLabel | null,
    spatialIndexRef,
    setGuides,
    setSpacingGuides,
    handleElementPointerDown,
    handleResizePointerDown,
    handleGroupResizePointerDown,
    handleGroupDragPointerDown,
  }
}
