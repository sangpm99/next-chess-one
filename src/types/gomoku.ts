// Các kiểu dữ liệu dùng chung cho cờ caro (Gomoku).
// File này không chứa logic, chỉ khai báo "hình dạng" của dữ liệu.

/** Màu quân: 1 = Đen (đi trước), 2 = Trắng. 0 = ô trống (chỉ dùng trong grid). */
export type GmColor = 1 | 2

/** Một nước đi: tọa độ giao điểm, gốc (0,0) ở GÓC TRÁI TRÊN, x sang phải, y xuống dưới */
export interface GmMove {
  x: number
  y: number
}

/**
 * Luật thắng:
 * - freestyle: 5 quân liên tiếp TRỞ LÊN là thắng (phổ biến nhất khi chơi vui)
 * - standard:  phải ĐÚNG 5 quân liên tiếp (6 quân trở lên không tính)
 * - renju:     Đen phải đúng 5 (Đen tạo 6+ quân liên tiếp là THUA), Trắng 5 trở lên
 */
export type GmRule = 'freestyle' | 'standard' | 'renju'

/** Lý do ván cờ caro kết thúc */
export type GmGameOverReason =
  /** Có bên tạo được hàng 5 (hoặc theo biến thể của luật đang chơi) */
  | 'five'
  /** Đen tạo hàng 6+ trong luật renju -> Đen thua */
  | 'overline'
  /** Bàn cờ đầy, không ai thắng */
  | 'full'

/** Kết quả ván cờ caro */
export type GmGameResult = 'black' | 'white' | 'draw'

/** Trạng thái ván cờ tại một thời điểm */
export interface GmGameStatus {
  /** Ván đã kết thúc chưa */
  over: boolean

  /** Bên thắng, hoặc "draw" nếu hòa (chỉ có khi over = true) */
  result?: GmGameResult

  /** Lý do kết thúc (chỉ có khi over = true) */
  reason?: GmGameOverReason
}
