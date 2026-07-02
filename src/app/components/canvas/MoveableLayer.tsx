'use client'

import type { RefObject } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

const Moveable = dynamic(() => import('react-moveable').then((mod) => mod.default), {
  ssr: false,
})

type MoveableLayerProps = {
  svgRef: RefObject<SVGSVGElement | null>
  enabled: boolean
  targetId: string | null
  canvasZoom: number
  onDragStart?: (targetId: string) => void
  onDrag?: (targetId: string, dx: number, dy: number) => void
  onDragEnd?: (targetId: string, dx: number, dy: number) => void
  onResizeStart?: (targetId: string) => void
  onResize?: (targetId: string, width: number, height: number, dx: number, dy: number) => void
  onResizeEnd?: (targetId: string, width: number, height: number, dx: number, dy: number) => void
}

export function MoveableLayer({
  svgRef,
  enabled,
  targetId,
  canvasZoom,
  onDragStart,
  onDrag,
  onDragEnd,
  onResizeStart,
  onResize,
  onResizeEnd,
}: MoveableLayerProps) {
  const [container, setContainer] = useState<SVGSVGElement | null>(null)

  // 在 effect 中安全地同步 svgRef
  useEffect(() => {
    setContainer(svgRef.current)
  }, [svgRef])

  // 根据 targetId 和 container 计算目标 DOM 元素
  const target = useMemo(() => {
    if (!enabled || !targetId || !container) {
      return null
    }
    const el = container.querySelector(`[data-element-id="${targetId}"]`)
    return (el as HTMLElement) ?? null
  }, [enabled, targetId, container])

  // OnDragEnd / OnResizeEnd 类型不含 beforeTranslate/width/height，
  // 通过内部 ref 在 onDrag / onResize 中缓存最后一次值
  const lastDragRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 })
  const lastResizeRef = useRef<{ width: number; height: number; dx: number; dy: number }>({
    width: 0,
    height: 0,
    dx: 0,
    dy: 0,
  })

  if (!enabled || !target || !container) {
    return null
  }

  return (
    <Moveable
      target={target}
      rootContainer={container as unknown as HTMLElement}
      transformOrigin="0 0"
      zoom={canvasZoom}
      draggable={true}
      resizable={true}
      snappable={false}
      rotatable={false}
      origin={false}
      throttleDrag={0}
      throttleResize={0}
      onDragStart={({ target: t }) => {
        lastDragRef.current = { dx: 0, dy: 0 }
        const elementId = t.getAttribute('data-element-id')
        if (elementId) {
          onDragStart?.(elementId)
        }
      }}
      onDrag={({ target: t, beforeTranslate }) => {
        lastDragRef.current = { dx: beforeTranslate[0], dy: beforeTranslate[1] }
        const elementId = t.getAttribute('data-element-id')
        if (elementId) {
          onDrag?.(elementId, beforeTranslate[0], beforeTranslate[1])
        }
      }}
      onDragEnd={({ target: t }) => {
        const elementId = t.getAttribute('data-element-id')
        if (elementId) {
          const { dx, dy } = lastDragRef.current
          onDragEnd?.(elementId, dx, dy)
        }
      }}
      onResizeStart={({ target: t }) => {
        lastResizeRef.current = { width: 0, height: 0, dx: 0, dy: 0 }
        const elementId = t.getAttribute('data-element-id')
        if (elementId) {
          onResizeStart?.(elementId)
        }
      }}
      onResize={({ target: t, width, height, drag }) => {
        lastResizeRef.current = {
          width,
          height,
          dx: drag.beforeTranslate[0],
          dy: drag.beforeTranslate[1],
        }
        const elementId = t.getAttribute('data-element-id')
        if (elementId) {
          onResize?.(elementId, width, height, drag.beforeTranslate[0], drag.beforeTranslate[1])
        }
      }}
      onResizeEnd={({ target: t }) => {
        const elementId = t.getAttribute('data-element-id')
        if (elementId) {
          const { width, height, dx, dy } = lastResizeRef.current
          onResizeEnd?.(elementId, width, height, dx, dy)
        }
      }}
    />
  )
}
