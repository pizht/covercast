import {
	HTMLContainer,
	Rectangle2d,
	Ellipse2d,
	ShapeUtil,
	TLShape,
	useEditor,
} from 'tldraw'
import { track } from '@tldraw/state-react'
import type { JSX } from 'react'

// Shape type IDs
export const GRADIENT_RECT_TYPE = 'gradient-rect'
export const GRADIENT_ELLIPSE_TYPE = 'gradient-ellipse'
export const CUTOUT_RECT_TYPE = 'cutout-rect'
export const CUTOUT_ELLIPSE_TYPE = 'cutout-ellipse'
export const COVERCAST_IMAGE_TYPE = 'covercast-image'
export const BACKGROUND_TYPE = 'covercast-background'

// Register shape types in global props map
declare module 'tldraw' {
	export interface TLGlobalShapePropsMap {
		[GRADIENT_RECT_TYPE]: {
			w: number
			h: number
			startColor: string
			endColor: string
			direction: 'horizontal' | 'vertical' | 'diagonal-down' | 'diagonal-up'
			radius: number
			stroke: string
			strokeWidth: number
		}
		[GRADIENT_ELLIPSE_TYPE]: {
			w: number
			h: number
			startColor: string
			endColor: string
			direction: 'horizontal' | 'vertical' | 'diagonal-down' | 'diagonal-up'
			stroke: string
			strokeWidth: number
		}
		[CUTOUT_RECT_TYPE]: {
			w: number
			h: number
			radius: number
			stroke: string
			strokeWidth: number
		}
		[CUTOUT_ELLIPSE_TYPE]: {
			w: number
			h: number
			stroke: string
			strokeWidth: number
		}
		[COVERCAST_IMAGE_TYPE]: {
			w: number
			h: number
			src: string
			alt: string
			fit: 'cover' | 'contain'
			shape: 'rect' | 'circle'
			fallbackText: string
		}
		[BACKGROUND_TYPE]: {
			w: number
			h: number
			color: string
			opacity: number
			glowColor?: string
			glowSize?: number
		}
	}
}

type GradientRectShape = TLShape<typeof GRADIENT_RECT_TYPE>
type GradientEllipseShape = TLShape<typeof GRADIENT_ELLIPSE_TYPE>
type CutoutRectShape = TLShape<typeof CUTOUT_RECT_TYPE>
type CutoutEllipseShape = TLShape<typeof CUTOUT_ELLIPSE_TYPE>
type CovercastImageShape = TLShape<typeof COVERCAST_IMAGE_TYPE>
type BackgroundShape = TLShape<typeof BACKGROUND_TYPE>

// Helper: compute gradient vector based on direction
function getGradientVector(direction: GradientRectShape['props']['direction']) {
	switch (direction) {
		case 'vertical':
			return { x1: '0%', y1: '0%', x2: '0%', y2: '100%' }
		case 'diagonal-down':
			return { x1: '0%', y1: '0%', x2: '100%', y2: '100%' }
		case 'diagonal-up':
			return { x1: '0%', y1: '100%', x2: '100%', y2: '0%' }
		default: // horizontal
			return { x1: '0%', y1: '0%', x2: '100%', y2: '0%' }
	}
}

// Gradient Rectangle Shape Util
export class GradientRectShapeUtil extends ShapeUtil<GradientRectShape> {
	static override type = GRADIENT_RECT_TYPE

	getDefaultProps(): GradientRectShape['props'] {
		return {
			w: 100,
			h: 100,
			startColor: '#ffffff',
			endColor: '#99f19c',
			direction: 'horizontal',
			radius: 0,
			stroke: '',
			strokeWidth: 0,
		}
	}

	getGeometry(shape: GradientRectShape) {
		return new Rectangle2d({
			width: shape.props.w,
			height: shape.props.h,
			isFilled: true,
		})
	}

	component(shape: GradientRectShape) {
		const { w, h, startColor, endColor, direction, radius, stroke, strokeWidth } = shape.props
		const vector = getGradientVector(direction)
		const gradientId = `gradient-${shape.id}`

		return (
			<HTMLContainer>
				<svg width={w} height={h} style={{ overflow: 'visible' }}>
					<defs>
						<linearGradient
							id={gradientId}
							x1={vector.x1}
							y1={vector.y1}
							x2={vector.x2}
							y2={vector.y2}
						>
							<stop offset="0%" stopColor={startColor} />
							<stop offset="100%" stopColor={endColor} />
						</linearGradient>
					</defs>
					<rect
						width={w}
						height={h}
						rx={radius}
						ry={radius}
						fill={`url(#${gradientId})`}
						stroke={stroke || 'none'}
						strokeWidth={strokeWidth}
					/>
				</svg>
			</HTMLContainer>
		)
	}

	getIndicatorPath(shape: GradientRectShape) {
		const path = new Path2D()
		path.rect(0, 0, shape.props.w, shape.props.h)
		return path
	}
}

// Gradient Ellipse Shape Util
export class GradientEllipseShapeUtil extends ShapeUtil<GradientEllipseShape> {
	static override type = GRADIENT_ELLIPSE_TYPE

	getDefaultProps(): GradientEllipseShape['props'] {
		return {
			w: 100,
			h: 100,
			startColor: '#ffffff',
			endColor: '#99f19c',
			direction: 'horizontal',
			stroke: '',
			strokeWidth: 0,
		}
	}

	getGeometry(shape: GradientEllipseShape) {
		return new Ellipse2d({
			width: shape.props.w,
			height: shape.props.h,
			isFilled: true,
		})
	}

	component(shape: GradientEllipseShape) {
		const { w, h, startColor, endColor, direction, stroke, strokeWidth } = shape.props
		const cx = w / 2
		const cy = h / 2
		const rx = w / 2
		const ry = h / 2
		const vector = getGradientVector(direction)
		const gradientId = `gradient-${shape.id}`

		return (
			<HTMLContainer>
				<svg width={w} height={h} style={{ overflow: 'visible' }}>
					<defs>
						<linearGradient
							id={gradientId}
							x1={vector.x1}
							y1={vector.y1}
							x2={vector.x2}
							y2={vector.y2}
						>
							<stop offset="0%" stopColor={startColor} />
							<stop offset="100%" stopColor={endColor} />
						</linearGradient>
					</defs>
					<ellipse
						cx={cx}
						cy={cy}
						rx={rx}
						ry={ry}
						fill={`url(#${gradientId})`}
						stroke={stroke || 'none'}
						strokeWidth={strokeWidth}
					/>
				</svg>
			</HTMLContainer>
		)
	}

	getIndicatorPath(shape: GradientEllipseShape) {
		const path = new Path2D()
		const cx = shape.props.w / 2
		const cy = shape.props.h / 2
		const rx = shape.props.w / 2
		const ry = shape.props.h / 2
		path.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
		return path
	}
}

// Cutout Rectangle Shape Util (transparent with border, used for video placeholders)
export class CutoutRectShapeUtil extends ShapeUtil<CutoutRectShape> {
	static override type = CUTOUT_RECT_TYPE

	getDefaultProps(): CutoutRectShape['props'] {
		return {
			w: 100,
			h: 100,
			radius: 0,
			stroke: '#ffffff',
			strokeWidth: 2,
		}
	}

	getGeometry(shape: CutoutRectShape) {
		return new Rectangle2d({
			width: shape.props.w,
			height: shape.props.h,
			isFilled: true,
		})
	}

	component(shape: CutoutRectShape) {
		const { w, h, radius, stroke, strokeWidth } = shape.props

		return (
			<HTMLContainer>
				<svg width={w} height={h} style={{ overflow: 'visible' }}>
					<rect
						width={w}
						height={h}
						rx={radius}
						ry={radius}
						fill="transparent"
						stroke={stroke}
						strokeWidth={strokeWidth}
					/>
				</svg>
			</HTMLContainer>
		)
	}

	getIndicatorPath(shape: CutoutRectShape) {
		const path = new Path2D()
		path.rect(0, 0, shape.props.w, shape.props.h)
		return path
	}
}

// Cutout Ellipse Shape Util
export class CutoutEllipseShapeUtil extends ShapeUtil<CutoutEllipseShape> {
	static override type = CUTOUT_ELLIPSE_TYPE

	getDefaultProps(): CutoutEllipseShape['props'] {
		return {
			w: 100,
			h: 100,
			stroke: '#ffffff',
			strokeWidth: 2,
		}
	}

	getGeometry(shape: CutoutEllipseShape) {
		return new Ellipse2d({
			width: shape.props.w,
			height: shape.props.h,
			isFilled: true,
		})
	}

	component(shape: CutoutEllipseShape) {
		const { w, h, stroke, strokeWidth } = shape.props
		const cx = w / 2
		const cy = h / 2
		const rx = w / 2
		const ry = h / 2

		return (
			<HTMLContainer>
				<svg width={w} height={h} style={{ overflow: 'visible' }}>
					<ellipse
						cx={cx}
						cy={cy}
						rx={rx}
						ry={ry}
						fill="transparent"
						stroke={stroke}
						strokeWidth={strokeWidth}
					/>
				</svg>
			</HTMLContainer>
		)
	}

	getIndicatorPath(shape: CutoutEllipseShape) {
		const path = new Path2D()
		const cx = shape.props.w / 2
		const cy = shape.props.h / 2
		const rx = shape.props.w / 2
		const ry = shape.props.h / 2
		path.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
		return path
	}
}

// Covercast Image Shape Util (supports circle clipping and fallback text)
export class CovercastImageShapeUtil extends ShapeUtil<CovercastImageShape> {
	static override type = COVERCAST_IMAGE_TYPE

	getDefaultProps(): CovercastImageShape['props'] {
		return {
			w: 100,
			h: 100,
			src: '',
			alt: 'Image',
			fit: 'contain',
			shape: 'rect',
			fallbackText: '图',
		}
	}

	getGeometry(shape: CovercastImageShape) {
		return new Rectangle2d({
			width: shape.props.w,
			height: shape.props.h,
			isFilled: true,
		})
	}

	component(shape: CovercastImageShape) {
		const { w, h, src, fit, shape: imageShape, fallbackText } = shape.props
		const clipId = `clip-${shape.id}`
		const cx = w / 2
		const cy = h / 2
		const r = Math.min(w, h) / 2

		// No image: render placeholder
		if (!src) {
			return (
				<HTMLContainer>
					<svg width={w} height={h}>
						<circle cx={cx} cy={cy} r={r} fill="#edf3ff" stroke="#ffffff" strokeWidth={5} />
						<circle cx={cx} cy={cy} r={r - 7} fill="#87a9ff" opacity={0.36} />
						<text
							x={cx}
							y={cy + r * 0.22}
							textAnchor="middle"
							fill="#163690"
							fontFamily="PingFang SC, Microsoft YaHei, Arial, sans-serif"
							fontSize={r * 0.72}
							fontWeight="900"
						>
							{fallbackText}
						</text>
					</svg>
				</HTMLContainer>
			)
		}

		// Circle shape with clipping
		if (imageShape === 'circle') {
			return (
				<HTMLContainer>
					<svg width={w} height={h}>
						<defs>
							<clipPath id={clipId}>
								<circle cx={cx} cy={cy} r={r} />
							</clipPath>
						</defs>
						<image
							href={src}
							x={0}
							y={0}
							width={w}
							height={h}
							preserveAspectRatio={fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet'}
							clipPath={`url(#${clipId})`}
						/>
						<circle cx={cx} cy={cy} r={r} fill="none" stroke="#ffffff" strokeWidth={5} />
					</svg>
				</HTMLContainer>
			)
		}

		// Rectangle shape
		return (
			<HTMLContainer>
				<svg width={w} height={h}>
					<image
						href={src}
						x={0}
						y={0}
						width={w}
						height={h}
						preserveAspectRatio={fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet'}
					/>
				</svg>
			</HTMLContainer>
		)
	}

	getIndicatorPath(shape: CovercastImageShape) {
		const path = new Path2D()
		path.rect(0, 0, shape.props.w, shape.props.h)
		return path
	}
}

// Background Component with cutout mask support
const BackgroundComponent = track(function BackgroundComponent({ shape }: { shape: BackgroundShape }) {
	const editor = useEditor()
	const { w, h, color, opacity, glowColor, glowSize } = shape.props
	const glowId = `bg-glow-${shape.id}`
	const maskId = `bg-mask-${shape.id}`

	// Get all shapes and filter cutout shapes
	// Access shape properties directly to establish reactive dependencies
	const allShapes = editor.getCurrentPageShapes()
	const cutoutShapes = allShapes.filter(s =>
		s.type === CUTOUT_RECT_TYPE || s.type === CUTOUT_ELLIPSE_TYPE
	)

	// Build mask paths for cutout regions
	// Access each cutout shape's properties to track changes
	const maskPaths: JSX.Element[] = cutoutShapes.map((cutout, index) => {
		// Access properties to establish reactive dependency
		const cutoutX = cutout.x - shape.x
		const cutoutY = cutout.y - shape.y
		const cutoutProps = cutout.props as any
		const cutoutW = cutoutProps.w
		const cutoutH = cutoutProps.h

		if (cutout.type === CUTOUT_RECT_TYPE) {
			const radius = cutoutProps.radius || 0
			return (
				<rect
					key={cutout.id}
					x={cutoutX}
					y={cutoutY}
					width={cutoutW}
					height={cutoutH}
					rx={radius}
					ry={radius}
					fill="black"
				/>
			)
		} else {
			return (
				<ellipse
					key={cutout.id}
					cx={cutoutX + cutoutW / 2}
					cy={cutoutY + cutoutH / 2}
					rx={cutoutW / 2}
					ry={cutoutH / 2}
					fill="black"
				/>
			)
		}
	})

	return (
		<HTMLContainer style={{ pointerEvents: 'none' }}>
			<svg width={w} height={h} style={{ position: 'absolute', top: 0, left: 0 }}>
				<defs>
					{/* Glow gradient */}
					<radialGradient id={glowId} cx="50%" cy="30%" r="70%">
						<stop offset="0%" stopColor={glowColor || 'rgba(255,255,255,0.3)'} stopOpacity="0.8" />
						<stop offset="100%" stopColor={glowColor || 'rgba(255,255,255,0.3)'} stopOpacity="0" />
					</radialGradient>
					{/* Cutout mask - black areas are transparent */}
					<mask id={maskId}>
						<rect width={w} height={h} fill="white" />
						{maskPaths}
					</mask>
				</defs>
				{/* Background rect with cutout mask */}
				<rect width={w} height={h} fill={color} opacity={opacity} mask={`url(#${maskId})`} />
				{/* Glow effect */}
				{glowSize && glowColor && (
					<ellipse cx={w / 2} cy={h * 0.3} rx={glowSize} ry={glowSize * 0.6} fill={`url(#${glowId})`} />
				)}
			</svg>
		</HTMLContainer>
	)
})

// Background Shape Util (locked, non-editable background with optional glow)
export class BackgroundShapeUtil extends ShapeUtil<BackgroundShape> {
	static override type = BACKGROUND_TYPE

	getDefaultProps(): BackgroundShape['props'] {
		return {
			w: 941,
			h: 1672,
			color: '#2845c7',
			opacity: 1,
			glowColor: 'rgba(255,255,255,0.3)',
			glowSize: 100,
		}
	}

	getGeometry(shape: BackgroundShape) {
		return new Rectangle2d({
			width: shape.props.w,
			height: shape.props.h,
			isFilled: true,
		})
	}

	component(shape: BackgroundShape) {
		return <BackgroundComponent shape={shape} />
	}

	getIndicatorPath(shape: BackgroundShape) {
		const path = new Path2D()
		path.rect(0, 0, shape.props.w, shape.props.h)
		return path
	}

	// Make this shape non-editable
	override canEdit(): boolean {
		return false
	}

	override canResize(): boolean {
		return false
	}

	canRotate(): boolean {
		return false
	}

	canBeEditedFromInsideBounds(): boolean {
		return false
	}
}

// Export all custom shape utils
export const customShapeUtils = [
	GradientRectShapeUtil,
	GradientEllipseShapeUtil,
	CutoutRectShapeUtil,
	CutoutEllipseShapeUtil,
	CovercastImageShapeUtil,
	BackgroundShapeUtil,
]