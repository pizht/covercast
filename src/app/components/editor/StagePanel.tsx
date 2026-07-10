'use client'

import type { Ref } from 'react'
import dynamic from 'next/dynamic'
import type { Editor } from 'tldraw'
import type { Scene } from '@/domain'
import styles from './editor.module.css'

// Dynamic import with ssr: false — tldraw uses browser APIs
const CovercastEditor = dynamic(
  () => import('@/tldraw/CovercastEditor').then((m) => m.CovercastEditor),
  {
    ssr: false,
    loading: () => <div style={{ padding: 24, color: '#888' }}>Loading tldraw...</div>,
  },
)

type StagePanelProps = {
  status: string
  scene: Scene
  canvasWidth?: number
  canvasHeight?: number
  resolveSrc?: (src: string) => string
  srcVersion?: number
  onSceneChange?: (scene: Scene) => void
  onSelectionChange?: (elementIds: string[]) => void
  onEditorReady?: (editor: Editor) => void
  stageViewportRef: Ref<HTMLDivElement>
}

export function StagePanel({
  status,
  scene,
  canvasWidth,
  canvasHeight,
  resolveSrc,
  srcVersion,
  onSceneChange,
  onSelectionChange,
  onEditorReady,
  stageViewportRef,
}: StagePanelProps) {
  return (
    <section className={styles.stagePanel} aria-label="Canvas preview">
      <div className={styles.stageHeader}>
        <span className={styles.stageStatus}>{status}</span>
        <div className={styles.stageHeaderTools}>
          <span style={{ color: '#7ee787' }}>tldraw 引擎 — 滚轮缩放，拖拽平移</span>
        </div>
      </div>
      <div className={styles.stageViewport} ref={stageViewportRef}>
        <div
          className={styles.scenePreviewFrame}
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
          }}
        >
          <CovercastEditor
            scene={scene}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            resolveSrc={resolveSrc}
            srcVersion={srcVersion}
            onEditorReady={onEditorReady}
            onSceneChange={onSceneChange}
            onSelectionChange={onSelectionChange}
          />
        </div>
      </div>
    </section>
  )
}
