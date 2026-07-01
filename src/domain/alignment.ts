/**
 * @file Alignment guides and spacing measurements.
 *
 * Computes visual guide lines (canvas edges/centers and element-to-element
 * alignments) and spacing/distance measurement guides between elements.
 * Optimized variants delegate to a `SpatialIndex` so only nearby elements
 * are considered.
 */

import { DEFAULT_CANVAS_HEIGHT, DEFAULT_CANVAS_WIDTH, type Rect } from './scene'
import { SpatialIndex } from './spatial-index'

export type GuideMode = 'drag' | 'keyboard'

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

const DEFAULT_THRESHOLD = 5

/**
 * Computes alignment guide lines for the dragged rect against canvas edges
 * and other rects. Returns guides for left/center-h/right (vertical) and
 * top/center-v/bottom (horizontal) alignments within `threshold` pixels.
 * @param dragged - The rect currently being dragged.
 * @param others - Other rects to test against.
 * @param threshold - Pixel tolerance for an alignment match. Defaults to `5`.
 * @param canvasWidth - Canvas width for edge/center guides.
 * @param canvasHeight - Canvas height for edge/center guides.
 * @returns An array of `GuideLine` instances to render.
 */
export function computeGuides(
  dragged: Rect,
  others: Rect[],
  threshold = DEFAULT_THRESHOLD,
  canvasWidth = DEFAULT_CANVAS_WIDTH,
  canvasHeight = DEFAULT_CANVAS_HEIGHT,
): GuideLine[] {
  const guides: GuideLine[] = []

  const dLeft = dragged.x
  const dCenterH = dragged.x + dragged.width / 2
  const dRight = dragged.x + dragged.width
  const dTop = dragged.y
  const dCenterV = dragged.y + dragged.height / 2
  const dBottom = dragged.y + dragged.height

  const canvasCx = canvasWidth / 2
  const canvasCy = canvasHeight / 2

  if (Math.abs(dLeft - 0) < threshold) {
    guides.push({
      direction: 'vertical',
      type: 'left',
      x1: 0,
      y1: 0,
      x2: 0,
      y2: canvasHeight,
    })
  }

  if (Math.abs(dRight - canvasWidth) < threshold) {
    guides.push({
      direction: 'vertical',
      type: 'right',
      x1: canvasWidth,
      y1: 0,
      x2: canvasWidth,
      y2: canvasHeight,
    })
  }

  if (Math.abs(dCenterH - canvasCx) < threshold) {
    guides.push({
      direction: 'vertical',
      type: 'center-h',
      x1: canvasCx,
      y1: 0,
      x2: canvasCx,
      y2: canvasHeight,
    })
  }

  if (Math.abs(dTop - 0) < threshold) {
    guides.push({
      direction: 'horizontal',
      type: 'top',
      x1: 0,
      y1: 0,
      x2: canvasWidth,
      y2: 0,
    })
  }

  if (Math.abs(dBottom - canvasHeight) < threshold) {
    guides.push({
      direction: 'horizontal',
      type: 'bottom',
      x1: 0,
      y1: canvasHeight,
      x2: canvasWidth,
      y2: canvasHeight,
    })
  }

  if (Math.abs(dCenterV - canvasCy) < threshold) {
    guides.push({
      direction: 'horizontal',
      type: 'center-v',
      x1: 0,
      y1: canvasCy,
      x2: canvasWidth,
      y2: canvasCy,
    })
  }

  if (others.length === 0) {
    return guides
  }

  for (const other of others) {
    const oLeft = other.x
    const oCenterH = other.x + other.width / 2
    const oRight = other.x + other.width
    const oTop = other.y
    const oCenterV = other.y + other.height / 2
    const oBottom = other.y + other.height

    const spanX1 = Math.min(dLeft, oLeft)
    const spanX2 = Math.max(dRight, oRight)
    const spanY1 = Math.min(dTop, oTop)
    const spanY2 = Math.max(dBottom, oBottom)

    if (Math.abs(dLeft - oLeft) < threshold) {
      guides.push({
        direction: 'vertical',
        type: 'left',
        x1: dLeft,
        y1: spanY1,
        x2: dLeft,
        y2: spanY2,
      })
    }

    if (Math.abs(dLeft - oRight) < threshold) {
      guides.push({
        direction: 'vertical',
        type: 'left',
        x1: dLeft,
        y1: spanY1,
        x2: dLeft,
        y2: spanY2,
      })
    }

    if (Math.abs(dCenterH - oCenterH) < threshold) {
      guides.push({
        direction: 'vertical',
        type: 'center-h',
        x1: dCenterH,
        y1: spanY1,
        x2: dCenterH,
        y2: spanY2,
      })
    }

    if (Math.abs(dCenterH - oLeft) < threshold) {
      guides.push({
        direction: 'vertical',
        type: 'center-h',
        x1: dCenterH,
        y1: spanY1,
        x2: dCenterH,
        y2: spanY2,
      })
    }

    if (Math.abs(dCenterH - oRight) < threshold) {
      guides.push({
        direction: 'vertical',
        type: 'center-h',
        x1: dCenterH,
        y1: spanY1,
        x2: dCenterH,
        y2: spanY2,
      })
    }

    if (Math.abs(dRight - oRight) < threshold) {
      guides.push({
        direction: 'vertical',
        type: 'right',
        x1: dRight,
        y1: spanY1,
        x2: dRight,
        y2: spanY2,
      })
    }

    if (Math.abs(dRight - oLeft) < threshold) {
      guides.push({
        direction: 'vertical',
        type: 'right',
        x1: dRight,
        y1: spanY1,
        x2: dRight,
        y2: spanY2,
      })
    }

    if (Math.abs(dTop - oTop) < threshold) {
      guides.push({
        direction: 'horizontal',
        type: 'top',
        x1: spanX1,
        y1: dTop,
        x2: spanX2,
        y2: dTop,
      })
    }

    if (Math.abs(dTop - oBottom) < threshold) {
      guides.push({
        direction: 'horizontal',
        type: 'top',
        x1: spanX1,
        y1: dTop,
        x2: spanX2,
        y2: dTop,
      })
    }

    if (Math.abs(dCenterV - oCenterV) < threshold) {
      guides.push({
        direction: 'horizontal',
        type: 'center-v',
        x1: spanX1,
        y1: dCenterV,
        x2: spanX2,
        y2: dCenterV,
      })
    }

    if (Math.abs(dCenterV - oTop) < threshold) {
      guides.push({
        direction: 'horizontal',
        type: 'center-v',
        x1: spanX1,
        y1: dCenterV,
        x2: spanX2,
        y2: dCenterV,
      })
    }

    if (Math.abs(dCenterV - oBottom) < threshold) {
      guides.push({
        direction: 'horizontal',
        type: 'center-v',
        x1: spanX1,
        y1: dCenterV,
        x2: spanX2,
        y2: dCenterV,
      })
    }

    if (Math.abs(dBottom - oBottom) < threshold) {
      guides.push({
        direction: 'horizontal',
        type: 'bottom',
        x1: spanX1,
        y1: dBottom,
        x2: spanX2,
        y2: dBottom,
      })
    }

    if (Math.abs(dBottom - oTop) < threshold) {
      guides.push({
        direction: 'horizontal',
        type: 'bottom',
        x1: spanX1,
        y1: dBottom,
        x2: spanX2,
        y2: dBottom,
      })
    }
  }

  return guides
}

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
 * @param dragged - The rect currently being dragged.
 * @param others - Other rects to measure against.
 * @param alignThreshold - Pixel tolerance for alignment. Defaults to `5`.
 * @returns An array of `MeasurementGuide` instances.
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
        rightCandidates.push({
          guide,
          distance: gap,
          hasAlignment: vAlign,
          position: 'right',
        })
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
        leftCandidates.push({
          guide,
          distance: gap,
          hasAlignment: vAlign,
          position: 'left',
        })
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
        bottomCandidates.push({
          guide,
          distance: gap,
          hasAlignment: hAlign,
          position: 'bottom',
        })
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
        topCandidates.push({
          guide,
          distance: gap,
          hasAlignment: hAlign,
          position: 'top',
        })
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
  const measurementLine = {
    x1: startX,
    y1: centerY,
    x2: endX,
    y2: centerY,
  }

  const extensionLines: ExtensionLine[] = []

  const startContainsCenter = centerY >= startTop && centerY <= startBottom
  const endContainsCenter = centerY >= endTop && centerY <= endBottom

  if (!startContainsCenter) {
    const nearestStartEdge = findNearestEdge(centerY, startTop, startBottom)
    extensionLines.push({
      x1: startX,
      y1: nearestStartEdge,
      x2: startX,
      y2: centerY,
    })
  }

  if (!endContainsCenter) {
    const nearestEndEdge = findNearestEdge(centerY, endTop, endBottom)
    extensionLines.push({
      x1: endX,
      y1: nearestEndEdge,
      x2: endX,
      y2: centerY,
    })
  }

  const labelX = (startX + endX) / 2
  const labelY = centerY

  return {
    direction: 'horizontal',
    measurementLine,
    extensionLines,
    label: {
      x: labelX,
      y: labelY,
      value: Math.round(gap),
    },
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
  const measurementLine = {
    x1: centerX,
    y1: startY,
    x2: centerX,
    y2: endY,
  }

  const extensionLines: ExtensionLine[] = []

  const startContainsCenter = centerX >= startLeft && centerX <= startRight
  const endContainsCenter = centerX >= endLeft && centerX <= endRight

  if (!startContainsCenter) {
    const nearestStartEdge = findNearestEdge(centerX, startLeft, startRight)
    extensionLines.push({
      x1: nearestStartEdge,
      y1: startY,
      x2: centerX,
      y2: startY,
    })
  }

  if (!endContainsCenter) {
    const nearestEndEdge = findNearestEdge(centerX, endLeft, endRight)
    extensionLines.push({
      x1: nearestEndEdge,
      y1: endY,
      x2: centerX,
      y2: endY,
    })
  }

  const labelX = centerX
  const labelY = (startY + endY) / 2

  return {
    direction: 'vertical',
    measurementLine,
    extensionLines,
    label: {
      x: labelX,
      y: labelY,
      value: Math.round(gap),
    },
  }
}

/** Returns whichever of `min`/`max` is closer to `value`. */
function findNearestEdge(value: number, min: number, max: number): number {
  const distToMin = Math.abs(value - min)
  const distToMax = Math.abs(value - max)
  return distToMin <= distToMax ? min : max
}

const GUIDE_QUERY_RANGE = 200

/**
 * Spatial-index-accelerated variant of {@link computeGuides}. Only elements
 * within `GUIDE_QUERY_RANGE` pixels of `dragged` are considered.
 * @param dragged - The rect currently being dragged.
 * @param spatialIndex - Index of all candidate rects.
 * @param threshold - Pixel tolerance for an alignment match. Defaults to `5`.
 * @param canvasWidth - Canvas width for edge/center guides.
 * @param canvasHeight - Canvas height for edge/center guides.
 * @returns An array of `GuideLine` instances to render.
 */
export function computeGuidesOptimized(
  dragged: Rect,
  spatialIndex: SpatialIndex,
  threshold = DEFAULT_THRESHOLD,
  canvasWidth = DEFAULT_CANVAS_WIDTH,
  canvasHeight = DEFAULT_CANVAS_HEIGHT,
): GuideLine[] {
  const nearbyRects = spatialIndex.queryNearby(dragged, GUIDE_QUERY_RANGE)
  return computeGuides(dragged, nearbyRects, threshold, canvasWidth, canvasHeight)
}

/**
 * Spatial-index-accelerated variant of {@link computeSpacingGuides}. Only
 * elements within `GUIDE_QUERY_RANGE` pixels of `dragged` are considered.
 * @param dragged - The rect currently being dragged.
 * @param spatialIndex - Index of all candidate rects.
 * @param alignThreshold - Pixel tolerance for alignment. Defaults to `5`.
 * @returns An array of `MeasurementGuide` instances.
 */
export function computeSpacingGuidesOptimized(
  dragged: Rect,
  spatialIndex: SpatialIndex,
  alignThreshold = SPACING_ALIGN_THRESHOLD,
): MeasurementGuide[] {
  const nearbyRects = spatialIndex.queryNearby(dragged, GUIDE_QUERY_RANGE)
  return computeSpacingGuides(dragged, nearbyRects, alignThreshold)
}
