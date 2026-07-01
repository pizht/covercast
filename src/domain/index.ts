// Scene domain (core)
export * from './scene'

// Alignment (smart-guide)
export {
  type GuideMode,
  type GuideDirection,
  type GuideType,
  type GuideLine,
  type ExtensionLine,
  type MeasurementGuide,
  computeGuides,
  computeSpacingGuides,
  computeGuidesOptimized,
  computeSpacingGuidesOptimized,
} from './alignment'

// Transform (group-drag)
export { type BoundingBox, computeBoundingBox } from './transform'

// Marquee (selection-box + hit-test)
export {
  type MarqueeState,
  type HitTestStrategy,
  createMarqueeState,
  startMarquee,
  updateMarquee,
  clearMarquee,
  getMarqueeRect,
  isMarqueeActive,
  hasMarqueeSize,
  getElementBounds,
  intersectsRect,
  containsRect,
  hitTestElement,
  hitTestElements,
} from './marquee'

// SVG serialization (scene → svg markup)
export {
  resolvePaint,
  textAnchorForAlign,
  textX,
  elementBounds,
  sceneToSvgMarkup,
  renderDefs,
  renderBackground,
  gradientVector,
} from './svg-serializer'

// Selection
export {
  type SelectionState,
  createSelectionState,
  selectSingle,
  toggleSelection,
  clearSelection,
  isSelected,
  getSelectedCount,
  hasSelection,
  getFirstSelectedId,
  handleElementClick,
  selectMultiple,
} from './selection'

// Spatial Index
export { SpatialIndex, buildSpatialIndex } from './spatial-index'
