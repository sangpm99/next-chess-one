// Các kiểu dữ liệu dùng chung cho engine luật cờ úp (Jieqi).
// File này không chứa logic, chỉ khai báo "hình dạng" của dữ liệu.

/** Màu quân: 0 = Đỏ (đi trước, tương ứng "w" trong FEN), 1 = Đen */
export type JqColor = 0 | 1

/**
 * Ký hiệu quân cờ theo chuẩn FEN (chữ hoa = Đỏ, chữ thường = Đen):
 * K = Tướng, A = Sĩ, B = Tượng, N = Mã, R = Xe, C = Pháo, P = Tốt
 */
export type JqPieceChar = 'K' | 'A' | 'B' | 'N' | 'R' | 'C' | 'P' | 'k' | 'a' | 'b' | 'n' | 'r' | 'c' | 'p'

/**
 * Thông tin LẬT QUÂN kèm theo một nước đi (đặc sản của cờ úp):
 * - mover: loại quân thật được lật ra khi di chuyển 1 quân đang úp
 * - captured: loại quân thật được lật ra khi ăn 1 quân đang úp
 * Giá trị là MÃ LOẠI QUÂN 0-6 (PIECE_KING..PIECE_PAWN trong constants).
 * Nếu không truyền, Position tự rút ngẫu nhiên từ hồ quân úp (pool).
 */
export interface JqReveal {
  mover?: number
  captured?: number
}

/**
 * Một nước đi trong cờ úp. Có thể kèm thông tin lật quân do engine chỉ định
 * (khi máy đi, engine đã "rút" sẵn quân từ hồ và báo lại qua chuỗi UCI).
 */
export interface JqMove {
  /** Ô xuất phát (chỉ số trong mảng 256 ô, hệ 16x16) */
  from: number

  /** Ô đến (chỉ số trong mảng 256 ô) */
  to: number

  /** Thông tin lật quân (nếu engine chỉ định); người chơi đi thì bỏ trống để rút ngẫu nhiên */
  reveal?: JqReveal
}

/** Lý do ván cờ úp kết thúc */
export type JqGameOverReason =
  /** Chiếu bí HOẶC hết nước đi hợp lệ (hết nước = thua, giống cờ tướng) */
  | 'checkmate'
  /** Hòa do 2 bên chỉ còn 2 Tướng trơ trọi (hết quân, hết cả hồ quân úp) */
  | 'material'
  /** Hòa do quá nhiều nước liên tiếp không ăn quân / không lật quân */
  | 'longgame'
  /** Hòa do lặp lại thế cờ (không bên nào chiếu dai) */
  | 'repetition'
  /** Thua do chiếu dai (luật cấm) */
  | 'perpetual'

/** Kết quả ván cờ úp */
export type JqGameResult = 'red' | 'black' | 'draw'

/** Trạng thái ván cờ tại một thời điểm */
export interface JqGameStatus {
  /** Ván đã kết thúc chưa */
  over: boolean

  /** Bên thắng, hoặc "draw" nếu hòa (chỉ có khi over = true) */
  result?: JqGameResult

  /** Lý do kết thúc (chỉ có khi over = true) */
  reason?: JqGameOverReason

  /** Bên đi hiện tại có đang bị chiếu không (chỉ có khi over = false) */
  check?: boolean
}
