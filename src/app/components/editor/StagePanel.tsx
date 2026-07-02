'use client'

import type { Ref, WheelEvent as ReactWheelEvent } from 'react'
import SceneCanvas from '../SceneCanvas'
import type { Scene } from '@/domain'
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
  editingTextId?: string | null
  svgRef?: Ref<SVGSVGElement>
  canvasWidth?: number
  canvasHeight?: number
  resolveSrc?: (src: string) => string
  onTextElementDoubleClick?: (elementId: string) => void
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
  editingTextId,
  svgRef,
  canvasWidth,
  canvasHeight,
  resolveSrc,
  onTextElementDoubleClick,
}: StagePanelProps) {
  return (
    <section className={styles.stagePanel} aria-label="Canvas preview">
      <div className={styles.stageHeader}>
        <span className={styles.stageStatus}>{status}</span>
        <div className={styles.stageHeaderTools}>
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
              editingTextId={editingTextId}
              svgRef={svgRef}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              resolveSrc={resolveSrc}
              onTextElementDoubleClick={onTextElementDoubleClick}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
