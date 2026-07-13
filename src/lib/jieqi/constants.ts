// Hằng số và hàm tiện ích cho cờ úp (Jieqi) - dùng chung hệ tọa độ "mảng 256 ô"
// (16x16) với cờ tướng (xem giải thích chi tiết ở lib/xiangqi/constants.ts).
//
// Điểm KHÁC cờ tướng:
// - Khai cuộc: mọi quân (trừ 2 Tướng) đều ÚP; ký hiệu FEN dùng "X" (úp Đỏ) và
//   "x" (úp Đen). Danh tính thật của các quân úp nằm trong "hồ quân" (pool),
//   được ghi ở trường thứ 3 của FEN, ví dụ "R2A2C2P5N2B2r2a2c2p5n2b2".
// - Quân úp DI CHUYỂN theo loại quân của Ô XUẤT PHÁT trên bàn cờ chuẩn
//   (START_TYPE), và được LẬT ra danh tính thật ở nước đi đầu tiên.

import type { JqColor, JqPieceChar } from '@/types/jieqi'

export const RED: JqColor = 0
export const BLACK: JqColor = 1

/** Mã loại quân (cộng với SIDE_TAG để ra mã quân hoàn chỉnh lưu trong mảng squares) */
export const PIECE_KING = 0
export const PIECE_ADVISOR = 1
export const PIECE_BISHOP = 2
export const PIECE_KNIGHT = 3
export const PIECE_ROOK = 4
export const PIECE_CANNON = 5
export const PIECE_PAWN = 6

/** Biên của vùng chơi thật trong lưới 16x16 */
export const RANK_TOP = 3
export const RANK_BOTTOM = 12
export const FILE_LEFT = 3
export const FILE_RIGHT = 11

/**
 * FEN khởi đầu cờ úp: mọi quân úp (X/x), chỉ 2 Tướng lộ mặt; trường thứ 3 là
 * hồ quân úp của cả 2 bên (mỗi bên 2 Xe, 2 Sĩ, 2 Pháo, 5 Tốt, 2 Mã, 2 Tượng).
 */
export const START_FEN = 'xxxxkxxxx/9/1x5x1/x1x1x1x1x/9/9/X1X1X1X1X/1X5X1/9/XXXXKXXXX w R2A2C2P5N2B2r2a2c2p5n2b2 0 1'

/** Ký tự FEN cho từng mã loại quân 0-6 */
export const TYPE_TO_CHAR = ['K', 'A', 'B', 'N', 'R', 'C', 'P']

/** Thứ tự in các loại quân khi xuất hồ quân ra FEN (giữ nguyên bản vanilla) */
export const POOL_ORDER = [PIECE_ROOK, PIECE_ADVISOR, PIECE_CANNON, PIECE_PAWN, PIECE_KNIGHT, PIECE_BISHOP]

/** Bước đi tương đối của Tướng và cũng là 4 hướng thẳng */
export const KING_DELTA = [-16, -1, 1, 16]

/** Bước đi tương đối của Sĩ (chéo 1 ô) */
export const ADVISOR_DELTA = [-17, -15, 15, 17]

/** Bước đi của Mã, nhóm theo "chân mã" tương ứng KING_DELTA[i] */
export const KNIGHT_DELTA = [
  [-33, -31],
  [-18, 14],
  [-14, 18],
  [31, 33]
]

// ================= CÁC BẢNG TRA CỨU (sinh tự động, giống lib/xiangqi) =================

const IN_BOARD_: number[] = new Array(256).fill(0)
const IN_FORT_: number[] = new Array(256).fill(0)
const LEGAL_SPAN: number[] = new Array(512).fill(0)
const KNIGHT_PIN_: number[] = new Array(512).fill(0)

for (let y = RANK_TOP; y <= RANK_BOTTOM; y++) {
  for (let x = FILE_LEFT; x <= FILE_RIGHT; x++) {
    IN_BOARD_[x + (y << 4)] = 1
  }
}

for (const yRange of [
  [3, 5],
  [10, 12]
]) {
  for (let y = yRange[0]; y <= yRange[1]; y++) {
    for (let x = 6; x <= 8; x++) {
      IN_FORT_[x + (y << 4)] = 1
    }
  }
}

for (const d of KING_DELTA) LEGAL_SPAN[d + 256] = 1
for (const d of ADVISOR_DELTA) LEGAL_SPAN[d + 256] = 2
for (const d of ADVISOR_DELTA) LEGAL_SPAN[d * 2 + 256] = 3

for (let i = 0; i < 4; i++) {
  for (let j = 0; j < 2; j++) {
    KNIGHT_PIN_[KNIGHT_DELTA[i][j] + 256] = KING_DELTA[i]
  }
}

// ================= HÀM TIỆN ÍCH =================

export function IN_BOARD(sq: number): boolean {
  return IN_BOARD_[sq] !== 0
}

export function IN_FORT(sq: number): boolean {
  return IN_FORT_[sq] !== 0
}

export function RANK_Y(sq: number): number {
  return sq >> 4
}

export function FILE_X(sq: number): number {
  return sq & 15
}

export function COORD_XY(x: number, y: number): number {
  return x + (y << 4)
}

export function SQUARE_FLIP(sq: number): number {
  return 254 - sq
}

export function SQUARE_FORWARD(sq: number, sd: JqColor): number {
  return sq - 16 + (sd << 5)
}

export function KING_SPAN(sqSrc: number, sqDst: number): boolean {
  return LEGAL_SPAN[sqDst - sqSrc + 256] === 1
}

export function ADVISOR_SPAN(sqSrc: number, sqDst: number): boolean {
  return LEGAL_SPAN[sqDst - sqSrc + 256] === 2
}

export function BISHOP_SPAN(sqSrc: number, sqDst: number): boolean {
  return LEGAL_SPAN[sqDst - sqSrc + 256] === 3
}

export function BISHOP_PIN(sqSrc: number, sqDst: number): number {
  return (sqSrc + sqDst) >> 1
}

export function KNIGHT_PIN(sqSrc: number, sqDst: number): number {
  return sqSrc + KNIGHT_PIN_[sqDst - sqSrc + 256]
}

export function HOME_HALF(sq: number, sd: JqColor): boolean {
  return (sq & 0x80) !== sd << 7
}

export function AWAY_HALF(sq: number, sd: JqColor): boolean {
  return (sq & 0x80) === sd << 7
}

export function SAME_HALF(sqSrc: number, sqDst: number): boolean {
  return ((sqSrc ^ sqDst) & 0x80) === 0
}

export function SAME_RANK(sqSrc: number, sqDst: number): boolean {
  return ((sqSrc ^ sqDst) & 0xf0) === 0
}

export function SAME_FILE(sqSrc: number, sqDst: number): boolean {
  return ((sqSrc ^ sqDst) & 0x0f) === 0
}

/** Mã "phe": Đỏ = 8 (quân 8-14), Đen = 16 (quân 16-22) */
export function SIDE_TAG(sd: JqColor): number {
  return 8 + (sd << 3)
}

export function OPP_SIDE_TAG(sd: JqColor): number {
  return 16 - (sd << 3)
}

export function SRC(mv: number): number {
  return mv & 255
}

export function DST(mv: number): number {
  return mv >> 8
}

export function MOVE(sqSrc: number, sqDst: number): number {
  return sqSrc + (sqDst << 8)
}

// ================= RIÊNG CHO CỜ ÚP =================

/** Hàng cuối bàn cờ chuẩn: Xe Mã Tượng Sĩ Tướng Sĩ Tượng Mã Xe */
const BACK_RANK = [
  PIECE_ROOK,
  PIECE_KNIGHT,
  PIECE_BISHOP,
  PIECE_ADVISOR,
  PIECE_KING,
  PIECE_ADVISOR,
  PIECE_BISHOP,
  PIECE_KNIGHT,
  PIECE_ROOK
]

/**
 * Loại quân ĐỨNG Ở Ô sq theo thế khởi đầu chuẩn - quân úp di chuyển theo loại
 * này cho tới khi được lật. Trả về -1 nếu ô không có quân lúc khai cuộc.
 */
export function START_TYPE(sq: number): number {
  const x = FILE_X(sq)
  const y = RANK_Y(sq)
  const f = x - FILE_LEFT

  if (f < 0 || f > 8) return -1
  if (y === 3 || y === 12) return BACK_RANK[f]
  if (y === 5 || y === 10) return f === 1 || f === 7 ? PIECE_CANNON : -1
  if (y === 6 || y === 9) return f % 2 === 0 ? PIECE_PAWN : -1

  return -1
}

/** Hồ quân úp đầy đủ của 1 bên lúc khai cuộc: 2R 2N 2B 2A 2C 5P (không có Tướng) */
export function FULL_POOL(): Record<number, number> {
  return {
    [PIECE_ROOK]: 2,
    [PIECE_KNIGHT]: 2,
    [PIECE_BISHOP]: 2,
    [PIECE_ADVISOR]: 2,
    [PIECE_CANNON]: 2,
    [PIECE_PAWN]: 5
  }
}

// ----- Chuyển đổi ký hiệu -----

/** Ký tự FEN (hoa hay thường đều được) -> mã loại quân, -1 nếu không hợp lệ */
export function CHAR_TO_TYPE(c: string): number {
  switch (c.toUpperCase()) {
    case 'K':
      return PIECE_KING
    case 'A':
      return PIECE_ADVISOR
    case 'B':
    case 'E':
      return PIECE_BISHOP
    case 'N':
    case 'H':
      return PIECE_KNIGHT
    case 'R':
      return PIECE_ROOK
    case 'C':
      return PIECE_CANNON
    case 'P':
      return PIECE_PAWN
    default:
      return -1
  }
}

/** Mã quân trong squares (8-14, 16-22) -> ký tự FEN ('K'..'p'), '' nếu 0 */
export function pieceCodeToChar(pc: number): JqPieceChar | '' {
  if (pc === 0) return ''
  const ch = TYPE_TO_CHAR[pc & 7]

  return (pc < 16 ? ch : ch.toLowerCase()) as JqPieceChar
}

/** Chuyển ô sang ký hiệu UCI (cột a-i, hàng 0-9 tính từ phía Đỏ) */
export function sqToUci(sq: number): string {
  return String.fromCharCode(97 + (FILE_X(sq) - FILE_LEFT)) + String.fromCharCode(48 + (RANK_BOTTOM - RANK_Y(sq)))
}

/** Chuyển ký hiệu UCI 2 ký tự (vd "h2") sang chỉ số ô */
export function uciToSq(uci2: string): number {
  const file = uci2.charCodeAt(0) - 97
  const rank = uci2.charCodeAt(1) - 48

  return COORD_XY(FILE_LEFT + file, RANK_BOTTOM - rank)
}
