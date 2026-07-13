import { type NextRequest, NextResponse } from 'next/server'

// Route nội bộ (chạy trên server của chính bạn) để chuyển tiếp (proxy) request
// tới engine cờ tướng thật - giống hệt cách làm của /api/chess/engine-move.
//
// Đặt biến môi trường JIEQI_ENGINE_API_BASE trong file .env.local nếu endpoint
// thật của bạn khác với giá trị mặc định bên dưới, ví dụ:
//   JIEQI_ENGINE_API_BASE=https://chessone.net/api/jiq

const ENGINE_API_BASE = process.env.JIEQI_ENGINE_API_BASE || 'https://chessone.net/api/jiq'

interface EngineMoveRequestBody {
  fen?: string
  level?: number
  depth?: number
  movetime?: number
}

export async function POST(req: NextRequest) {
  let body: EngineMoveRequestBody

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Nội dung gửi lên phải là JSON hợp lệ' }, { status: 400 })
  }

  if (!body.fen) {
    return NextResponse.json({ error: 'Thiếu trường "fen"' }, { status: 400 })
  }

  try {
    const upstream = await fetch(`${ENGINE_API_BASE}/play`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fen: body.fen,
        level: body.level,
        depth: body.depth,
        movetime: body.movetime
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
