import { useEffect } from 'react'
import { type Scene, type SceneElement } from '@/domain'

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

type UseEditorShortcutsOptions = {
  scene: Scene
  selectedIds: string[]
  editingTextId: string | null
  undo: () => void
  redo: () => void
  copySelectedElements: () => void
  pasteCopiedElements: () => void
  deleteSelected: () => void
  elementClipboardRef: React.MutableRefObject<SceneElement | null>
  elementsClipboardRef: React.MutableRefObject<SceneElement[] | null>
  setScene: (updater: (currentScene: Scene) => Scene) => void
  markSceneEdited: () => void
}

export function useEditorShortcuts(options: UseEditorShortcutsOptions) {
  const {
    scene,
    selectedIds,
    editingTextId,
    undo,
    redo,
    copySelectedElements,
    pasteCopiedElements,
    deleteSelected,
    elementClipboardRef,
    elementsClipboardRef,
    setScene,
    markSceneEdited,
  } = options

  useEffect(() => {
    function handleEditorKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target) || editingTextId) {
        return
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        if (event.shiftKey) {
          redo()
        } else {
          undo()
        }
        return
      }

      if (event.key === 'Backspace' || event.key === 'Delete') {
        if (selectedIds.length === 0) {
          return
        }

        event.preventDefault()
        deleteSelected()
        return
      }

      const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']

      if (arrowKeys.includes(event.key)) {
        if (selectedIds.length === 0) {
          return
        }

        event.preventDefault()

        const selectedElements = scene.elements.filter(
          (el) => selectedIds.includes(el.id) && !el.locked,
        )

        if (selectedElements.length === 0) {
          return
        }

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

        setScene((currentScene) => {
          const updatedElements = currentScene.elements.map((element) => {
            if (!selectedIds.includes(element.id) || element.locked) {
              return element
            }

            return {
              ...element,
              x: element.x + dx,
              y: element.y + dy,
            } as SceneElement
          })

          return {
            ...currentScene,
            elements: updatedElements,
          }
        })
        markSceneEdited()
        return
      }

      if (!isCopyPasteModifier(event) || isEditableTarget(event.target)) {
        return
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault()
        redo()
        return
      }

      if (event.key.toLowerCase() === 'c' && selectedIds.length > 0) {
        event.preventDefault()
        copySelectedElements()
        return
      }

      if (
        event.key.toLowerCase() === 'v' &&
        (elementClipboardRef.current || elementsClipboardRef.current)
      ) {
        event.preventDefault()
        pasteCopiedElements()
      }
    }

    window.addEventListener('keydown', handleEditorKeyDown)

    return () => {
      window.removeEventListener('keydown', handleEditorKeyDown)
    }
  }, [
    copySelectedElements,
    pasteCopiedElements,
    deleteSelected,
    undo,
    redo,
    selectedIds,
    editingTextId,
    scene.elements,
    markSceneEdited,
    elementClipboardRef,
    elementsClipboardRef,
    setScene,
  ])
}
