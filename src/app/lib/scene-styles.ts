import type {
  ShapeElement,
  TextElement,
  ImageElement,
  GradientDirection,
} from './scene';

export function gradientToCSS(direction: GradientDirection): string {
  const map: Record<GradientDirection, string> = {
    horizontal: 'to right',
    vertical: 'to bottom',
    'diagonal-down': 'to bottom right',
    'diagonal-up': 'to top right',
  };
  return map[direction];
}

export function resolveShapeFillCSS(element: ShapeElement): string {
  if (element.fillMode === 'gradient' && element.gradient) {
    const { startColor, endColor, direction } = element.gradient;
    return `linear-gradient(${gradientToCSS(direction)}, ${startColor}, ${endColor})`;
  }

  if (element.fill === 'courseGradient') {
    return 'linear-gradient(to right, #ffffff 0%, #ffffff 54%, #99f19c 100%)';
  }
  if (element.fill === 'accentGradient') {
    return 'linear-gradient(to bottom right, #73f08c, #2859d7)';
  }

  return element.fill;
}

export function getPositionStyle(el: {
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  return {
    position: 'absolute',
    left: `${el.x}px`,
    top: `${el.y}px`,
    width: `${el.width}px`,
    height: `${el.height}px`,
  } as const;
}

export function getShapeStyle(element: ShapeElement) {
  const base = getPositionStyle(element);

  if (element.backgroundCutout) {
    return { ...base, background: 'transparent' };
  }

  return {
    ...base,
    background: resolveShapeFillCSS(element),
    borderRadius:
      element.type === 'ellipse' ? '50%' : `${element.radius ?? 0}px`,
    border:
      element.stroke && element.strokeWidth
        ? `${element.strokeWidth}px solid ${element.stroke}`
        : undefined,
    opacity: element.opacity ?? 1,
  };
}

export function getTextStyle(element: TextElement) {
  return {
    ...getPositionStyle(element),
    color: element.fill,
    fontSize: `${element.fontSize}px`,
    fontFamily: element.fontFamily,
    fontWeight: element.fontWeight,
    textAlign: element.align,
    lineHeight: `${element.fontSize * element.lineHeight}px`,
    opacity: element.opacity ?? 1,
    display: 'flex',
    flexDirection: 'column',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  };
}

export function getImageStyle(element: ImageElement) {
  return {
    ...getPositionStyle(element),
    borderRadius: element.shape === 'circle' ? '50%' : undefined,
    opacity: element.opacity ?? 1,
    objectFit: element.fit,
    overflow: 'hidden',
  };
}
