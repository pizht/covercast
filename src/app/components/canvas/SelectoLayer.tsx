'use client'

import dynamic from 'next/dynamic'
import { useEffect, useLayoutEffect, useState, type Ref } from 'react'
import type { OnDragStart, OnSelectEnd } from 'react-selecto'

const Selecto = dynamic(() => import('react-selecto').then((mod) => mod.default), {
  ssr: false,
})

type SelectoLayerProps = {
  svgRef?: Ref<SVGSVGElement> | null
  selectableTargetIds: string[]
  enabled?: boolean
  onDragStart?: (isShiftPressed: boolean) => void
  onSelectEnd?: (selectedIds: string[], isShiftPressed: boolean, isClick: boolean) => void
}

export function SelectoLayer({
  svgRef,
  selectableTargetIds,
  enabled = false,
  onDragStart,
  onSelectEnd,
}: SelectoLayerProps) {
  const [container, setContainer] = useState<SVGSVGElement | null>(null)
  const [selectableTargets, setSelectableTargets] = useState<SVGGElement[]>([])
  const [dragContainer, setDragContainer] = useState<HTMLElement | null>(null)

  const svgEl = (svgRef as React.RefObject<SVGSVGElement> | null)?.current ?? null

  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- SVG 容器需写入 state 才能传给 Selecto
    setContainer(svgEl)
    if (!enabled || !svgEl || selectableTargetIds.length === 0) {
      setSelectableTargets([])
      return
    }
    const nodes = selectableTargetIds
      .map((id) => svgEl.querySelector<SVGGElement>(`g[data-element-id="${CSS.escape(id)}"]`))
      .filter((n): n is SVGGElement => n !== null)
    setSelectableTargets(nodes)
  }, [svgEl, selectableTargetIds, enabled])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- document.body 仅在客户端可用，需写入 state 触发渲染
    setDragContainer(document.body)
  }, [])

  if (!enabled || !container || !dragContainer || selectableTargets.length === 0) {
    return null
  }

  const handleDragStart = (e: OnDragStart) => {
    onDragStart?.(Boolean((e.inputEvent as { shiftKey?: boolean } | null)?.shiftKey))
  }

  const handleSelectEnd = (e: OnSelectEnd) => {
    const ids = e.selected
      .map((el) => el.getAttribute('data-element-id'))
      .filter((id): id is string => id !== null)
    const isShiftPressed = Boolean((e.inputEvent as { shiftKey?: boolean } | null)?.shiftKey)
    onSelectEnd?.(ids, isShiftPressed, e.isClick)
  }

  return (
    <Selecto
      container={container as unknown as HTMLElement}
      dragContainer={dragContainer}
      selectableTargets={selectableTargets}
      selectFromInside={false}
      selectByClick={false}
      preventDragFromInside={false}
      continueSelect={false}
      hitRate={0}
      preventDefault
      onDragStart={handleDragStart}
      onSelectEnd={handleSelectEnd}
    />
  )
}
