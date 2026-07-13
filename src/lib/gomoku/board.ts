// Engine LUẬT cờ caro (Gomoku) - port TypeScript từ bản vanilla JS (gomoku-rules.js).
// Đơn giản hơn các loại cờ khác rất nhiều: chỉ có đặt quân vào giao điểm trống,
// không di chuyển, không ăn quân. Thắng khi tạo được hàng 5 (tùy luật).

import type { GmColor, GmMove, GmRule, GmGameStatus } from '@/types/gomoku'

/** Kích thước bàn cờ chuẩn: 15x15 giao điểm */
export const SIZE = 15

/** 9 điểm "sao" trang trí trên bàn 15x15 (giống bàn cờ vây) */
export const STAR_POINTS: Array<[number, number]> = [
  [3, 3],
  [3, 7],
  [3, 11],
  [7, 3],
  [7, 7],
  [7, 11],
  [11, 3],
  [11, 7],
  [11, 11]
]

export const RULE_LABELS: Record<GmRule, string> = {
  freestyle: 'Freestyle (5 trở lên)',
  standard: 'Standard (đúng 5)',
  renju: 'Renju (Đen cấm hàng 6+)'
}

/** Chuyển tên luật sang mã số mà cả engine gốc lẫn hàm checkAfter dùng */
export function ruleId(rule: GmRule | string | undefined): number {
  const r = (rule || 'freestyle').toLowerCase()

  if (r === 'standard' || r === 'exactfive') return 1
  if (r === 'renju') return 4

  return 0
}

/** Nhãn tọa độ hiển thị cho người chơi, ví dụ (7,7) giữa bàn -> "H8" */
export function coordLabel(x: number, y: number, size = SIZE): string {
  return String.fromCharCode(65 + x) + (size - y)
}

export class GomokuBoard {
  size: number

  /** Bàn cờ phẳng size*size: 0 = trống, 1 = Đen, 2 = Trắng */
  grid: number[] = []

  /** Lịch sử các nước đã đặt, theo thứ tự */
  moves: Array<{ x: number; y: number; color: GmColor }> = []

  constructor(size = SIZE) {
    this.size = size
    this.reset()
  }

  reset(): void {
    this.grid = new Array(this.size * this.size).fill(0)
    this.moves = []
  }

  idx(x: number, y: number): number {
    return y * this.size + x
  }

  /** Giá trị tại 1 giao điểm; -1 nếu ra ngoài bàn (giúp runLength tự dừng ở biên) */
  at(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.size || y >= this.size) return -1

    return this.grid[this.idx(x, y)]
  }

  isEmpty(x: number, y: number): boolean {
    return this.at(x, y) === 0
  }

  full(): boolean {
    return this.moves.length >= this.size * this.size
  }

  /** Bên sắp được đặt quân: Đen đi trước, sau đó luân phiên */
  colorToMove(): GmColor {
    return this.moves.length % 2 === 0 ? 1 : 2
  }

  /**
   * Đặt quân của bên đang được đi vào (x, y). Trả về màu quân vừa đặt,
   * hoặc 0 nếu ô đã có quân (bàn cờ không đổi).
   */
  place(x: number, y: number): GmColor | 0 {
    if (!this.isEmpty(x, y)) return 0
    const color = this.colorToMove()

    this.grid[this.idx(x, y)] = color
    this.moves.push({ x, y, color })

    return color
  }

  /** Gỡ nước đi cuối cùng (dùng khi xem lại ván đấu) */
  undo(): void {
    const last = this.moves.pop()

    if (last) this.grid[this.idx(last.x, last.y)] = 0
  }

  /** Độ dài chuỗi quân cùng màu đi qua (x,y) theo hướng (dx,dy) - đếm cả 2 phía */
  runLength(x: number, y: number, color: GmColor, dx: number, dy: number): number {
    let n = 1
    let cx = x + dx
    let cy = y + dy

    while (this.at(cx, cy) === color) {
      n++
      cx += dx
      cy += dy
    }

    cx = x - dx
    cy = y - dy

    while (this.at(cx, cy) === color) {
      n++
      cx -= dx
      cy -= dy
    }

    return n
  }

  /** Chuỗi dài nhất đi qua (x,y) trong 4 hướng: ngang, dọc, 2 đường chéo */
  maxRun(x: number, y: number, color: GmColor): number {
    const dirs: Array<[number, number]> = [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, -1]
    ]

    let best = 0

    for (const [dx, dy] of dirs) {
      const r = this.runLength(x, y, color, dx, dy)

      if (r > best) best = r
    }

    return best
  }

  /**
   * Kiểm tra trạng thái ván cờ NGAY SAU khi bên "color" vừa đặt quân tại (x,y).
   * ruleIdNum: 0 = freestyle, 1 = standard (đúng 5), 4 = renju.
   */
  checkAfter(x: number, y: number, color: GmColor, ruleIdNum: number): GmGameStatus {
    const run = this.maxRun(x, y, color)
    const sideName = color === 1 ? 'black' : 'white'

    if (ruleIdNum === 1) {
      // Standard: phải ĐÚNG 5
      if (run === 5) return { over: true, result: sideName, reason: 'five' }
    } else if (ruleIdNum === 4) {
      // Renju: Đen đúng 5 (hàng 6+ là Đen THUA); Trắng 5 trở lên
      if (color === 1) {
        if (run === 5) return { over: true, result: 'black', reason: 'five' }
        if (run >= 6) return { over: true, result: 'white', reason: 'overline' }
      } else {
        if (run >= 5) return { over: true, result: 'white', reason: 'five' }
      }
    } else {
      // Freestyle: 5 trở lên
      if (run >= 5) return { over: true, result: sideName, reason: 'five' }
    }

    if (this.full()) return { over: true, result: 'draw', reason: 'full' }

    return { over: false }
  }

  /** Trạng thái hiện tại (dựa trên nước đi CUỐI CÙNG). Bàn trống = ván đang mở. */
  status(ruleIdNum: number): GmGameStatus {
    const last = this.moves[this.moves.length - 1]

    if (!last) return { over: false }

    return this.checkAfter(last.x, last.y, last.color, ruleIdNum)
  }

  /** 5 quân tạo thành hàng thắng đi qua nước cuối - dùng để tô sáng khi kết thúc */
  winningLine(ruleIdNum: number): GmMove[] {
    const last = this.moves[this.moves.length - 1]

    if (!last) return []
    const st = this.checkAfter(last.x, last.y, last.color, ruleIdNum)

    if (!st.over || st.reason !== 'five') return []
    const winColor: GmColor = st.result === 'black' ? 1 : 2

    // Hàng thắng luôn đi qua nước đặt cuối cùng của bên thắng. Trong luật renju,
    // Trắng có thể thắng vì Đen phạm overline - khi đó không có hàng 5 để tô.
    if (last.color !== winColor) return []

    const dirs: Array<[number, number]> = [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, -1]
    ]

    for (const [dx, dy] of dirs) {
      if (this.runLength(last.x, last.y, winColor, dx, dy) >= 5) {
        // Lùi về đầu chuỗi rồi thu 5 ô liên tiếp
        let sx = last.x
        let sy = last.y

        while (this.at(sx - dx, sy - dy) === winColor) {
          sx -= dx
          sy -= dy
        }

        const line: GmMove[] = []

        for (let i = 0; i < 5 && this.at(sx, sy) === winColor; i++) {
          line.push({ x: sx, y: sy })
          sx += dx
          sy += dy
        }

        return line
      }
    }

    return []
  }

  /** Danh sách nước đi dạng chuỗi "x,y" - đúng định dạng engine API yêu cầu */
  movesAsStrings(): string[] {
    return this.moves.map(m => m.x + ',' + m.y)
  }
}
