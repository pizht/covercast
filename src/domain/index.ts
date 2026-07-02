// Scene domain (core)
export * from './scene'

// Alignment (spacing + Moveable snappable adapter)
export {
  type ExtensionLine,
  type MeasurementGuide,
  type MoveableGuideline,
  buildMoveableGuidelines,
  computeSpacingGuides,
  computeSpacingGuidesOptimized,
} from './alignment'

// Transform (bounding-box)
export { type BoundingBox, computeBoundingBox } from './transform'

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
