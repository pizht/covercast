'use client'

import type { RefObject } from 'react'
import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'

const Selecto = dynamic(() => import('react-selecto').then((mod) => mod.default), {
  ssr: false,
})

type SelectoLayerProps = {
  svgRef: RefObject<SVGSVGElement | null>
  selectableTargetIds: string[]
  enabled?: boolean
  onDragStart?: () => void
  onSelectEnd?: (selectedIds: string[], isShiftPressed: boolean) => void
}

export function SelectoLayer({
  svgRef,
  selectableTargetIds,
  enabled = false,
  onDragStart,
  onSelectEnd,
}: SelectoLayerProps) {
  const [container, setContainer] = useState<HTMLElement | null>(null)

  // 使用 SVG 的父元素作为 container，让 Selecto 在 CSS 像素空间工作
  // 避免 SVG viewBox → 屏幕像素的坐标转换导致选框错位
  useEffect(() => {
    const el = svgRef.current?.parentElement ?? null
    setContainer(el)
  }, [svgRef])

  // CSS 选择器在 container（SVG 父元素）内查找子元素
  const selectableSelectors = useMemo(() => {
    return selectableTargetIds.map((id) => `[data-element-id="${id}"]`)
  }, [selectableTargetIds])

  if (!enabled || !container) {
    return null
  }

  return (
    <Selecto
      dragContainer={container}
      container={container}
      selectableTargets={selectableSelectors}
      selectFromInside={false}
      hitRate={0}
      continueSelect={false}
      selectByClick={false}
      ratio={0}
      onDragStart={() => {
        onDragStart?.()
      }}
      onSelectEnd={(e) => {
        const isShiftPressed = e.inputEvent?.shiftKey ?? false
        const afterSelectIds: string[] = []

        if (e.selected.length > 0) {
          for (const el of e.selected) {
            const elementId = el.getAttribute('data-element-id')
            if (elementId) {
              afterSelectIds.push(elementId)
            }
          }
        }

        onSelectEnd?.(afterSelectIds, isShiftPressed)
      }}
    />
  )
}
