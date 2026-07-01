import { useEffect, useState, type PointerEvent, type Ref } from 'react'
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
  editingTextId,
  isGroupDragging = false,
  canvasWidth = DEFAULT_CANVAS_WIDTH,
  canvasHeight = DEFAULT_CANVAS_HEIGHT,
  resolveSrc,
  onElementPointerDown,
  onResizePointerDown,
  onGroupDragPointerDown,
  onGroupResizePointerDown,
  onTextElementDoubleClick,
  moveableTargetIds = [],
  moveableSnapTargetIds = [],
  moveableEnabled = false,
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
  selectoSelectableTargetIds = [],
  selectoEnabled = false,
  onSelectoDragStart,
  onSelectoSelectEnd,
}: SceneCanvasProps) {
  const [shiftKeyPressed, setShiftKeyPressed] = useState(false)

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

  return (
    <>
      <svg
        ref={svgRef}
        className={className}
        viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
        role="img"
        aria-label="Covercast OBS live background"
        preserveAspectRatio="xMidYMid meet"
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
            {moveableTargetIds.length > 0
              ? null
              : selectedElements.map((element) => (
                  <SelectionFrame
                    key={element.id}
                    element={element}
                    onResizePointerDown={
                      selectedElements.length === 1 ? onResizePointerDown : undefined
                    }
                  />
                ))}
            {selectedElements.length > 1 && !isGroupDragging && moveableTargetIds.length <= 1 ? (
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
        svgRef={svgRef}
        targetElementIds={moveableTargetIds}
        snapTargetIds={moveableSnapTargetIds}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        enabled={moveableEnabled && interactive}
        onDragStart={onMoveableDragStart}
        onDrag={onMoveableDrag}
        onDragEnd={onMoveableDragEnd}
        onResizeStart={onMoveableResizeStart}
        onResize={onMoveableResize}
        onResizeEnd={onMoveableResizeEnd}
        onGroupDragStart={onMoveableGroupDragStart}
        onGroupDrag={onMoveableGroupDrag}
        onGroupDragEnd={onMoveableGroupDragEnd}
        onGroupResizeStart={onMoveableGroupResizeStart}
        onGroupResize={onMoveableGroupResize}
        onGroupResizeEnd={onMoveableGroupResizeEnd}
      />
      <SelectoLayer
        svgRef={svgRef}
        selectableTargetIds={selectoSelectableTargetIds}
        enabled={selectoEnabled && interactive}
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
