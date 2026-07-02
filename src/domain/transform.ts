/**
 * @file Element geometry utilities.
 *
 * Provides bounding-box computation and a dimension formatter for display
 * labels. Drag/resize/scale operations have been migrated to react-moveable
 * and are no longer defined here.
 */

import type { SceneElement } from './scene'

export type ResizeHandleType = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

export type BoundingBox = {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Computes the axis-aligned bounding box that contains all given elements.
 * Returns a zero-sized box at the origin when the input is empty.
 */
export function computeBoundingBox(elements: SceneElement[]): BoundingBox {
  if (elements.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const element of elements) {
    minX = Math.min(minX, element.x)
    minY = Math.min(minY, element.y)
    maxX = Math.max(maxX, element.x + element.width)
    maxY = Math.max(maxY, element.y + element.height)
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

/**
 * Formats a `width × height` pair as a rounded display string.
 * @returns A string like `"300 × 180"`.
 */
export function formatDimension(width: number, height: number): string {
  return `${Math.round(width)} × ${Math.round(height)}`
}
