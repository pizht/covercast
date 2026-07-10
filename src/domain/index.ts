// Scene domain (core)
export * from './scene'

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
