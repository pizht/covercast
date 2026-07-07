# Covercast 完全迁移至 react-moveable 方案

## 背景

当前 Covercast 使用 SVG 作为画布渲染方式，所有元素（矩形、椭圆、文字、图片）都通过 SVG 原生元素绘制，拖拽和缩放通过手动监听 pointer 事件实现。用户希望完全迁移到 react-moveable，使用 HTML/CSS 渲染，彻底摆脱 SVG。

## 当前架构概览

| 文件 | 作用 |
|------|------|
| `src/app/lib/scene.ts` | 数据模型：Scene、SceneElement（Text/Shape/Image） |
| `src/app/lib/scene-svg.ts` | SVG 渲染工具函数、SVG 导出 |
| `src/app/components/SceneCanvas.tsx` | SVG 画布组件（交互式 + 非交互式） |
| `src/app/components/SceneEditor.tsx` | 编辑器主组件，手动处理拖拽/缩放 |
| `src/app/components/LiveView.tsx` | OBS 浏览器源，非交互式渲染 |

## 迁移目标

1. **编辑器画布**：使用 HTML/CSS 渲染 + react-moveable 控制
2. **LiveView**：使用 HTML/CSS 渲染（OBS 支持 HTML）
3. **导出**：PNG/JPG 使用 html2canvas，SVG 导出可选保留
4. **数据模型**：保持不变（Scene/SceneElement 结构不变）

---

## 分阶段实施计划

### 阶段 1：安装依赖 + 创建样式工具模块

**目标**：准备基础设施，创建 CSS 样式转换工具

#### 1.1 安装依赖

```bash
npm install react-moveable
npm install html2canvas
```

#### 1.2 新建 `src/app/lib/scene-styles.ts`

将场景元素转换为 CSS 样式对象：

```typescript
import type { ShapeElement, TextElement, ImageElement, GradientDirection } from './scene';

// 渐变方向 → CSS
export function gradientToCSS(direction: GradientDirection): string {
  const map: Record<GradientDirection, string> = {
    'horizontal': 'to right',
    'vertical': 'to bottom',
    'diagonal-down': 'to bottom right',
    'diagonal-up': 'to top right',
  };
  return map[direction];
}

// 解析形状填充
export function resolveShapeFillCSS(element: ShapeElement): string {
  if (element.fillMode === 'gradient' && element.gradient) {
    const { startColor, endColor, direction } = element.gradient;
    return `linear-gradient(${gradientToCSS(direction)}, ${startColor}, ${endColor})`;
  }
  
  // 命名渐变
  if (element.fill === 'courseGradient') {
    return 'linear-gradient(to right, #ffffff 0%, #ffffff 54%, #99f19c 100%)';
  }
  if (element.fill === 'accentGradient') {
    return 'linear-gradient(to bottom right, #73f08c, #2859d7)';
  }
  
  return element.fill;
}

// 元素定位样式
export function getPositionStyle(el: { x: number; y: number; width: number; height: number }) {
  return {
    position: 'absolute',
    left: `${el.x}px`,
    top: `${el.y}px`,
    width: `${el.width}px`,
    height: `${el.height}px`,
  } as const;
}

// 形状完整样式
export function getShapeStyle(element: ShapeElement) {
  const base = getPositionStyle(element);
  
  if (element.backgroundCutout) {
    return { ...base, background: 'transparent' };
  }
  
  return {
    ...base,
    background: resolveShapeFillCSS(element),
    borderRadius: element.type === 'ellipse' 
      ? '50%' 
      : `${element.radius ?? 0}px`,
    border: element.stroke && element.strokeWidth
      ? `${element.strokeWidth}px solid ${element.stroke}`
      : undefined,
    opacity: element.opacity ?? 1,
  };
}

// 文本样式
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

// 图片样式
export function getImageStyle(element: ImageElement) {
  return {
    ...getPositionStyle(element),
    borderRadius: element.shape === 'circle' ? '50%' : undefined,
    opacity: element.opacity ?? 1,
    objectFit: element.fit,
    overflow: 'hidden',
  };
}
```

---

### 阶段 2：创建 HTML 画布组件（非交互式）

**目标**：创建纯 HTML/CSS 渲染的画布，用于 LiveView 和导出

#### 2.1 新建 `src/app/components/HtmlSceneCanvas.tsx`

```typescript
'use client';

import { memo } from 'react';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  type Scene,
  type SceneElement,
  type ShapeElement,
  type TextElement,
  type ImageElement,
} from '../lib/scene';
import {
  getShapeStyle,
  getTextStyle,
  getImageStyle,
} from '../lib/scene-styles';

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
  
  // 背景穿透区域
  const backgroundCutouts = visibleElements.filter(
    (el): el is ShapeElement => 
      (el.type === 'rect' || el.type === 'ellipse') && 
      el.backgroundCutout === true
  );

  const maskImage = backgroundCutouts.length > 0 
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
          background: 'radial-gradient(circle at 48% 28%, rgba(78,114,255,0.75) 0%, rgba(41,73,215,0.18) 64%, rgba(22,43,148,0.42) 100%)',
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
          isSelected={element.id === selectedId}
          onClick={() => onElementClick?.(element.id)}
        />
      ))}
      
      {/* 选中框（交互式时显示） */}
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
  isSelected,
  onClick,
}: {
  element: SceneElement;
  interactive: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  const handleClick = (e: React.MouseEvent) => {
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

function HtmlImageElement({ element, onClick }: { element: ImageElement; onClick: () => void }) {
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
        <span style={{ color: '#163690', fontSize: `${Math.min(element.width, element.height) * 0.36}px`, fontWeight: 900 }}>
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

// 生成 CSS mask-image 用于背景穿透
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
      svgParts.push(`<ellipse cx='${cx}' cy='${cy}' rx='${rx}' ry='${ry}' fill='black'/>`);
    } else {
      const { x, y, width, height, radius = 0 } = cutout;
      svgParts.push(`<rect x='${x}' y='${y}' width='${width}' height='${height}' rx='${radius}' fill='black'/>`);
    }
  });
  
  svgParts.push(`</svg>`);
  
  return `url("data:image/svg+xml,${encodeURIComponent(svgParts.join(''))}")`;
}
```

#### 2.2 更新 `src/app/components/LiveView.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { createDefaultScene, type Scene } from '../lib/scene';
import HtmlSceneCanvas from './HtmlSceneCanvas';

export default function LiveView({ templateId, slotId }: { templateId?: string; slotId?: string }) {
  const [scene, setScene] = useState<Scene>(() => createDefaultScene());

  useEffect(() => {
    let active = true;

    async function refreshScene() {
      try {
        const url = templateId && slotId
          ? `/api/scene?t=${encodeURIComponent(templateId)}&s=${encodeURIComponent(slotId)}&ts=${Date.now()}`
          : `/api/scene?ts=${Date.now()}`;

        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) return;

        const nextScene = (await response.json()) as Scene;
        if (active) setScene(nextScene);
      } catch {
        // 保持当前场景
      }
    }

    void refreshScene();
    const interval = window.setInterval(refreshScene, 1000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [templateId, slotId]);

  return (
    <>
      <style>{`html, body { background: transparent !important; }`}</style>
      <main className="live-shell">
        <HtmlSceneCanvas scene={scene} className="live-canvas" />
      </main>
    </>
  );
}
```

---

### 阶段 3：集成 react-moveable（交互式画布）

**目标**：创建支持拖拽、缩放的交互式画布

#### 3.1 新建 `src/app/components/InteractiveSceneCanvas.tsx`

```typescript
'use client';

import { useRef, useCallback } from 'react';
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
  const selectedElement = scene.elements.find((el) => el.id === selectedId);

  const getTargetElement = useCallback(() => {
    if (!selectedId) return null;
    return document.querySelector(`[data-element-id="${selectedId}"]`) as HTMLElement | null;
  }, [selectedId]);

  const handleDrag = useCallback((e: any) => {
    if (!selectedId) return;
    const { beforeTranslate } = e;
    onUpdate(selectedId, {
      x: beforeTranslate[0],
      y: beforeTranslate[1],
    });
  }, [selectedId, onUpdate]);

  const handleResize = useCallback((e: any) => {
    if (!selectedId) return;
    const { width, height, drag } = e;
    onUpdate(selectedId, {
      width: Math.max(20, width),
      height: Math.max(20, height),
      x: drag.beforeTranslate[0],
      y: drag.beforeTranslate[1],
    });
  }, [selectedId, onUpdate]);

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
        
        {selectedElement && !selectedElement.locked && (
          <Moveable
            ref={moveableRef}
            target={getTargetElement()}
            container={null}
            origin={false}
            
            // 拖拽
            draggable={true}
            throttleDrag={0}
            onDragStart={({ set }) => {
              set([selectedElement.x, selectedElement.y]);
            }}
            onDrag={handleDrag}
            
            // 缩放
            resizable={true}
            throttleResize={0}
            onResizeStart={({ setOrigin, dragStart }) => {
              setOrigin(['%', '%']);
              if (dragStart) {
                dragStart.set([0, 0]);
              }
            }}
            onResize={handleResize}
            
            // 视觉
            renderDirections={['nw', 'ne', 'sw', 'se']}
            linePadding={10}
            className="moveable-control-box"
          />
        )}
      </div>
    </div>
  );
}
```

#### 3.2 更新 `src/app/components/SceneEditor.tsx`

**删除以下内容**：
- `DragState` 类型定义（第 41-47 行）
- `drag` state 和 `svgRef`（第 149 行附近）
- `handleElementPointerDown` 函数（第 643-666 行）
- `handleResizePointerDown` 函数（第 668-690 行）
- `getSvgPoint` 函数（第 2470-2482 行）
- 处理拖拽的 `useEffect`（第 441-510 行）

**添加以下内容**：

```typescript
// 新增导入
import InteractiveSceneCanvas from './InteractiveSceneCanvas';

// 新增处理函数
const handleElementUpdate = useCallback(
  (id: string, updates: Partial<SceneElement>) => {
    setScene((currentScene) => ({
      ...currentScene,
      elements: currentScene.elements.map((element) =>
        element.id === id ? ({ ...element, ...updates } as SceneElement) : element
      ),
    }));
    markSceneEdited();
  },
  [markSceneEdited]
);

// 在 JSX 中替换 SceneCanvas（约第 1429 行）
<InteractiveSceneCanvas
  scene={scene}
  selectedId={selectedId}
  onSelect={setSelectedId}
  onUpdate={handleElementUpdate}
  zoom={canvasZoom}
/>
```

---

### 阶段 4：更新导出功能

**目标**：使用 html2canvas 替代 SVG 导出

#### 4.1 新建 `src/app/lib/scene-export.ts`

```typescript
import { CANVAS_HEIGHT, CANVAS_WIDTH, type Scene } from './scene';
import html2canvas from 'html2canvas';

export async function renderSceneToCanvas(scene: Scene): Promise<HTMLCanvasElement> {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = `${CANVAS_WIDTH}px`;
  container.style.height = `${CANVAS_HEIGHT}px`;
  
  const { default: HtmlSceneCanvas } = await import('../components/HtmlSceneCanvas');
  const { createRoot } = await import('react-dom/client');
  const { createElement } = await import('react');
  
  const root = createRoot(container);
  root.render(createElement(HtmlSceneCanvas, { scene }));
  
  await new Promise((resolve) => setTimeout(resolve, 100));
  
  try {
    const canvas = await html2canvas(container, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: null,
      scale: 1,
      useCORS: true,
      logging: false,
    });
    
    return canvas;
  } finally {
    root.unmount();
    container.remove();
  }
}

export async function exportSceneAsImage(
  scene: Scene,
  format: 'png' | 'jpeg'
): Promise<Blob> {
  const canvas = await renderSceneToCanvas(scene);
  
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas to blob failed'));
      },
      format === 'jpeg' ? 'image/jpeg' : 'image/png',
      format === 'jpeg' ? 0.92 : undefined
    );
  });
}
```

#### 4.2 更新 `src/app/components/SceneEditor.tsx` 的导出逻辑

```typescript
import { exportSceneAsImage } from '../lib/scene-export';

// 替换 exportScene 函数（约第 942 行）
async function exportScene(format: ExportFormat) {
  const formatOption = EXPORT_FORMAT_OPTIONS.find((option) => option.value === format)
    ?? EXPORT_FORMAT_OPTIONS[0];
  setStatus(`正在导出 ${formatOption.label}...`);

  try {
    if (format === 'json') {
      exportTemplateJson();
      return;
    }

    if (format === 'svg') {
      // 可选：保留原有 SVG 导出逻辑，或禁用
      setStatus('SVG 导出已禁用，请使用 PNG 或 JPG');
      return;
    }

    const exportScene = await inlineSceneAssets(scene);
    const blob = await exportSceneAsImage(exportScene, format === 'jpeg' ? 'jpeg' : 'png');
    const filename = `covercast-${new Date().toISOString().slice(0, 10)}.${formatOption.extension}`;
    
    downloadBlob(blob, filename);
    setStatus(`${formatOption.label} 已导出，尺寸 ${CANVAS_WIDTH}×${CANVAS_HEIGHT}`);
  } catch {
    setStatus('导出失败，请确认所有素材都能正常显示');
  }
}
```

---

### 阶段 5：添加 Moveable 样式

**修改 `src/app/globals.css`**

```css
/* react-moveable 自定义样式 */
.moveable-control-box .moveable-line {
  background: #f8d84a !important;
}

.moveable-control-box .moveable-control {
  background: #f8d84a !important;
  border: 2px solid #132060 !important;
  width: 20px !important;
  height: 20px !important;
  border-radius: 4px !important;
}

.moveable-control-box .moveable-origin {
  background: #f8d84a !important;
  border: 2px solid #132060 !important;
}

/* HTML 画布元素光标 */
[data-element-id] {
  cursor: move;
}

[data-element-id].locked {
  cursor: default;
}
```

---

### 阶段 6：清理旧代码

**删除以下文件**：
- `src/app/components/SceneCanvas.tsx`（已被 HtmlSceneCanvas 替代）
- `src/app/lib/scene-svg.ts`（如果不需要 SVG 导出）

**从 `SceneEditor.tsx` 删除**：
- `import { sceneToSvgMarkup } from '../lib/scene-svg'`
- `renderSvgToCanvas` 函数
- `canvasToBlob` 函数
- 所有 SVG 相关代码

---

## 迁移顺序总结

| 阶段 | 内容 | 预计时间 |
|------|------|----------|
| 1 | 安装依赖 + 创建 scene-styles.ts | 1-2 小时 |
| 2 | 创建 HtmlSceneCanvas + 更新 LiveView | 2-3 小时 |
| 3 | 集成 react-moveable + 更新 SceneEditor | 3-4 小时 |
| 4 | 更新导出功能 | 1-2 小时 |
| 5 | 添加 Moveable 样式 | 0.5 小时 |
| 6 | 清理旧代码 | 1 小时 |
| **总计** | | **8-12 小时** |

---

## 测试清单

### 功能测试
- [ ] 所有 5 个模板正确渲染
- [ ] 拖拽元素正常工作
- [ ] 缩放元素正常工作
- [ ] 背景穿透效果正确
- [ ] 渐变填充正确
- [ ] 图片加载和显示
- [ ] 文本换行和对齐
- [ ] 导出 PNG/JPG 正确
- [ ] OBS 浏览器源正常显示
- [ ] 缩放画布正常工作

### 视觉回归测试
- [ ] 对每个模板截图作为基准
- [ ] 迁移后对比截图，确保视觉一致性
- [ ] 特别测试：渐变填充、背景穿透、圆形图片、文本换行

---

## 关键文件变更清单

| 文件 | 操作 |
|------|------|
| `src/app/lib/scene-styles.ts` | 新建 |
| `src/app/components/HtmlSceneCanvas.tsx` | 新建 |
| `src/app/components/InteractiveSceneCanvas.tsx` | 新建 |
| `src/app/lib/scene-export.ts` | 新建 |
| `src/app/components/SceneEditor.tsx` | 修改 |
| `src/app/components/LiveView.tsx` | 修改 |
| `src/app/globals.css` | 修改 |
| `src/app/components/SceneCanvas.tsx` | 删除 |
| `src/app/lib/scene-svg.ts` | 删除 |
