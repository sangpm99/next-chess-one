import { type NextRequest, NextResponse } from 'next/server'

// Route nội bộ chuyển tiếp (proxy) request tới engine cờ caro thật - giống hệt
// cách làm của /api/chess/engine-move, /api/xiangqi/engine-move...
//
// Đặt biến môi trường GOMOKU_ENGINE_API_BASE trong .env.local nếu endpoint
// thật của bạn khác giá trị mặc định bên dưới, ví dụ:
//   GOMOKU_ENGINE_API_BASE=https://chessone.net/api/gom

const ENGINE_API_BASE = process.env.GOMOKU_ENGINE_API_BASE || 'https://chessone.net/api/gom'

interface EngineMoveRequestBody {
  moves?: string[]
  boardSize?: number
  rule?: string
  level?: number
  depth?: number
}

export async function POST(req: NextRequest) {
  let body: EngineMoveRequestBody

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Nội dung gửi lên phải là JSON hợp lệ' }, { status: 400 })
  }

  if (!Array.isArray(body.moves)) {
    return NextResponse.json({ error: 'Thiếu trường "moves" (mảng chuỗi "x,y")' }, { status: 400 })
  }

  try {
    const upstream = await fetch(`${ENGINE_API_BASE}/play`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        moves: body.moves,
        boardSize: body.boardSize ?? 15,
        rule: body.rule ?? 'freestyle',
        level: body.level,
        depth: body.depth
      })
    })

    const data = await upstream.json().catch(() => null)

    if (!upstream.ok) {
      return NextResponse.json({ error: data ?? `HTTP ${upstream.status}` }, { status: upstream.status })
    }

    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: 'Không gọi được engine API: ' + String(e) }, { status: 502 })
  }
}
