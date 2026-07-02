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

export type GuideMode = 'drag' | 'keyboard'

export type GuideContext = {
  mode: GuideMode
}

export type GuideDirection = 'horizontal' | 'vertical'

export type GuideType = 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom'

export type GuideLine = {
  direction: GuideDirection
  type: GuideType
  x1: number
  y1: number
  x2: number
  y2: number
  mode?: GuideMode
}

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
  mode?: GuideMode
}

export type ResizeLabel = {
  x: number
  y: number
  w: number
  h: number
}

export type CanvasSizeOptions = {
  canvasWidth?: number
  canvasHeight?: number
}

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

type MeasurementCandidate = {
  guide: MeasurementGuide
  distance: number
  hasAlignment: boolean
  position: 'left' | 'right' | 'top' | 'bottom'
}

/**
 * Computes spacing measurement guides between the dragged rect and others
 * that share a vertical or horizontal alignment. Returns at most one guide
 * per side (left/right/top/bottom), choosing the nearest aligned candidate.
 */
export function computeSpacingGuides(
  dragged: Rect,
  others: Rect[],
  alignThreshold = SPACING_ALIGN_THRESHOLD,
): MeasurementGuide[] {
  if (others.length === 0) return []

  const dLeft = dragged.x
  const dCenterH = dragged.x + dragged.width / 2
  const dRight = dragged.x + dragged.width
  const dTop = dragged.y
  const dCenterV = dragged.y + dragged.height / 2
  const dBottom = dragged.y + dragged.height

  const leftCandidates: MeasurementCandidate[] = []
  const rightCandidates: MeasurementCandidate[] = []
  const topCandidates: MeasurementCandidate[] = []
  const bottomCandidates: MeasurementCandidate[] = []

  for (const other of others) {
    const oLeft = other.x
    const oCenterH = other.x + other.width / 2
    const oRight = other.x + other.width
    const oTop = other.y
    const oCenterV = other.y + other.height / 2
    const oBottom = other.y + other.height

    if (dRight <= oLeft) {
      const gap = oLeft - dRight
      const vAlign = checkVerticalAlignment(
        dTop,
        dCenterV,
        dBottom,
        oTop,
        oCenterV,
        oBottom,
        alignThreshold,
      )
      if (vAlign) {
        const guide = createHorizontalMeasurementGuide(
          dRight,
          oLeft,
          dCenterV,
          dTop,
          dBottom,
          oTop,
          oBottom,
          gap,
        )
        rightCandidates.push({ guide, distance: gap, hasAlignment: vAlign, position: 'right' })
      }
    } else if (oRight <= dLeft) {
      const gap = dLeft - oRight
      const vAlign = checkVerticalAlignment(
        dTop,
        dCenterV,
        dBottom,
        oTop,
        oCenterV,
        oBottom,
        alignThreshold,
      )
      if (vAlign) {
        const guide = createHorizontalMeasurementGuide(
          oRight,
          dLeft,
          dCenterV,
          oTop,
          oBottom,
          dTop,
          dBottom,
          gap,
        )
        leftCandidates.push({ guide, distance: gap, hasAlignment: vAlign, position: 'left' })
      }
    }

    if (dBottom <= oTop) {
      const gap = oTop - dBottom
      const hAlign = checkHorizontalAlignment(
        dLeft,
        dCenterH,
        dRight,
        oLeft,
        oCenterH,
        oRight,
        alignThreshold,
      )
      if (hAlign) {
        const guide = createVerticalMeasurementGuide(
          dBottom,
          oTop,
          dCenterH,
          dLeft,
          dRight,
          oLeft,
          oRight,
          gap,
        )
        bottomCandidates.push({ guide, distance: gap, hasAlignment: hAlign, position: 'bottom' })
      }
    } else if (oBottom <= dTop) {
      const gap = dTop - oBottom
      const hAlign = checkHorizontalAlignment(
        dLeft,
        dCenterH,
        dRight,
        oLeft,
        oCenterH,
        oRight,
        alignThreshold,
      )
      if (hAlign) {
        const guide = createVerticalMeasurementGuide(
          oBottom,
          dTop,
          dCenterH,
          oLeft,
          oRight,
          dLeft,
          dRight,
          gap,
        )
        topCandidates.push({ guide, distance: gap, hasAlignment: hAlign, position: 'top' })
      }
    }
  }

  const selectedGuides: MeasurementGuide[] = []

  const bestLeft = selectBestCandidate(leftCandidates)
  if (bestLeft) selectedGuides.push(bestLeft.guide)
  const bestRight = selectBestCandidate(rightCandidates)
  if (bestRight) selectedGuides.push(bestRight.guide)
  const bestTop = selectBestCandidate(topCandidates)
  if (bestTop) selectedGuides.push(bestTop.guide)
  const bestBottom = selectBestCandidate(bottomCandidates)
  if (bestBottom) selectedGuides.push(bestBottom.guide)

  return selectedGuides
}

/** Picks the best measurement candidate: aligned ones first, then by distance. */
function selectBestCandidate(candidates: MeasurementCandidate[]): MeasurementCandidate | null {
  if (candidates.length === 0) return null
  if (candidates.length === 1) return candidates[0]

  candidates.sort((a, b) => {
    if (a.hasAlignment !== b.hasAlignment) {
      return a.hasAlignment ? -1 : 1
    }
    return a.distance - b.distance
  })

  return candidates[0]
}

/** Returns `true` when the dragged and other rect share any vertical edge/center alignment. */
function checkVerticalAlignment(
  dTop: number,
  dCenterV: number,
  dBottom: number,
  oTop: number,
  oCenterV: number,
  oBottom: number,
  threshold: number,
): boolean {
  return (
    Math.abs(dCenterV - oTop) < threshold ||
    Math.abs(dCenterV - oCenterV) < threshold ||
    Math.abs(dCenterV - oBottom) < threshold ||
    Math.abs(dTop - oTop) < threshold ||
    Math.abs(dTop - oBottom) < threshold ||
    Math.abs(dBottom - oTop) < threshold ||
    Math.abs(dBottom - oBottom) < threshold
  )
}

/** Returns `true` when the dragged and other rect share any horizontal edge/center alignment. */
function checkHorizontalAlignment(
  dLeft: number,
  dCenterH: number,
  dRight: number,
  oLeft: number,
  oCenterH: number,
  oRight: number,
  threshold: number,
): boolean {
  return (
    Math.abs(dCenterH - oLeft) < threshold ||
    Math.abs(dCenterH - oCenterH) < threshold ||
    Math.abs(dCenterH - oRight) < threshold ||
    Math.abs(dLeft - oLeft) < threshold ||
    Math.abs(dLeft - oRight) < threshold ||
    Math.abs(dRight - oLeft) < threshold ||
    Math.abs(dRight - oRight) < threshold
  )
}

/** Builds a horizontal spacing measurement guide with extension lines to the measured edges. */
function createHorizontalMeasurementGuide(
  startX: number,
  endX: number,
  centerY: number,
  startTop: number,
  startBottom: number,
  endTop: number,
  endBottom: number,
  gap: number,
): MeasurementGuide {
  const measurementLine = { x1: startX, y1: centerY, x2: endX, y2: centerY }
  const extensionLines: ExtensionLine[] = []

  const startContainsCenter = centerY >= startTop && centerY <= startBottom
  const endContainsCenter = centerY >= endTop && centerY <= endBottom

  if (!startContainsCenter) {
    const nearestStartEdge = findNearestEdge(centerY, startTop, startBottom)
    extensionLines.push({ x1: startX, y1: nearestStartEdge, x2: startX, y2: centerY })
  }

  if (!endContainsCenter) {
    const nearestEndEdge = findNearestEdge(centerY, endTop, endBottom)
    extensionLines.push({ x1: endX, y1: nearestEndEdge, x2: endX, y2: centerY })
  }

  const labelX = (startX + endX) / 2
  const labelY = centerY

  return {
    direction: 'horizontal',
    measurementLine,
    extensionLines,
    label: { x: labelX, y: labelY, value: Math.round(gap) },
  }
}

/** Builds a vertical spacing measurement guide with extension lines to the measured edges. */
function createVerticalMeasurementGuide(
  startY: number,
  endY: number,
  centerX: number,
  startLeft: number,
  startRight: number,
  endLeft: number,
  endRight: number,
  gap: number,
): MeasurementGuide {
  const measurementLine = { x1: centerX, y1: startY, x2: centerX, y2: endY }
  const extensionLines: ExtensionLine[] = []

  const startContainsCenter = centerX >= startLeft && centerX <= startRight
  const endContainsCenter = centerX >= endLeft && centerX <= endRight

  if (!startContainsCenter) {
    const nearestStartEdge = findNearestEdge(centerX, startLeft, startRight)
    extensionLines.push({ x1: nearestStartEdge, y1: startY, x2: centerX, y2: startY })
  }

  if (!endContainsCenter) {
    const nearestEndEdge = findNearestEdge(centerX, endLeft, endRight)
    extensionLines.push({ x1: nearestEndEdge, y1: endY, x2: centerX, y2: endY })
  }

  const labelX = centerX
  const labelY = (startY + endY) / 2

  return {
    direction: 'vertical',
    measurementLine,
    extensionLines,
    label: { x: labelX, y: labelY, value: Math.round(gap) },
  }
}

/** Returns whichever of `min`/`max` is closer to `value`. */
function findNearestEdge(value: number, min: number, max: number): number {
  const distToMin = Math.abs(value - min)
  const distToMax = Math.abs(value - max)
  return distToMin <= distToMax ? min : max
}

// ---------------------------------------------------------------------------
// Optimized variants (spatial-index accelerated)
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
