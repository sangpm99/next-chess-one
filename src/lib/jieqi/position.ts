// Engine LUẬT cờ úp (Jieqi) - port TypeScript từ bản vanilla JS (jieqi-rules.js).
// API thiết kế giống lib/xiangqi/position.ts để store và component dùng theo
// cùng một kiểu: setFen/toFen, legalMoves(), status(), makeMove(), uciToMove()...
//
// Khác biệt cốt lõi so với cờ tướng:
// - Mỗi ô có thêm cờ "dark" (đang úp hay đã lật). Quân úp di chuyển theo loại
//   quân của ô xuất phát (bàn cờ chuẩn), quân ĐÃ LẬT được đi TỰ DO: Sĩ ra khỏi
//   cung, Tượng qua sông (vẫn bị cản mắt Tượng); Tướng luôn ở trong cung.
// - Hồ quân úp (pool): danh tính thật của quân úp. Đi 1 quân úp -> rút ngẫu
//   nhiên từ hồ để lật; ăn 1 quân úp -> rút từ hồ ĐỐI PHƯƠNG để lộ quân bị ăn.
//   Khi máy đi, engine chỉ định sẵn kết quả lật qua chuỗi UCI (vd "a3a4Nc").
// - Không dùng Zobrist: phát hiện lặp thế cờ bằng chuỗi placementKey, và chuỗi
//   lặp bị CẮT khi có ăn quân hoặc lật quân.
// - Có halfmove/fullmove trong FEN (halfmove reset khi ăn quân HOẶC lật quân).

import type { JqColor, JqMove, JqReveal, JqGameStatus, JqPieceChar } from '@/types/jieqi'

import {
  RED,
  BLACK,
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
  KNIGHT_DELTA,
  IN_BOARD,
  IN_FORT,
  COORD_XY,
  SQUARE_FORWARD,
  KING_SPAN,
  ADVISOR_SPAN,
  BISHOP_SPAN,
  BISHOP_PIN,
  KNIGHT_PIN,
  AWAY_HALF,
  SAME_RANK,
  SAME_FILE,
  SIDE_TAG,
  SRC,
  DST,
  MOVE,
  TYPE_TO_CHAR,
  CHAR_TO_TYPE,
  START_TYPE,
  FULL_POOL,
  pieceCodeToChar,
  sqToUci,
  uciToSq,
  FILE_X,
  RANK_Y
} from './constants'

/** Luật tùy chọn: quân đã lật được đi tự do (Sĩ ra cung, Tượng qua sông) - giữ bật như bản gốc */
export const JIEQI_FREE_AFTER_REVEAL = true

const MATE_VALUE = 10000
const WIN_VALUE = MATE_VALUE - 200

/** Bản ghi lịch sử 1 nước đi - đủ thông tin để undo chính xác (kể cả trả quân về hồ) */
interface HistEntry {
  mv: number
  src: number
  dst: number
  srcPc: number
  srcDark: boolean
  capPc: number
  capDark: boolean

  /** Loại quân được lật của QUÂN DI CHUYỂN (-1 nếu quân đi vốn đã lộ mặt) */
  revealMover: number

  /** Loại quân được lật của QUÂN BỊ ĂN (-1 nếu quân bị ăn vốn đã lộ mặt / không ăn) */
  revealCap: number
  halfmove: number
  fullmove: number
}

export class Position {
  /** Bên đang được đi: 0 = Đỏ, 1 = Đen */
  sdPlayer: JqColor = RED

  /** Bàn cờ 256 ô: 0 = trống, 8-14 = Đỏ, 16-22 = Đen. Với quân úp, loại quân
   *  lưu ở đây là loại của Ô XUẤT PHÁT (quy định cách di chuyển khi còn úp). */
  squares: number[] = []

  /** dark[sq] = true nếu quân ở ô sq đang ÚP */
  dark: boolean[] = []

  /** Hồ quân úp: pool[8] của Đỏ, pool[16] của Đen; map loại quân -> số lượng còn lại */
  pool: Record<number, Record<number, number>> = { 8: {}, 16: {} }

  /** Số nửa-nước liên tiếp không ăn quân và không lật quân */
  halfmove = 0
  fullmove = 1

  /** Chuỗi UCI của nước đi gần nhất, KÈM ký tự lật quân (vd "a3a4Nc") - dùng lưu lịch sử/replay */
  lastMoveUci: string | null = null

  mvList: number[] = [0]
  pcList: number[] = [0]
  histList: (HistEntry | null)[] = [null]

  /** placementKey của từng thời điểm - dùng phát hiện lặp thế cờ */
  fenList: string[] = ['']
  chkList: boolean[] = [false]
  distance = 0

  constructor(fen?: string) {
    this.clearBoard()
    if (fen) this.setFen(fen)
  }

  clearBoard(): void {
    this.sdPlayer = RED
    this.squares = new Array(256).fill(0)
    this.dark = new Array(256).fill(false)
    this.pool = { 8: {}, 16: {} }
    this.halfmove = 0
    this.fullmove = 1
    this.lastMoveUci = null
  }

  setIrrev(): void {
    this.mvList = [0]
    this.pcList = [0]
    this.histList = [null]
    this.fenList = [this.placementKey()]
    this.chkList = [this.checked()]
    this.distance = 0
  }

  /** Tổng số quân còn trong hồ úp của bên sd */
  poolCount(sd: JqColor): number {
    let t = 0
    const p = this.pool[SIDE_TAG(sd)]

    for (const k in p) t += p[k]

    return t
  }

  /** Chuỗi mô tả thế cờ (kể cả trạng thái úp/mở + bên được đi) - "chữ ký" để so lặp thế cờ */
  placementKey(): string {
    let s = ''

    for (let sq = 0; sq < 256; sq++) {
      if (!IN_BOARD(sq)) continue
      const pc = this.squares[sq]

      if (pc === 0) {
        s += '.'
        continue
      }

      if (this.dark[sq]) {
        s += pc < 16 ? 'X' : 'x'
      } else {
        const ch = TYPE_TO_CHAR[pc & 7]

        s += pc < 16 ? ch : ch.toLowerCase()
      }
    }

    return s + (this.sdPlayer === RED ? 'w' : 'b')
  }

  // ================= FEN =================

  /** Nạp thế cờ từ FEN cờ úp: "bàn_cờ bên_đi hồ_quân halfmove fullmove" */
  setFen(fen: string): void {
    this.clearBoard()
    const parts = fen.trim().split(/\s+/)
    const board = parts[0] || ''
    let y = RANK_TOP
    let x = FILE_LEFT

    for (let i = 0; i < board.length; i++) {
      const c = board.charAt(i)

      if (c === '/') {
        x = FILE_LEFT
        y++
        if (y > RANK_BOTTOM) break
        continue
      }

      if (c >= '1' && c <= '9') {
        x += c.charCodeAt(0) - 48
        continue
      }

      if (x > FILE_RIGHT) continue
      const sq = COORD_XY(x, y)

      if (c === 'X' || c === 'x') {
        // Quân úp: loại quân (để biết cách di chuyển) = loại của ô này trên bàn cờ chuẩn
        const sd: JqColor = c === 'X' ? 0 : 1
        let t = START_TYPE(sq)

        if (t < 0 || t === PIECE_KING) {
          t = PIECE_ROOK
          console.warn('[jieqi] quân úp ở ô lạ', sqToUci(sq))
        }

        this.squares[sq] = SIDE_TAG(sd) + t
        this.dark[sq] = true
      } else {
        const t2 = CHAR_TO_TYPE(c)

        if (t2 >= 0) {
          const sd2: JqColor = c === c.toUpperCase() ? 0 : 1

          this.squares[sq] = SIDE_TAG(sd2) + t2
          this.dark[sq] = false
        }
      }

      x++
    }

    this.sdPlayer = parts[1] === 'b' ? 1 : 0
    this.pool = { 8: {}, 16: {} }
    const rest = parts[2] || ''

    if (rest && rest !== '-') {
      const re = /([A-Za-z])(\d*)/g
      let m: RegExpExecArray | null

      while ((m = re.exec(rest)) !== null) {
        const ch = m[1]
        const cnt = m[2] === '' ? 1 : parseInt(m[2], 10)
        const t3 = CHAR_TO_TYPE(ch)

        if (t3 < 0) continue
        const tag = ch === ch.toUpperCase() ? 8 : 16

        this.pool[tag][t3] = (this.pool[tag][t3] || 0) + cnt
      }
    } else {
      this.pool[8] = FULL_POOL()
      this.pool[16] = FULL_POOL()
    }

    this.halfmove = parts[3] ? parseInt(parts[3], 10) || 0 : 0
    this.fullmove = parts[4] ? parseInt(parts[4], 10) || 1 : 1
    this.setIrrev()
  }

  private poolToString(tag: number): string {
    const p = this.pool[tag]
    let s = ''
    const POOL_ORDER = [PIECE_ROOK, PIECE_ADVISOR, PIECE_CANNON, PIECE_PAWN, PIECE_KNIGHT, PIECE_BISHOP]

    for (const t of POOL_ORDER) {
      const n = p[t] || 0

      if (n > 0) {
        const ch = TYPE_TO_CHAR[t]

        s += (tag === 8 ? ch : ch.toLowerCase()) + n
      }
    }

    return s
  }

  /** Xuất FEN đầy đủ 5 trường (kể cả hồ quân) - dùng được ngay cho engine API */
  toFen(): string {
    let fen = ''

    for (let y = RANK_TOP; y <= RANK_BOTTOM; y++) {
      let k = 0

      for (let x = FILE_LEFT; x <= FILE_RIGHT; x++) {
        const sq = COORD_XY(x, y)
        const pc = this.squares[sq]

        if (pc > 0) {
          if (k > 0) {
            fen += k
            k = 0
          }

          if (this.dark[sq]) {
            fen += pc < 16 ? 'X' : 'x'
          } else {
            const ch = TYPE_TO_CHAR[pc & 7]

            fen += pc < 16 ? ch : ch.toLowerCase()
          }
        } else {
          k++
        }
      }

      if (k > 0) fen += k
      if (y < RANK_BOTTOM) fen += '/'
    }

    let rest = this.poolToString(8) + this.poolToString(16)

    if (rest === '') rest = '-'

    return fen + ' ' + (this.sdPlayer === RED ? 'w' : 'b') + ' ' + rest + ' ' + this.halfmove + ' ' + this.fullmove
  }

  // ================= LUẬT DI CHUYỂN =================

  /**
   * Quân loại "type" của bên "sd" (đang úp = isDark) đứng ở fromSq có thể
   * ĐI TỚI toSq theo cách di chuyển của nó không (chưa xét tự để bị chiếu).
   * Quân đã lật được đi tự do: Sĩ ra khỏi cung, Tượng qua sông.
   */
  canReach(fromSq: number, type: number, sd: JqColor, isDark: boolean, toSq: number): boolean {
    if (fromSq === toSq) return false
    const free = JIEQI_FREE_AFTER_REVEAL && !isDark

    switch (type) {
      case PIECE_KING:
        return IN_FORT(toSq) && KING_SPAN(fromSq, toSq)

      case PIECE_ADVISOR:
        if (!ADVISOR_SPAN(fromSq, toSq)) return false

        return free ? IN_BOARD(toSq) : IN_FORT(toSq)

      case PIECE_BISHOP:
        if (!BISHOP_SPAN(fromSq, toSq)) return false
        if (this.squares[BISHOP_PIN(fromSq, toSq)] !== 0) return false
        if (!IN_BOARD(toSq)) return false

        return free ? true : !AWAY_HALF(toSq, sd)

      case PIECE_KNIGHT: {
        for (let i = 0; i < 4; i++) {
          for (let j = 0; j < 2; j++) {
            if (fromSq + KNIGHT_DELTA[i][j] === toSq) {
              if (this.squares[KNIGHT_PIN(fromSq, toSq)] === 0) return IN_BOARD(toSq)

              return false
            }
          }
        }

        return false
      }

      case PIECE_ROOK:
      case PIECE_CANNON: {
        if (!SAME_RANK(fromSq, toSq) && !SAME_FILE(fromSq, toSq)) return false
        const delta = SAME_RANK(fromSq, toSq) ? (toSq > fromSq ? 1 : -1) : toSq > fromSq ? 16 : -16
        let sq = fromSq + delta
        let screens = 0

        while (sq !== toSq) {
          if (!IN_BOARD(sq)) return false
          if (this.squares[sq] !== 0) screens++
          sq += delta
        }

        const destOcc = this.squares[toSq] !== 0

        if (type === PIECE_ROOK) return screens === 0

        // Pháo: đi thường cần đường trống, ăn cần đúng 1 "ngòi"
        return destOcc ? screens === 1 : screens === 0
      }

      case PIECE_PAWN: {
        const fwd = SQUARE_FORWARD(fromSq, sd)

        if (toSq === fwd) return IN_BOARD(toSq)

        if (AWAY_HALF(fromSq, sd) && SAME_RANK(fromSq, toSq) && (toSq === fromSq - 1 || toSq === fromSq + 1)) {
          return IN_BOARD(toSq)
        }

        return false
      }
    }

    return false
  }

  /** Ô targetSq có bị bên bySd tấn công không (Tướng tính cả luật "đối mặt") */
  attacked(targetSq: number, bySd: JqColor): boolean {
    const tag = SIDE_TAG(bySd)

    for (let sq = 0; sq < 256; sq++) {
      const pc = this.squares[sq]

      if (pc === 0 || (pc & tag) === 0) continue
      const type = pc & 7
      const isDark = this.dark[sq]

      if (type === PIECE_KING) {
        // Luật 2 Tướng đối mặt: Tướng "tấn công" ô của Tướng đối phương trên cùng cột trống
        if (SAME_FILE(sq, targetSq)) {
          const d = targetSq > sq ? 16 : -16
          let s2 = sq + d
          let ok = true

          while (s2 !== targetSq) {
            if (this.squares[s2] !== 0) {
              ok = false
              break
            }

            s2 += d
          }

          if (ok && (this.squares[targetSq] & 7) === PIECE_KING) return true
        }

        continue
      }

      if (this.canReach(sq, type, bySd, isDark, targetSq)) return true
    }

    return false
  }

  /** Ô đang đứng của Tướng (đã lộ mặt) bên sd, 0 nếu không tìm thấy */
  kingSquare(sd: JqColor): number {
    const pc = SIDE_TAG(sd) + PIECE_KING

    for (let sq = 0; sq < 256; sq++) {
      if (this.squares[sq] === pc && !this.dark[sq]) return sq
    }

    return 0
  }

  /** Tướng của bên đang được đi có đang bị chiếu không */
  checked(): boolean {
    const ksq = this.kingSquare(this.sdPlayer)

    if (ksq === 0) return false

    return this.attacked(ksq, (1 - this.sdPlayer) as JqColor)
  }

  /** Bên vừa được chuyển lượt có đang bị chiếu không (đọc từ lịch sử) */
  inCheck(): boolean {
    return this.chkList[this.chkList.length - 1]
  }

  /** Nước đi vừa rồi có ăn quân không */
  captured(): boolean {
    return this.pcList[this.pcList.length - 1] !== 0
  }

  // ================= SINH & KIỂM TRA NƯỚC ĐI =================

  /** Sinh mọi nước "giả hợp lệ" (đúng cách di chuyển, chưa xét tự để bị chiếu) */
  generateMoves(): number[] {
    const mvs: number[] = []
    const selfTag = SIDE_TAG(this.sdPlayer)

    for (let src = 0; src < 256; src++) {
      const pc = this.squares[src]

      if (pc === 0 || (pc & selfTag) === 0) continue
      const type = pc & 7
      const isDark = this.dark[src]

      for (let dst = 0; dst < 256; dst++) {
        if (!IN_BOARD(dst)) continue
        const pcDst = this.squares[dst]

        if (pcDst !== 0 && (pcDst & selfTag) !== 0) continue
        if (this.canReach(src, type, this.sdPlayer, isDark, dst)) mvs.push(MOVE(src, dst))
      }
    }

    return mvs
  }

  /** Kiểm tra 1 nước đi có hợp lệ THẬT SỰ không (đúng cách đi + không tự để bị chiếu) */
  legalMoveInt(mv: number): boolean {
    const src = SRC(mv)
    const dst = DST(mv)

    if (!IN_BOARD(src) || !IN_BOARD(dst)) return false
    const pc = this.squares[src]
    const selfTag = SIDE_TAG(this.sdPlayer)

    if (pc === 0 || (pc & selfTag) === 0) return false
    const pcDst = this.squares[dst]

    if (pcDst !== 0 && (pcDst & selfTag) !== 0) return false
    const type = pc & 7
    const isDark = this.dark[src]

    if (!this.canReach(src, type, this.sdPlayer, isDark, dst)) return false

    // Thử đi tạm để kiểm tra có tự để Tướng bị chiếu không, rồi hoàn tác ngay
    const savedDstPc = this.squares[dst]
    const savedDstDark = this.dark[dst]

    this.squares[dst] = pc
    this.dark[dst] = isDark
    this.squares[src] = 0
    this.dark[src] = false
    const selfCheck = this.attacked(this.kingSquare(this.sdPlayer), (1 - this.sdPlayer) as JqColor)

    this.squares[src] = pc
    this.dark[src] = isDark
    this.squares[dst] = savedDstPc
    this.dark[dst] = savedDstDark

    return !selfCheck
  }

  // ================= HỒ QUÂN ÚP =================

  /** Rút NGẪU NHIÊN 1 loại quân từ hồ úp của bên sd (giảm số lượng). -1 nếu hồ rỗng. */
  private drawFromPool(sd: JqColor): number {
    const p = this.pool[SIDE_TAG(sd)]
    let total = 0

    for (const k in p) total += p[k]
    if (total <= 0) return -1
    let r = Math.floor(Math.random() * total)

    for (const k in p) {
      if (p[k] > 0) {
        r -= p[k]

        if (r < 0) {
          p[k]--

          return parseInt(k, 10)
        }
      }
    }

    return -1
  }

  /** Lấy ĐÚNG loại quân "type" ra khỏi hồ (khi engine đã chỉ định kết quả lật) */
  private takeFromPool(sd: JqColor, type: number): boolean {
    const p = this.pool[SIDE_TAG(sd)]

    if ((p[type] || 0) > 0) {
      p[type]--

      return true
    }

    console.warn('[jieqi] lật loại không có trong hồ quân', TYPE_TO_CHAR[type], 'sd', sd)

    return false
  }

  // ================= THỰC HIỆN / HOÀN TÁC NƯỚC ĐI =================

  /**
   * Thực hiện 1 nước đi {from, to, reveal?}. Trả về false nếu không hợp lệ
   * (thế cờ không đổi). Nếu quân đi / quân bị ăn đang úp:
   * - có reveal (engine chỉ định): lật đúng loại đó và trừ khỏi hồ;
   * - không có reveal (người chơi đi): rút ngẫu nhiên từ hồ.
   */
  makeMove(move: JqMove): boolean {
    const mv = MOVE(move.from, move.to)

    if (!this.legalMoveInt(mv)) return false

    const reveal: JqReveal | undefined = move.reveal
    const src = move.from
    const dst = move.to
    const pc = this.squares[src]
    const sd = this.sdPlayer
    const type = pc & 7
    const isDark = this.dark[src]
    const capPc = this.squares[dst]
    const capDark = this.dark[dst]

    const hist: HistEntry = {
      mv,
      src,
      dst,
      srcPc: pc,
      srcDark: isDark,
      capPc,
      capDark,
      revealMover: -1,
      revealCap: -1,
      halfmove: this.halfmove,
      fullmove: this.fullmove
    }

    // Ăn 1 quân đang úp -> lộ danh tính thật của nó (rút từ hồ đối phương)
    if (capPc !== 0 && capDark) {
      const capSd: JqColor = capPc < 16 ? 0 : 1
      let capType =
        reveal && reveal.captured != null && reveal.captured >= 0 ? reveal.captured : this.drawFromPool(capSd)

      if (capType < 0) capType = capPc & 7
      else if (reveal && reveal.captured != null) this.takeFromPool(capSd, capType)
      hist.revealCap = capType
    }

    // Di chuyển 1 quân đang úp -> lật ra danh tính thật (rút từ hồ của mình)
    let newPc = pc

    if (isDark) {
      let mType = reveal && reveal.mover != null && reveal.mover >= 0 ? reveal.mover : this.drawFromPool(sd)

      if (mType < 0) mType = type
      else if (reveal && reveal.mover != null) this.takeFromPool(sd, mType)
      hist.revealMover = mType
      newPc = SIDE_TAG(sd) + mType
    }

    this.squares[src] = 0
    this.dark[src] = false
    this.squares[dst] = newPc
    this.dark[dst] = false

    const wasCapture = capPc !== 0

    this.halfmove = wasCapture || isDark ? 0 : this.halfmove + 1
    if (sd === 1) this.fullmove++
    this.mvList.push(mv)
    this.pcList.push(capPc)
    this.histList.push(hist)

    // Chuỗi UCI kèm ký tự lật quân - lưu lại chuỗi này thì replay sẽ tái hiện
    // được CHÍNH XÁC các lần lật ngẫu nhiên của ván đấu.
    let uci = sqToUci(src) + sqToUci(dst)

    if (hist.revealMover >= 0) {
      const mc = TYPE_TO_CHAR[hist.revealMover]

      uci += sd === 0 ? mc : mc.toLowerCase()
    }

    if (hist.revealCap >= 0) {
      const cc = TYPE_TO_CHAR[hist.revealCap]

      uci += hist.capPc < 16 ? cc : cc.toLowerCase()
    }

    this.lastMoveUci = uci
    this.sdPlayer = (1 - this.sdPlayer) as JqColor
    this.chkList.push(this.checked())
    this.fenList.push(this.placementKey())
    this.distance++

    return true
  }

  undoMakeMove(): void {
    if (this.histList.length <= 1) return
    const hist = this.histList.pop() as HistEntry

    this.mvList.pop()
    this.pcList.pop()
    this.chkList.pop()
    this.fenList.pop()
    this.distance--
    this.sdPlayer = (1 - this.sdPlayer) as JqColor
    const sd = this.sdPlayer

    this.squares[hist.src] = hist.srcPc
    this.dark[hist.src] = hist.srcDark
    this.squares[hist.dst] = hist.capPc
    this.dark[hist.dst] = hist.capDark

    // Trả các quân đã lật về hồ
    if (hist.revealMover >= 0) {
      this.pool[SIDE_TAG(sd)][hist.revealMover] = (this.pool[SIDE_TAG(sd)][hist.revealMover] || 0) + 1
    }

    if (hist.revealCap >= 0) {
      const capSd: JqColor = hist.capPc < 16 ? 0 : 1

      this.pool[SIDE_TAG(capSd)][hist.revealCap] = (this.pool[SIDE_TAG(capSd)][hist.revealCap] || 0) + 1
    }

    this.halfmove = hist.halfmove
    this.fullmove = hist.fullmove
    this.lastMoveUci = null
  }

  /** Bên đang được đi có hết nước đi hợp lệ không (= thua) */
  isMate(): boolean {
    const mvs = this.generateMoves()

    for (let i = 0; i < mvs.length; i++) {
      if (this.legalMoveInt(mvs[i])) return false
    }

    return true
  }

  // ================= LUẬT LẶP THẾ CỜ =================

  /**
   * Phát hiện lặp thế cờ (so chuỗi placementKey). Chuỗi lặp bị CẮT khi có ăn
   * quân hoặc lật quân. Trả về 0 nếu chưa lặp; ngược lại mã bit:
   * bit 1 = có lặp, bit 2 = bên VỪA ĐƯỢC CHUYỂN LƯỢT chiếu dai, bit 4 = bên vừa đi chiếu dai.
   */
  repStatus(recur = 1): number {
    const last = this.mvList.length - 1
    const curKey = this.fenList[last]
    let moverCheckAll = true
    let otherCheckAll = true
    let matches = 0

    for (let index = last; index > 0 && this.mvList[index] > 0; index--) {
      const h = this.histList[index]

      if (this.pcList[index] !== 0 || (h && (h.revealMover >= 0 || h.revealCap >= 0))) break
      const byMover = ((last - index) & 1) === 0

      if (byMover) {
        moverCheckAll = moverCheckAll && this.chkList[index]

        if (index !== last && this.fenList[index] === curKey) {
          matches++

          if (matches === recur) {
            return 1 + (otherCheckAll ? 2 : 0) + (moverCheckAll ? 4 : 0)
          }
        }
      } else {
        otherCheckAll = otherCheckAll && this.chkList[index]
      }
    }

    return 0
  }

  repValue(vlRep: number): number {
    let v = 0

    if (vlRep & 2) v -= WIN_VALUE
    if (vlRep & 4) v += WIN_VALUE

    return v
  }

  /**
   * Nước đi này (của quân ĐÃ LỘ MẶT) có phạm luật "chiếu nhây" không - dùng để
   * CHẶN TRƯỚC nước đi của người chơi, giống hành vi bản vanilla (addMove).
   */
  wouldBePerpetual(move: JqMove): boolean {
    if (this.dark[move.from]) return false
    if (!this.makeMove({ from: move.from, to: move.to })) return false
    const st = this.repStatus(2)

    this.undoMakeMove()

    return (st & 1) !== 0 && (st & 4) !== 0
  }

  // ================= API "KIỂU CHESS" CHO STORE / COMPONENT =================

  /** Bên đang được đi (alias đồng bộ tên với lib/chess, lib/xiangqi) */
  get turn(): JqColor {
    return this.sdPlayer
  }

  /** Ký tự quân tại 1 ô ('K'..'p' hoặc '' nếu trống). LƯU Ý: với quân úp, đây là
   *  loại quân "di chuyển" (theo ô xuất phát), KHÔNG phải danh tính thật. */
  pieceAt(sq: number): JqPieceChar | '' {
    return pieceCodeToChar(this.squares[sq])
  }

  /** Quân tại ô sq có đang úp không (false nếu ô trống) */
  isDarkAt(sq: number): boolean {
    return this.dark[sq]
  }

  /** Màu quân tại 1 ô, null nếu ô trống */
  sideAt(sq: number): JqColor | null {
    const pc = this.squares[sq]

    if (pc === 0) return null

    return pc < 16 ? RED : BLACK
  }

  /** Tất cả nước đi HỢP LỆ THẬT SỰ ở thế cờ hiện tại */
  legalMoves(): JqMove[] {
    const result: JqMove[] = []
    const mvs = this.generateMoves()

    for (const mv of mvs) {
      if (this.legalMoveInt(mv)) {
        result.push({ from: SRC(mv), to: DST(mv) })
      }
    }

    return result
  }

  /**
   * Trạng thái ván cờ hiện tại - kiểm tra theo đúng thứ tự của bản vanilla
   * (jieqi-board.js -> postAddMove): hết nước -> lặp thế cờ -> 2 Tướng trơ trọi
   * -> quá lâu không ăn/lật quân.
   */
  status(): JqGameStatus {
    const sideToMove = this.sdPlayer
    const opponent = (1 - sideToMove) as JqColor
    const colorName = (c: JqColor): 'red' | 'black' => (c === RED ? 'red' : 'black')

    // 1. Hết nước đi hợp lệ -> thua
    if (this.isMate()) {
      return { over: true, result: colorName(opponent), reason: 'checkmate' }
    }

    // 2. Lặp lại thế cờ
    const st = this.repStatus(3)

    if (st > 0) {
      const vl = this.repValue(st)

      if (vl > -WIN_VALUE && vl < WIN_VALUE) {
        return { over: true, result: 'draw', reason: 'repetition' }
      }

      // vl > 0: bên VỪA ĐI chiếu dai -> bên vừa đi thua -> bên đang được đi thắng
      // vl < 0: bên ĐANG ĐƯỢC ĐI chiếu dai -> bên đang được đi thua
      return {
        over: true,
        result: vl > 0 ? colorName(sideToMove) : colorName(opponent),
        reason: 'perpetual'
      }
    }

    // 3. Chỉ còn 2 Tướng lộ mặt và cả 2 hồ quân đều rỗng -> hòa
    if (this.captured()) {
      let hasMaterial = false

      for (let sq = 0; sq < 256; sq++) {
        if (IN_BOARD(sq) && this.squares[sq] > 0 && ((this.squares[sq] & 7) !== PIECE_KING || this.dark[sq])) {
          hasMaterial = true
          break
        }
      }

      if (!hasMaterial && this.poolCount(RED) === 0 && this.poolCount(BLACK) === 0) {
        return { over: true, result: 'draw', reason: 'material' }
      }
    } else if (this.halfmove >= 120) {
      // 4. 120 nửa-nước liên tiếp không ăn quân, không lật quân -> hòa
      return { over: true, result: 'draw', reason: 'longgame' }
    }

    return { over: false, check: this.inCheck() }
  }

  // ----- Chuyển đổi ký hiệu nước đi -----

  /** {from,to} -> chuỗi UCI 4 ký tự (KHÔNG kèm ký tự lật). Muốn có ký tự lật,
   *  dùng position.lastMoveUci sau khi makeMove thành công. */
  moveToUci(move: JqMove): string {
    return sqToUci(move.from) + sqToUci(move.to)
  }

  /**
   * Chuỗi UCI (có thể kèm 0-2 ký tự lật quân, vd "a3a4", "a3a4N", "a3a4Nc")
   * -> {from, to, reveal}, có kiểm tra hợp lệ ở thế cờ hiện tại.
   * Với 1 ký tự lật: nếu ô đi đang úp thì đó là quân di chuyển, ngược lại là quân bị ăn.
   */
  uciToMove(uci: string): JqMove | null {
    if (!uci || uci.length < 4) return null

    const from = uciToSq(uci.substring(0, 2))
    const to = uciToSq(uci.substring(2, 4))
    const reveal: JqReveal = {}
    const extra = uci.substring(4)

    if (extra.length >= 2) {
      reveal.mover = CHAR_TO_TYPE(extra.charAt(0))
      reveal.captured = CHAR_TO_TYPE(extra.charAt(1))
    } else if (extra.length === 1) {
      if (this.dark[from]) {
        reveal.mover = CHAR_TO_TYPE(extra.charAt(0))
      } else {
        reveal.captured = CHAR_TO_TYPE(extra.charAt(0))
      }
    }

    if (!this.legalMoveInt(MOVE(from, to))) return null

    const move: JqMove = { from, to }

    if (reveal.mover != null || reveal.captured != null) move.reveal = reveal

    return move
  }

  /** {from,to} -> ký hiệu ICCS để hiển thị cho người chơi, ví dụ "H2-E2" */
  moveToIccs(move: JqMove): string {
    const part = (sq: number) =>
      String.fromCharCode(65 + FILE_X(sq) - FILE_LEFT) + String.fromCharCode(57 - RANK_Y(sq) + RANK_TOP)

    return part(move.from) + '-' + part(move.to)
  }
}
