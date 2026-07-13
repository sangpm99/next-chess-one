// Gọi máy (AI) cờ tướng để lấy nước đi tiếp theo.
// Giống hệt lib/chess/engine-client.ts: gọi qua route NỘI BỘ của app Next.js
// (/api/xiangqi/engine-move) thay vì gọi thẳng ra domain engine thật, để:
//   1. Tránh lỗi CORS khi gọi domain khác từ trình duyệt.
//   2. Ẩn domain/endpoint thật khỏi người dùng cuối.
//   3. Có 1 chỗ duy nhất ở server để thêm log, giới hạn tần suất, cache...

export interface XqEngineMoveOptions {
  /** Cấp độ máy, 1 (yếu) - 10 (mạnh) */
  level?: number
  depth?: number
  movetime?: number
}

export interface XqEngineMoveResult {
  /** Nước đi máy chọn, dạng UCI cờ tướng, ví dụ "h9g7" */
  move: string
}

export async function requestXqEngineMove(fen: string, opts: XqEngineMoveOptions = {}): Promise<XqEngineMoveResult> {
  const res = await fetch('/api/xiangqi/engine-move', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fen, ...opts })
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')

    throw new Error(`Engine API lỗi (${res.status}): ${text}`)
  }

  const data = await res.json()

  // Chuẩn hóa lại vì tùy phiên bản engine API có thể trả field "move", "bestmove",
  // hoặc nằm trong "lines[0].move"
  const move: string | undefined = data.move || data.bestmove || data.lines?.[0]?.move

  if (!move) {
    throw new Error('Engine API không trả về nước đi hợp lệ')
  }

  return { move }
}
