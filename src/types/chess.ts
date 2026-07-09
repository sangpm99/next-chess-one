// Các kiểu dữ liệu dùng chung cho engine luật cờ vua.
// File này không chứa logic, chỉ khai báo "hình dạng" của dữ liệu.

/** Màu quân: 0 = Trắng, 1 = Đen */
export type Color = 0 | 1

/** Ký hiệu quân cờ theo chuẩn FEN (chữ hoa = Trắng, chữ thường = Đen) */
export type PieceChar = 'P' | 'N' | 'B' | 'R' | 'Q' | 'K' | 'p' | 'n' | 'b' | 'r' | 'q' | 'k'

/** Một ô trên bàn cờ: hoặc có quân, hoặc rỗng ('') */
export type Piece = PieceChar | ''

/** Một nước đi (chưa thực hiện) */
export interface Move {
  /** Ô xuất phát (theo hệ tọa độ 0x88) */
  from: number

  /** Ô đến (theo hệ tọa độ 0x88) */
  to: number

  /**
   * Cờ hiệu loại nước đi, có thể chứa nhiều ký tự:
   * n = đi thường, c = ăn quân, b = tốt đi 2 ô,
   * e = bắt tốt qua đường (en passant), k = nhập thành cánh vua,
   * q = nhập thành cánh hậu, p = phong cấp, cp = ăn quân kèm phong cấp
   */
  flags: string

  /** Quân phong cấp (nếu có), ví dụ 'Q' hoặc 'q' */
  promo: string
}

/** Quyền nhập thành còn lại của mỗi bên */
export interface CastlingRights {
  /** Trắng nhập thành cánh vua (O-O) */
  K: boolean

  /** Trắng nhập thành cánh hậu (O-O-O) */
  Q: boolean

  /** Đen nhập thành cánh vua (O-O) */
  k: boolean

  /** Đen nhập thành cánh hậu (O-O-O) */
  q: boolean
}

/** Thông tin để hoàn tác (undo) một nước đi đã thực hiện */
export interface UndoEntry {
  from: number
  to: number
  flags: string
  promo: string

  /** Quân đã di chuyển */
  piece: Piece

  /** Quân bị ăn (nếu có) */
  captured: Piece

  /** Ô của quân bị ăn (khác "to" trong trường hợp bắt tốt qua đường) */
  capSq: number

  /** Ô có thể bắt tốt qua đường trước khi thực hiện nước đi */
  ep: number

  /** Quyền nhập thành trước khi thực hiện nước đi */
  castling: CastlingRights
  halfmove: number
  fullmove: number
}

/** Lý do ván cờ kết thúc */
export type GameOverReason = 'checkmate' | 'stalemate' | 'fifty' | 'material' | 'repetition'

/** Kết quả ván cờ */
export type GameResult = 'white' | 'black' | 'draw'

/** Trạng thái ván cờ tại một thời điểm */
export interface GameStatus {
  /** Ván đã kết thúc chưa */
  over: boolean

  /** Bên thắng, hoặc "draw" nếu hòa (chỉ có khi over = true) */
  result?: GameResult

  /** Lý do kết thúc (chỉ có khi over = true) */
  reason?: GameOverReason

  /** Bên đi hiện tại có đang bị chiếu không (chỉ có khi over = false) */
  check?: boolean
}
