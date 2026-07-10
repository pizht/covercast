'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { type Editor } from 'tldraw'
import {
  createDefaultScene,
  type Scene,
  type SceneElement,
  createSelectionState,
  type SelectionState,
} from '@/domain'
import editorStyles from './editor/editor.module.css'
import { useScrollVisibility } from '../lib/use-scroll-visibility'
import { usePanelResize } from '../lib/use-panel-resize'
import { useCanvasSize } from '../hooks/useCanvasSize'
import { useTemplateManager } from '../hooks/useTemplateManager'
import { useSlotManager } from '../hooks/useSlotManager'
import { useExportScene, type ExportFormat, EXPORT_FORMAT_OPTIONS } from '../hooks/useExportScene'
import { useSceneActions } from '../hooks/useSceneActions'
import { useAssetManager } from '../hooks/useAssetManager'
import { useSceneLoader } from '../hooks/useSceneLoader'
import { useClipboard } from '../hooks/useClipboard'
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

export default function SceneEditor() {
  const [scene, setScene] = useState<Scene>(() => createDefaultScene())
  const [selection, setSelection] = useState<SelectionState>(() => createSelectionState())
  const [status, setStatus] = useState('正在读取本地场景...')
  const [appOrigin, setAppOrigin] = useState('')
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png')
  const tldrawEditorRef = useRef<Editor | null>(null)
  const sceneElementsRef = useRef<SceneElement[]>(scene.elements)
  const selectedElementRef = useRef<SceneElement | null>(null)
  const [collapsedSections, setCollapsedSections] = useState<Record<SidebarSectionId, boolean>>({
    scene: false,
    sources: false,
    templates: false,
    layers: false,
  })

  // 编辑器加载时立即恢复本地字体
  const localFontManager = useLocalFonts()

  // 管理本地素材的 blob URL 生命周期
  const { resolveSrc, blobUrlMap } = useLocalAssets(scene)

  // Version key that changes when blob URLs are built — triggers tldraw reload
  const srcVersion = useMemo(() => Object.keys(blobUrlMap).length, [blobUrlMap])

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

  const selectedElement = useMemo(() => {
    if (selection.selectedIds.length !== 1) {
      return null
    }
    return scene.elements.find((element) => element.id === selection.selectedIds[0]) ?? null
  }, [scene.elements, selection.selectedIds])

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

  // changeScene — no saveHistory (tldraw handles undo/redo)
  const changeScene = useCallback(
    (updater: (currentScene: Scene) => Scene) => {
      setScene(updater)
      markSceneEdited()
    },
    [markSceneEdited],
  )

  // tldraw → Scene sync (debounced inside CovercastEditor)
  // Preserves hidden elements in their original layer order
  const handleTldrawSceneChange = useCallback(
    (newScene: Scene) => {
      setScene((prev) => {
        const newElementsMap = new Map(newScene.elements.map((el) => [el.id, el]))
        const prevIds = new Set(prev.elements.map((el) => el.id))

        const merged = prev.elements.map((el) => {
          const updated = newElementsMap.get(el.id)
          return updated ?? el
        })

        const newElements = newScene.elements.filter((el) => !prevIds.has(el.id))

        return {
          ...newScene,
          elements: [...merged, ...newElements],
        }
      })
      markSceneEdited()
    },
    [markSceneEdited],
  )

  // tldraw selection → SceneEditor selection
  const handleTldrawSelectionChange = useCallback((elementIds: string[]) => {
    setSelection({ selectedIds: elementIds })
  }, [])

  // tldraw editor ready — store ref for undo/redo
  const handleTldrawEditorReady = useCallback((editor: Editor) => {
    tldrawEditorRef.current = editor
  }, [])

  // Undo/redo — tldraw native
  const handleUndo = useCallback(() => {
    tldrawEditorRef.current?.undo()
  }, [])

  const handleRedo = useCallback(() => {
    tldrawEditorRef.current?.redo()
  }, [])

  const { canPasteElement, copySelectedElements, pasteCopiedElements } = useClipboard({
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
          undo={handleUndo}
          redo={handleRedo}
          canUndo={true}
          canRedo={true}
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
            scene={scene}
            canvasWidth={canvasSize.width}
            canvasHeight={canvasSize.height}
            resolveSrc={resolveSrc}
            srcVersion={srcVersion}
            onSceneChange={handleTldrawSceneChange}
            onSelectionChange={handleTldrawSelectionChange}
            onEditorReady={handleTldrawEditorReady}
            stageViewportRef={stageViewportRef}
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
