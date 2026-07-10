import { type Ref } from 'react'
import { DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT, type Scene } from '@/domain'
import { SceneDefs, backgroundMaskId, hasBackgroundCutouts } from './canvas/SceneDefs'
import { ElementView } from './canvas/elements/ElementView'

type SceneCanvasProps = {
  scene: Scene
  className?: string
  style?: React.CSSProperties
  idPrefix?: string
  /** Ignored — SceneCanvas is non-interactive (used by /live and test pages) */
  interactive?: boolean
  canvasWidth?: number
  canvasHeight?: number
  resolveSrc?: (src: string) => string
  svgRef?: Ref<SVGSVGElement>
}

export default function SceneCanvas({
  scene,
  className,
  style,
  idPrefix = 'scene',
  // 'interactive' prop is accepted for backward compat but ignored
  canvasWidth = DEFAULT_CANVAS_WIDTH,
  canvasHeight = DEFAULT_CANVAS_HEIGHT,
  resolveSrc,
  svgRef,
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
          resolveSrc={resolveSrc}
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
