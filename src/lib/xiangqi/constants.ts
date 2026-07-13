// Hằng số và hàm tiện ích cho hệ tọa độ bàn cờ tướng kiểu "mảng 256 ô" (16x16).
//
// Tương tự kỹ thuật 0x88 của cờ vua (lib/chess/constants.ts) nhưng dùng lưới
// 16x16 = 256 ô, trong đó vùng chơi thật 9 cột x 10 hàng nằm ở:
//   cột (file)  x = 3..11
//   hàng (rank) y = 3..12   (y = 3 là hàng cuối của ĐEN, y = 12 là hàng cuối của ĐỎ)
// Viền "đệm" xung quanh giúp kiểm tra "ô có nằm trong bàn không" chỉ bằng 1 phép
// tra bảng, và các nước đi vượt biên tự động rơi vào vùng không hợp lệ.
//
// Cách biểu diễn này được chuyển thẳng từ bản vanilla JS (xiangqi-rules.js,
// gốc là engine XiangQi Wizard Light) sang TypeScript.

import type { XqColor, XqPieceChar } from '@/types/xiangqi'

export const RED: XqColor = 0
export const BLACK: XqColor = 1

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

/** Các FEN khởi đầu: [0] = ván thường, [1] = chấp mã trái, [2] = chấp 2 mã, [3] = chấp 9 quân (bên Đỏ bị bớt quân) */
export const STARTUP_FEN = [
  'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1',
  'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKAB1R w - - 0 1',
  'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/R1BAKAB1R w - - 0 1',
  'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/9/1C5C1/9/RN2K2NR w - - 0 1'
]

export const HANDICAP_LABELS = ['Không chấp', 'Chấp mã trái', 'Chấp hai mã', 'Chấp chín quân']

/** Bước đi tương đối của Tướng và cũng là 4 hướng thẳng (lên/xuống/trái/phải) */
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

/** Dùng để kiểm tra Mã đối phương có đang chiếu Tướng không (chiều ngược của KNIGHT_DELTA) */
export const KNIGHT_CHECK_DELTA = [
  [-33, -18],
  [-31, -14],
  [14, 31],
  [18, 33]
]

// ================= CÁC BẢNG TRA CỨU =================
// Bản vanilla nhúng sẵn các mảng literal khổng lồ; ở đây ta SINH ra chúng lúc
// nạp module - kết quả giống hệt, nhưng code ngắn và không thể gõ nhầm số.

/** IN_BOARD_[sq] = 1 nếu ô sq nằm trong vùng chơi 9x10 */
const IN_BOARD_: number[] = new Array(256).fill(0)

/** IN_FORT_[sq] = 1 nếu ô sq nằm trong cung Tướng (3x3 mỗi bên) */
const IN_FORT_: number[] = new Array(256).fill(0)

/** LEGAL_SPAN[dst - src + 256]: 1 = bước Tướng, 2 = bước Sĩ, 3 = bước Tượng */
const LEGAL_SPAN: number[] = new Array(512).fill(0)

/** KNIGHT_PIN_[dst - src + 256]: độ dời tới ô "chân mã" cần kiểm tra bị cản */
const KNIGHT_PIN_: number[] = new Array(512).fill(0)

for (let y = RANK_TOP; y <= RANK_BOTTOM; y++) {
  for (let x = FILE_LEFT; x <= FILE_RIGHT; x++) {
    IN_BOARD_[x + (y << 4)] = 1
  }
}

for (const yRange of [
  [3, 5], // cung của Đen (phía trên)
  [10, 12] // cung của Đỏ (phía dưới)
]) {
  for (let y = yRange[0]; y <= yRange[1]; y++) {
    for (let x = 6; x <= 8; x++) {
      IN_FORT_[x + (y << 4)] = 1
    }
  }
}

for (const d of KING_DELTA) LEGAL_SPAN[d + 256] = 1
for (const d of ADVISOR_DELTA) LEGAL_SPAN[d + 256] = 2
for (const d of ADVISOR_DELTA) LEGAL_SPAN[d * 2 + 256] = 3 // Tượng = 2 bước chéo

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

/** Lấy hàng (rank) 3-12 của một ô */
export function RANK_Y(sq: number): number {
  return sq >> 4
}

/** Lấy cột (file) 3-11 của một ô */
export function FILE_X(sq: number): number {
  return sq & 15
}

/** Chuyển (cột, hàng) sang chỉ số ô */
export function COORD_XY(x: number, y: number): number {
  return x + (y << 4)
}

/** Lật ô qua tâm bàn cờ (đổi góc nhìn Đỏ <-> Đen) */
export function SQUARE_FLIP(sq: number): number {
  return 254 - sq
}

/** Ô phía trước của một quân, theo hướng tiến của bên sd (Đỏ tiến lên = y giảm) */
export function SQUARE_FORWARD(sq: number, sd: XqColor): number {
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

/** Ô "mắt Tượng" (điểm giữa) - Tượng bị cản nếu ô này có quân */
export function BISHOP_PIN(sqSrc: number, sqDst: number): number {
  return (sqSrc + sqDst) >> 1
}

/** Ô "chân Mã" - Mã bị cản nếu ô này có quân */
export function KNIGHT_PIN(sqSrc: number, sqDst: number): number {
  return sqSrc + KNIGHT_PIN_[sqDst - sqSrc + 256]
}

/** Ô có nằm ở nửa bàn NHÀ của bên sd không */
export function HOME_HALF(sq: number, sd: XqColor): boolean {
  return (sq & 0x80) !== sd << 7
}

/** Ô có nằm ở nửa bàn ĐỐI PHƯƠNG (đã qua sông) của bên sd không */
export function AWAY_HALF(sq: number, sd: XqColor): boolean {
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

/** Mã "phe" cộng vào mã loại quân: Đỏ = 8 (quân 8-14), Đen = 16 (quân 16-22) */
export function SIDE_TAG(sd: XqColor): number {
  return 8 + (sd << 3)
}

export function OPP_SIDE_TAG(sd: XqColor): number {
  return 16 - (sd << 3)
}

// ----- Đóng gói / mở gói một nước đi thành số nguyên (dùng nội bộ trong Position) -----

export function SRC(mv: number): number {
  return mv & 255
}

export function DST(mv: number): number {
  return mv >> 8
}

export function MOVE(sqSrc: number, sqDst: number): number {
  return sqSrc + (sqDst << 8)
}

// ----- Chuyển đổi ký hiệu -----

/** Bảng tra: mã quân (8-14, 16-22) -> ký tự FEN */
export const FEN_PIECE = '        KABNRCP kabnrcp '

/** Ký tự FEN (viết hoa) -> mã loại quân, -1 nếu không hợp lệ */
export function CHAR_TO_PIECE(c: string): number {
  switch (c) {
    case 'K':
      return PIECE_KING
    case 'A':
      return PIECE_ADVISOR
    case 'B':
    case 'E':
      return PIECE_BISHOP
    case 'H':
    case 'N':
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

/** Mã quân trong mảng squares -> ký tự FEN ('K'..'p'), '' nếu ô trống */
export function pieceCodeToChar(pc: number): XqPieceChar | '' {
  const c = FEN_PIECE.charAt(pc)

  return c === ' ' ? '' : (c as XqPieceChar)
}

/**
 * Chuyển ô sang ký hiệu UCI cờ tướng (cột a-i, hàng 0-9 tính từ phía Đỏ),
 * ví dụ ô Pháo đỏ bên phải lúc khai cuộc = "h2". Dùng khi giao tiếp với engine API.
 */
export function sqToUci(sq: number): string {
  const x = FILE_X(sq)
  const y = RANK_Y(sq)

  return String.fromCharCode(97 + (x - FILE_LEFT)) + String.fromCharCode(48 + (RANK_BOTTOM - y))
}

/** Chuyển ký hiệu UCI 2 ký tự (vd "h2") sang chỉ số ô */
export function uciToSq(uci2: string): number {
  const file = uci2.charCodeAt(0) - 97
  const rank = uci2.charCodeAt(1) - 48

  return COORD_XY(FILE_LEFT + file, RANK_BOTTOM - rank)
}
