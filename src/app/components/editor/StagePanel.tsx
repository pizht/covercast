'use client'

import type { Ref, WheelEvent as ReactWheelEvent, PointerEvent } from 'react'
import SceneCanvas from '../SceneCanvas'
import type { Scene, GuideLine, MeasurementGuide } from '@/domain'
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
  guides?: GuideLine[]
  spacingGuides?: MeasurementGuide[]
  svgRef?: Ref<SVGSVGElement>
  editingTextId?: string | null
  canvasWidth?: number
  canvasHeight?: number
  resolveSrc?: (src: string) => string
  onElementPointerDown?: (elementId: string, event: PointerEvent<SVGGElement>) => void
  onTextElementDoubleClick?: (elementId: string) => void
  moveableTargetIds?: string[]
  moveableSnapTargetIds?: string[]
  moveableEnabled?: boolean
  moveableRefreshKey?: string
  dimensionLabel?: { x: number; y: number; width: number; height: number } | null
  onMoveableDragStart?: () => void
  onMoveableDrag?: (translateX: number, translateY: number) => void
  onMoveableDragEnd?: (isDrag: boolean) => void
  onMoveableScaleStart?: () => void
  onMoveableScale?: (width: number, height: number) => void
  onMoveableScaleEnd?: (isDrag: boolean) => void
  onMoveableGroupDragStart?: () => void
  onMoveableGroupDrag?: (translateX: number, translateY: number) => void
  onMoveableGroupDragEnd?: (isDrag: boolean) => void
  onMoveableGroupScaleStart?: () => void
  onMoveableGroupScale?: (groupWidth: number, groupHeight: number) => void
  onMoveableGroupScaleEnd?: (isDrag: boolean) => void
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
  guides,
  spacingGuides,
  svgRef,
  editingTextId,
  canvasWidth,
  canvasHeight,
  resolveSrc,
  onElementPointerDown,
  onTextElementDoubleClick,
  moveableTargetIds,
  moveableSnapTargetIds,
  moveableEnabled,
  moveableRefreshKey,
  dimensionLabel,
  onMoveableDragStart,
  onMoveableDrag,
  onMoveableDragEnd,
  onMoveableScaleStart,
  onMoveableScale,
  onMoveableScaleEnd,
  onMoveableGroupDragStart,
  onMoveableGroupDrag,
  onMoveableGroupDragEnd,
  onMoveableGroupScaleStart,
  onMoveableGroupScale,
  onMoveableGroupScaleEnd,
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
              guides={guides}
              spacingGuides={spacingGuides}
              svgRef={svgRef}
              editingTextId={editingTextId}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              resolveSrc={resolveSrc}
              onElementPointerDown={onElementPointerDown}
              onTextElementDoubleClick={onTextElementDoubleClick}
              moveableTargetIds={moveableTargetIds}
              moveableSnapTargetIds={moveableSnapTargetIds}
              moveableEnabled={moveableEnabled}
              moveableRefreshKey={moveableRefreshKey}
              dimensionLabel={dimensionLabel}
              onMoveableDragStart={onMoveableDragStart}
              onMoveableDrag={onMoveableDrag}
              onMoveableDragEnd={onMoveableDragEnd}
              onMoveableScaleStart={onMoveableScaleStart}
              onMoveableScale={onMoveableScale}
              onMoveableScaleEnd={onMoveableScaleEnd}
              onMoveableGroupDragStart={onMoveableGroupDragStart}
              onMoveableGroupDrag={onMoveableGroupDrag}
              onMoveableGroupDragEnd={onMoveableGroupDragEnd}
              onMoveableGroupScaleStart={onMoveableGroupScaleStart}
              onMoveableGroupScale={onMoveableGroupScale}
              onMoveableGroupScaleEnd={onMoveableGroupScaleEnd}
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
