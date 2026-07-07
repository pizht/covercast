'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import Moveable from 'react-moveable';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  type Scene,
  type SceneElement,
} from '../lib/scene';
import HtmlSceneCanvas from './HtmlSceneCanvas';

type InteractiveSceneCanvasProps = {
  scene: Scene;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, updates: Partial<SceneElement>) => void;
  zoom?: number;
};

export default function InteractiveSceneCanvas({
  scene,
  selectedId,
  onSelect,
  onUpdate,
  zoom = 1,
}: InteractiveSceneCanvasProps) {
  const moveableRef = useRef<Moveable>(null);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const dragStartPosRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const selectedElement = scene.elements.find((el) => el.id === selectedId);

  useEffect(() => {
    if (!selectedId) {
      setTargetElement(null);
      return;
    }
    
    const element = document.querySelector(
      `[data-element-id="${selectedId}"]`
    ) as HTMLElement | null;
    setTargetElement(element);
  }, [selectedId]);

  // 拖拽处理：实时更新位置
  const handleDrag = useCallback(
    (e: any) => {
      if (!selectedId || !dragStartPosRef.current) return;

      const startPos = dragStartPosRef.current;
      const { beforeTranslate } = e;

      onUpdate(selectedId, {
        x: startPos.x + beforeTranslate[0],
        y: startPos.y + beforeTranslate[1],
      });
    },
    [selectedId, onUpdate]
  );

  // 缩放处理：实时更新位置和尺寸
  const handleResize = useCallback(
    (e: any) => {
      if (!selectedId || !dragStartPosRef.current) return;

      const startPos = dragStartPosRef.current;
      const { width, height, drag } = e;

      let newX = startPos.x;
      let newY = startPos.y;

      if (drag && drag.beforeTranslate) {
        newX = startPos.x + drag.beforeTranslate[0];
        newY = startPos.y + drag.beforeTranslate[1];
      }

      onUpdate(selectedId, {
        width: Math.max(20, width),
        height: Math.max(20, height),
        x: newX,
        y: newY,
      });
    },
    [selectedId, onUpdate]
  );

  return (
    <div
      style={{
        position: 'relative',
        width: `${CANVAS_WIDTH * zoom}px`,
        height: `${CANVAS_HEIGHT * zoom}px`,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: `${CANVAS_WIDTH}px`,
          height: `${CANVAS_HEIGHT}px`,
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
        }}
      >
        <HtmlSceneCanvas
          scene={scene}
          interactive
          selectedId={selectedId}
          onElementClick={(id) => onSelect(id)}
          onCanvasClick={() => onSelect(null)}
        />

        {selectedElement && !selectedElement.locked && targetElement && (
          <Moveable
            ref={moveableRef}
            target={targetElement}
            container={null}
            origin={false}
            zoom={1 / zoom}
            draggable={true}
            throttleDrag={0}
            onDragStart={({ set }) => {
              if (selectedElement) {
                dragStartPosRef.current = {
                  x: selectedElement.x,
                  y: selectedElement.y,
                  width: selectedElement.width,
                  height: selectedElement.height,
                };
                set([0, 0]);
              }
            }}
            onDrag={handleDrag}
            resizable={true}
            throttleResize={0}
            onResizeStart={({ setOrigin, dragStart }) => {
              if (selectedElement) {
                dragStartPosRef.current = {
                  x: selectedElement.x,
                  y: selectedElement.y,
                  width: selectedElement.width,
                  height: selectedElement.height,
                };
                setOrigin(['%', '%']);
                if (dragStart) {
                  dragStart.set([0, 0]);
                }
              }
            }}
            onResize={handleResize}
            renderDirections={['nw', 'ne', 'sw', 'se']}
            linePadding={10}
            className="moveable-control-box"
          />
        )}
      </div>
    </div>
  );
}
