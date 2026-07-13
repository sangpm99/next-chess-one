// Engine LUẬT cờ tướng - port TypeScript từ bản vanilla JS (xiangqi-rules.js,
// gốc là XiangQi Wizard Light), đã lược bỏ phần đánh giá thế cờ (PIECE_VALUE)
// vì việc "suy nghĩ" đã do engine API phía server đảm nhiệm; ở client chỉ cần
// sinh nước hợp lệ, phát hiện chiếu/chiếu bí và các luật hòa/cấm lặp nước.
//
// API được thiết kế giống lib/chess/position.ts để store và component dùng
// theo cùng một kiểu: setFen/toFen, legalMoves(), status(), makeMove(),
// uciToMove()/moveToUci()...

import type { XqColor, XqMove, XqGameStatus, XqPieceChar } from '@/types/xiangqi'

import {
  RED,
  PIECE_KING,
  PIECE_ADVISOR,
  PIECE_BISHOP,
  PIECE_KNIGHT,
  PIECE_ROOK,
  PIECE_CANNON,
  PIECE_PAWN,
  RANK_TOP,
  RANK_BOTTOM,
  FILE_LEFT,
  FILE_RIGHT,
  KING_DELTA,
  ADVISOR_DELTA,
  KNIGHT_DELTA,
  KNIGHT_CHECK_DELTA,
  IN_BOARD,
  IN_FORT,
  COORD_XY,
  SQUARE_FORWARD,
  KING_SPAN,
  ADVISOR_SPAN,
  BISHOP_SPAN,
  BISHOP_PIN,
  KNIGHT_PIN,
  HOME_HALF,
  AWAY_HALF,
  SAME_HALF,
  SAME_RANK,
  SAME_FILE,
  SIDE_TAG,
  OPP_SIDE_TAG,
  SRC,
  DST,
  MOVE,
  FEN_PIECE,
  CHAR_TO_PIECE,
  pieceCodeToChar,
  sqToUci,
  uciToSq,
  FILE_X,
  RANK_Y
} from './constants'

// Các ngưỡng điểm dùng cho luật lặp thế cờ (giữ nguyên giá trị từ bản gốc)
const MATE_VALUE = 10000
const BAN_VALUE = MATE_VALUE - 100
const WIN_VALUE = MATE_VALUE - 200
const DRAW_VALUE = 20

const ADD_PIECE = false
const DEL_PIECE = true

// ================= ZOBRIST HASHING =================
// Mỗi thế cờ được "băm" thành 1 con số; 2 thế cờ giống nhau cho ra cùng số.
// Dùng để phát hiện lặp lại thế cờ (luật cấm chiếu dai / đuổi dai).
// Bảng khóa được sinh bằng thuật toán RC4 với seed cố định - GIỐNG HỆT bản
// vanilla để đảm bảo hành vi không đổi.

class RC4 {
  private x = 0
  private y = 0
  private state: number[] = []

  constructor(key: number[]) {
    for (let i = 0; i < 256; i++) this.state.push(i)
    let j = 0

    for (let i = 0; i < 256; i++) {
      j = (j + this.state[i] + key[i % key.length]) & 0xff
      this.swap(i, j)
    }
  }

  private swap(i: number, j: number): void {
    const t = this.state[i]

    this.state[i] = this.state[j]
    this.state[j] = t
  }

  nextByte(): number {
    this.x = (this.x + 1) & 0xff
    this.y = (this.y + this.state[this.x]) & 0xff
    this.swap(this.x, this.y)
    const t = (this.state[this.x] + this.state[this.y]) & 0xff

    return this.state[t]
  }

  nextLong(): number {
    const n0 = this.nextByte()
    const n1 = this.nextByte()
    const n2 = this.nextByte()
    const n3 = this.nextByte()

    return n0 + (n1 << 8) + (n2 << 16) + ((n3 << 24) & 0xffffffff)
  }
}

const PreGen_zobristKeyTable: number[][] = []
const PreGen_zobristLockTable: number[][] = []
let PreGen_zobristKeyPlayer = 0
let PreGen_zobristLockPlayer = 0

{
  const rc4 = new RC4([0])

  PreGen_zobristKeyPlayer = rc4.nextLong()
  rc4.nextLong()
  PreGen_zobristLockPlayer = rc4.nextLong()

  for (let i = 0; i < 14; i++) {
    const keys: number[] = []
    const locks: number[] = []

    for (let j = 0; j < 256; j++) {
      keys.push(rc4.nextLong())
      rc4.nextLong()
      locks.push(rc4.nextLong())
    }

    PreGen_zobristKeyTable.push(keys)
    PreGen_zobristLockTable.push(locks)
  }
}

// ================= CLASS POSITION =================

export class Position {
  /** Bên đang được đi: 0 = Đỏ, 1 = Đen */
  sdPlayer: XqColor = RED

  /**
   * Bàn cờ 256 ô: 0 = ô trống, 8-14 = quân Đỏ (K A B N R C P),
   * 16-22 = quân Đen. Vùng chơi thật là 9x10 ô (xem constants.ts).
   */
  squares: number[] = []

  zobristKey = 0
  zobristLock = 0

  /** Lịch sử nước đi (mv dạng số nguyên), phần tử [0] luôn là 0 làm mốc */
  mvList: number[] = [0]

  /** Quân bị ăn ở từng nước tương ứng mvList (0 = không ăn quân) */
  pcList: number[] = [0]

  /** zobristKey TRƯỚC từng nước đi - dùng phát hiện lặp thế cờ */
  keyList: number[] = [0]

  /** Bên vừa được chuyển lượt có đang bị chiếu không, ở từng nước */
  chkList: boolean[] = [false]

  /** Số nước đã đi tính từ mốc setIrrev gần nhất */
  distance = 0

  constructor(fen?: string) {
    this.clearBoard()
    if (fen) this.setFen(fen)
  }

  clearBoard(): void {
    this.sdPlayer = RED
    this.squares = new Array(256).fill(0)
    this.zobristKey = 0
    this.zobristLock = 0
  }

  /** Đặt lại mốc lịch sử (gọi sau khi nạp FEN mới) */
  setIrrev(): void {
    this.mvList = [0]
    this.pcList = [0]
    this.keyList = [0]
    this.chkList = [this.checked()]
    this.distance = 0
  }

  addPiece(sq: number, pc: number, bDel = ADD_PIECE): void {
    this.squares[sq] = bDel ? 0 : pc
    const pcAdjust = pc < 16 ? pc - 8 : pc - 16 + 7

    this.zobristKey ^= PreGen_zobristKeyTable[pcAdjust][sq]
    this.zobristLock ^= PreGen_zobristLockTable[pcAdjust][sq]
  }

  private movePiece(mv: number): void {
    const sqSrc = SRC(mv)
    const sqDst = DST(mv)
    let pc = this.squares[sqDst]

    this.pcList.push(pc)
    if (pc > 0) this.addPiece(sqDst, pc, DEL_PIECE)
    pc = this.squares[sqSrc]
    this.addPiece(sqSrc, pc, DEL_PIECE)
    this.addPiece(sqDst, pc, ADD_PIECE)
    this.mvList.push(mv)
  }

  private undoMovePiece(): void {
    const mv = this.mvList.pop() as number
    const sqSrc = SRC(mv)
    const sqDst = DST(mv)
    let pc = this.squares[sqDst]

    this.addPiece(sqDst, pc, DEL_PIECE)
    this.addPiece(sqSrc, pc, ADD_PIECE)
    pc = this.pcList.pop() as number
    if (pc > 0) this.addPiece(sqDst, pc, ADD_PIECE)
  }

  changeSide(): void {
    this.sdPlayer = (1 - this.sdPlayer) as XqColor
    this.zobristKey ^= PreGen_zobristKeyPlayer
    this.zobristLock ^= PreGen_zobristLockPlayer
  }

  /**
   * Thực hiện 1 nước đi (mv dạng số nguyên nội bộ). Trả về false và KHÔNG
   * thay đổi gì nếu nước đi khiến Tướng mình bị chiếu (tự sát) - đây là cách
   * lọc nước "hợp lệ thật sự" của engine gốc.
   */
  makeMoveInt(mv: number): boolean {
    const zobristKey = this.zobristKey

    this.movePiece(mv)

    if (this.checked()) {
      this.undoMovePiece()

      return false
    }

    this.keyList.push(zobristKey)
    this.changeSide()
    this.chkList.push(this.checked())
    this.distance++

    return true
  }

  undoMakeMove(): void {
    this.distance--
    this.chkList.pop()
    this.changeSide()
    this.keyList.pop()
    this.undoMovePiece()
  }

  // ================= FEN =================

  /** Nạp thế cờ từ chuỗi FEN cờ tướng, ví dụ "rnbakabnr/9/1c5c1/... w - - 0 1" */
  setFen(fen: string): void {
    this.clearBoard()
    let y = RANK_TOP
    let x = FILE_LEFT
    let index = 0

    if (index === fen.length) {
      this.setIrrev()

      return
    }

    let c = fen.charAt(index)

    while (c !== ' ') {
      if (c === '/') {
        x = FILE_LEFT
        y++
        if (y > RANK_BOTTOM) break
      } else if (c >= '1' && c <= '9') {
        x += c.charCodeAt(0) - 48
      } else if (c >= 'A' && c <= 'Z') {
        if (x <= FILE_RIGHT) {
          const pt = CHAR_TO_PIECE(c)

          if (pt >= 0) this.addPiece(COORD_XY(x, y), pt + 8)
          x++
        }
      } else if (c >= 'a' && c <= 'z') {
        if (x <= FILE_RIGHT) {
          const pt = CHAR_TO_PIECE(String.fromCharCode(c.charCodeAt(0) + 65 - 97))

          if (pt >= 0) this.addPiece(COORD_XY(x, y), pt + 16)
          x++
        }
      }

      index++

      if (index === fen.length) {
        this.setIrrev()

        return
      }

      c = fen.charAt(index)
    }

    index++

    if (index === fen.length) {
      this.setIrrev()

      return
    }

    // Ký tự tiếp theo là bên được đi: "w" (hoặc "r") = Đỏ, "b" = Đen
    if (this.sdPlayer === (fen.charAt(index) === 'b' ? 0 : 1)) {
      this.changeSide()
    }

    this.setIrrev()
  }

  /** Xuất thế cờ hiện tại thành FEN đầy đủ 6 trường (dùng được ngay cho engine API) */
  toFen(): string {
    let fen = ''

    for (let y = RANK_TOP; y <= RANK_BOTTOM; y++) {
      let k = 0

      for (let x = FILE_LEFT; x <= FILE_RIGHT; x++) {
        const pc = this.squares[COORD_XY(x, y)]

        if (pc > 0) {
          if (k > 0) {
            fen += String.fromCharCode(48 + k)
            k = 0
          }

          fen += FEN_PIECE.charAt(pc)
        } else {
          k++
        }
      }

      if (k > 0) fen += String.fromCharCode(48 + k)
      fen += '/'
    }

    return fen.substring(0, fen.length - 1) + (this.sdPlayer === RED ? ' w' : ' b') + ' - - 0 1'
  }

  // ================= SINH NƯỚC ĐI =================

  /**
   * Sinh tất cả nước đi "giả hợp lệ" (đúng cách di chuyển của quân, nhưng CHƯA
   * kiểm tra có để Tướng mình bị chiếu hay không). Trả về mảng mv số nguyên.
   */
  generateMoves(): number[] {
    const mvs: number[] = []
    const pcSelfSide = SIDE_TAG(this.sdPlayer)
    const pcOppSide = OPP_SIDE_TAG(this.sdPlayer)

    for (let sqSrc = 0; sqSrc < 256; sqSrc++) {
      const pcSrc = this.squares[sqSrc]

      if ((pcSrc & pcSelfSide) === 0) continue

      switch (pcSrc - pcSelfSide) {
        case PIECE_KING:
          for (let i = 0; i < 4; i++) {
            const sqDst = sqSrc + KING_DELTA[i]

            if (!IN_FORT(sqDst)) continue
            if ((this.squares[sqDst] & pcSelfSide) === 0) mvs.push(MOVE(sqSrc, sqDst))
          }

          break

        case PIECE_ADVISOR:
          for (let i = 0; i < 4; i++) {
            const sqDst = sqSrc + ADVISOR_DELTA[i]

            if (!IN_FORT(sqDst)) continue
            if ((this.squares[sqDst] & pcSelfSide) === 0) mvs.push(MOVE(sqSrc, sqDst))
          }

          break

        case PIECE_BISHOP:
          for (let i = 0; i < 4; i++) {
            let sqDst = sqSrc + ADVISOR_DELTA[i]

            // Ô "mắt Tượng" phải trong bàn, cùng nửa sân nhà và KHÔNG có quân cản
            if (!(IN_BOARD(sqDst) && HOME_HALF(sqDst, this.sdPlayer) && this.squares[sqDst] === 0)) continue
            sqDst += ADVISOR_DELTA[i]
            if ((this.squares[sqDst] & pcSelfSide) === 0) mvs.push(MOVE(sqSrc, sqDst))
          }

          break

        case PIECE_KNIGHT:
          for (let i = 0; i < 4; i++) {
            // Chân Mã bị cản thì bỏ qua cả 2 hướng nhảy của chân đó
            let sqDst = sqSrc + KING_DELTA[i]

            if (this.squares[sqDst] > 0) continue

            for (let j = 0; j < 2; j++) {
              sqDst = sqSrc + KNIGHT_DELTA[i][j]
              if (!IN_BOARD(sqDst)) continue
              if ((this.squares[sqDst] & pcSelfSide) === 0) mvs.push(MOVE(sqSrc, sqDst))
            }
          }

          break

        case PIECE_ROOK:
          for (let i = 0; i < 4; i++) {
            const delta = KING_DELTA[i]
            let sqDst = sqSrc + delta

            while (IN_BOARD(sqDst)) {
              const pcDst = this.squares[sqDst]

              if (pcDst === 0) {
                mvs.push(MOVE(sqSrc, sqDst))
              } else {
                if ((pcDst & pcOppSide) !== 0) mvs.push(MOVE(sqSrc, sqDst))
                break
              }

              sqDst += delta
            }
          }

          break

        case PIECE_CANNON:
          for (let i = 0; i < 4; i++) {
            const delta = KING_DELTA[i]
            let sqDst = sqSrc + delta

            // Pha 1: đi như Xe khi không ăn quân
            while (IN_BOARD(sqDst)) {
              if (this.squares[sqDst] === 0) {
                mvs.push(MOVE(sqSrc, sqDst))
              } else {
                break
              }

              sqDst += delta
            }

            // Pha 2: nhảy qua "ngòi" để ăn quân đầu tiên phía sau
            sqDst += delta

            while (IN_BOARD(sqDst)) {
              const pcDst = this.squares[sqDst]

              if (pcDst > 0) {
                if ((pcDst & pcOppSide) !== 0) mvs.push(MOVE(sqSrc, sqDst))
                break
              }

              sqDst += delta
            }
          }

          break

        case PIECE_PAWN: {
          // Tiến 1 ô
          let sqDst = SQUARE_FORWARD(sqSrc, this.sdPlayer)

          if (IN_BOARD(sqDst) && (this.squares[sqDst] & pcSelfSide) === 0) {
            mvs.push(MOVE(sqSrc, sqDst))
          }

          // Đã qua sông thì được đi ngang
          if (AWAY_HALF(sqSrc, this.sdPlayer)) {
            for (let delta = -1; delta <= 1; delta += 2) {
              sqDst = sqSrc + delta

              if (IN_BOARD(sqDst) && (this.squares[sqDst] & pcSelfSide) === 0) {
                mvs.push(MOVE(sqSrc, sqDst))
              }
            }
          }

          break
        }
      }
    }

    return mvs
  }

  /** Kiểm tra 1 nước đi có đúng cách di chuyển của quân không (chưa xét tự để bị chiếu) */
  legalMoveInt(mv: number): boolean {
    const sqSrc = SRC(mv)
    const pcSrc = this.squares[sqSrc]
    const pcSelfSide = SIDE_TAG(this.sdPlayer)

    if ((pcSrc & pcSelfSide) === 0) return false

    const sqDst = DST(mv)
    const pcDst = this.squares[sqDst]

    if ((pcDst & pcSelfSide) !== 0) return false

    switch (pcSrc - pcSelfSide) {
      case PIECE_KING:
        return IN_FORT(sqDst) && KING_SPAN(sqSrc, sqDst)

      case PIECE_ADVISOR:
        return IN_FORT(sqDst) && ADVISOR_SPAN(sqSrc, sqDst)

      case PIECE_BISHOP:
        return SAME_HALF(sqSrc, sqDst) && BISHOP_SPAN(sqSrc, sqDst) && this.squares[BISHOP_PIN(sqSrc, sqDst)] === 0

      case PIECE_KNIGHT: {
        const sqPin = KNIGHT_PIN(sqSrc, sqDst)

        return sqPin !== sqSrc && this.squares[sqPin] === 0
      }

      case PIECE_ROOK:
      case PIECE_CANNON: {
        let delta: number

        if (SAME_RANK(sqSrc, sqDst)) {
          delta = sqDst < sqSrc ? -1 : 1
        } else if (SAME_FILE(sqSrc, sqDst)) {
          delta = sqDst < sqSrc ? -16 : 16
        } else {
          return false
        }

        let sqPin = sqSrc + delta

        while (sqPin !== sqDst && this.squares[sqPin] === 0) sqPin += delta

        if (sqPin === sqDst) {
          // Đường trống tới đích: Xe được đi/ăn, Pháo chỉ được đi (không ăn)
          return pcDst === 0 || pcSrc - pcSelfSide === PIECE_ROOK
        }

        // Có quân cản: chỉ Pháo được nhảy ăn, và đích phải có quân
        if (pcDst === 0 || pcSrc - pcSelfSide !== PIECE_CANNON) return false
        sqPin += delta

        while (sqPin !== sqDst && this.squares[sqPin] === 0) sqPin += delta

        return sqPin === sqDst
      }

      case PIECE_PAWN:
        if (AWAY_HALF(sqDst, this.sdPlayer) && (sqDst === sqSrc - 1 || sqDst === sqSrc + 1)) {
          return true
        }

        return sqDst === SQUARE_FORWARD(sqSrc, this.sdPlayer)

      default:
        return false
    }
  }

  /** Tướng của bên đang được đi có đang bị chiếu không */
  checked(): boolean {
    const pcSelfSide = SIDE_TAG(this.sdPlayer)
    const pcOppSide = OPP_SIDE_TAG(this.sdPlayer)

    for (let sqSrc = 0; sqSrc < 256; sqSrc++) {
      if (this.squares[sqSrc] !== pcSelfSide + PIECE_KING) continue

      // 1. Bị Tốt đối phương chiếu (từ phía trước hoặc 2 bên)
      if (this.squares[SQUARE_FORWARD(sqSrc, this.sdPlayer)] === pcOppSide + PIECE_PAWN) return true

      for (let delta = -1; delta <= 1; delta += 2) {
        if (this.squares[sqSrc + delta] === pcOppSide + PIECE_PAWN) return true
      }

      // 2. Bị Mã đối phương chiếu (chú ý chân mã tính từ phía Tướng)
      for (let i = 0; i < 4; i++) {
        if (this.squares[sqSrc + ADVISOR_DELTA[i]] !== 0) continue

        for (let j = 0; j < 2; j++) {
          const pcDst = this.squares[sqSrc + KNIGHT_CHECK_DELTA[i][j]]

          if (pcDst === pcOppSide + PIECE_KNIGHT) return true
        }
      }

      // 3. Bị Xe / Pháo chiếu, hoặc 2 Tướng đối mặt
      for (let i = 0; i < 4; i++) {
        const delta = KING_DELTA[i]
        let sqDst = sqSrc + delta

        while (IN_BOARD(sqDst)) {
          const pcDst = this.squares[sqDst]

          if (pcDst > 0) {
            if (pcDst === pcOppSide + PIECE_ROOK || pcDst === pcOppSide + PIECE_KING) return true
            break
          }

          sqDst += delta
        }

        sqDst += delta

        while (IN_BOARD(sqDst)) {
          const pcDst = this.squares[sqDst]

          if (pcDst > 0) {
            if (pcDst === pcOppSide + PIECE_CANNON) return true
            break
          }

          sqDst += delta
        }
      }

      return false
    }

    return false
  }

  /** Bên đang được đi có hết nước đi hợp lệ không (= thua trong cờ tướng) */
  isMate(): boolean {
    const mvs = this.generateMoves()

    for (let i = 0; i < mvs.length; i++) {
      if (this.makeMoveInt(mvs[i])) {
        this.undoMakeMove()

        return false
      }
    }

    return true
  }

  // ================= LUẬT LẶP THẾ CỜ =================

  private banValue(): number {
    return this.distance - BAN_VALUE
  }

  private drawValue(): number {
    return (this.distance & 1) === 0 ? -DRAW_VALUE : DRAW_VALUE
  }

  /** Bên vừa được chuyển lượt có đang bị chiếu không (đọc từ lịch sử) */
  inCheck(): boolean {
    return this.chkList[this.chkList.length - 1]
  }

  /** Nước đi vừa rồi có ăn quân không */
  captured(): boolean {
    return this.pcList[this.pcList.length - 1] > 0
  }

  repValue(vlRep: number): number {
    const vlReturn = ((vlRep & 2) === 0 ? 0 : this.banValue()) + ((vlRep & 4) === 0 ? 0 : -this.banValue())

    return vlReturn === 0 ? this.drawValue() : vlReturn
  }

  /**
   * Phát hiện lặp thế cờ. Trả về 0 nếu chưa lặp; ngược lại là mã bit:
   * bit 1 = có lặp, bit 2 = bên mình chiếu dai, bit 4 = đối phương chiếu dai.
   */
  repStatus(recur_ = 1): number {
    let recur = recur_
    let selfSide = false
    let perpCheck = true
    let oppPerpCheck = true
    let index = this.mvList.length - 1

    while (this.mvList[index] > 0 && this.pcList[index] === 0) {
      if (selfSide) {
        perpCheck = perpCheck && this.chkList[index]

        if (this.keyList[index] === this.zobristKey) {
          recur--

          if (recur === 0) {
            return 1 + (perpCheck ? 2 : 0) + (oppPerpCheck ? 4 : 0)
          }
        }
      } else {
        oppPerpCheck = oppPerpCheck && this.chkList[index]
      }

      selfSide = !selfSide
      index--
    }

    return 0
  }

  // ================= API "KIỂU CHESS" CHO STORE / COMPONENT =================

  /** Bên đang được đi (alias để đồng bộ tên với lib/chess: position.turn) */
  get turn(): XqColor {
    return this.sdPlayer
  }

  /** Ký tự quân tại 1 ô ('K'..'p' hoặc '' nếu trống) - tiện cho component */
  pieceAt(sq: number): XqPieceChar | '' {
    return pieceCodeToChar(this.squares[sq])
  }

  /** Ô đang đứng của Tướng bên sd, -1 nếu không tìm thấy */
  kingSquare(sd: XqColor): number {
    const pc = SIDE_TAG(sd) + PIECE_KING

    for (let sq = 0; sq < 256; sq++) {
      if (this.squares[sq] === pc) return sq
    }

    return -1
  }

  /** Tất cả nước đi HỢP LỆ THẬT SỰ (đã loại nước tự để Tướng bị chiếu) */
  legalMoves(): XqMove[] {
    const result: XqMove[] = []
    const mvs = this.generateMoves()

    for (const mv of mvs) {
      if (this.makeMoveInt(mv)) {
        this.undoMakeMove()
        result.push({ from: SRC(mv), to: DST(mv) })
      }
    }

    return result
  }

  /**
   * Thực hiện 1 nước đi dạng {from, to}. Trả về false nếu nước đi không hợp lệ
   * (sai cách di chuyển hoặc tự để bị chiếu) - khi đó thế cờ KHÔNG thay đổi.
   */
  makeMove(move: XqMove): boolean {
    const mv = MOVE(move.from, move.to)

    if (!this.legalMoveInt(mv)) return false

    return this.makeMoveInt(mv)
  }

  /**
   * Trạng thái ván cờ hiện tại. Kiểm tra theo đúng thứ tự của bản vanilla
   * (xiangqi-board.js -> postAddMove): chiếu bí/hết nước -> lặp thế cờ ->
   * hết quân tấn công -> quá lâu không ăn quân.
   */
  status(): XqGameStatus {
    const sideToMove = this.sdPlayer
    const opponent = (1 - sideToMove) as XqColor
    const colorName = (c: XqColor): 'red' | 'black' => (c === RED ? 'red' : 'black')

    // 1. Bên đang được đi hết nước hợp lệ -> thua (bao gồm cả chiếu bí)
    if (this.isMate()) {
      return { over: true, result: colorName(opponent), reason: 'checkmate' }
    }

    // 2. Lặp lại thế cờ 3 lần
    const vlRep = this.repStatus(3)

    if (vlRep > 0) {
      const vl = this.repValue(vlRep)

      if (vl > -WIN_VALUE && vl < WIN_VALUE) {
        return { over: true, result: 'draw', reason: 'repetition' }
      }

      // Chiếu dai bị xử thua: vl âm sâu = bên đang được đi phạm luật
      return {
        over: true,
        result: vl < 0 ? colorName(opponent) : colorName(sideToMove),
        reason: 'perpetual'
      }
    }

    // 3. Cả 2 bên không còn quân tấn công (Mã/Xe/Pháo/Tốt) -> hòa
    if (this.captured()) {
      let hasMaterial = false

      for (let sq = 0; sq < 256; sq++) {
        if (IN_BOARD(sq) && (this.squares[sq] & 7) > 2) {
          hasMaterial = true
          break
        }
      }

      if (!hasMaterial) {
        return { over: true, result: 'draw', reason: 'material' }
      }
    } else if (this.pcList.length > 100) {
      // 4. 100 nửa-nước liên tiếp không ăn quân -> hòa
      let anyCapture = false

      for (let i = 2; i <= 100; i++) {
        if (this.pcList[this.pcList.length - i] > 0) {
          anyCapture = true
          break
        }
      }

      if (!anyCapture) {
        return { over: true, result: 'draw', reason: 'longgame' }
      }
    }

    return { over: false, check: this.inCheck() }
  }

  // ----- Chuyển đổi ký hiệu nước đi -----

  /** {from,to} -> chuỗi UCI 4 ký tự, ví dụ "h2e2" - dùng khi gọi engine API / lưu lịch sử */
  moveToUci(move: XqMove): string {
    return sqToUci(move.from) + sqToUci(move.to)
  }

  /**
   * Chuỗi UCI -> {from,to}, có kiểm tra tính hợp lệ ở thế cờ hiện tại.
   * Trả về null nếu chuỗi hỏng hoặc nước đi không hợp lệ.
   */
  uciToMove(uci: string): XqMove | null {
    if (!uci || uci.length < 4) return null

    const move: XqMove = { from: uciToSq(uci.substring(0, 2)), to: uciToSq(uci.substring(2, 4)) }

    if (!this.legalMoveInt(MOVE(move.from, move.to))) return null

    return move
  }

  /** {from,to} -> ký hiệu ICCS để hiển thị cho người chơi, ví dụ "H2-E2" */
  moveToIccs(move: XqMove): string {
    const part = (sq: number) =>
      String.fromCharCode(65 + FILE_X(sq) - FILE_LEFT) + String.fromCharCode(57 - RANK_Y(sq) + RANK_TOP)

    return part(move.from) + '-' + part(move.to)
  }
}
