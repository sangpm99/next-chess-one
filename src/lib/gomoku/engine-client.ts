// Gọi máy (AI) cờ caro để lấy nước đi tiếp theo, qua route NỘI BỘ của app
// Next.js (/api/gomoku/engine-move) - cùng lý do với chess/xiangqi/jieqi:
// tránh CORS, ẩn endpoint thật, có 1 chỗ duy nhất để thêm log/giới hạn tần suất.
//
// Khác các loại cờ kia: engine cờ caro nhận DANH SÁCH NƯỚC ĐI ("x,y") thay vì
// FEN, kèm kích thước bàn và tên luật.

import type { GmRule } from '@/types/gomoku'

export interface GmEngineMoveOptions {
  /** Cấp độ máy, 1 (yếu) - 10 (mạnh) */
  level?: number

  /** Luật thắng đang chơi - engine cần biết để không đi vào nước phạm luật */
  rule?: GmRule
  boardSize?: number
  depth?: number
}

export interface GmEngineMoveResult {
  /** Nước đi máy chọn, dạng "x,y", ví dụ "7,7" */
  move: string
}

export async function requestGmEngineMove(
  moves: string[],
  opts: GmEngineMoveOptions = {}
): Promise<GmEngineMoveResult> {
  const res = await fetch('/api/gomoku/engine-move', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      moves,
      boardSize: opts.boardSize ?? 15,
      rule: opts.rule ?? 'freestyle',
      level: opts.level,
      depth: opts.depth
    })
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')

    throw new Error(`Engine API lỗi (${res.status}): ${text}`)
  }

  const data = await res.json()

  // Chuẩn hóa: tùy phiên bản engine API có thể trả "move", "bestmove" hoặc lines[0].move
  const move: string | undefined = data.move || data.bestmove || data.lines?.[0]?.move

  if (!move) {
    throw new Error('Engine API không trả về nước đi hợp lệ')
  }

  return { move }
}
