'use client'

import type { Ref, WheelEvent as ReactWheelEvent, PointerEvent } from 'react'
import type { RefObject } from 'react'
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
  svgRef?: RefObject<SVGSVGElement | null>
  selectableTargetIds?: string[]
  editingTextId?: string | null
  isGroupDragging?: boolean
  canvasWidth?: number
  canvasHeight?: number
  resolveSrc?: (src: string) => string
  onCanvasPointerDown?: (event: PointerEvent<SVGSVGElement>) => void
  onElementPointerDown?: (elementId: string, event: PointerEvent<SVGGElement>) => void
  onResizePointerDown?: (elementId: string, event: PointerEvent<SVGRectElement>) => void
  onGroupDragPointerDown?: (event: PointerEvent<SVGRectElement>) => void
  onGroupResizePointerDown?: (handle: ResizeHandleType, event: PointerEvent<SVGRectElement>) => void
  onTextElementDoubleClick?: (elementId: string) => void
  onSelectoDragStart?: () => void
  onSelectoSelectEnd?: (selectedIds: string[], isShiftPressed: boolean) => void
  // Moveable
  moveableTargetId?: string | null
  onMoveableDragStart?: (targetId: string) => void
  onMoveableDrag?: (targetId: string, dx: number, dy: number) => void
  onMoveableDragEnd?: (targetId: string, dx: number, dy: number) => void
  onMoveableResizeStart?: (targetId: string) => void
  onMoveableResize?: (
    targetId: string,
    width: number,
    height: number,
    dx: number,
    dy: number,
  ) => void
  onMoveableResizeEnd?: (
    targetId: string,
    width: number,
    height: number,
    dx: number,
    dy: number,
  ) => void
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
  selectableTargetIds,
  editingTextId,
  isGroupDragging,
  canvasWidth,
  canvasHeight,
  resolveSrc,
  onCanvasPointerDown,
  onElementPointerDown,
  onResizePointerDown,
  onGroupDragPointerDown,
  onGroupResizePointerDown,
  onTextElementDoubleClick,
  onSelectoDragStart,
  onSelectoSelectEnd,
  moveableTargetId,
  onMoveableDragStart,
  onMoveableDrag,
  onMoveableDragEnd,
  onMoveableResizeStart,
  onMoveableResize,
  onMoveableResizeEnd,
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
              selectableTargetIds={selectableTargetIds}
              editingTextId={editingTextId}
              isGroupDragging={isGroupDragging}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              resolveSrc={resolveSrc}
              onCanvasPointerDown={onCanvasPointerDown}
              onElementPointerDown={onElementPointerDown}
              onResizePointerDown={onResizePointerDown}
              onGroupDragPointerDown={onGroupDragPointerDown}
              onGroupResizePointerDown={onGroupResizePointerDown}
              onTextElementDoubleClick={onTextElementDoubleClick}
              onSelectoDragStart={onSelectoDragStart}
              onSelectoSelectEnd={onSelectoSelectEnd}
              moveableTargetId={moveableTargetId}
              canvasZoom={canvasZoom}
              onMoveableDragStart={onMoveableDragStart}
              onMoveableDrag={onMoveableDrag}
              onMoveableDragEnd={onMoveableDragEnd}
              onMoveableResizeStart={onMoveableResizeStart}
              onMoveableResize={onMoveableResize}
              onMoveableResizeEnd={onMoveableResizeEnd}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
