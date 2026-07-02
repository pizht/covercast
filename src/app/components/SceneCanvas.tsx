import { useEffect, useState, type PointerEvent } from 'react'
import type { RefObject } from 'react'
import { useRef } from 'react'
import {
  DEFAULT_CANVAS_WIDTH,
  DEFAULT_CANVAS_HEIGHT,
  type Scene,
  type GuideLine,
  type MeasurementGuide,
  type ResizeLabel,
  type ResizeHandleType,
} from '@/domain'
import { SceneDefs, backgroundMaskId, hasBackgroundCutouts } from './canvas/SceneDefs'
import { ElementView } from './canvas/elements/ElementView'
import { SelectionFrame } from './canvas/SelectionFrame'
import { GroupSelectionFrame } from './canvas/GroupSelectionFrame'
import { SmartGuideOverlay } from './canvas/SmartGuideOverlay'
import { ResizeLabelOverlay } from './canvas/ResizeLabelOverlay'
import { SpacingGuideOverlay } from './canvas/SpacingGuideOverlay'
import { MoveableLayer } from './canvas/MoveableLayer'
import { SelectoLayer } from './canvas/SelectoLayer'

type SceneCanvasProps = {
  scene: Scene
  className?: string
  style?: React.CSSProperties
  idPrefix?: string
  interactive?: boolean
  selectedIds?: string[]
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
  canvasZoom?: number
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

export default function SceneCanvas({
  scene,
  className,
  style,
  idPrefix = 'scene',
  interactive = false,
  selectedIds = [],
  guides,
  spacingGuides,
  resizeLabel,
  svgRef,
  selectableTargetIds = [],
  editingTextId,
  isGroupDragging = false,
  canvasWidth = DEFAULT_CANVAS_WIDTH,
  canvasHeight = DEFAULT_CANVAS_HEIGHT,
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
  canvasZoom = 1,
  onMoveableDragStart,
  onMoveableDrag,
  onMoveableDragEnd,
  onMoveableResizeStart,
  onMoveableResize,
  onMoveableResizeEnd,
}: SceneCanvasProps) {
  const [shiftKeyPressed, setShiftKeyPressed] = useState(false)

  // svgRef 可能由外部传入，fallback 内部 ref 供 SelectoLayer 使用
  const internalSvgRef = useRef<SVGSVGElement>(null)
  const effectiveSvgRef = svgRef ?? internalSvgRef

  useEffect(() => {
    if (!interactive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setShiftKeyPressed(true)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setShiftKeyPressed(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [interactive])

  const visibleElements = scene.elements.filter((element) => element.hidden !== true)
  const selectedElements = visibleElements.filter((element) => selectedIds.includes(element.id))
  const moveableEnabled = interactive && selectedIds.length === 1 && moveableTargetId != null

  return (
    <>
      <svg
        ref={effectiveSvgRef}
        className={className}
        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
        role="img"
        aria-label="Covercast OBS live background"
        preserveAspectRatio="xMidYMid meet"
        onPointerDown={onCanvasPointerDown}
        style={{
          ...style,
          touchAction: interactive ? 'none' : undefined,
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        <SceneDefs
          visibleElements={visibleElements}
          idPrefix={idPrefix}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
        />

        <g
          mask={
            hasBackgroundCutouts(visibleElements)
              ? `url(#${backgroundMaskId(idPrefix)})`
              : undefined
          }
        >
          <rect
            width={canvasWidth}
            height={canvasHeight}
            fill={scene.backgroundColor}
            opacity={clampOpacity(scene.backgroundOpacity)}
          />
          <rect
            width={canvasWidth}
            height={canvasHeight}
            fill={`url(#${idPrefix}-bg-glow)`}
            opacity={0.68 * clampOpacity(scene.backgroundOpacity)}
          />
        </g>

        {visibleElements.map((element) => (
          <ElementView
            key={element.id}
            element={element}
            idPrefix={idPrefix}
            interactive={interactive}
            editingTextId={editingTextId}
            resolveSrc={resolveSrc}
            onPointerDown={onElementPointerDown}
            onDoubleClick={onTextElementDoubleClick}
          />
        ))}

        {interactive && selectedElements.length > 0 ? (
          <>
            {selectedElements.map((element) => (
              <SelectionFrame
                key={element.id}
                element={element}
                showResizeHandle={!moveableEnabled}
                onResizePointerDown={
                  selectedElements.length === 1 && !moveableEnabled
                    ? onResizePointerDown
                    : undefined
                }
              />
            ))}
            {selectedElements.length > 1 && !isGroupDragging ? (
              <GroupSelectionFrame
                elements={selectedElements}
                shiftKeyPressed={shiftKeyPressed}
                onDragPointerDown={onGroupDragPointerDown}
                onResizePointerDown={onGroupResizePointerDown}
              />
            ) : null}
          </>
        ) : null}

        {guides && guides.length > 0 ? <SmartGuideOverlay guides={guides} /> : null}

        {resizeLabel ? <ResizeLabelOverlay resizeLabel={resizeLabel} /> : null}

        {spacingGuides && spacingGuides.length > 0 ? (
          <SpacingGuideOverlay spacingGuides={spacingGuides} />
        ) : null}
      </svg>
      <MoveableLayer
        svgRef={effectiveSvgRef}
        enabled={moveableEnabled}
        targetId={moveableTargetId ?? null}
        canvasZoom={canvasZoom}
        onDragStart={onMoveableDragStart}
        onDrag={onMoveableDrag}
        onDragEnd={onMoveableDragEnd}
        onResizeStart={onMoveableResizeStart}
        onResize={onMoveableResize}
        onResizeEnd={onMoveableResizeEnd}
      />
      <SelectoLayer
        svgRef={effectiveSvgRef}
        selectableTargetIds={selectableTargetIds}
        enabled={interactive}
        onDragStart={onSelectoDragStart}
        onSelectEnd={onSelectoSelectEnd}
      />
    </>
  )
}

function clampOpacity(value: number) {
  if (!Number.isFinite(value)) {
    return 1
  }

  return Math.min(Math.max(value, 0), 1)
}
