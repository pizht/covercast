'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import type MoveableType from 'react-moveable'
import type { OnDrag, OnResize, OnDragGroup, OnResizeGroup } from 'react-moveable'
import type { Scene } from '@/domain'

type MoveableLayerProps = {
  svgRef: React.RefObject<SVGSVGElement | null>
  scene: Scene
  selectedIds: string[]
  changeScene: (updater: (scene: Scene) => Scene, description?: string) => void
}

export default function MoveableLayer({
  svgRef,
  scene,
  selectedIds,
  changeScene,
}: MoveableLayerProps) {
  const [MoveableComp, setMoveableComp] = useState<typeof MoveableType | null>(null)
  const containerRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    let cancelled = false
    import('react-moveable').then((mod) => {
      if (!cancelled) setMoveableComp(() => mod.default)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Keep containerRef in sync with svgRef so we can pass it to Moveable
  useEffect(() => {
    containerRef.current = svgRef.current
  })

  // Snap positions from non-selected, visible, non-locked elements
  const { verticalSnap, horizontalSnap } = useMemo(() => {
    const vPos: number[] = []
    const hPos: number[] = []
    for (const el of scene.elements) {
      if (el.hidden || el.locked || selectedIds.includes(el.id)) continue
      vPos.push(el.x, el.x + el.width / 2, el.x + el.width)
      hPos.push(el.y, el.y + el.height / 2, el.y + el.height)
    }
    return {
      verticalSnap: [...new Set(vPos)],
      horizontalSnap: [...new Set(hPos)],
    }
  }, [scene.elements, selectedIds])

  // Only non-locked selected elements can be dragged/resized
  const movableIds = useMemo(() => {
    return selectedIds.filter((id) => {
      const el = scene.elements.find((e) => e.id === id)
      return el && !el.locked
    })
  }, [scene.elements, selectedIds])

  const targetSelector = useMemo(() => {
    if (movableIds.length === 0) return ''
    return movableIds.map((id) => `[data-element-id="${id}"]`).join(',')
  }, [movableIds])

  const handleDrag = useCallback(
    (e: OnDrag) => {
      const el = e.target as SVGElement
      const id = el.getAttribute('data-element-id')
      if (!id) return
      changeScene((prev) => ({
        ...prev,
        elements: prev.elements.map((el) =>
          el.id === id ? { ...el, x: el.x + e.beforeDelta[0], y: el.y + e.beforeDelta[1] } : el,
        ),
      }))
    },
    [changeScene],
  )

  const handleDragGroup = useCallback(
    (e: OnDragGroup) => {
      const ids = new Set(movableIds)
      changeScene((prev) => ({
        ...prev,
        elements: prev.elements.map((el) =>
          ids.has(el.id) ? { ...el, x: el.x + e.beforeDelta[0], y: el.y + e.beforeDelta[1] } : el,
        ),
      }))
    },
    [changeScene, movableIds],
  )

  const handleResize = useCallback(
    (e: OnResize) => {
      const el = e.target as SVGElement
      const id = el.getAttribute('data-element-id')
      if (!id) return
      changeScene((prev) => ({
        ...prev,
        elements: prev.elements.map((el) => {
          if (el.id !== id) return el
          return {
            ...el,
            x: el.x + e.drag.beforeTranslate[0],
            y: el.y + e.drag.beforeTranslate[1],
            width: e.width,
            height: e.height,
          }
        }),
      }))
    },
    [changeScene],
  )

  const handleResizeGroup = useCallback(
    (e: OnResizeGroup) => {
      const ids = new Set(movableIds)
      changeScene((prev) => ({
        ...prev,
        elements: prev.elements.map((el) => {
          if (!ids.has(el.id)) return el
          const childEvent = e.events.find(
            (ev) => (ev.target as SVGElement).getAttribute('data-element-id') === el.id,
          )
          if (!childEvent) return el
          return {
            ...el,
            x: el.x + childEvent.drag.beforeTranslate[0],
            y: el.y + childEvent.drag.beforeTranslate[1],
            width: childEvent.width,
            height: childEvent.height,
          }
        }),
      }))
    },
    [changeScene, movableIds],
  )

  if (!MoveableComp || movableIds.length === 0) return null

  return (
    <MoveableComp
      target={targetSelector}
      draggable={true}
      resizable={true}
      snappable={true}
      verticalGuidelines={verticalSnap}
      horizontalGuidelines={horizontalSnap}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rootContainer={containerRef as any}
      transformOrigin="0 0"
      onDrag={handleDrag}
      onDragGroup={handleDragGroup}
      onResize={handleResize}
      onResizeGroup={handleResizeGroup}
      // Prevent Moveable from updating element styles — we handle position via React state
      useMutationObserver={true}
    />
  )
}
