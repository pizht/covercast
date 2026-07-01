import { useRef, type PointerEvent, type Ref } from 'react'
import {
  DEFAULT_CANVAS_WIDTH,
  DEFAULT_CANVAS_HEIGHT,
  type Scene,
  type GuideLine,
  type MeasurementGuide,
} from '@/domain'
import { SceneDefs, backgroundMaskId, hasBackgroundCutouts } from './canvas/SceneDefs'
import { ElementView } from './canvas/elements/ElementView'
import { SmartGuideOverlay } from './canvas/SmartGuideOverlay'
import { SpacingGuideOverlay } from './canvas/SpacingGuideOverlay'
import { MoveableLayer } from './canvas/MoveableLayer'
import { SelectoLayer } from './canvas/SelectoLayer'

type SceneCanvasProps = {
  scene: Scene
  className?: string
  style?: React.CSSProperties
  idPrefix?: string
  interactive?: boolean
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

export default function SceneCanvas({
  scene,
  className,
  style,
  idPrefix = 'scene',
  interactive = false,
  guides,
  spacingGuides,
  svgRef,
  editingTextId,
  canvasWidth = DEFAULT_CANVAS_WIDTH,
  canvasHeight = DEFAULT_CANVAS_HEIGHT,
  resolveSrc,
  onElementPointerDown,
  onTextElementDoubleClick,
  moveableTargetIds = [],
  moveableSnapTargetIds = [],
  moveableEnabled = false,
  moveableRefreshKey = '',
  dimensionLabel = null,
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
  selectoSelectableTargetIds = [],
  selectoEnabled = false,
  onSelectoDragStart,
  onSelectoSelectEnd,
}: SceneCanvasProps) {
  const visibleElements = scene.elements.filter((element) => element.hidden !== true)
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        transform: 'translateZ(0)',
      }}
    >
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

        {guides && guides.length > 0 ? <SmartGuideOverlay guides={guides} /> : null}

        {spacingGuides && spacingGuides.length > 0 ? (
          <SpacingGuideOverlay spacingGuides={spacingGuides} />
        ) : null}

        {dimensionLabel ? (
          <g pointerEvents="none">
            <rect
              x={dimensionLabel.x + dimensionLabel.width / 2 - 40}
              y={dimensionLabel.y + dimensionLabel.height + 6}
              width={80}
              height={20}
              rx={3}
              fill="#243247"
              opacity={0.85}
            />
            <text
              x={dimensionLabel.x + dimensionLabel.width / 2}
              y={dimensionLabel.y + dimensionLabel.height + 20}
              textAnchor="middle"
              fill="#ffffff"
              fontSize={12}
              fontWeight={700}
            >
              {Math.round(dimensionLabel.width)} × {Math.round(dimensionLabel.height)}
            </text>
          </g>
        ) : null}
      </svg>
      <MoveableLayer
        svgRef={svgRef}
        containerRef={containerRef}
        targetElementIds={moveableTargetIds}
        snapTargetIds={moveableSnapTargetIds}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        refreshKey={moveableRefreshKey}
        enabled={moveableEnabled && interactive}
        onDragStart={onMoveableDragStart}
        onDrag={onMoveableDrag}
        onDragEnd={onMoveableDragEnd}
        onScaleStart={onMoveableScaleStart}
        onScale={onMoveableScale}
        onScaleEnd={onMoveableScaleEnd}
        onGroupDragStart={onMoveableGroupDragStart}
        onGroupDrag={onMoveableGroupDrag}
        onGroupDragEnd={onMoveableGroupDragEnd}
        onGroupScaleStart={onMoveableGroupScaleStart}
        onGroupScale={onMoveableGroupScale}
        onGroupScaleEnd={onMoveableGroupScaleEnd}
      />
      <SelectoLayer
        svgRef={svgRef}
        selectableTargetIds={selectoSelectableTargetIds}
        enabled={selectoEnabled && interactive}
        onDragStart={onSelectoDragStart}
        onSelectEnd={onSelectoSelectEnd}
      />
    </div>
  )
}

function clampOpacity(value: number) {
  if (!Number.isFinite(value)) {
    return 1
  }

  return Math.min(Math.max(value, 0), 1)
}
