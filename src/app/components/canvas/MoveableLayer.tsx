'use client'

import dynamic from 'next/dynamic'
import { flushSync } from 'react-dom'
import { useEffect, useLayoutEffect, useMemo, useState, type Ref } from 'react'
import type {
  OnDrag,
  OnDragEnd,
  OnDragGroup,
  OnDragGroupEnd,
  OnDragGroupStart,
  OnDragStart,
  OnResize,
  OnResizeEnd,
  OnResizeGroup,
  OnResizeGroupEnd,
  OnResizeGroupStart,
  OnResizeStart,
} from 'react-moveable'

const Moveable = dynamic(() => import('react-moveable').then((mod) => mod.default), {
  ssr: false,
})

type MoveableLayerProps = {
  svgRef?: Ref<SVGSVGElement> | null
  targetElementIds: string[]
  snapTargetIds: string[]
  canvasWidth: number
  canvasHeight: number
  enabled?: boolean
  onDragStart?: () => void
  onDrag?: (translateX: number, translateY: number) => void
  onDragEnd?: (isDrag: boolean) => void
  onResizeStart?: () => void
  onResize?: (width: number, height: number) => void
  onResizeEnd?: (isDrag: boolean) => void
  onGroupDragStart?: () => void
  onGroupDrag?: (translateX: number, translateY: number) => void
  onGroupDragEnd?: (isDrag: boolean) => void
  onGroupResizeStart?: () => void
  onGroupResize?: (groupWidth: number, groupHeight: number) => void
  onGroupResizeEnd?: (isDrag: boolean) => void
}

export function MoveableLayer({
  svgRef,
  targetElementIds,
  snapTargetIds,
  canvasWidth,
  enabled = false,
  onDragStart,
  onDrag,
  onDragEnd,
  onResizeStart,
  onResize,
  onResizeEnd,
  onGroupDragStart,
  onGroupDrag,
  onGroupDragEnd,
  onGroupResizeStart,
  onGroupResize,
  onGroupResizeEnd,
}: MoveableLayerProps) {
  const [targets, setTargets] = useState<SVGGElement[]>([])
  const [snapTargets, setSnapTargets] = useState<SVGGElement[]>([])
  const [zoom, setZoom] = useState(1)

  const svgEl = (svgRef as React.RefObject<SVGSVGElement> | null)?.current ?? null

  useLayoutEffect(() => {
    if (!enabled || !svgEl || targetElementIds.length === 0) {
      return
    }
    const nodes = targetElementIds
      .map((id) => svgEl.querySelector<SVGGElement>(`g[data-element-id="${CSS.escape(id)}"]`))
      .filter((n): n is SVGGElement => n !== null)
    const snapNodes = snapTargetIds
      .map((id) => svgEl.querySelector<SVGGElement>(`g[data-element-id="${CSS.escape(id)}"]`))
      .filter((n): n is SVGGElement => n !== null)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 查询到的 DOM 节点需写入 state 才能传给 Moveable，无副作用更优解
    setTargets(nodes)
    setSnapTargets(snapNodes)
  }, [svgEl, targetElementIds, snapTargetIds, enabled])

  const effectiveTargets = targets.filter(
    (t) => t.isConnected && targetElementIds.includes(t.getAttribute('data-element-id') ?? ''),
  )

  useEffect(() => {
    if (!svgEl) {
      return
    }

    function updateZoom() {
      const el = (svgRef as React.RefObject<SVGSVGElement> | null)?.current
      if (!el) {
        return
      }
      const rect = el.getBoundingClientRect()
      if (rect.width > 0 && canvasWidth > 0) {
        setZoom(rect.width / canvasWidth)
      }
    }

    updateZoom()
    const observer = new ResizeObserver(updateZoom)
    observer.observe(svgEl)
    return () => {
      observer.disconnect()
    }
  }, [svgEl, canvasWidth, svgRef])

  const elementGuidelines = useMemo(
    () => snapTargets.map((element) => ({ element, refresh: true })),
    [snapTargets],
  )

  if (!enabled || effectiveTargets.length === 0) {
    return null
  }

  const isGroup = effectiveTargets.length > 1
  const moveableTarget = isGroup ? effectiveTargets : effectiveTargets[0]

  const handleDragStart = (e: OnDragStart) => {
    e.set([0, 0])
    onDragStart?.()
  }

  const handleDrag = (e: OnDrag) => {
    const [tx, ty] = e.translate
    onDrag?.(tx, ty)
  }

  const handleDragEnd = (e: OnDragEnd) => {
    onDragEnd?.(e.isDrag)
  }

  const handleResizeStart = (e: OnResizeStart) => {
    e.setMin([0, 0])
    onResizeStart?.()
  }

  const handleResize = (e: OnResize) => {
    onResize?.(e.width, e.height)
  }

  const handleResizeEnd = (e: OnResizeEnd) => {
    onResizeEnd?.(e.isDrag)
  }

  const handleDragGroupStart = (e: OnDragGroupStart) => {
    e.set([0, 0])
    onGroupDragStart?.()
  }

  const handleDragGroup = (e: OnDragGroup) => {
    const [tx, ty] = e.translate
    onGroupDrag?.(tx, ty)
  }

  const handleDragGroupEnd = (e: OnDragGroupEnd) => {
    onGroupDragEnd?.(e.isDrag)
  }

  const handleResizeGroupStart = (e: OnResizeGroupStart) => {
    e.setMin([0, 0])
    onGroupResizeStart?.()
  }

  const handleResizeGroup = (e: OnResizeGroup) => {
    onGroupResize?.(e.width, e.height)
  }

  const handleResizeGroupEnd = (e: OnResizeGroupEnd) => {
    onGroupResizeEnd?.(e.isDrag)
  }

  return (
    <Moveable
      target={moveableTarget}
      draggable
      resizable
      renderDirections={['se']}
      snappable
      elementGuidelines={elementGuidelines}
      snapDirections={{
        left: true,
        top: true,
        right: true,
        bottom: true,
        center: true,
        middle: true,
      }}
      elementSnapDirections={{
        left: true,
        top: true,
        right: true,
        bottom: true,
        center: true,
        middle: true,
      }}
      snapGap
      isDisplaySnapDigit
      snapHorizontalThreshold={5}
      snapVerticalThreshold={5}
      origin={false}
      transformOrigin="0 0"
      zoom={zoom}
      flushSync={flushSync}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      onResizeStart={handleResizeStart}
      onResize={handleResize}
      onResizeEnd={handleResizeEnd}
      onDragGroupStart={handleDragGroupStart}
      onDragGroup={handleDragGroup}
      onDragGroupEnd={handleDragGroupEnd}
      onResizeGroupStart={handleResizeGroupStart}
      onResizeGroup={handleResizeGroup}
      onResizeGroupEnd={handleResizeGroupEnd}
    />
  )
}
