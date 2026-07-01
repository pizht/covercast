'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  cloneScene,
  createDefaultScene,
  computeBoundingBox,
  computeGuidesOptimized,
  computeSpacingGuidesOptimized,
  buildSpatialIndex,
  isTextElement,
  type Scene,
  type SceneElement,
  type BoundingBox,
  type SpatialIndex,
  createSelectionState,
  selectSingle,
  clearSelection,
  selectMultiple,
  type SelectionState,
} from '@/domain'
import { clamp } from '@/shared/lib'
import editorStyles from './editor/editor.module.css'
import { useScrollVisibility } from '../lib/use-scroll-visibility'
import { usePanelResize } from '../lib/use-panel-resize'
import { useHistory } from '../hooks/useHistory'
import { useClipboard } from '../hooks/useClipboard'
import { useEditorShortcuts } from '../hooks/useEditorShortcuts'
import { useCanvasZoom } from '../hooks/useCanvasZoom'
import { useCanvasSize } from '../hooks/useCanvasSize'
import { useTemplateManager } from '../hooks/useTemplateManager'
import { useSlotManager } from '../hooks/useSlotManager'
import { useDragManager } from '../hooks/useDragManager'
import { useExportScene, type ExportFormat, EXPORT_FORMAT_OPTIONS } from '../hooks/useExportScene'
import { useSceneActions } from '../hooks/useSceneActions'
import { useAssetManager } from '../hooks/useAssetManager'
import { useSceneLoader } from '../hooks/useSceneLoader'
import { useLocalFonts } from '../hooks/useLocalFonts'
import { useLocalAssets } from '../hooks/useLocalAssets'
import { useCreateBlankCover } from '../hooks/useCreateBlankCover'
import { SaveTemplateDialog } from './dialogs/SaveTemplateDialog'
import { useSaveTemplateDialog } from '../hooks/useSaveTemplateDialog'
import { SceneToolbar } from './editor/SceneToolbar'
import { StagePanel } from './editor/StagePanel'
import { LeftSidebar } from './editor/sidebar/LeftSidebar'
import { RightSidebar } from './editor/sidebar/RightSidebar'
import { CreateBlankCoverModal } from './panels/CreateBlankCoverModal'

type SidebarSectionId = 'scene' | 'sources' | 'templates' | 'layers'

function minimumWidth(element: SceneElement) {
  if (isTextElement(element)) {
    return 40
  }

  if (element.type === 'ellipse') {
    return 14
  }

  return 28
}

function minimumHeight(element: SceneElement) {
  if (isTextElement(element)) {
    return Math.max(24, element.fontSize)
  }

  if (element.type === 'ellipse') {
    return 14
  }

  return 28
}

export default function SceneEditor() {
  const [scene, setScene] = useState<Scene>(() => createDefaultScene())
  const [selection, setSelection] = useState<SelectionState>(() => createSelectionState())
  const [status, setStatus] = useState('正在读取本地场景...')
  const [appOrigin, setAppOrigin] = useState('')
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png')
  const svgRef = useRef<SVGSVGElement>(null)
  const sceneElementsRef = useRef<SceneElement[]>(scene.elements)
  const selectedElementRef = useRef<SceneElement | null>(null)
  const [collapsedSections, setCollapsedSections] = useState<Record<SidebarSectionId, boolean>>({
    scene: false,
    sources: false,
    templates: false,
    layers: false,
  })
  const [editingTextId, setEditingTextId] = useState<string | null>(null)

  // 编辑器加载时立即恢复本地字体
  const localFontManager = useLocalFonts()

  // 管理本地素材的 blob URL 生命周期
  const { resolveSrc } = useLocalAssets(scene)

  const { leftPanelRef, rightPanelRef, stageViewportRef } = useScrollVisibility()
  const { panelWidths, resizerLeftRef, resizerRightRef, handleMouseDown } = usePanelResize()

  const {
    canvasSize,
    setCanvasSize,
    setPresetSize,
    setCustomSize,
    isCustomSize,
    currentPreset,
    presets,
  } = useCanvasSize()

  const {
    canvasZoom,
    canvasPreviewWidth,
    canvasZoomPercent,
    setCanvasZoomLevel,
    zoomCanvasIn,
    zoomCanvasOut,
    resetCanvasZoom,
    handleStageWheel,
    handleZoomSliderWheel,
    CANVAS_ZOOM_MIN,
    CANVAS_ZOOM_MAX,
    CANVAS_ZOOM_STEP,
  } = useCanvasZoom({
    stageViewportRef,
    canvasWidth: canvasSize.width,
    canvasHeight: canvasSize.height,
  })
  const { history, saveHistory, undo, redo } = useHistory({
    scene,
    selectedIds: selection.selectedIds,
    setScene,
    setSelection,
    setStatus,
  })
  const {
    templateSlots,
    activeSlotId,
    setActiveSlotId,
    setTemplateSlots,
    customTemplatesRef,
    addSlot,
    removeSlot,
    selectSlotForEditing,
    getSlotUrl,
    writeSlotNameToStorage,
  } = useSlotManager({
    setStatus,
    appOrigin,
  })
  const {
    customTemplates,
    activeTemplateId,
    activeBuiltInTemplate,
    activeCustomTemplate,
    activeTemplate,
    hasUnsavedCustomTemplateChanges,
    setActiveTemplateId,
    applyTemplate,
    applyBuiltInTemplate,
    saveCustomTemplateWithName,
    saveCustomTemplateWithScene,
    saveActiveCustomTemplate,
    deleteCustomTemplate,
    duplicateCustomTemplate,
    renameCustomTemplate,
    exportTemplateJson,
    importTemplateFile,
  } = useTemplateManager({
    scene,
    selection,
    setScene,
    setSelection,
    setStatus,
    templateSlots,
    setActiveSlotId,
  })

  const {
    isModalOpen: isCreateBlankCoverModalOpen,
    config: createBlankCoverConfig,
    openModal: openCreateBlankCoverModal,
    closeModal: closeCreateBlankCoverModal,
    updateConfig: updateCreateBlankCoverConfig,
    createBlankCover,
    presetOptions: createBlankCoverPresetOptions,
    templateOptions: createBlankCoverTemplateOptions,
  } = useCreateBlankCover({
    setScene,
    setSelection,
    setCanvasSize,
    setActiveTemplateId,
    setStatus,
    saveCustomTemplate: saveCustomTemplateWithScene,
    canvasSizePresets: presets,
    customTemplates,
  })

  const saveTemplateDialog = useSaveTemplateDialog({
    customTemplates,
    onSave: saveCustomTemplateWithName,
  })

  const { exportScene } = useExportScene(
    scene,
    setStatus,
    exportTemplateJson,
    canvasSize.width,
    canvasSize.height,
  )

  const activeSlot = templateSlots.find((slot) => slot.slotId === activeSlotId) ?? null
  const editingContextCaption = activeCustomTemplate
    ? hasUnsavedCustomTemplateChanges
      ? '自定义模板有未保存修改'
      : '自定义模板已保存'
    : (activeSlot?.name ?? '未选择 OBS 源')
  const markSceneEdited = useCallback(() => {
    if (activeCustomTemplate) {
      return
    }

    if (activeBuiltInTemplate) {
      setActiveTemplateId('')
    }
  }, [activeBuiltInTemplate, activeCustomTemplate, setActiveTemplateId])

  useEffect(() => {
    customTemplatesRef.current = customTemplates
  }, [customTemplates, customTemplatesRef])

  const selectoSelectableTargetIds = useMemo(() => {
    return scene.elements
      .filter((element) => !element.locked && element.hidden !== true)
      .map((element) => element.id)
  }, [scene.elements])

  const handleSelectoDragStart = useCallback(
    (isShiftPressed: boolean) => {
      if (editingTextId) {
        setEditingTextId(null)
      }
      if (!isShiftPressed) {
        setSelection((prev) => clearSelection(prev))
      }
    },
    [editingTextId, setEditingTextId, setSelection],
  )

  const handleSelectoSelectEnd = useCallback(
    (selectedIds: string[], isShiftPressed: boolean) => {
      setSelection((prev) => {
        if (selectedIds.length === 0) {
          return prev
        }
        return selectMultiple(prev, selectedIds, isShiftPressed)
      })
    },
    [setSelection],
  )

  const {
    guides,
    spacingGuides,
    spatialIndexRef,
    setGuides,
    setSpacingGuides,
    handleElementPointerDown,
  } = useDragManager({
    selection,
    editingTextId,
    setSelection,
    setEditingTextId,
  })

  const selectedElement = useMemo(() => {
    if (selection.selectedIds.length !== 1) {
      return null
    }
    return scene.elements.find((element) => element.id === selection.selectedIds[0]) ?? null
  }, [scene.elements, selection.selectedIds])

  const moveableTargetIds = useMemo(() => {
    if (editingTextId) {
      return []
    }
    return scene.elements
      .filter(
        (element) =>
          selection.selectedIds.includes(element.id) && !element.locked && element.hidden !== true,
      )
      .map((element) => element.id)
  }, [selection.selectedIds, editingTextId, scene.elements])

  const moveableSnapTargetIds = useMemo(() => {
    return scene.elements
      .filter(
        (element) =>
          !selection.selectedIds.includes(element.id) && !element.locked && element.hidden !== true,
      )
      .map((element) => element.id)
  }, [selection.selectedIds, scene.elements])

  const moveableRefreshKey = useMemo(() => {
    return scene.elements
      .filter((element) => selection.selectedIds.includes(element.id))
      .map(
        (element) => `${element.id}:${element.x},${element.y},${element.width},${element.height}`,
      )
      .join('|')
  }, [scene.elements, selection.selectedIds])

  const moveableDragStartRef = useRef<SceneElement | null>(null)
  const moveableScaleStartRef = useRef<SceneElement | null>(null)
  const dragSpatialIndexRef = useRef<SpatialIndex | null>(null)
  const [dimensionLabel, setDimensionLabel] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)

  const buildDragSpatialIndex = useCallback(() => {
    const otherElements = scene.elements.filter(
      (el) => !selection.selectedIds.includes(el.id) && !el.locked && el.hidden !== true,
    )
    dragSpatialIndexRef.current = buildSpatialIndex(otherElements)
  }, [scene.elements, selection.selectedIds])

  const handleMoveableDragStart = useCallback(() => {
    const id = moveableTargetIds[0]
    if (!id) {
      return
    }
    const element = scene.elements.find((item) => item.id === id)
    if (!element) {
      return
    }
    moveableDragStartRef.current = { ...element }
    buildDragSpatialIndex()
    saveHistory(`移动元素「${element.name}」`, scene)
  }, [moveableTargetIds, scene, saveHistory, buildDragSpatialIndex])

  const handleMoveableDrag = useCallback(
    (translateX: number, translateY: number) => {
      const start = moveableDragStartRef.current
      if (!start) {
        return
      }
      const nextX = clamp(start.x + translateX, -start.width + 24, canvasSize.width - 24)
      const nextY = clamp(start.y + translateY, -start.height + 24, canvasSize.height - 24)
      setScene((currentScene) => ({
        ...currentScene,
        elements: currentScene.elements.map((element) =>
          element.id === start.id ? ({ ...element, x: nextX, y: nextY } as SceneElement) : element,
        ),
      }))
      if (dragSpatialIndexRef.current) {
        const movedBounds = { x: nextX, y: nextY, width: start.width, height: start.height }
        setGuides(computeGuidesOptimized(movedBounds, dragSpatialIndexRef.current))
        setSpacingGuides(computeSpacingGuidesOptimized(movedBounds, dragSpatialIndexRef.current))
      }
      markSceneEdited()
    },
    [canvasSize.width, canvasSize.height, setScene, markSceneEdited, setGuides, setSpacingGuides],
  )

  const handleMoveableDragEnd = useCallback(() => {
    moveableDragStartRef.current = null
    setGuides([])
    setSpacingGuides([])
  }, [setGuides, setSpacingGuides])

  const handleMoveableScaleStart = useCallback(() => {
    const id = moveableTargetIds[0]
    if (!id) {
      return
    }
    const element = scene.elements.find((item) => item.id === id)
    if (!element) {
      return
    }
    moveableScaleStartRef.current = { ...element }
    buildDragSpatialIndex()
    saveHistory(`调整元素大小「${element.name}」`, scene)
  }, [moveableTargetIds, scene, saveHistory, buildDragSpatialIndex])

  const handleMoveableScale = useCallback(
    (width: number, height: number) => {
      const start = moveableScaleStartRef.current
      if (!start) {
        return
      }
      const minW = minimumWidth(start)
      const minH = minimumHeight(start)
      const maxW = Math.max(minW, canvasSize.width - start.x)
      const maxH = Math.max(minH, canvasSize.height - start.y)
      const nextW = clamp(width, minW, maxW)
      const nextH = clamp(height, minH, maxH)
      setScene((currentScene) => ({
        ...currentScene,
        elements: currentScene.elements.map((element) =>
          element.id === start.id
            ? ({ ...element, width: nextW, height: nextH } as SceneElement)
            : element,
        ),
      }))
      setDimensionLabel({ x: start.x, y: start.y, width: nextW, height: nextH })
      if (dragSpatialIndexRef.current) {
        const movedBounds = { x: start.x, y: start.y, width: nextW, height: nextH }
        setGuides(computeGuidesOptimized(movedBounds, dragSpatialIndexRef.current))
        setSpacingGuides(computeSpacingGuidesOptimized(movedBounds, dragSpatialIndexRef.current))
      }
      markSceneEdited()
    },
    [canvasSize.width, canvasSize.height, setScene, markSceneEdited, setGuides, setSpacingGuides],
  )

  const handleMoveableScaleEnd = useCallback(() => {
    moveableScaleStartRef.current = null
    setGuides([])
    setSpacingGuides([])
    setDimensionLabel(null)
  }, [setGuides, setSpacingGuides])

  const moveableGroupDragStartRef = useRef<{
    bounds: BoundingBox
    elements: SceneElement[]
  } | null>(null)
  const moveableGroupScaleStartRef = useRef<{
    bounds: BoundingBox
    elements: SceneElement[]
  } | null>(null)

  const handleMoveableGroupDragStart = useCallback(() => {
    const targets = scene.elements.filter((el) => moveableTargetIds.includes(el.id))
    if (targets.length === 0) {
      return
    }
    moveableGroupDragStartRef.current = {
      bounds: computeBoundingBox(targets),
      elements: targets.map((el) => ({ ...el })),
    }
    buildDragSpatialIndex()
    saveHistory(`移动 ${targets.length} 个元素`, scene)
  }, [moveableTargetIds, scene, saveHistory, buildDragSpatialIndex])

  const handleMoveableGroupDrag = useCallback(
    (translateX: number, translateY: number) => {
      const start = moveableGroupDragStartRef.current
      if (!start) {
        return
      }
      const nextX = clamp(
        start.bounds.x + translateX,
        -start.bounds.width + 24,
        canvasSize.width - 24,
      )
      const nextY = clamp(
        start.bounds.y + translateY,
        -start.bounds.height + 24,
        canvasSize.height - 24,
      )
      const deltaX = nextX - start.bounds.x
      const deltaY = nextY - start.bounds.y
      setScene((currentScene) => ({
        ...currentScene,
        elements: currentScene.elements.map((element) => {
          const startEl = start.elements.find((e) => e.id === element.id)
          if (!startEl) {
            return element
          }
          return { ...element, x: startEl.x + deltaX, y: startEl.y + deltaY } as SceneElement
        }),
      }))
      if (dragSpatialIndexRef.current) {
        const movedBounds = {
          x: nextX,
          y: nextY,
          width: start.bounds.width,
          height: start.bounds.height,
        }
        setGuides(computeGuidesOptimized(movedBounds, dragSpatialIndexRef.current))
        setSpacingGuides(computeSpacingGuidesOptimized(movedBounds, dragSpatialIndexRef.current))
      }
      markSceneEdited()
    },
    [canvasSize.width, canvasSize.height, setScene, markSceneEdited, setGuides, setSpacingGuides],
  )

  const handleMoveableGroupDragEnd = useCallback(() => {
    moveableGroupDragStartRef.current = null
    setGuides([])
    setSpacingGuides([])
  }, [setGuides, setSpacingGuides])

  const handleMoveableGroupScaleStart = useCallback(() => {
    const targets = scene.elements.filter((el) => moveableTargetIds.includes(el.id))
    if (targets.length === 0) {
      return
    }
    moveableGroupScaleStartRef.current = {
      bounds: computeBoundingBox(targets),
      elements: targets.map((el) => ({ ...el })),
    }
    buildDragSpatialIndex()
    saveHistory(`缩放 ${targets.length} 个元素`, scene)
  }, [moveableTargetIds, scene, saveHistory, buildDragSpatialIndex])

  const handleMoveableGroupScale = useCallback(
    (groupWidth: number, groupHeight: number) => {
      const start = moveableGroupScaleStartRef.current
      if (!start || start.bounds.width <= 0 || start.bounds.height <= 0) {
        return
      }
      const maxW = Math.max(10, canvasSize.width - start.bounds.x)
      const maxH = Math.max(10, canvasSize.height - start.bounds.y)
      const clampedW = clamp(groupWidth, 10, maxW)
      const clampedH = clamp(groupHeight, 10, maxH)
      const scaleX = clampedW / start.bounds.width
      const scaleY = clampedH / start.bounds.height
      setScene((currentScene) => ({
        ...currentScene,
        elements: currentScene.elements.map((element) => {
          const startEl = start.elements.find((e) => e.id === element.id)
          if (!startEl) {
            return element
          }
          return {
            ...element,
            x: start.bounds.x + (startEl.x - start.bounds.x) * scaleX,
            y: start.bounds.y + (startEl.y - start.bounds.y) * scaleY,
            width: startEl.width * scaleX,
            height: startEl.height * scaleY,
          } as SceneElement
        }),
      }))
      setDimensionLabel({
        x: start.bounds.x,
        y: start.bounds.y,
        width: clampedW,
        height: clampedH,
      })
      if (dragSpatialIndexRef.current) {
        const movedBounds = {
          x: start.bounds.x,
          y: start.bounds.y,
          width: clampedW,
          height: clampedH,
        }
        setGuides(computeGuidesOptimized(movedBounds, dragSpatialIndexRef.current))
        setSpacingGuides(computeSpacingGuidesOptimized(movedBounds, dragSpatialIndexRef.current))
      }
      markSceneEdited()
    },
    [canvasSize.width, canvasSize.height, setScene, markSceneEdited, setGuides, setSpacingGuides],
  )

  const handleMoveableGroupScaleEnd = useCallback(() => {
    moveableGroupScaleStartRef.current = null
    setGuides([])
    setSpacingGuides([])
    setDimensionLabel(null)
  }, [setGuides, setSpacingGuides])

  useEffect(() => {
    setGuides([])
    setSpacingGuides([])
  }, [selection.selectedIds, setGuides, setSpacingGuides])

  useEffect(() => {
    sceneElementsRef.current = scene.elements
    selectedElementRef.current = selectedElement
  }, [scene.elements, selectedElement])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAppOrigin(window.location.origin)
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [])

  function toggleSidebarSection(sectionId: SidebarSectionId) {
    setCollapsedSections((current) => ({
      ...current,
      [sectionId]: !current[sectionId],
    }))
  }

  const changeScene = useCallback(
    (updater: (currentScene: Scene) => Scene, description?: string) => {
      if (description) {
        const currentSceneSnapshot = cloneScene(scene)
        saveHistory(description, currentSceneSnapshot)
      }
      setScene(updater)
      markSceneEdited()
    },
    [scene, saveHistory, markSceneEdited],
  )

  const {
    elementClipboardRef,
    elementsClipboardRef,
    canPasteElement,
    copySelectedElements,
    pasteCopiedElements,
  } = useClipboard({
    selectedElementRef,
    sceneElementsRef,
    selectedIds: selection.selectedIds,
    changeScene,
    setSelection,
    markSceneEdited,
    setStatus,
    canvasWidth: canvasSize.width,
    canvasHeight: canvasSize.height,
  })

  const {
    patchElement,
    patchSelected,
    toggleElementHidden,
    toggleElementLocked,
    moveElementLayer,
    addTextElement,
    addRectElement,
    addEllipseElement,
    deleteSelected,
  } = useSceneActions({
    scene,
    selection,
    changeScene,
    setSelection,
  })

  useEditorShortcuts({
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
    setGuides,
    setSpacingGuides,
    setScene,
    markSceneEdited,
  })

  const { handleAssetInput } = useAssetManager({
    setStatus,
    selectedElement,
    patchElement,
    changeScene,
    selection,
    setSelection,
  })

  useSceneLoader({
    setScene,
    setStatus,
    setActiveTemplateId,
    setSelection,
  })

  function handleTextElementDoubleClick(elementId: string) {
    const element = scene.elements.find((item) => item.id === elementId)
    if (!element || element.type !== 'text') {
      return
    }

    setSelection(selectSingle(selection, elementId))
    setEditingTextId(elementId)
  }

  return (
    <>
      <CreateBlankCoverModal
        isOpen={isCreateBlankCoverModalOpen}
        config={createBlankCoverConfig}
        presetOptions={createBlankCoverPresetOptions}
        templateOptions={createBlankCoverTemplateOptions}
        onCancel={closeCreateBlankCoverModal}
        onConfirm={createBlankCover}
        onUpdateConfig={updateCreateBlankCoverConfig}
      />

      <main className={editorStyles.editorShell}>
        <SceneToolbar
          undo={undo}
          redo={redo}
          canUndo={history.past.length > 0}
          canRedo={history.future.length > 0}
          addTextElement={addTextElement}
          addRectElement={addRectElement}
          addEllipseElement={addEllipseElement}
          handleAssetInput={handleAssetInput}
          onCreateBlankCover={openCreateBlankCoverModal}
          activeCustomTemplate={activeCustomTemplate}
          hasUnsavedCustomTemplateChanges={hasUnsavedCustomTemplateChanges}
          saveActiveCustomTemplate={saveActiveCustomTemplate}
          onOpenSaveTemplateDialog={() => saveTemplateDialog.openDialog(activeTemplate?.name)}
          importTemplateFile={importTemplateFile}
          exportFormat={exportFormat}
          setExportFormat={setExportFormat}
          exportScene={exportScene}
          EXPORT_FORMAT_OPTIONS={EXPORT_FORMAT_OPTIONS}
        />

        <SaveTemplateDialog
          show={saveTemplateDialog.showDialog}
          title="另存为模板"
          templateName={saveTemplateDialog.templateName}
          nameError={saveTemplateDialog.nameError}
          onSetName={saveTemplateDialog.setTemplateName}
          onSave={saveTemplateDialog.handleSave}
          onCancel={saveTemplateDialog.closeDialog}
        />

        <section className={editorStyles.editorGrid}>
          <LeftSidebar
            leftPanelRef={leftPanelRef}
            leftPanelWidth={panelWidths.leftPanel}
            activeTemplate={activeCustomTemplate}
            hasUnsavedCustomTemplateChanges={hasUnsavedCustomTemplateChanges}
            editingContextCaption={editingContextCaption}
            collapsedSections={collapsedSections}
            toggleSidebarSection={toggleSidebarSection}
            scene={scene}
            changeScene={changeScene}
            canvasSize={canvasSize}
            presets={presets}
            currentPreset={currentPreset}
            isCustomSize={isCustomSize}
            onPresetSizeChange={setPresetSize}
            onCustomSizeChange={setCustomSize}
            templateSlots={templateSlots}
            customTemplates={customTemplates}
            activeSlotId={activeSlotId}
            addSlot={addSlot}
            removeSlot={removeSlot}
            selectSlotForEditing={selectSlotForEditing}
            writeSlotNameToStorage={writeSlotNameToStorage}
            setTemplateSlots={setTemplateSlots}
            getSlotUrl={getSlotUrl}
            setStatus={setStatus}
            activeTemplateId={activeTemplateId}
            applyBuiltInTemplate={applyBuiltInTemplate}
            applyTemplate={applyTemplate}
            duplicateCustomTemplate={duplicateCustomTemplate}
            renameCustomTemplate={renameCustomTemplate}
            deleteCustomTemplate={deleteCustomTemplate}
            selection={selection}
            setSelection={setSelection}
            toggleElementHidden={toggleElementHidden}
            toggleElementLocked={toggleElementLocked}
            moveElementLayer={moveElementLayer}
          />

          <div
            ref={resizerLeftRef}
            className={editorStyles.panelResizer}
            onMouseDown={(e) => handleMouseDown('left', e)}
          />

          <StagePanel
            status={status}
            canvasZoom={canvasZoom}
            canvasZoomPercent={canvasZoomPercent}
            canvasPreviewWidth={canvasPreviewWidth}
            CANVAS_ZOOM_MIN={CANVAS_ZOOM_MIN}
            CANVAS_ZOOM_MAX={CANVAS_ZOOM_MAX}
            CANVAS_ZOOM_STEP={CANVAS_ZOOM_STEP}
            setCanvasZoomLevel={setCanvasZoomLevel}
            zoomCanvasIn={zoomCanvasIn}
            zoomCanvasOut={zoomCanvasOut}
            resetCanvasZoom={resetCanvasZoom}
            handleZoomSliderWheel={handleZoomSliderWheel}
            handleStageWheel={handleStageWheel}
            stageViewportRef={stageViewportRef}
            scene={scene}
            guides={guides}
            spacingGuides={spacingGuides}
            svgRef={svgRef}
            editingTextId={editingTextId}
            canvasWidth={canvasSize.width}
            canvasHeight={canvasSize.height}
            resolveSrc={resolveSrc}
            onElementPointerDown={handleElementPointerDown}
            onTextElementDoubleClick={handleTextElementDoubleClick}
            moveableTargetIds={moveableTargetIds}
            moveableSnapTargetIds={moveableSnapTargetIds}
            moveableEnabled
            moveableRefreshKey={moveableRefreshKey}
            dimensionLabel={dimensionLabel}
            onMoveableDragStart={handleMoveableDragStart}
            onMoveableDrag={handleMoveableDrag}
            onMoveableDragEnd={handleMoveableDragEnd}
            onMoveableScaleStart={handleMoveableScaleStart}
            onMoveableScale={handleMoveableScale}
            onMoveableScaleEnd={handleMoveableScaleEnd}
            onMoveableGroupDragStart={handleMoveableGroupDragStart}
            onMoveableGroupDrag={handleMoveableGroupDrag}
            onMoveableGroupDragEnd={handleMoveableGroupDragEnd}
            onMoveableGroupScaleStart={handleMoveableGroupScaleStart}
            onMoveableGroupScale={handleMoveableGroupScale}
            onMoveableGroupScaleEnd={handleMoveableGroupScaleEnd}
            selectoSelectableTargetIds={selectoSelectableTargetIds}
            selectoEnabled
            onSelectoDragStart={handleSelectoDragStart}
            onSelectoSelectEnd={handleSelectoSelectEnd}
          />

          <div
            ref={resizerRightRef}
            className={editorStyles.panelResizer}
            onMouseDown={(e) => handleMouseDown('right', e)}
          />

          <RightSidebar
            rightPanelRef={rightPanelRef}
            rightPanelWidth={panelWidths.rightPanel}
            selectedElement={selectedElement}
            allElements={scene.elements}
            patchSelected={(patch) => patchSelected(selectedElement, patch)}
            copySelectedElements={copySelectedElements}
            pasteCopiedElements={pasteCopiedElements}
            canPasteElement={canPasteElement}
            deleteSelected={deleteSelected}
            handleAssetInput={handleAssetInput}
            localFontManager={localFontManager}
          />
        </section>
      </main>
    </>
  )
}
