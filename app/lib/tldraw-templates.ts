// Tldraw templates - pre-converted from scene.ts
import { createShapeId, TLShapePartial, toRichText } from 'tldraw'
import {
	GRADIENT_RECT_TYPE,
	GRADIENT_ELLIPSE_TYPE,
	CUTOUT_RECT_TYPE,
	CUTOUT_ELLIPSE_TYPE,
	COVERCAST_IMAGE_TYPE,
	BACKGROUND_TYPE,
} from './tldraw-shapes'

const CANVAS_WIDTH = 941
const CANVAS_HEIGHT = 1672

export type TldrawTemplate = {
	id: string
	name: string
	description: string
	shapes: TLShapePartial[]
	backgroundColor: string
}

// Helper to create shapes
function shape(
	id: string,
	type: TLShapePartial['type'],
	x: number,
	y: number,
	props: Record<string, unknown>,
	isLocked?: boolean
): TLShapePartial {
	const result: TLShapePartial = {
		id: createShapeId(id),
		type,
		x,
		y,
		props,
	}
	if (isLocked) {
		result.isLocked = true
	}
	return result
}

// Helper to map font size to tldraw size
function mapFontSize(fontSize: number): 's' | 'm' | 'l' | 'xl' {
	if (fontSize <= 24) return 's'
	if (fontSize <= 36) return 'm'
	if (fontSize <= 48) return 'l'
	return 'xl'
}

// Helper to map text align
function mapTextAlign(align: string): 'start' | 'middle' | 'end' {
	if (align === 'left') return 'start'
	if (align === 'center') return 'middle'
	if (align === 'right') return 'end'
	return 'start'
}

// 双讲师课程模板
const dualCourseTemplate: TldrawTemplate = {
	id: 'dual-course',
	name: '双讲师课程',
	description: '双人连麦课程直播背景',
	backgroundColor: '#2845c7',
	shapes: [
		// Background (locked, with glow)
		shape('bg', BACKGROUND_TYPE, 0, 0, {
			w: CANVAS_WIDTH,
			h: CANVAS_HEIGHT,
			color: '#2845c7',
			opacity: 1,
			glowColor: 'rgba(147, 241, 156, 0.4)',
			glowSize: 200,
		}, true),
		// 顶部头像
		shape('avatar', COVERCAST_IMAGE_TYPE, 294, 68, {
			w: 112,
			h: 112,
			src: '',
			alt: '陆向谦教授头像',
			fit: 'cover',
			shape: 'circle',
			fallbackText: '陆',
		}),
		// 顶部姓名
		{
			id: createShapeId('host-name'),
			type: 'text',
			x: 420,
			y: 101,
			props: {
				richText: toRichText('陆向谦教授'),
				color: 'black',
				font: 'sans',
				size: mapFontSize(40),
				textAlign: mapTextAlign('left'),
				w: 300,
				autoSize: false,
			},
		},
		// 课程条 1
		shape('course-card-1', GRADIENT_RECT_TYPE, 147, 202, {
			w: 648,
			h: 61,
			startColor: '#ccf0a0',
			endColor: '#73f08c',
			direction: 'horizontal',
			radius: 12,
			stroke: '',
			strokeWidth: 0,
		}),
		// 课程圆点 1
		shape('course-dot-1', GRADIENT_ELLIPSE_TYPE, 195, 222, {
			w: 22,
			h: 22,
			startColor: '#87a9ff',
			endColor: '#163690',
			direction: 'horizontal',
			stroke: '',
			strokeWidth: 0,
		}),
		// 课程文字 1
		{
			id: createShapeId('course-date-1'),
			type: 'text',
			x: 242,
			y: 219,
			props: {
				richText: toRichText('7 月 8 日-31 日，陆向谦 AI 夏令营'),
				color: 'black',
				font: 'sans',
				size: mapFontSize(27),
				textAlign: mapTextAlign('left'),
				w: 390,
				autoSize: false,
			},
		},
		// 已报满标记
		{
			id: createShapeId('course-full-label'),
			type: 'text',
			x: 650,
			y: 219,
			props: {
				richText: toRichText('（已报满）'),
				color: 'black',
				font: 'sans',
				size: mapFontSize(27),
				textAlign: mapTextAlign('left'),
				w: 138,
				autoSize: false,
			},
		},
		// 课程条 2
		shape('course-card-2', GRADIENT_RECT_TYPE, 147, 284, {
			w: 648,
			h: 61,
			startColor: '#ccf0a0',
			endColor: '#73f08c',
			direction: 'horizontal',
			radius: 12,
			stroke: '',
			strokeWidth: 0,
		}),
		// 课程圆点 2
		shape('course-dot-2', GRADIENT_ELLIPSE_TYPE, 195, 304, {
			w: 22,
			h: 22,
			startColor: '#87a9ff',
			endColor: '#163690',
			direction: 'horizontal',
			stroke: '',
			strokeWidth: 0,
		}),
		// 课程文字 2
		{
			id: createShapeId('course-date-2'),
			type: 'text',
			x: 242,
			y: 302,
			props: {
				richText: toRichText('8 月 1 日-24 日，陆向谦实验室AI夏令营'),
				color: 'black',
				font: 'sans',
				size: mapFontSize(27),
				textAlign: mapTextAlign('left'),
				w: 520,
				autoSize: false,
			},
		},
		// 主标题
		{
			id: createShapeId('main-title'),
			type: 'text',
			x: 245,
			y: 392,
			props: {
				richText: toRichText('人工智能时代，\n如何培养孩子？'),
				color: 'black',
				font: 'sans',
				size: mapFontSize(58),
				textAlign: mapTextAlign('center'),
				w: 452,
				autoSize: false,
			},
		},
		// 视频占位 - 左
		shape('video-left', CUTOUT_RECT_TYPE, 111, 550, {
			w: 351,
			h: 580,
			radius: 14,
			stroke: '#ffffff',
			strokeWidth: 1,
		}),
		// 视频占位 - 右
		shape('video-right', CUTOUT_RECT_TYPE, 480, 550, {
			w: 351,
			h: 580,
			radius: 14,
			stroke: '#ffffff',
			strokeWidth: 1,
		}),
		// 左侧讲师姓名
		{
			id: createShapeId('speaker-left-name'),
			type: 'text',
			x: 125,
			y: 1160,
			props: {
				richText: toRichText('陆向谦'),
				color: 'black',
				font: 'sans',
				size: mapFontSize(50),
				textAlign: mapTextAlign('center'),
				w: 320,
				autoSize: false,
			},
		},
		// 左侧讲师介绍
		{
			id: createShapeId('speaker-left-bio'),
			type: 'text',
			x: 108,
			y: 1235,
			props: {
				richText: toRichText('清华大学教授，教育部全国高校\n教师网络培训中心创新/创业特聘教授\n清华工学硕士，加州伯克利大学博士\n斯坦福大学 & 加州伯克利大学爸爸'),
				color: 'black',
				font: 'sans',
				size: mapFontSize(21),
				textAlign: mapTextAlign('center'),
				w: 355,
				autoSize: false,
			},
		},
		// 右侧讲师姓名
		{
			id: createShapeId('speaker-right-name'),
			type: 'text',
			x: 508,
			y: 1160,
			props: {
				richText: toRichText('张晨老师玩AI'),
				color: 'black',
				font: 'sans',
				size: mapFontSize(44),
				textAlign: mapTextAlign('center'),
				w: 305,
				autoSize: false,
			},
		},
		// 右侧讲师介绍
		{
			id: createShapeId('speaker-right-bio'),
			type: 'text',
			x: 514,
			y: 1248,
			props: {
				richText: toRichText('清华陆向谦教授实验室\nAI 教育专家\n培养多名学生获得名企AI大奖'),
				color: 'black',
				font: 'sans',
				size: mapFontSize(22),
				textAlign: mapTextAlign('center'),
				w: 300,
				autoSize: false,
			},
		},
	],
}

// 单人访谈模板
const soloInterviewTemplate: TldrawTemplate = {
	id: 'solo-interview',
	name: '单人访谈',
	description: '单人开播、公开课、访谈',
	backgroundColor: '#0f766e',
	shapes: [
		// Background (locked, with glow)
		shape('bg', BACKGROUND_TYPE, 0, 0, {
			w: CANVAS_WIDTH,
			h: CANVAS_HEIGHT,
			color: '#0f766e',
			opacity: 1,
			glowColor: 'rgba(204, 251, 241, 0.3)',
			glowSize: 150,
		}, true),
		// 嘉宾头像
		shape('solo-host-avatar', COVERCAST_IMAGE_TYPE, 70, 72, {
			w: 106,
			h: 106,
			src: '',
			alt: '嘉宾头像',
			fit: 'cover',
			shape: 'circle',
			fallbackText: '嘉',
		}),
		// 嘉宾姓名
		{
			id: createShapeId('solo-host-name'),
			type: 'text',
			x: 198,
			y: 91,
			props: {
				richText: toRichText('主讲嘉宾'),
				color: 'black',
				font: 'sans',
				size: mapFontSize(38),
				textAlign: mapTextAlign('left'),
				w: 260,
				autoSize: false,
			},
		},
		// 嘉宾介绍
		{
			id: createShapeId('solo-host-role'),
			type: 'text',
			x: 200,
			y: 144,
			props: {
				richText: toRichText('AI 教育实践者 / 直播间主持人'),
				color: 'black',
				font: 'sans',
				size: mapFontSize(24),
				textAlign: mapTextAlign('left'),
				w: 470,
				autoSize: false,
			},
		},
		// 直播标签
		shape('solo-live-badge', GRADIENT_RECT_TYPE, 676, 82, {
			w: 166,
			h: 58,
			startColor: '#f97316',
			endColor: '#facc15',
			direction: 'horizontal',
			radius: 29,
			stroke: '',
			strokeWidth: 0,
		}),
		// 直播标签文字
		{
			id: createShapeId('solo-live-text'),
			type: 'text',
			x: 676,
			y: 96,
			props: {
				richText: toRichText('LIVE'),
				color: 'black',
				font: 'sans',
				size: mapFontSize(30),
				textAlign: mapTextAlign('center'),
				w: 166,
				autoSize: false,
			},
		},
		// 主题标题
		{
			id: createShapeId('solo-title'),
			type: 'text',
			x: 104,
			y: 236,
			props: {
				richText: toRichText('如何用 AI\n升级学习效率'),
				color: 'black',
				font: 'sans',
				size: mapFontSize(66),
				textAlign: mapTextAlign('center'),
				w: 734,
				autoSize: false,
			},
		},
		// 单人视频占位
		shape('solo-video', CUTOUT_RECT_TYPE, 130, 440, {
			w: 682,
			h: 780,
			radius: 20,
			stroke: '#ffffff',
			strokeWidth: 2,
		}),
		// 姓名底条
		shape('solo-name-card', GRADIENT_RECT_TYPE, 170, 1254, {
			w: 602,
			h: 84,
			startColor: '#ffffff',
			endColor: '#ffffff',
			direction: 'horizontal',
			radius: 18,
			stroke: '',
			strokeWidth: 0,
			opacity: 0.95,
		}),
		// 姓名底条文字
		{
			id: createShapeId('solo-name-card-text'),
			type: 'text',
			x: 170,
			y: 1278,
			props: {
				richText: toRichText('今晚 20:00 开播  |  预约直播间'),
				color: 'black',
				font: 'sans',
				size: mapFontSize(34),
				textAlign: mapTextAlign('center'),
				w: 602,
				autoSize: false,
			},
		},
		// 底部提示
		{
			id: createShapeId('solo-bottom-note'),
			type: 'text',
			x: 120,
			y: 1452,
			props: {
				richText: toRichText('适合单人访谈、公开课、开播预告'),
				color: 'black',
				font: 'sans',
				size: mapFontSize(28),
				textAlign: mapTextAlign('center'),
				w: 702,
				autoSize: false,
			},
		},
	],
}

// 三人圆桌模板
const roundtableTemplate: TldrawTemplate = {
	id: 'roundtable',
	name: '三人圆桌',
	description: '三人连麦讨论场景',
	backgroundColor: '#2f244f',
	shapes: [
		// Background (locked, with glow)
		shape('bg', BACKGROUND_TYPE, 0, 0, {
			w: CANVAS_WIDTH,
			h: CANVAS_HEIGHT,
			color: '#2f244f',
			opacity: 1,
			glowColor: 'rgba(252, 211, 77, 0.2)',
			glowSize: 180,
		}, true),
		// 栏目名称
		{
			id: createShapeId('roundtable-kicker'),
			type: 'text',
			x: 102,
			y: 86,
			props: {
				richText: toRichText('Covercast Roundtable'),
				color: 'black',
				font: 'sans',
				size: mapFontSize(26),
				textAlign: mapTextAlign('center'),
				w: 738,
				autoSize: false,
			},
		},
		// 圆桌标题
		{
			id: createShapeId('roundtable-title'),
			type: 'text',
			x: 96,
			y: 142,
			props: {
				richText: toRichText('三人圆桌：\nAI 产品如何落地？'),
				color: 'black',
				font: 'sans',
				size: mapFontSize(58),
				textAlign: mapTextAlign('center'),
				w: 750,
				autoSize: false,
			},
		},
		// 左上视频占位
		shape('roundtable-video-left', CUTOUT_RECT_TYPE, 72, 358, {
			w: 380,
			h: 472,
			radius: 18,
			stroke: '#ffffff',
			strokeWidth: 2,
		}),
		// 右上视频占位
		shape('roundtable-video-right', CUTOUT_RECT_TYPE, 490, 358, {
			w: 380,
			h: 472,
			radius: 18,
			stroke: '#ffffff',
			strokeWidth: 2,
		}),
		// 下方视频占位
		shape('roundtable-video-bottom', CUTOUT_RECT_TYPE, 168, 914, {
			w: 606,
			h: 410,
			radius: 18,
			stroke: '#ffffff',
			strokeWidth: 2,
		}),
		// 左上嘉宾名
		{
			id: createShapeId('roundtable-name-left'),
			type: 'text',
			x: 92,
			y: 852,
			props: {
				richText: toRichText('嘉宾 A'),
				color: 'black',
				font: 'sans',
				size: mapFontSize(34),
				textAlign: mapTextAlign('center'),
				w: 340,
				autoSize: false,
			},
		},
		// 右上嘉宾名
		{
			id: createShapeId('roundtable-name-right'),
			type: 'text',
			x: 510,
			y: 852,
			props: {
				richText: toRichText('嘉宾 B'),
				color: 'black',
				font: 'sans',
				size: mapFontSize(34),
				textAlign: mapTextAlign('center'),
				w: 340,
				autoSize: false,
			},
		},
		// 下方嘉宾名
		{
			id: createShapeId('roundtable-name-bottom'),
			type: 'text',
			x: 220,
			y: 1348,
			props: {
				richText: toRichText('主持人'),
				color: 'black',
				font: 'sans',
				size: mapFontSize(34),
				textAlign: mapTextAlign('center'),
				w: 502,
				autoSize: false,
			},
		},
		// 讨论话题底框
		shape('roundtable-topic-card', GRADIENT_RECT_TYPE, 88, 1452, {
			w: 766,
			h: 96,
			startColor: '#fcd34d',
			endColor: '#f97316',
			direction: 'horizontal',
			radius: 20,
			stroke: '',
			strokeWidth: 0,
		}),
		// 讨论话题
		{
			id: createShapeId('roundtable-topic'),
			type: 'text',
			x: 88,
			y: 1482,
			props: {
				richText: toRichText('话题：增长、交付、团队协作'),
				color: 'black',
				font: 'sans',
				size: mapFontSize(34),
				textAlign: mapTextAlign('center'),
				w: 766,
				autoSize: false,
			},
		},
	],
}

// 发布会海报模板
const launchPosterTemplate: TldrawTemplate = {
	id: 'launch-poster',
	name: '发布会海报',
	description: '新课发布、活动预告',
	backgroundColor: '#f8fafc',
	shapes: [
		// Background (locked, with glow)
		shape('bg', BACKGROUND_TYPE, 0, 0, {
			w: CANVAS_WIDTH,
			h: CANVAS_HEIGHT,
			color: '#f8fafc',
			opacity: 1,
			glowColor: 'rgba(37, 99, 235, 0.1)',
			glowSize: 150,
		}, true),
		// 左侧色带
		shape('poster-side-band', GRADIENT_RECT_TYPE, 0, 0, {
			w: 110,
			h: 1672,
			startColor: '#2563eb',
			endColor: '#14b8a6',
			direction: 'vertical',
			radius: 0,
			stroke: '',
			strokeWidth: 0,
		}),
		// 活动标签
		{
			id: createShapeId('poster-label'),
			type: 'text',
			x: 160,
			y: 118,
			props: {
				richText: toRichText('新课发布会'),
				color: 'black',
				font: 'sans',
				size: mapFontSize(32),
				textAlign: mapTextAlign('left'),
				w: 320,
				autoSize: false,
			},
		},
		// 海报标题
		{
			id: createShapeId('poster-title'),
			type: 'text',
			x: 158,
			y: 214,
			props: {
				richText: toRichText('用 AI 打造\n个人知识系统'),
				color: 'black',
				font: 'sans',
				size: mapFontSize(72),
				textAlign: mapTextAlign('left'),
				w: 666,
				autoSize: false,
			},
		},
		// 海报副标题
		{
			id: createShapeId('poster-subtitle'),
			type: 'text',
			x: 164,
			y: 430,
			props: {
				richText: toRichText('从信息收集、笔记整理到自动复盘'),
				color: 'black',
				font: 'sans',
				size: mapFontSize(30),
				textAlign: mapTextAlign('left'),
				w: 628,
				autoSize: false,
			},
		},
		// 主视觉视频占位
		shape('poster-video', CUTOUT_RECT_TYPE, 158, 558, {
			w: 666,
			h: 648,
			radius: 26,
			stroke: '#111827',
			strokeWidth: 2,
		}),
		// 报名信息卡片
		shape('poster-card', GRADIENT_RECT_TYPE, 158, 1288, {
			w: 666,
			h: 154,
			startColor: '#111827',
			endColor: '#111827',
			direction: 'horizontal',
			radius: 22,
			stroke: '',
			strokeWidth: 0,
		}),
		// 日期时间
		{
			id: createShapeId('poster-date'),
			type: 'text',
			x: 198,
			y: 1328,
			props: {
				richText: toRichText('周四 20:00 直播'),
				color: 'black',
				font: 'sans',
				size: mapFontSize(38),
				textAlign: mapTextAlign('left'),
				w: 586,
				autoSize: false,
			},
		},
		// 报名提示
		{
			id: createShapeId('poster-note'),
			type: 'text',
			x: 198,
			y: 1392,
			props: {
				richText: toRichText('扫码预约，开播前自动提醒'),
				color: 'black',
				font: 'sans',
				size: mapFontSize(26),
				textAlign: mapTextAlign('left'),
				w: 586,
				autoSize: false,
			},
		},
	],
}

// 训练营直播模板
const courseSprintTemplate: TldrawTemplate = {
	id: 'course-sprint',
	name: '训练营直播',
	description: '课程训练营与实战营',
	backgroundColor: '#4c1d95',
	shapes: [
		// Background (locked, with glow)
		shape('bg', BACKGROUND_TYPE, 0, 0, {
			w: CANVAS_WIDTH,
			h: CANVAS_HEIGHT,
			color: '#4c1d95',
			opacity: 1,
			glowColor: 'rgba(167, 139, 250, 0.3)',
			glowSize: 200,
		}),
		// 顶部标签底
		shape('sprint-top-chip', GRADIENT_RECT_TYPE, 274, 76, {
			w: 394,
			h: 58,
			startColor: '#22c55e',
			endColor: '#a3e635',
			direction: 'horizontal',
			radius: 29,
			stroke: '',
			strokeWidth: 0,
		}),
		// 顶部标签文字
		{
			id: createShapeId('sprint-top-chip-text'),
			type: 'text',
			x: 274,
			y: 92,
			props: {
				richText: toRichText('7 天实战训练营'),
				color: 'black',
				font: 'sans',
				size: mapFontSize(30),
				textAlign: mapTextAlign('center'),
				w: 394,
				autoSize: false,
			},
		},
		// 训练营标题
		{
			id: createShapeId('sprint-title'),
			type: 'text',
			x: 106,
			y: 204,
			props: {
				richText: toRichText('AI 工具流\n从入门到交付'),
				color: 'black',
				font: 'sans',
				size: mapFontSize(68),
				textAlign: mapTextAlign('center'),
				w: 730,
				autoSize: false,
			},
		},
		// 训练营副标题
		{
			id: createShapeId('sprint-subtitle'),
			type: 'text',
			x: 126,
			y: 410,
			props: {
				richText: toRichText('适合产品、运营、教师与内容创作者'),
				color: 'black',
				font: 'sans',
				size: mapFontSize(30),
				textAlign: mapTextAlign('center'),
				w: 690,
				autoSize: false,
			},
		},
		// 讲师视频占位
		shape('sprint-video-left', CUTOUT_RECT_TYPE, 92, 530, {
			w: 360,
			h: 580,
			radius: 20,
			stroke: '#ffffff',
			strokeWidth: 2,
		}),
		// 助教视频占位
		shape('sprint-video-right', CUTOUT_RECT_TYPE, 490, 530, {
			w: 360,
			h: 580,
			radius: 20,
			stroke: '#ffffff',
			strokeWidth: 2,
		}),
		// 课程大纲底
		shape('sprint-outline-card', GRADIENT_RECT_TYPE, 92, 1202, {
			w: 758,
			h: 228,
			startColor: '#ffffff',
			endColor: '#ffffff',
			direction: 'horizontal',
			radius: 22,
			stroke: '',
			strokeWidth: 0,
			opacity: 0.94,
		}),
		// 课程大纲标题
		{
			id: createShapeId('sprint-outline-title'),
			type: 'text',
			x: 132,
			y: 1240,
			props: {
				richText: toRichText('本场你会带走'),
				color: 'black',
				font: 'sans',
				size: mapFontSize(32),
				textAlign: mapTextAlign('left'),
				w: 680,
				autoSize: false,
			},
		},
		// 课程大纲
		{
			id: createShapeId('sprint-outline'),
			type: 'text',
			x: 132,
			y: 1300,
			props: {
				richText: toRichText('01 个人知识库搭建\n02 自动化内容生产\n03 真实业务交付演示'),
				color: 'black',
				font: 'sans',
				size: mapFontSize(28),
				textAlign: mapTextAlign('left'),
				w: 680,
				autoSize: false,
			},
		},
		// 底部行动提示
		{
			id: createShapeId('sprint-footer'),
			type: 'text',
			x: 132,
			y: 1508,
			props: {
				richText: toRichText('预约直播，领取课前资料包'),
				color: 'black',
				font: 'sans',
				size: mapFontSize(32),
				textAlign: mapTextAlign('center'),
				w: 678,
				autoSize: false,
			},
		},
	],
}

// Export all templates
export const TLDRAW_TEMPLATES: TldrawTemplate[] = [
	dualCourseTemplate,
	soloInterviewTemplate,
	roundtableTemplate,
	launchPosterTemplate,
	courseSprintTemplate,
]

// Helper to get template by id
export function getTemplateById(id: string): TldrawTemplate | undefined {
	return TLDRAW_TEMPLATES.find(t => t.id === id)
}