import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const STORE_FILE = path.join(process.cwd(), 'data', 'tldraw-store.json')

async function ensureDataDir() {
	const dataDir = path.dirname(STORE_FILE)
	try {
		await fs.access(dataDir)
	} catch {
		await fs.mkdir(dataDir, { recursive: true })
	}
}

export async function GET() {
	try {
		const data = await fs.readFile(STORE_FILE, 'utf-8')
		return NextResponse.json(JSON.parse(data))
	} catch {
		return NextResponse.json({ snapshot: null })
	}
}

export async function POST(request: NextRequest) {
	try {
		await ensureDataDir()
		const body = await request.json()
		await fs.writeFile(STORE_FILE, JSON.stringify(body, null, 2))
		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Save failed:', error)
		return NextResponse.json({ success: false }, { status: 500 })
	}
}