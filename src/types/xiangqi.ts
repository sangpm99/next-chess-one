// Các kiểu dữ liệu dùng chung cho engine luật cờ tướng (Xiangqi).
// File này không chứa logic, chỉ khai báo "hình dạng" của dữ liệu.

/** Màu quân: 0 = Đỏ (đi trước, tương ứng "w" trong FEN), 1 = Đen */
export type XqColor = 0 | 1

/**
 * Ký hiệu quân cờ theo chuẩn FEN cờ tướng (chữ hoa = Đỏ, chữ thường = Đen):
 * K = Tướng, A = Sĩ, B = Tượng, N = Mã, R = Xe, C = Pháo, P = Tốt
 */
export type XqPieceChar = 'K' | 'A' | 'B' | 'N' | 'R' | 'C' | 'P' | 'k' | 'a' | 'b' | 'n' | 'r' | 'c' | 'p'

/**
 * Một nước đi trong cờ tướng. Đơn giản hơn cờ vua rất nhiều vì KHÔNG có
 * phong cấp, nhập thành, hay bắt tốt qua đường.
 */
export interface XqMove {
  /** Ô xuất phát (chỉ số trong mảng 256 ô, hệ 16x16 - xem lib/xiangqi/constants.ts) */
  from: number

  /** Ô đến (chỉ số trong mảng 256 ô) */
  to: number
}

/** Lý do ván cờ tướng kết thúc */
export type XqGameOverReason =
  /** Chiếu bí HOẶC hết nước đi hợp lệ (trong cờ tướng, hết nước đi cũng là THUA, không phải hòa như cờ vua) */
  | 'checkmate'
  /** Hòa do cả 2 bên không còn quân tấn công (Xe/Pháo/Mã/Tốt) */
  | 'material'
  /** Hòa do quá nhiều nước liên tiếp không ăn quân */
  | 'longgame'
  /** Hòa do lặp lại thế cờ (không bên nào chiếu dai) */
  | 'repetition'
  /** Thua do chiếu dai (lặp lại thế cờ bằng cách chiếu liên tục - luật cấm của cờ tướng) */
  | 'perpetual'

/** Kết quả ván cờ tướng */
export type XqGameResult = 'red' | 'black' | 'draw'

/** Trạng thái ván cờ tại một thời điểm */
export interface XqGameStatus {
  /** Ván đã kết thúc chưa */
  over: boolean

  /** Bên thắng, hoặc "draw" nếu hòa (chỉ có khi over = true) */
  result?: XqGameResult

  /** Lý do kết thúc (chỉ có khi over = true) */
  reason?: XqGameOverReason

  /** Bên đi hiện tại có đang bị chiếu không (chỉ có khi over = false) */
  check?: boolean
}
