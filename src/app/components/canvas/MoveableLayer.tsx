'use client'

import dynamic from 'next/dynamic'
import { flushSync } from 'react-dom'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type Ref } from 'react'
import type {
  MoveableProps,
  OnDrag,
  OnDragEnd,
  OnDragGroup,
  OnDragGroupEnd,
  OnDragGroupStart,
  OnDragStart,
  OnScale,
  OnScaleEnd,
  OnScaleGroup,
  OnScaleGroupEnd,
  OnScaleGroupStart,
  OnScaleStart,
} from 'react-moveable'

const Moveable = dynamic(() => import('react-moveable').then((mod) => mod.default), {
  ssr: false,
}) as React.ComponentType<MoveableProps & { ref?: React.Ref<{ updateRect: () => void }> }>

type MoveableLayerProps = {
  svgRef?: Ref<SVGSVGElement> | null
  containerRef?: Ref<HTMLDivElement> | null
  targetElementIds: string[]
  snapTargetIds: string[]
  canvasWidth: number
  canvasHeight: number
  refreshKey?: string
  enabled?: boolean
  onDragStart?: () => void
  onDrag?: (translateX: number, translateY: number) => void
  onDragEnd?: (isDrag: boolean) => void
  onScaleStart?: () => void
  onScale?: (width: number, height: number) => void
  onScaleEnd?: (isDrag: boolean) => void
  onGroupDragStart?: () => void
  onGroupDrag?: (translateX: number, translateY: number) => void
  onGroupDragEnd?: (isDrag: boolean) => void
  onGroupScaleStart?: () => void
  onGroupScale?: (groupWidth: number, groupHeight: number) => void
  onGroupScaleEnd?: (isDrag: boolean) => void
}

export function MoveableLayer({
  svgRef,
  containerRef,
  targetElementIds,
  snapTargetIds,
  canvasWidth,
  refreshKey = '',
  enabled = false,
  onDragStart,
  onDrag,
  onDragEnd,
  onScaleStart,
  onScale,
  onScaleEnd,
  onGroupDragStart,
  onGroupDrag,
  onGroupDragEnd,
  onGroupScaleStart,
  onGroupScale,
  onGroupScaleEnd,
}: MoveableLayerProps) {
  const [targets, setTargets] = useState<SVGGElement[]>([])
  const [snapTargets, setSnapTargets] = useState<SVGGElement[]>([])
  const [zoom, setZoom] = useState(1)
  const [shiftPressed, setShiftPressed] = useState(false)
  const moveableRef = useRef<{ updateRect: () => void } | null>(null)

  const svgEl = (svgRef as React.RefObject<SVGSVGElement> | null)?.current ?? null
  const containerEl = (containerRef as React.RefObject<HTMLDivElement> | null)?.current ?? null

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

  useEffect(() => {
    if (!enabled) {
      return
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Shift') {
        setShiftPressed(true)
      }
    }
    function handleKeyUp(e: KeyboardEvent) {
      if (e.key === 'Shift') {
        setShiftPressed(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled || effectiveTargets.length === 0) {
      return
    }
    // refreshKey 变化时（方向键移动元素后）强制 Moveable 重新读取目标位置
    moveableRef.current?.updateRect()
  }, [refreshKey, enabled, effectiveTargets.length])

  const elementGuidelines = useMemo(
    () => snapTargets.map((element) => ({ element, refresh: true })),
    [snapTargets],
  )

  const handleDragStart = useCallback(
    (e: OnDragStart) => {
      e.set([0, 0])
      onDragStart?.()
    },
    [onDragStart],
  )

  const handleDrag = useCallback(
    (e: OnDrag) => {
      const [tx, ty] = e.translate
      onDrag?.(tx, ty)
    },
    [onDrag],
  )

  const handleDragEnd = useCallback(
    (e: OnDragEnd) => {
      onDragEnd?.(e.isDrag)
    },
    [onDragEnd],
  )

  const handleScaleStart = useCallback(
    (e: OnScaleStart) => {
      e.set([1, 1])
      onScaleStart?.()
    },
    [onScaleStart],
  )

  const handleScale = useCallback(
    (e: OnScale) => {
      const width = e.offsetWidth * e.scale[0]
      const height = e.offsetHeight * e.scale[1]
      onScale?.(width, height)
    },
    [onScale],
  )

  const handleScaleEnd = useCallback(
    (e: OnScaleEnd) => {
      onScaleEnd?.(e.isDrag)
    },
    [onScaleEnd],
  )

  const handleDragGroupStart = useCallback(
    (e: OnDragGroupStart) => {
      e.set([0, 0])
      onGroupDragStart?.()
    },
    [onGroupDragStart],
  )

  const handleDragGroup = useCallback(
    (e: OnDragGroup) => {
      const [tx, ty] = e.translate
      onGroupDrag?.(tx, ty)
    },
    [onGroupDrag],
  )

  const handleDragGroupEnd = useCallback(
    (e: OnDragGroupEnd) => {
      onGroupDragEnd?.(e.isDrag)
    },
    [onGroupDragEnd],
  )

  const handleScaleGroupStart = useCallback(
    (e: OnScaleGroupStart) => {
      e.set([1, 1])
      onGroupScaleStart?.()
    },
    [onGroupScaleStart],
  )

  const handleScaleGroup = useCallback(
    (e: OnScaleGroup) => {
      const width = e.offsetWidth * e.scale[0]
      const height = e.offsetHeight * e.scale[1]
      onGroupScale?.(width, height)
    },
    [onGroupScale],
  )

  const handleScaleGroupEnd = useCallback(
    (e: OnScaleGroupEnd) => {
      onGroupScaleEnd?.(e.isDrag)
    },
    [onGroupScaleEnd],
  )

  if (!enabled || effectiveTargets.length === 0 || !containerEl) {
    return null
  }

  const isGroup = effectiveTargets.length > 1

  return (
    <Moveable
      ref={moveableRef}
      {...(isGroup ? { targets: effectiveTargets } : { target: effectiveTargets[0] })}
      container={containerEl}
      draggable
      scalable
      renderDirections={['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w']}
      keepRatio={shiftPressed}
      throttleScale={0}
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
      onScaleStart={handleScaleStart}
      onScale={handleScale}
      onScaleEnd={handleScaleEnd}
      onDragGroupStart={handleDragGroupStart}
      onDragGroup={handleDragGroup}
      onDragGroupEnd={handleDragGroupEnd}
      onScaleGroupStart={handleScaleGroupStart}
      onScaleGroup={handleScaleGroup}
      onScaleGroupEnd={handleScaleGroupEnd}
    />
  )
}
