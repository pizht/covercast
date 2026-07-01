'use client'

import type { Ref, WheelEvent as ReactWheelEvent, PointerEvent } from 'react'
import SceneCanvas from '../SceneCanvas'
import type { Scene, GuideLine, MeasurementGuide, ResizeLabel, ResizeHandleType } from '@/domain'
import { Slider } from '@/shared/components/ui'
import styles from './editor.module.css'

type StagePanelProps = {
  // Status
  status: string

  // Zoom controls
  canvasZoom: number
  canvasZoomPercent: number
  canvasPreviewWidth: number
  CANVAS_ZOOM_MIN: number
  CANVAS_ZOOM_MAX: number
  CANVAS_ZOOM_STEP: number
  setCanvasZoomLevel: (value: number) => void
  zoomCanvasIn: () => void
  zoomCanvasOut: () => void
  resetCanvasZoom: () => void
  handleZoomSliderWheel: (event: ReactWheelEvent<HTMLDivElement>) => void
  handleStageWheel: (event: ReactWheelEvent<HTMLDivElement>) => void
  stageViewportRef: Ref<HTMLDivElement>

  // SceneCanvas props
  scene: Scene
  selectedIds: string[]
  guides?: GuideLine[]
  spacingGuides?: MeasurementGuide[]
  resizeLabel?: ResizeLabel | null
  svgRef?: Ref<SVGSVGElement>
  editingTextId?: string | null
  isGroupDragging?: boolean
  canvasWidth?: number
  canvasHeight?: number
  resolveSrc?: (src: string) => string
  onElementPointerDown?: (elementId: string, event: PointerEvent<SVGGElement>) => void
  onResizePointerDown?: (elementId: string, event: PointerEvent<SVGRectElement>) => void
  onGroupDragPointerDown?: (event: PointerEvent<SVGRectElement>) => void
  onGroupResizePointerDown?: (handle: ResizeHandleType, event: PointerEvent<SVGRectElement>) => void
  onTextElementDoubleClick?: (elementId: string) => void
  moveableTargetIds?: string[]
  moveableSnapTargetIds?: string[]
  moveableEnabled?: boolean
  onMoveableDragStart?: () => void
  onMoveableDrag?: (translateX: number, translateY: number) => void
  onMoveableDragEnd?: (isDrag: boolean) => void
  onMoveableResizeStart?: () => void
  onMoveableResize?: (width: number, height: number) => void
  onMoveableResizeEnd?: (isDrag: boolean) => void
  onMoveableGroupDragStart?: () => void
  onMoveableGroupDrag?: (translateX: number, translateY: number) => void
  onMoveableGroupDragEnd?: (isDrag: boolean) => void
  onMoveableGroupResizeStart?: () => void
  onMoveableGroupResize?: (groupWidth: number, groupHeight: number) => void
  onMoveableGroupResizeEnd?: (isDrag: boolean) => void
  selectoSelectableTargetIds?: string[]
  selectoEnabled?: boolean
  onSelectoDragStart?: (isShiftPressed: boolean) => void
  onSelectoSelectEnd?: (selectedIds: string[], isShiftPressed: boolean, isClick: boolean) => void
}

export function StagePanel({
  status,
  canvasZoom,
  canvasZoomPercent,
  canvasPreviewWidth,
  CANVAS_ZOOM_MIN,
  CANVAS_ZOOM_MAX,
  CANVAS_ZOOM_STEP,
  setCanvasZoomLevel,
  zoomCanvasIn,
  zoomCanvasOut,
  resetCanvasZoom,
  handleZoomSliderWheel,
  handleStageWheel,
  stageViewportRef,
  scene,
  selectedIds,
  guides,
  spacingGuides,
  resizeLabel,
  svgRef,
  editingTextId,
  isGroupDragging,
  canvasWidth,
  canvasHeight,
  resolveSrc,
  onElementPointerDown,
  onResizePointerDown,
  onGroupDragPointerDown,
  onGroupResizePointerDown,
  onTextElementDoubleClick,
  moveableTargetIds,
  moveableSnapTargetIds,
  moveableEnabled,
  onMoveableDragStart,
  onMoveableDrag,
  onMoveableDragEnd,
  onMoveableResizeStart,
  onMoveableResize,
  onMoveableResizeEnd,
  onMoveableGroupDragStart,
  onMoveableGroupDrag,
  onMoveableGroupDragEnd,
  onMoveableGroupResizeStart,
  onMoveableGroupResize,
  onMoveableGroupResizeEnd,
  selectoSelectableTargetIds,
  selectoEnabled,
  onSelectoDragStart,
  onSelectoSelectEnd,
}: StagePanelProps) {
  return (
    <section className={styles.stagePanel} aria-label="Canvas preview">
      <div className={styles.stageHeader}>
        <span className={styles.stageStatus}>{status}</span>
        <div className={styles.stageHeaderTools}>
          <span>拖拽移动，右下角黄点缩放</span>
          <div
            className={styles.canvasZoomControls}
            aria-label="画布缩放"
            onWheel={handleZoomSliderWheel}
          >
            <button
              type="button"
              className={styles.zoomButton}
              onClick={zoomCanvasOut}
              disabled={canvasZoom <= CANVAS_ZOOM_MIN}
              title="缩小画布"
            >
              -
            </button>
            <label className={styles.zoomSliderLabel}>
              <span>{canvasZoomPercent}%</span>
              <Slider
                min={CANVAS_ZOOM_MIN}
                max={CANVAS_ZOOM_MAX}
                step={CANVAS_ZOOM_STEP}
                value={canvasZoom}
                onValueChange={setCanvasZoomLevel}
                title="调整画布缩放"
              />
            </label>
            <button
              type="button"
              className={styles.zoomButton}
              onClick={zoomCanvasIn}
              disabled={canvasZoom >= CANVAS_ZOOM_MAX}
              title="放大画布"
            >
              +
            </button>
            <button
              type="button"
              className={styles.zoomFitButton}
              onClick={resetCanvasZoom}
              disabled={canvasZoom === 1}
              title="恢复适配视图"
            >
              适配
            </button>
          </div>
        </div>
      </div>
      <div className={styles.stageViewport} ref={stageViewportRef} onWheel={handleStageWheel}>
        <div className={styles.stageViewportInner}>
          <div
            className={styles.scenePreviewFrame}
            style={{
              width: canvasPreviewWidth,
              aspectRatio: `${canvasWidth} / ${canvasHeight}`,
            }}
          >
            <SceneCanvas
              scene={scene}
              className={styles.scenePreview}
              style={{ aspectRatio: `${canvasWidth} / ${canvasHeight}` }}
              idPrefix="editor"
              interactive
              selectedIds={selectedIds}
              guides={guides}
              spacingGuides={spacingGuides}
              resizeLabel={resizeLabel}
              svgRef={svgRef}
              editingTextId={editingTextId}
              isGroupDragging={isGroupDragging}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              resolveSrc={resolveSrc}
              onElementPointerDown={onElementPointerDown}
              onResizePointerDown={onResizePointerDown}
              onGroupDragPointerDown={onGroupDragPointerDown}
              onGroupResizePointerDown={onGroupResizePointerDown}
              onTextElementDoubleClick={onTextElementDoubleClick}
              moveableTargetIds={moveableTargetIds}
              moveableSnapTargetIds={moveableSnapTargetIds}
              moveableEnabled={moveableEnabled}
              onMoveableDragStart={onMoveableDragStart}
              onMoveableDrag={onMoveableDrag}
              onMoveableDragEnd={onMoveableDragEnd}
              onMoveableResizeStart={onMoveableResizeStart}
              onMoveableResize={onMoveableResize}
              onMoveableResizeEnd={onMoveableResizeEnd}
              onMoveableGroupDragStart={onMoveableGroupDragStart}
              onMoveableGroupDrag={onMoveableGroupDrag}
              onMoveableGroupDragEnd={onMoveableGroupDragEnd}
              onMoveableGroupResizeStart={onMoveableGroupResizeStart}
              onMoveableGroupResize={onMoveableGroupResize}
              onMoveableGroupResizeEnd={onMoveableGroupResizeEnd}
              selectoSelectableTargetIds={selectoSelectableTargetIds}
              selectoEnabled={selectoEnabled}
              onSelectoDragStart={onSelectoDragStart}
              onSelectoSelectEnd={onSelectoSelectEnd}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
