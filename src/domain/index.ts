// Scene domain (core)
export * from './scene'

// SVG serialization (scene → svg markup)
export {
  resolvePaint,
  textAnchorForAlign,
  textX,
  sceneToSvgMarkup,
  renderDefs,
  renderBackground,
  gradientVector,
} from './svg-serializer'
