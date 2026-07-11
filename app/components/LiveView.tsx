'use client'

import { useEffect, useRef } from 'react'
import {
	Tldraw,
	Editor,
	defaultShapeUtils,
	getSnapshot,
	loadSnapshot,
} from 'tldraw'
import 'tldraw/tldraw.css'
import { customShapeUtils } from '../lib/tldraw-shapes'

type LiveViewProps = {
	templateId?: string
	slotId?: string
}

// OBS Live View - readonly tldraw renderer
export default function LiveView({ templateId, slotId }: LiveViewProps) {
	const editorRef = useRef<Editor | null>(null)
	const allShapeUtils = [...customShapeUtils, ...defaultShapeUtils]

	useEffect(() => {
		let active = true
		let refreshInterval: ReturnType<typeof setInterval>

		async function refreshScene() {
			if (!editorRef.current) return

			try {
				// Load latest state from API
				const url = templateId && slotId
					? `/api/tldraw-store?t=${encodeURIComponent(templateId)}&s=${encodeURIComponent(slotId)}&ts=${Date.now()}`
					: `/api/tldraw-store?ts=${Date.now()}`

				const response = await fetch(url, { cache: 'no-store' })
				if (!response.ok || !active) return

				const data = await response.json()
				if (data.snapshot) {
					loadSnapshot(editorRef.current.store, data.snapshot)
				}
			} catch {
				// OBS should keep rendering last known state if refresh fails
			}
		}

		// Initial load after editor mounts
		const timeout = setTimeout(() => {
			if (active) void refreshScene()
			refreshInterval = setInterval(refreshScene, 1000)
		}, 100)

		return () => {
			active = false
			clearTimeout(timeout)
			clearInterval(refreshInterval)
		}
	}, [templateId, slotId])

	return (
		<>
			<style>{`html, body { background: transparent !important; }`}</style>
			<main className="live-shell">
				<Tldraw
					shapeUtils={allShapeUtils}
					hideUi
					onMount={(editor) => {
						editorRef.current = editor
						editor.setCamera({ x: 0, y: 0, z: 0.5 })
					}}
				/>
			</main>
		</>
	)
}