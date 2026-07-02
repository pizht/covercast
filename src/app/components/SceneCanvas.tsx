import type { Ref } from 'react'
import { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT, type Scene } from '@/domain'
import { SceneDefs, backgroundMaskId, hasBackgroundCutouts } from './canvas/SceneDefs'
import { ElementView } from './canvas/elements/ElementView'

type SceneCanvasProps = {
  scene: Scene
  className?: string
  style?: React.CSSProperties
  idPrefix?: string
  interactive?: boolean
  editingTextId?: string | null
  canvasWidth?: number
  canvasHeight?: number
  resolveSrc?: (src: string) => string
  svgRef?: Ref<SVGSVGElement>
  onTextElementDoubleClick?: (elementId: string) => void
}

export default function SceneCanvas({
  scene,
  className,
  style,
  idPrefix = 'scene',
  interactive = false,
  editingTextId,
  canvasWidth = DEFAULT_CANVAS_WIDTH,
  canvasHeight = DEFAULT_CANVAS_HEIGHT,
  resolveSrc,
  svgRef,
  onTextElementDoubleClick,
}: SceneCanvasProps) {
  const visibleElements = scene.elements.filter((element) => element.hidden !== true)

  return (
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
          hasBackgroundCutouts(visibleElements) ? `url(#${backgroundMaskId(idPrefix)})` : undefined
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
          onDoubleClick={onTextElementDoubleClick}
        />
      ))}
    </svg>
  )
}

function clampOpacity(value: number) {
  if (!Number.isFinite(value)) {
    return 1
  }

  return Math.min(Math.max(value, 0), 1)
}
