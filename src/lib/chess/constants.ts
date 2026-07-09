// Hằng số và các hàm tiện ích cho hệ tọa độ bàn cờ kiểu "0x88".
// Đây là kỹ thuật biểu diễn bàn cờ cổ điển: dùng mảng 128 ô (thay vì 64)
// để việc kiểm tra "ô có nằm trong bàn cờ hay không" cực nhanh bằng phép AND bit.

import type { Color } from '@/types/chess'

export const WHITE: Color = 0
export const BLACK: Color = 1

/** Giá trị đại diện cho ô trống trên bàn cờ */
export const EMPTY = ''

/** Các bước di chuyển tương đối của Mã (Knight) trên hệ 0x88 */
export const KNIGHT_OFF = [33, 31, -31, -33, 18, 14, -14, -18]

/** Các bước di chuyển tương đối của Vua (King) trên hệ 0x88 */
export const KING_OFF = [16, -16, 1, -1, 17, 15, -17, -15]

/** Các hướng di chuyển của Tượng (Bishop) trên hệ 0x88 */
export const BISHOP_OFF = [17, 15, -17, -15]

/** Các hướng di chuyển của Xe (Rook) trên hệ 0x88 */
export const ROOK_OFF = [16, -16, 1, -1]

/** FEN của vị trí bắt đầu ván cờ vua tiêu chuẩn */
export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

/** Kiểm tra một ô (theo hệ 0x88) có nằm trong bàn cờ 8x8 hay không */
export function onBoard(sq: number): boolean {
  return (sq & 0x88) === 0
}

/** Lấy cột (file) 0-7 của một ô */
export function fileOf(sq: number): number {
  return sq & 7
}

/** Lấy hàng (rank) 0-7 của một ô */
export function rankOf(sq: number): number {
  return sq >> 4
}

/** Chuyển (cột, hàng) sang chỉ số ô trong hệ 0x88 */
export function sq0x88(file: number, rank: number): number {
  return rank * 16 + file
}

/** Quân cờ có phải của Trắng không (chữ hoa = Trắng) */
export function isWhite(pc: string): boolean {
  return pc !== EMPTY && pc === pc.toUpperCase()
}

/** Quân cờ có phải của Đen không (chữ thường = Đen) */
export function isBlack(pc: string): boolean {
  return pc !== EMPTY && pc === pc.toLowerCase()
}

/** Lấy màu của một quân cờ */
export function colorOf(pc: string): Color {
  return isWhite(pc) ? WHITE : BLACK
}

/** Chuyển ô (hệ 0x88) sang ký hiệu đại số, ví dụ "e4" */
export function sqToAlg(sq: number): string {
  return String.fromCharCode(97 + fileOf(sq)) + String.fromCharCode(49 + rankOf(sq))
}

/** Chuyển ký hiệu đại số (ví dụ "e4") sang ô trong hệ 0x88 */
export function algToSq(s: string): number {
  return sq0x88(s.charCodeAt(0) - 97, s.charCodeAt(1) - 49)
}
