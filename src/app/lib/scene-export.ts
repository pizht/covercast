import { CANVAS_HEIGHT, CANVAS_WIDTH, type Scene } from './scene';
import html2canvas from 'html2canvas';

export async function renderSceneToCanvas(scene: Scene): Promise<HTMLCanvasElement> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = `${CANVAS_WIDTH}px`;
  container.style.height = `${CANVAS_HEIGHT}px`;
  container.style.pointerEvents = 'none';
  container.style.background = 'transparent';
  container.style.overflow = 'hidden';

  document.body.appendChild(container);

  const { default: HtmlSceneCanvas } = await import('../components/HtmlSceneCanvas');
  const { createRoot } = await import('react-dom/client');
  const { createElement } = await import('react');

  const root = createRoot(container);
  root.render(createElement(HtmlSceneCanvas, { scene }));

  await new Promise((resolve) => setTimeout(resolve, 200));

  const images = container.querySelectorAll('img');
  await Promise.all(
    Array.from(images).map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    })
  );

  await new Promise((resolve) => setTimeout(resolve, 200));

  try {
    const canvas = await html2canvas(container, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      backgroundColor: null,
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: true,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
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
