/**
 * @file Spacing measurement guides and Moveable snappable guideline adapter.
 *
 * Provides spacing/distance measurement guides between scene elements and a
 * guideline adapter (`buildMoveableGuidelines`) that converts scene element
 * edge positions into the format expected by react-moveable's `snappable`
 * elementGuidelines. Snap/drag/resize engines have been migrated to
 * react-moveable and are no longer defined here.
 */

import { type Rect } from './scene'
import { SpatialIndex } from './spatial-index'

// ---------------------------------------------------------------------------
// Moveable snappable guideline adapter
// ---------------------------------------------------------------------------

export type MoveableGuideline = {
  direction: 'vertical' | 'horizontal'
  pos: number[]
}

/** Builds vertical/horizontal guideline position arrays from scene element rects. */
export function buildMoveableGuidelines(elements: Rect[]): MoveableGuideline[] {
  const verticalPositions: number[] = []
  const horizontalPositions: number[] = []

  for (const el of elements) {
    verticalPositions.push(el.x, el.x + el.width / 2, el.x + el.width)
    horizontalPositions.push(el.y, el.y + el.height / 2, el.y + el.height)
  }

  return [
    { direction: 'vertical', pos: [...new Set(verticalPositions)] },
    { direction: 'horizontal', pos: [...new Set(horizontalPositions)] },
  ]
}

// ---------------------------------------------------------------------------
// Spacing measurement guides
// ---------------------------------------------------------------------------

const SPACING_ALIGN_THRESHOLD = 5

export type ExtensionLine = {
  x1: number
  y1: number
  x2: number
  y2: number
}

export type MeasurementGuide = {
  direction: 'horizontal' | 'vertical'
  measurementLine: {
    x1: number
    y1: number
    x2: number
    y2: number
  }
  extensionLines: ExtensionLine[]
  label: {
    x: number
    y: number
    value: number
  }
  mode?: 'drag' | 'keyboard'
}

/**
 * Computes spacing measurement guides between a dragged element and nearby
 * target elements. Each guide shows the distance between the closest pair of
 * parallel edges.
 */
export function computeSpacingGuides(
  dragged: Rect,
  targets: Rect[],
  alignThreshold = SPACING_ALIGN_THRESHOLD,
): MeasurementGuide[] {
  const guides: MeasurementGuide[] = []

  for (const target of targets) {
    // Vertical spacing: left-right or right-left edge pairs
    {
      const dlr = Math.abs(dragged.x - (target.x + target.width))
      const drl = Math.abs(dragged.x + dragged.width - target.x)

      if (dlr <= alignThreshold || drl <= alignThreshold) {
        const useLR = dlr <= drl
        const gap = useLR ? dlr : drl
        const draggedEdge = useLR ? dragged.x : dragged.x + dragged.width
        const targetEdge = useLR ? target.x + target.width : target.x

        const minY = Math.max(dragged.y, target.y)
        const maxY = Math.min(dragged.y + dragged.height, target.y + target.height)
        const midY = (minY + maxY) / 2

        guides.push({
          direction: 'vertical',
          measurementLine: {
            x1: draggedEdge,
            y1: midY,
            x2: targetEdge,
            y2: midY,
          },
          extensionLines: [
            { x1: draggedEdge, y1: minY, x2: draggedEdge, y2: maxY },
            { x1: targetEdge, y1: minY, x2: targetEdge, y2: maxY },
          ],
          label: {
            x: (draggedEdge + targetEdge) / 2,
            y: midY - 8,
            value: Math.round(gap),
          },
        })
      }
    }

    // Horizontal spacing: top-bottom or bottom-top edge pairs
    {
      const dtb = Math.abs(dragged.y - (target.y + target.height))
      const dbt = Math.abs(dragged.y + dragged.height - target.y)

      if (dtb <= alignThreshold || dbt <= alignThreshold) {
        const useTB = dtb <= dbt
        const gap = useTB ? dtb : dbt
        const draggedEdge = useTB ? dragged.y : dragged.y + dragged.height
        const targetEdge = useTB ? target.y + target.height : target.y

        const minX = Math.max(dragged.x, target.x)
        const maxX = Math.min(dragged.x + dragged.width, target.x + target.width)
        const midX = (minX + maxX) / 2

        guides.push({
          direction: 'horizontal',
          measurementLine: {
            x1: midX,
            y1: draggedEdge,
            x2: midX,
            y2: targetEdge,
          },
          extensionLines: [
            { x1: minX, y1: draggedEdge, x2: maxX, y2: draggedEdge },
            { x1: minX, y1: targetEdge, x2: maxX, y2: targetEdge },
          ],
          label: {
            x: midX + 8,
            y: (draggedEdge + targetEdge) / 2,
            value: Math.round(gap),
          },
        })
      }
    }
  }

  return guides
}

// ---------------------------------------------------------------------------
// Optimized variant (spatial-index accelerated)
// ---------------------------------------------------------------------------

const GUIDE_QUERY_RANGE = 200

/**
 * Spatial-index-accelerated variant of {@link computeSpacingGuides}. Only
 * elements within `GUIDE_QUERY_RANGE` pixels of `dragged` are considered.
 */
export function computeSpacingGuidesOptimized(
  dragged: Rect,
  spatialIndex: SpatialIndex,
  alignThreshold = SPACING_ALIGN_THRESHOLD,
): MeasurementGuide[] {
  const nearbyRects = spatialIndex.queryNearby(dragged, GUIDE_QUERY_RANGE)
  return computeSpacingGuides(dragged, nearbyRects, alignThreshold)
}
