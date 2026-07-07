'use client';

import { memo, type MouseEvent } from 'react';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  type Scene,
  type SceneElement,
  type ShapeElement,
  type ImageElement,
} from '../lib/scene';
import { getShapeStyle, getTextStyle, getImageStyle } from '../lib/scene-styles';

type HtmlSceneCanvasProps = {
  scene: Scene;
  className?: string;
  interactive?: boolean;
  selectedId?: string | null;
  onElementClick?: (id: string) => void;
  onCanvasClick?: () => void;
};

export default memo(function HtmlSceneCanvas({
  scene,
  className,
  interactive = false,
  selectedId,
  onElementClick,
  onCanvasClick,
}: HtmlSceneCanvasProps) {
  const visibleElements = scene.elements.filter((el) => el.hidden !== true);

  const backgroundCutouts = visibleElements.filter(
    (el): el is ShapeElement =>
      (el.type === 'rect' || el.type === 'ellipse') &&
      el.backgroundCutout === true
  );

  const maskImage =
    backgroundCutouts.length > 0
      ? generateMaskImage(backgroundCutouts)
      : undefined;

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: `${CANVAS_WIDTH}px`,
        height: `${CANVAS_HEIGHT}px`,
        overflow: 'hidden',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCanvasClick?.();
        }
      }}
    >
      {/* 背景层 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: scene.backgroundColor,
          opacity: scene.backgroundOpacity,
          maskImage,
          WebkitMaskImage: maskImage,
        }}
      />

      {/* 背景光晕 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 48% 28%, rgba(78,114,255,0.75) 0%, rgba(41,73,215,0.18) 64%, rgba(22,43,148,0.42) 100%)',
          opacity: 0.68 * scene.backgroundOpacity,
          pointerEvents: 'none',
          maskImage,
          WebkitMaskImage: maskImage,
        }}
      />

      {/* 元素层 */}
      {visibleElements.map((element) => (
        <HtmlElementView
          key={element.id}
          element={element}
          interactive={interactive}
          onClick={() => onElementClick?.(element.id)}
        />
      ))}

      {/* 选中框 */}
      {interactive && selectedId && (
        <SelectionOverlay
          element={visibleElements.find((el) => el.id === selectedId)}
        />
      )}
    </div>
  );
});

function HtmlElementView({
  element,
  interactive,
  onClick,
}: {
  element: SceneElement;
  interactive: boolean;
  onClick: () => void;
}) {
  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (interactive && !element.locked) {
      onClick();
    }
  };

  if (element.type === 'text') {
    return (
      <div
        data-element-id={element.id}
        style={getTextStyle(element)}
        onClick={handleClick}
      >
        {element.text.split('\n').map((line, i) => (
          <div key={i}>{line || ' '}</div>
        ))}
      </div>
    );
  }

  if (element.type === 'image') {
    return <HtmlImageElement element={element} onClick={handleClick} />;
  }

  return (
    <div
      data-element-id={element.id}
      style={getShapeStyle(element)}
      onClick={handleClick}
    />
  );
}

function HtmlImageElement({
  element,
  onClick,
}: {
  element: ImageElement;
  onClick: () => void;
}) {
  const style = getImageStyle(element);

  if (!element.src) {
    return (
      <div
        data-element-id={element.id}
        style={{
          ...style,
          background: '#edf3ff',
          border: '5px solid #ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
        }}
        onClick={onClick}
      >
        <span
          style={{
            color: '#163690',
            fontSize: `${Math.min(element.width, element.height) * 0.36}px`,
            fontWeight: 900,
          }}
        >
          {element.fallbackText || '图'}
        </span>
      </div>
    );
  }

  return (
    <img
      data-element-id={element.id}
      src={element.src}
      alt={element.alt}
      style={style}
      onClick={onClick}
    />
  );
}

function SelectionOverlay({ element }: { element?: SceneElement }) {
  if (!element) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${element.x}px`,
        top: `${element.y}px`,
        width: `${element.width}px`,
        height: `${element.height}px`,
        border: '3px solid #f8d84a',
        pointerEvents: 'none',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          position: 'absolute',
          right: '-10px',
          bottom: '-10px',
          width: '20px',
          height: '20px',
          background: '#f8d84a',
          border: '2px solid #132060',
          borderRadius: '4px',
        }}
      />
    </div>
  );
}

function generateMaskImage(cutouts: ShapeElement[]): string {
  const svgParts = [
    `<svg xmlns='http://www.w3.org/2000/svg' width='${CANVAS_WIDTH}' height='${CANVAS_HEIGHT}'>`,
    `<rect width='${CANVAS_WIDTH}' height='${CANVAS_HEIGHT}' fill='white'/>`,
  ];

  cutouts.forEach((cutout) => {
    if (cutout.type === 'ellipse') {
      const cx = cutout.x + cutout.width / 2;
      const cy = cutout.y + cutout.height / 2;
      const rx = cutout.width / 2;
      const ry = cutout.height / 2;
      svgParts.push(
        `<ellipse cx='${cx}' cy='${cy}' rx='${rx}' ry='${ry}' fill='black'/>`
      );
    } else {
      const { x, y, width, height, radius = 0 } = cutout;
      svgParts.push(
        `<rect x='${x}' y='${y}' width='${width}' height='${height}' rx='${radius}' fill='black'/>`
      );
    }
  });

  svgParts.push(`</svg>`);

  return `url("data:image/svg+xml,${encodeURIComponent(svgParts.join(''))}")`;
}
