// Gọi máy (AI) để lấy nước đi tiếp theo.
// Gọi qua route NỘI BỘ của chính app Next.js (/api/chess/engine-move) thay vì
// gọi thẳng ra domain engine thật từ trình duyệt - lý do:
//   1. Tránh lỗi CORS khi gọi domain khác từ client.
//   2. Ẩn domain/endpoint thật khỏi người dùng cuối (xem Network tab).
//   3. Có 1 chỗ duy nhất ở server để sau này thêm log, giới hạn tần suất, cache...

export interface EngineMoveOptions {
  /** Cấp độ máy, 1 (yếu) - 10 (mạnh) */
  level?: number
  depth?: number
  movetime?: number
}

export interface EngineMoveResult {
  /** Nước đi máy chọn, dạng UCI, ví dụ "e7e5" hoặc nếu phong cấp thì "e7e8q" */
  move: string
}

export async function requestEngineMove(fen: string, opts: EngineMoveOptions = {}): Promise<EngineMoveResult> {
  const res = await fetch('/api/chess/engine-move', {
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
  // hoặc nằm trong "lines[0].move" - phòng hờ để không phải sửa code gọi mỗi khi backend đổi format nhỏ.
  const move: string | undefined = data.move || data.bestmove || data.lines?.[0]?.move

  if (!move) {
    throw new Error('Engine API không trả về nước đi hợp lệ')
  }

  return { move }
}
