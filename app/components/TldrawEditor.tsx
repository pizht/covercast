'use client'

import {
	type ChangeEvent,
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import {
	Tldraw,
	Editor,
	track,
	createShapeId,
	defaultShapeUtils,
	getSnapshot,
	loadSnapshot,
	createTLStore,
	TLStore,
	toRichText,
} from 'tldraw'
import 'tldraw/tldraw.css'
import {
	GRADIENT_RECT_TYPE,
	GRADIENT_ELLIPSE_TYPE,
	CUTOUT_RECT_TYPE,
	CUTOUT_ELLIPSE_TYPE,
	COVERCAST_IMAGE_TYPE,
	customShapeUtils,
} from '../lib/tldraw-shapes'
import { TLDRAW_TEMPLATES } from '../lib/tldraw-templates'

// Constants
const CANVAS_WIDTH = 941
const CANVAS_HEIGHT = 1672
const STORAGE_KEY = 'covercast-tldraw-store'

type SidebarSectionId = 'scene' | 'sources' | 'templates' | 'layers'
type ExportFormat = 'png' | 'jpeg' | 'svg' | 'json'

// Main Editor Component
export default function TldrawEditor() {
	const [status, setStatus] = useState('正在初始化...')
	const [activeTemplateId, setActiveTemplateId] = useState<string>('')
	const [exportFormat, setExportFormat] = useState<ExportFormat>('png')
	const [collapsedSections, setCollapsedSections] = useState<Record<SidebarSectionId, boolean>>({
		scene: false,
		sources: false,
		templates: false,
		layers: false,
	})

	const editorRef = useRef<Editor | null>(null)

	// All shape utils (custom + default)
	const allShapeUtils = useMemo(() => [...customShapeUtils, ...defaultShapeUtils], [])

	// Handle editor mount
	const handleMount = useCallback((editor: Editor) => {
		editorRef.current = editor

		// Load saved state from API
		async function loadSavedState() {
			try {
				const response = await fetch('/api/tldraw-store', { cache: 'no-store' })
				if (response.ok) {
					const data = await response.json()
					if (data.snapshot) {
						loadSnapshot(editor.store, data.snapshot)
						setStatus('已加载保存的场景')
					} else {
						setStatus('使用空白画布')
					}
				} else {
					throw new Error('Load failed')
				}
			} catch {
				setStatus('使用空白画布')
			}
		}

		void loadSavedState()

		// Center camera
		editor.setCamera({ x: 0, y: 0, z: 0.5 })

		// Auto-save on changes
		let saveTimeout: ReturnType<typeof setTimeout>
		const unsubscribe = editor.store.listen(() => {
			clearTimeout(saveTimeout)
			saveTimeout = setTimeout(() => {
				saveToServer(editor)
			}, 1000)
		}, { scope: 'document' })

		return () => {
			clearTimeout(saveTimeout)
			unsubscribe()
		}
	}, [])

	return (
		<main className="editor-shell">
			<section className="editor-toolbar" aria-label="Covercast editor controls">
				<div>
					<p className="eyebrow">Covercast</p>
					<h1>直播背景编辑器</h1>
				</div>
				<div className="toolbar-actions">
					<button
						type="button"
						className="secondary-button"
						onClick={() => addTextElement(editorRef.current)}
					>
						添加文字
					</button>
					<button
						type="button"
						className="secondary-button"
						onClick={() => addRectElement(editorRef.current)}
					>
						添加矩形
					</button>
					<button
						type="button"
						className="secondary-button"
						onClick={() => addEllipseElement(editorRef.current)}
					>
						添加椭圆
					</button>
					<label className="secondary-button file-button">
						添加图片
						<input
							type="file"
							accept="image/png,image/jpeg,image/webp"
							onChange={(e) => handleAssetInput(e, editorRef.current)}
						/>
					</label>
					<button
						type="button"
						className="primary-button muted"
						onClick={() => saveToServer(editorRef.current, setStatus)}
					>
						保存
					</button>
					<div className="export-control">
						<select
							className="export-format-select"
							value={exportFormat}
							onChange={(e) => setExportFormat(e.currentTarget.value as ExportFormat)}
						>
							<option value="png">PNG</option>
							<option value="jpeg">JPG</option>
							<option value="svg">SVG</option>
							<option value="json">JSON</option>
						</select>
						<button
							type="button"
							className="primary-button muted"
							onClick={() => exportScene(editorRef.current, exportFormat, setStatus)}
						>
							导出
						</button>
					</div>
				</div>
			</section>

			<section className="editor-grid">
				<aside className="left-panel">
					<SidebarSection
						title="场景"
						caption={`${CANVAS_WIDTH}×${CANVAS_HEIGHT} 竖屏`}
						collapsed={collapsedSections.scene}
						onToggle={() => toggleSidebarSection('scene', collapsedSections, setCollapsedSections)}
					>
						<p className="empty-state">使用右侧画布进行编辑，所有更改自动保存</p>
					</SidebarSection>

					<SidebarSection
						title="模板"
						caption={`${TLDRAW_TEMPLATES.length} 个`}
						collapsed={collapsedSections.templates}
						onToggle={() => toggleSidebarSection('templates', collapsedSections, setCollapsedSections)}
					>
						<div className="template-library">
							{TLDRAW_TEMPLATES.map(template => (
								<button
									key={template.id}
									type="button"
									className={['template-card-button', activeTemplateId === template.id ? 'active' : ''].filter(Boolean).join(' ')}
									onClick={() => loadTemplate(editorRef.current, template.id, setActiveTemplateId, setStatus)}
								>
									{template.name}
								</button>
							))}
						</div>
					</SidebarSection>

					<SidebarSection
						title="图层"
						collapsed={collapsedSections.layers}
						onToggle={() => toggleSidebarSection('layers', collapsedSections, setCollapsedSections)}
					>
						<LayerList editorRef={editorRef} />
					</SidebarSection>
				</aside>

				<section className="stage-panel" style={{ position: 'relative' }}>
					<div className="stage-header">
						<span className="stage-status">{status}</span>
					</div>
					<div className="stage-viewport" style={{ position: 'absolute', inset: 0 }}>
						<Tldraw
							shapeUtils={allShapeUtils}
							hideUi
							onMount={handleMount}
						/>
					</div>
				</section>

				<aside className="right-panel">
					<PropertiesPanel editorRef={editorRef} />
				</aside>
			</section>
		</main>
	)
}

// Layer List Component
const LayerList = track(function LayerList({ editorRef }: { editorRef: React.RefObject<Editor | null> }) {
	const editor = editorRef.current

	if (!editor) {
		return <div className="layer-list">加载中...</div>
	}

	const shapes = editor.getCurrentPageShapes()

	if (shapes.length === 0) {
		return <p className="empty-state">画布为空，添加元素开始编辑</p>
	}

	return (
		<div className="layer-list">
			{shapes.slice().reverse().map(shape => {
				const isSelected = editor.getSelectedShapeIds().includes(shape.id)
				const name = (shape.meta?.name as string) || shape.id.replace('shape:', '')

				return (
					<div
						key={shape.id}
						className={['layer-row', isSelected ? 'active' : ''].filter(Boolean).join(' ')}
					>
						<button
							type="button"
							className="layer-main"
							onClick={() => editor.select(shape.id)}
						>
							<span className="layer-type">{getShapeTypeIcon(shape.type)}</span>
							<span className="layer-name">{name}</span>
						</button>
						<button
							type="button"
							className="layer-action"
							onClick={() => editor.deleteShape(shape.id)}
						>
							×
						</button>
					</div>
				)
			})}
		</div>
	)
})

// Properties Panel
const PropertiesPanel = track(function PropertiesPanel({ editorRef }: { editorRef: React.RefObject<Editor | null> }) {
	const editor = editorRef.current

	if (!editor) {
		return <div className="inspector">加载中...</div>
	}

	const selectedShapes = editor.getSelectedShapeIds()
	const selectedId = selectedShapes[0]

	if (!selectedId) {
		return (
			<div className="inspector">
				<div className="panel-title">
					<h2>未选择元素</h2>
				</div>
				<p className="empty-state">点击画布元素进行编辑</p>
			</div>
		)
	}

	const shape = editor.getShape(selectedId)
	if (!shape) {
		return <div className="inspector">加载中...</div>
	}

	return (
		<div className="inspector">
			<div className="panel-title">
				<h2>{getShapeTypeName(shape.type)}</h2>
			</div>
			<div className="field-grid">
				<NumberField
					label="X"
					value={Math.round(shape.x)}
					onChange={(value) => editor.updateShape({ ...shape, x: value })}
				/>
				<NumberField
					label="Y"
					value={Math.round(shape.y)}
					onChange={(value) => editor.updateShape({ ...shape, y: value })}
				/>
			</div>
		</div>
	)
})

// Helper Functions

function getShapeTypeIcon(type: string): string {
	switch (type) {
		case 'text': return 'T'
		case GRADIENT_RECT_TYPE: return 'R'
		case GRADIENT_ELLIPSE_TYPE: return 'O'
		case CUTOUT_RECT_TYPE: return '□'
		case CUTOUT_ELLIPSE_TYPE: return '○'
		case COVERCAST_IMAGE_TYPE: return 'I'
		default: return 'S'
	}
}

function getShapeTypeName(type: string): string {
	switch (type) {
		case 'text': return '文字'
		case GRADIENT_RECT_TYPE: return '矩形'
		case GRADIENT_ELLIPSE_TYPE: return '椭圆'
		case CUTOUT_RECT_TYPE: return '挖空矩形'
		case CUTOUT_ELLIPSE_TYPE: return '挖空椭圆'
		case COVERCAST_IMAGE_TYPE: return '图片'
		default: return '元素'
	}
}

function generateId(type: string): string {
	return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function loadTemplate(editor: Editor | null, templateId: string, setActiveTemplateId: (id: string) => void, setStatus: (s: string) => void) {
	if (!editor) return

	const template = TLDRAW_TEMPLATES.find(t => t.id === templateId)
	if (!template) return

	// Clear existing shapes
	const existingShapes = editor.getCurrentPageShapes()
	editor.deleteShapes(existingShapes)

	// Load template shapes
	editor.createShapes(template.shapes)

	setActiveTemplateId(templateId)
	setStatus(`已加载模板: ${template.name}`)
}

function addTextElement(editor: Editor | null) {
	if (!editor) return

	editor.createShape({
		id: createShapeId(generateId('text')),
		type: 'text',
		x: 300,
		y: 700,
		props: {
			richText: toRichText('新文字'),
			color: 'black',
			font: 'sans',
			size: 'm',
			textAlign: 'middle',
			w: 200,
			autoSize: false,
		},
	})
}

function addRectElement(editor: Editor | null) {
	if (!editor) return

	editor.createShape({
		id: createShapeId(generateId('rect')),
		type: GRADIENT_RECT_TYPE,
		x: 300,
		y: 700,
		props: {
			w: 200,
			h: 100,
			startColor: '#ffffff',
			endColor: '#99f19c',
			direction: 'horizontal',
			radius: 12,
			stroke: '',
			strokeWidth: 0,
		},
	})
}

function addEllipseElement(editor: Editor | null) {
	if (!editor) return

	editor.createShape({
		id: createShapeId(generateId('ellipse')),
		type: GRADIENT_ELLIPSE_TYPE,
		x: 320,
		y: 720,
		props: {
			w: 160,
			h: 160,
			startColor: '#ffffff',
			endColor: '#99f19c',
			direction: 'horizontal',
			stroke: '',
			strokeWidth: 0,
		},
	})
}

async function handleAssetInput(event: ChangeEvent<HTMLInputElement>, editor: Editor | null) {
	const file = event.currentTarget.files?.[0]
	event.currentTarget.value = ''

	if (!file || !editor) return

	const formData = new FormData()
	formData.append('asset', file)

	try {
		const response = await fetch('/api/assets', {
			method: 'POST',
			body: formData,
		})

		if (!response.ok) throw new Error('Upload failed')

		const { src, name } = await response.json()

		editor.createShape({
			id: createShapeId(generateId('image')),
			type: COVERCAST_IMAGE_TYPE,
			x: 300,
			y: 700,
			props: {
				w: 200,
				h: 200,
				src,
				alt: name,
				fit: 'contain',
				shape: 'rect',
				fallbackText: '图',
			},
		})
	} catch (error) {
		console.error('Upload failed:', error)
	}
}

async function saveToServer(editor: Editor | null, setStatus?: (s: string) => void) {
	if (!editor) return

	const { document } = getSnapshot(editor.store)

	try {
		await fetch('/api/tldraw-store', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ snapshot: { document, session: {} } }),
		})
		setStatus?.('已保存')
	} catch (error) {
		console.error('Save failed:', error)
		setStatus?.('保存失败')
	}
}

async function exportScene(editor: Editor | null, format: ExportFormat, setStatus: (s: string) => void) {
	if (!editor) return

	setStatus('正在导出...')

	try {
		const shapes = editor.getCurrentPageShapes()

		if (format === 'json') {
			const { document } = getSnapshot(editor.store)
			const json = JSON.stringify(document, null, 2)
			downloadBlob(new Blob([json], { type: 'application/json' }), `covercast-${new Date().toISOString().slice(0, 10)}.json`)
			setStatus('JSON 已导出')
			return
		}

		if (format === 'svg') {
			const result = await editor.getSvgString(shapes, { background: true })
			if (result) {
				downloadBlob(new Blob([result.svg], { type: 'image/svg+xml' }), `covercast-${new Date().toISOString().slice(0, 10)}.svg`)
				setStatus('SVG 已导出')
			}
			return
		}

		const result = await editor.toImage(shapes, {
			format,
			background: true,
			pixelRatio: 2,
		})

		const link = document.createElement('a')
		link.href = URL.createObjectURL(result.blob)
		link.download = `covercast-${new Date().toISOString().slice(0, 10)}.${format}`
		link.click()

		setStatus(`${format.toUpperCase()} 已导出`)
	} catch (error) {
		console.error(error)
		setStatus('导出失败')
	}
}

function downloadBlob(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob)
	const link = document.createElement('a')
	link.href = url
	link.download = filename
	document.body.appendChild(link)
	link.click()
	link.remove()
	URL.revokeObjectURL(url)
}

function toggleSidebarSection(
	sectionId: SidebarSectionId,
	collapsed: Record<SidebarSectionId, boolean>,
	setCollapsed: (v: Record<SidebarSectionId, boolean>) => void
) {
	setCollapsed({ ...collapsed, [sectionId]: !collapsed[sectionId] })
}

// Reusable UI Components

function SidebarSection({
	title,
	caption,
	collapsed,
	onToggle,
	children,
}: {
	title: string
	caption?: string
	collapsed: boolean
	onToggle: () => void
	children: ReactNode
}) {
	return (
		<section className="sidebar-section">
			<button
				type="button"
				className="sidebar-section-header"
				onClick={onToggle}
				aria-expanded={!collapsed}
			>
				<span>{title}</span>
				{caption && <small>{caption}</small>}
				<b>{collapsed ? '＋' : '－'}</b>
			</button>
			{collapsed ? null : <div className="sidebar-section-body">{children}</div>}
		</section>
	)
}

function NumberField({
	label,
	value,
	onChange,
	min,
	max,
	step = 1,
}: {
	label: string
	value: number
	onChange: (value: number) => void
	min?: number
	max?: number
	step?: number
}) {
	return (
		<label className="field">
			<span>{label}</span>
			<input
				type="number"
				value={value}
				min={min}
				max={max}
				step={step}
				onChange={(e) => {
					const next = Number(e.currentTarget.value)
					if (Number.isFinite(next)) onChange(next)
				}}
			/>
		</label>
	)
}