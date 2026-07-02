import { useEffect } from 'react'
import {
  type Scene,
  type SceneElement,
  computeSpacingGuidesOptimized,
  type MeasurementGuide,
  SpatialIndex,
  buildSpatialIndex,
  computeBoundingBox,
  type SelectionState,
} from '@/domain'

function isCopyPasteModifier(event: KeyboardEvent) {
  return (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  )
}

function nudgeElements(
  event: KeyboardEvent,
  scene: Scene,
  selection: SelectionState,
  spatialIndexRef: React.MutableRefObject<SpatialIndex>,
  setScene: (updater: (currentScene: Scene) => Scene) => void,
  markSceneEdited: () => void,
  setGuidesSelectedIds: (ids: string[]) => void,
  setSpacingGuides: (guides: MeasurementGuide[]) => void,
) {
  const selectedElements = scene.elements.filter(
    (el) => selection.selectedIds.includes(el.id) && !el.locked,
  )

  if (selectedElements.length === 0) return

  const movementStep = event.shiftKey ? 10 : 1

  let dx = 0
  let dy = 0

  switch (event.key) {
    case 'ArrowUp':
      dy = -movementStep
      break
    case 'ArrowDown':
      dy = movementStep
      break
    case 'ArrowLeft':
      dx = -movementStep
      break
    case 'ArrowRight':
      dx = movementStep
      break
  }

  const otherElements = scene.elements.filter(
    (el) => !selection.selectedIds.includes(el.id) && !el.locked && el.hidden !== true,
  )
  spatialIndexRef.current = buildSpatialIndex(otherElements)

  setScene((currentScene) => {
    const updatedElements = currentScene.elements.map((element) => {
      if (!selection.selectedIds.includes(element.id) || element.locked) {
        return element
      }
      return { ...element, x: element.x + dx, y: element.y + dy } as SceneElement
    })

    const updatedSelectedElements = updatedElements.filter(
      (el) => selection.selectedIds.includes(el.id) && !el.locked,
    )

    if (updatedSelectedElements.length > 0) {
      const movedBounds = computeBoundingBox(updatedSelectedElements)
      const guides = computeSpacingGuidesOptimized(movedBounds, spatialIndexRef.current)
      setGuidesSelectedIds(selection.selectedIds)
      setSpacingGuides(guides)
    }

    return { ...currentScene, elements: updatedElements }
  })
  markSceneEdited()
}

type UseEditorShortcutsOptions = {
  scene: Scene
  selection: SelectionState
  editingTextId: string | null
  undo: () => void
  redo: () => void
  copySelectedElements: () => void
  pasteCopiedElements: () => void
  deleteSelected: () => void
  selectedElementRef: React.MutableRefObject<SceneElement | null>
  elementClipboardRef: React.MutableRefObject<SceneElement | null>
  elementsClipboardRef: React.MutableRefObject<SceneElement[] | null>
  spatialIndexRef: React.MutableRefObject<SpatialIndex>
  setGuidesSelectedIds: (ids: string[]) => void
  setSpacingGuides: (guides: MeasurementGuide[]) => void
  setScene: (updater: (currentScene: Scene) => Scene) => void
  markSceneEdited: () => void
}

export function useEditorShortcuts(options: UseEditorShortcutsOptions) {
  const {
    scene,
    selection,
    editingTextId,
    undo,
    redo,
    copySelectedElements,
    pasteCopiedElements,
    deleteSelected,
    elementClipboardRef,
    elementsClipboardRef,
    spatialIndexRef,
    setGuidesSelectedIds,
    setSpacingGuides,
    setScene,
    markSceneEdited,
  } = options

  useEffect(() => {
    function handleEditorKeyDown(event: KeyboardEvent) {
      const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']

      if (isEditableTarget(event.target) || editingTextId) {
        if (!arrowKeys.includes(event.key)) return
      }

      const key = event.key.toLowerCase()

      if ((event.metaKey || event.ctrlKey) && key === 'z') {
        event.preventDefault()
        if (event.shiftKey) {
          redo()
        } else {
          undo()
        }
        return
      }

      if (event.key === 'Backspace' || event.key === 'Delete') {
        if (isEditableTarget(event.target) || editingTextId) return
        if (selection.selectedIds.length === 0) return
        event.preventDefault()
        deleteSelected()
        return
      }

      if (arrowKeys.includes(event.key)) {
        if (isEditableTarget(event.target) || editingTextId) return
        if (selection.selectedIds.length === 0) return
        event.preventDefault()
        nudgeElements(
          event,
          scene,
          selection,
          spatialIndexRef,
          setScene,
          markSceneEdited,
          setGuidesSelectedIds,
          setSpacingGuides,
        )
        return
      }

      if (!isCopyPasteModifier(event) || isEditableTarget(event.target)) return

      if ((event.metaKey || event.ctrlKey) && key === 'y') {
        event.preventDefault()
        redo()
        return
      }

      if (arrowKeys.includes(event.key)) {
        if (selection.selectedIds.length === 0) return
        event.preventDefault()
        nudgeElements(
          event,
          scene,
          selection,
          spatialIndexRef,
          setScene,
          markSceneEdited,
          setGuidesSelectedIds,
          setSpacingGuides,
        )
        return
      }

      if (key === 'c' && selection.selectedIds.length > 0) {
        event.preventDefault()
        copySelectedElements()
        return
      }

      if (key === 'v' && (elementClipboardRef.current || elementsClipboardRef.current)) {
        event.preventDefault()
        pasteCopiedElements()
      }
    }

    window.addEventListener('keydown', handleEditorKeyDown)

    return () => {
      window.removeEventListener('keydown', handleEditorKeyDown)
    }
  }, [
    scene,
    selection,
    copySelectedElements,
    pasteCopiedElements,
    deleteSelected,
    undo,
    redo,
    selection.selectedIds,
    editingTextId,
    scene.elements,
    markSceneEdited,
    elementClipboardRef,
    elementsClipboardRef,
    setGuidesSelectedIds,
    setScene,
    setSpacingGuides,
    spatialIndexRef,
  ])
}
