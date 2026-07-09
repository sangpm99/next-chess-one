// Class Position: đại diện cho một thế cờ và toàn bộ luật chơi cờ vua.
// Đây là phần logic thuần (pure logic) - không đụng tới DOM, không đụng React.
// Có thể dùng y hệt ở client (trình duyệt) lẫn server (route handler / server action).

import {
  WHITE,
  BLACK,
  EMPTY,
  KNIGHT_OFF,
  KING_OFF,
  BISHOP_OFF,
  ROOK_OFF,
  onBoard,
  fileOf,
  rankOf,
  sq0x88,
  colorOf,
  sqToAlg,
  algToSq
} from './constants'
import type { Color, Piece, Move, CastlingRights, UndoEntry, GameStatus } from '@/types/chess'

/** Hàm tiện ích nội bộ: thêm một nước đi vào danh sách */
function addMove(list: Move[], from: number, to: number, flags = '', promo = ''): void {
  list.push({ from, to, flags, promo })
}

export class Position {
  /** Bàn cờ 128 ô (hệ 0x88). Chỉ 64 ô "hợp lệ" thực sự được dùng. */
  board: Piece[] = new Array(128).fill(EMPTY)

  /** Bên nào đang được đi (WHITE hoặc BLACK) */
  turn: Color = WHITE

  /** Quyền nhập thành còn lại */
  castling: CastlingRights = { K: false, Q: false, k: false, q: false }

  /** Ô có thể bắt tốt qua đường (en passant), -1 nếu không có */
  ep = -1

  /** Số nửa-nước-đi kể từ lần cuối ăn quân hoặc đi tốt (dùng cho luật hòa 50 nước) */
  halfmove = 0

  /** Số nước đi đầy đủ (tăng sau mỗi lượt của Đen) */
  fullmove = 1

  /** Vị trí hiện tại của 2 vua: kings[WHITE], kings[BLACK] */
  kings: [number, number] = [-1, -1]

  /** Lịch sử các nước đã đi, dùng để undoMove() */
  history: UndoEntry[] = []

  /** Đếm số lần lặp lại của từng thế cờ, dùng để phát hiện hòa do lặp thế cờ */
  repTable: Record<string, number> = {}

  /** Tạo bản sao độc lập của thế cờ hiện tại */
  clone(): Position {
    const p = new Position()

    p.board = this.board.slice()
    p.turn = this.turn
    p.castling = { ...this.castling }
    p.ep = this.ep
    p.halfmove = this.halfmove
    p.fullmove = this.fullmove
    p.kings = [...this.kings] as [number, number]

    return p
  }

  /** Nạp thế cờ từ chuỗi FEN chuẩn */
  setFen(fen: string): void {
    this.board = new Array(128).fill(EMPTY)
    this.kings = [-1, -1]
    this.history = []
    this.repTable = {}
    const parts = fen.trim().split(/\s+/)
    const rows = parts[0].split('/')

    for (let r = 0; r < 8; r++) {
      const rank = 7 - r
      let file = 0
      const row = rows[r]

      for (let i = 0; i < row.length; i++) {
        const c = row[i]

        if (c >= '1' && c <= '8') {
          file += c.charCodeAt(0) - 48
        } else {
          const sq = sq0x88(file, rank)

          this.board[sq] = c as Piece
          if (c === 'K') this.kings[WHITE] = sq
          else if (c === 'k') this.kings[BLACK] = sq
          file++
        }
      }
    }

    this.turn = parts[1] === 'b' ? BLACK : WHITE
    const cr = parts[2] || '-'

    this.castling = {
      K: cr.indexOf('K') >= 0,
      Q: cr.indexOf('Q') >= 0,
      k: cr.indexOf('k') >= 0,
      q: cr.indexOf('q') >= 0
    }
    this.ep = parts[3] && parts[3] !== '-' ? algToSq(parts[3]) : -1
    this.halfmove = parts[4] ? parseInt(parts[4], 10) : 0
    this.fullmove = parts[5] ? parseInt(parts[5], 10) : 1
    this.repTable = {}
    this.repTable[this.repKey()] = 1
  }

  /** Xuất thế cờ hiện tại ra chuỗi FEN chuẩn */
  toFen(): string {
    const rowsOut: string[] = []

    for (let rank = 7; rank >= 0; rank--) {
      let row = ''
      let empty = 0

      for (let file = 0; file < 8; file++) {
        const pc = this.board[sq0x88(file, rank)]

        if (pc === EMPTY) {
          empty++
        } else {
          if (empty) {
            row += empty
            empty = 0
          }

          row += pc
        }
      }

      if (empty) row += empty
      rowsOut.push(row)
    }

    let cr =
      (this.castling.K ? 'K' : '') +
      (this.castling.Q ? 'Q' : '') +
      (this.castling.k ? 'k' : '') +
      (this.castling.q ? 'q' : '')

    if (!cr) cr = '-'
    const epStr = this.ep >= 0 ? sqToAlg(this.ep) : '-'

    return (
      rowsOut.join('/') +
      ' ' +
      (this.turn === WHITE ? 'w' : 'b') +
      ' ' +
      cr +
      ' ' +
      epStr +
      ' ' +
      this.halfmove +
      ' ' +
      this.fullmove
    )
  }

  /** Khóa dùng để so sánh thế cờ (phục vụ phát hiện lặp thế cờ 3 lần) */
  repKey(): string {
    const rowsOut: string[] = []

    for (let rank = 7; rank >= 0; rank--) {
      let row = ''
      let empty = 0

      for (let file = 0; file < 8; file++) {
        const pc = this.board[sq0x88(file, rank)]

        if (pc === EMPTY) {
          empty++
        } else {
          if (empty) {
            row += empty
            empty = 0
          }

          row += pc
        }
      }

      if (empty) row += empty
      rowsOut.push(row)
    }

    const cr =
      (this.castling.K ? 'K' : '') +
      (this.castling.Q ? 'Q' : '') +
      (this.castling.k ? 'k' : '') +
      (this.castling.q ? 'q' : '')

    return rowsOut.join('/') + (this.turn === WHITE ? 'w' : 'b') + (cr || '-') + (this.ep >= 0 ? sqToAlg(this.ep) : '-')
  }

  /** Ô "sq" có đang bị bên "byColor" tấn công hay không */
  isAttacked(sq: number, byColor: Color): boolean {
    const b = this.board
    let t: number

    if (byColor === WHITE) {
      if (onBoard(sq - 17) && b[sq - 17] === 'P') return true
      if (onBoard(sq - 15) && b[sq - 15] === 'P') return true
    } else {
      if (onBoard(sq + 17) && b[sq + 17] === 'p') return true
      if (onBoard(sq + 15) && b[sq + 15] === 'p') return true
    }

    const nC = byColor === WHITE ? 'N' : 'n'

    for (let i = 0; i < 8; i++) {
      t = sq + KNIGHT_OFF[i]
      if (onBoard(t) && b[t] === nC) return true
    }

    const kC = byColor === WHITE ? 'K' : 'k'

    for (let i = 0; i < 8; i++) {
      t = sq + KING_OFF[i]
      if (onBoard(t) && b[t] === kC) return true
    }

    const bC = byColor === WHITE ? 'B' : 'b'
    const qC = byColor === WHITE ? 'Q' : 'q'

    for (let i = 0; i < 4; i++) {
      t = sq + BISHOP_OFF[i]

      while (onBoard(t)) {
        if (b[t] !== EMPTY) {
          if (b[t] === bC || b[t] === qC) return true
          break
        }

        t += BISHOP_OFF[i]
      }
    }

    const rC = byColor === WHITE ? 'R' : 'r'

    for (let i = 0; i < 4; i++) {
      t = sq + ROOK_OFF[i]

      while (onBoard(t)) {
        if (b[t] !== EMPTY) {
          if (b[t] === rC || b[t] === qC) return true
          break
        }

        t += ROOK_OFF[i]
      }
    }

    return false
  }

  /** Bên "color" (mặc định là bên đang đi) có đang bị chiếu không */
  inCheck(color?: Color): boolean {
    const c = color === undefined ? this.turn : color
    const ksq = this.kings[c]

    return ksq >= 0 && this.isAttacked(ksq, (c ^ 1) as Color)
  }

  /**
   * Sinh ra toàn bộ nước đi "thô" (pseudo-legal): đúng luật di chuyển của quân
   * nhưng CHƯA kiểm tra có làm lộ vua mình hay không. Dùng nội bộ bởi legalMoves().
   */
  generatePseudo(): Move[] {
    const b = this.board
    const us = this.turn
    const them = (us ^ 1) as Color
    const moves: Move[] = []

    for (let sq = 0; sq < 128; sq++) {
      if (sq & 0x88) {
        sq += 7
        continue
      }

      const pc = b[sq]

      if (pc === EMPTY || colorOf(pc) !== us) continue

      const up = pc.toUpperCase()

      if (up === 'P') {
        const dir = us === WHITE ? 16 : -16
        const startRank = us === WHITE ? 1 : 6
        const promoRank = us === WHITE ? 7 : 0
        const one = sq + dir

        if (onBoard(one) && b[one] === EMPTY) {
          if (rankOf(one) === promoRank) {
            addMove(moves, sq, one, 'p', us === WHITE ? 'Q' : 'q')
            addMove(moves, sq, one, 'p', us === WHITE ? 'R' : 'r')
            addMove(moves, sq, one, 'p', us === WHITE ? 'B' : 'b')
            addMove(moves, sq, one, 'p', us === WHITE ? 'N' : 'n')
          } else {
            addMove(moves, sq, one, 'n')

            if (rankOf(sq) === startRank) {
              const two = sq + dir * 2

              if (b[two] === EMPTY) addMove(moves, sq, two, 'b')
            }
          }
        }

        const caps = us === WHITE ? [17, 15] : [-17, -15]

        for (let ci = 0; ci < 2; ci++) {
          const cap = sq + caps[ci]

          if (!onBoard(cap)) continue

          if (b[cap] !== EMPTY && colorOf(b[cap]) === them) {
            if (rankOf(cap) === promoRank) {
              addMove(moves, sq, cap, 'cp', us === WHITE ? 'Q' : 'q')
              addMove(moves, sq, cap, 'cp', us === WHITE ? 'R' : 'r')
              addMove(moves, sq, cap, 'cp', us === WHITE ? 'B' : 'b')
              addMove(moves, sq, cap, 'cp', us === WHITE ? 'N' : 'n')
            } else {
              addMove(moves, sq, cap, 'c')
            }
          } else if (cap === this.ep) {
            addMove(moves, sq, cap, 'e')
          }
        }
      } else if (up === 'N') {
        for (let k = 0; k < 8; k++) {
          const t = sq + KNIGHT_OFF[k]

          if (!onBoard(t)) continue
          if (b[t] === EMPTY) addMove(moves, sq, t, 'n')
          else if (colorOf(b[t]) === them) addMove(moves, sq, t, 'c')
        }
      } else if (up === 'K') {
        for (let k = 0; k < 8; k++) {
          const t = sq + KING_OFF[k]

          if (!onBoard(t)) continue
          if (b[t] === EMPTY) addMove(moves, sq, t, 'n')
          else if (colorOf(b[t]) === them) addMove(moves, sq, t, 'c')
        }

        this.genCastling(moves, us)
      } else {
        const offs = up === 'B' ? BISHOP_OFF : up === 'R' ? ROOK_OFF : KING_OFF
        const nd = up === 'Q' ? 8 : 4

        for (let d = 0; d < nd; d++) {
          let t = sq + offs[d]

          while (onBoard(t)) {
            if (b[t] === EMPTY) {
              addMove(moves, sq, t, 'n')
            } else {
              if (colorOf(b[t]) === them) addMove(moves, sq, t, 'c')
              break
            }

            t += offs[d]
          }
        }
      }
    }

    return moves
  }

  /** Sinh nước nhập thành (nếu hợp lệ) cho bên "us", thêm vào "moves" */
  genCastling(moves: Move[], us: Color): void {
    const them = (us ^ 1) as Color
    const b = this.board

    if (us === WHITE) {
      if (
        this.castling.K &&
        b[5] === EMPTY &&
        b[6] === EMPTY &&
        !this.isAttacked(4, them) &&
        !this.isAttacked(5, them) &&
        !this.isAttacked(6, them)
      ) {
        addMove(moves, 4, 6, 'k')
      }

      if (
        this.castling.Q &&
        b[3] === EMPTY &&
        b[2] === EMPTY &&
        b[1] === EMPTY &&
        !this.isAttacked(4, them) &&
        !this.isAttacked(3, them) &&
        !this.isAttacked(2, them)
      ) {
        addMove(moves, 4, 2, 'q')
      }
    } else {
      if (
        this.castling.k &&
        b[117] === EMPTY &&
        b[118] === EMPTY &&
        !this.isAttacked(116, them) &&
        !this.isAttacked(117, them) &&
        !this.isAttacked(118, them)
      ) {
        addMove(moves, 116, 118, 'k')
      }

      if (
        this.castling.q &&
        b[115] === EMPTY &&
        b[114] === EMPTY &&
        b[113] === EMPTY &&
        !this.isAttacked(116, them) &&
        !this.isAttacked(115, them) &&
        !this.isAttacked(114, them)
      ) {
        addMove(moves, 116, 114, 'q')
      }
    }
  }

  /** Thực hiện một nước đi, cập nhật toàn bộ state, lưu lại undo entry */
  makeMove(m: Move): void {
    const b = this.board
    const us = this.turn
    const them = (us ^ 1) as Color

    const undo: UndoEntry = {
      from: m.from,
      to: m.to,
      flags: m.flags,
      promo: m.promo,
      piece: b[m.from],
      captured: EMPTY,
      capSq: -1,
      ep: this.ep,
      castling: { ...this.castling },
      halfmove: this.halfmove,
      fullmove: this.fullmove
    }

    const pc = b[m.from]
    const isPawn = pc === 'P' || pc === 'p'
    const isCap = b[m.to] !== EMPTY || m.flags.indexOf('e') >= 0

    if (m.flags.indexOf('e') >= 0) {
      const capPawnSq = m.to + (us === WHITE ? -16 : 16)

      undo.captured = b[capPawnSq]
      undo.capSq = capPawnSq
      b[capPawnSq] = EMPTY
    } else if (b[m.to] !== EMPTY) {
      undo.captured = b[m.to]
      undo.capSq = m.to
    }

    b[m.to] = pc
    b[m.from] = EMPTY
    if (m.promo) b[m.to] = m.promo as Piece
    if (pc === 'K') this.kings[WHITE] = m.to
    else if (pc === 'k') this.kings[BLACK] = m.to

    if (m.flags.indexOf('k') >= 0) {
      if (us === WHITE) {
        b[5] = b[7]
        b[7] = EMPTY
      } else {
        b[117] = b[119]
        b[119] = EMPTY
      }
    } else if (m.flags.indexOf('q') >= 0) {
      if (us === WHITE) {
        b[3] = b[0]
        b[0] = EMPTY
      } else {
        b[115] = b[112]
        b[112] = EMPTY
      }
    }

    this.ep = -1
    if (m.flags.indexOf('b') >= 0) this.ep = m.from + (us === WHITE ? 16 : -16)

    if (pc === 'K') {
      this.castling.K = false
      this.castling.Q = false
    }

    if (pc === 'k') {
      this.castling.k = false
      this.castling.q = false
    }

    if (m.from === 0 || m.to === 0) this.castling.Q = false
    if (m.from === 7 || m.to === 7) this.castling.K = false
    if (m.from === 112 || m.to === 112) this.castling.q = false
    if (m.from === 119 || m.to === 119) this.castling.k = false
    if (isPawn || isCap) this.halfmove = 0
    else this.halfmove++
    if (us === BLACK) this.fullmove++
    this.turn = them
    this.history.push(undo)
    const key = this.repKey()

    this.repTable[key] = (this.repTable[key] || 0) + 1
  }

  /** Hoàn tác nước đi gần nhất (dùng cho legalMoves(), perft(), moveToSan()...) */
  undoMove(): void {
    const undo = this.history.pop()

    if (!undo) return
    const key = this.repKey()

    if (this.repTable[key]) {
      this.repTable[key]--
      if (!this.repTable[key]) delete this.repTable[key]
    }

    const b = this.board
    const us = (this.turn ^ 1) as Color

    this.turn = us
    this.castling = undo.castling
    this.ep = undo.ep
    this.halfmove = undo.halfmove
    this.fullmove = undo.fullmove
    b[undo.from] = undo.piece
    b[undo.to] = EMPTY
    if (undo.piece === 'K') this.kings[WHITE] = undo.from
    else if (undo.piece === 'k') this.kings[BLACK] = undo.from

    if (undo.flags.indexOf('k') >= 0) {
      if (us === WHITE) {
        b[7] = b[5]
        b[5] = EMPTY
      } else {
        b[119] = b[117]
        b[117] = EMPTY
      }
    } else if (undo.flags.indexOf('q') >= 0) {
      if (us === WHITE) {
        b[0] = b[3]
        b[3] = EMPTY
      } else {
        b[112] = b[115]
        b[115] = EMPTY
      }
    }

    if (undo.capSq >= 0) b[undo.capSq] = undo.captured
  }

  /** Sinh toàn bộ nước đi HỢP LỆ (đã lọc bỏ nước làm lộ vua mình) */
  legalMoves(): Move[] {
    const pseudo = this.generatePseudo()
    const legal: Move[] = []
    const us = this.turn

    for (let i = 0; i < pseudo.length; i++) {
      this.makeMove(pseudo[i])
      if (!this.isAttacked(this.kings[us], (us ^ 1) as Color)) legal.push(pseudo[i])
      this.undoMove()
    }

    return legal
  }

  /** Chuyển một nước đi sang ký hiệu UCI, ví dụ "e2e4" hoặc "e7e8q" */
  moveToUci(m: Move): string {
    return sqToAlg(m.from) + sqToAlg(m.to) + (m.promo ? m.promo.toLowerCase() : '')
  }

  /** Tìm nước đi hợp lệ tương ứng với chuỗi UCI, trả về null nếu không có */
  uciToMove(uci: string): Move | null {
    const from = algToSq(uci.substr(0, 2))
    const to = algToSq(uci.substr(2, 2))
    const promo = uci.length > 4 ? uci[4] : ''
    const legal = this.legalMoves()

    for (let i = 0; i < legal.length; i++) {
      if (legal[i].from === from && legal[i].to === to) {
        if (promo) {
          if (legal[i].promo && legal[i].promo.toLowerCase() === promo.toLowerCase()) return legal[i]
        } else {
          return legal[i]
        }
      }
    }

    return null
  }

  /**
   * Đếm số thế cờ lá (leaf nodes) ở độ sâu "depth" - dùng để KIỂM TRA
   * engine sinh nước đi có đúng không (so với số liệu perft chuẩn đã công bố).
   */
  perft(depth: number): number {
    if (depth === 0) return 1
    const moves = this.legalMoves()
    let nodes = 0

    for (let i = 0; i < moves.length; i++) {
      this.makeMove(moves[i])
      nodes += this.perft(depth - 1)
      this.undoMove()
    }

    return nodes
  }

  /** Kiểm tra trường hợp hòa do không đủ quân để chiếu bí (vd: Vua đơn, Vua+Mã...) */
  insufficientMaterial(): boolean {
    const b = this.board
    const pieces: string[] = []
    const bishops: number[] = []

    for (let sq = 0; sq < 128; sq++) {
      if (sq & 0x88) {
        sq += 7
        continue
      }

      const pc = b[sq]

      if (pc === EMPTY) continue
      const up = pc.toUpperCase()

      if (up === 'K') continue
      if (up === 'P' || up === 'R' || up === 'Q') return false
      pieces.push(up)
      if (up === 'B') bishops.push((fileOf(sq) + rankOf(sq)) & 1)
    }

    if (pieces.length === 0) return true
    if (pieces.length === 1) return true
    if (pieces.every(p => p === 'B') && bishops.every(c => c === bishops[0])) return true

    return false
  }

  /** Trả về trạng thái hiện tại của ván cờ: đang tiếp diễn / chiếu bí / hòa... */
  status(): GameStatus {
    const legal = this.legalMoves()
    const inChk = this.inCheck(this.turn)

    if (legal.length === 0) {
      if (inChk) {
        return { over: true, result: this.turn === WHITE ? 'black' : 'white', reason: 'checkmate' }
      }

      return { over: true, result: 'draw', reason: 'stalemate' }
    }

    if (this.halfmove >= 100) return { over: true, result: 'draw', reason: 'fifty' }
    if (this.insufficientMaterial()) return { over: true, result: 'draw', reason: 'material' }
    if (this.repTable[this.repKey()] >= 3) return { over: true, result: 'draw', reason: 'repetition' }

    return { over: false, check: inChk }
  }

  /** Chuyển một nước đi sang ký hiệu đại số ngắn gọn (SAN), ví dụ "Nf3", "exd5", "O-O", "e8=Q#" */
  moveToSan(m: Move): string {
    let san: string

    if (m.flags.indexOf('k') >= 0) {
      san = 'O-O'
    } else if (m.flags.indexOf('q') >= 0) {
      san = 'O-O-O'
    } else {
      const pc = this.board[m.from]
      const up = pc.toUpperCase()
      const isPawn = up === 'P'
      const capture = this.board[m.to] !== EMPTY || m.flags.indexOf('e') >= 0

      if (isPawn) {
        san = capture ? String.fromCharCode(97 + fileOf(m.from)) + 'x' : ''
        san += sqToAlg(m.to)
        if (m.promo) san += '=' + m.promo.toUpperCase()
      } else {
        san = up
        const legal = this.legalMoves()
        let sameFile = false
        let sameRank = false
        let ambig = false

        for (let i = 0; i < legal.length; i++) {
          const o = legal[i]

          if (o.to === m.to && o.from !== m.from && this.board[o.from] && this.board[o.from].toUpperCase() === up) {
            ambig = true
            if (fileOf(o.from) === fileOf(m.from)) sameFile = true
            if (rankOf(o.from) === rankOf(m.from)) sameRank = true
          }
        }

        if (ambig) {
          if (!sameFile) san += String.fromCharCode(97 + fileOf(m.from))
          else if (!sameRank) san += String.fromCharCode(49 + rankOf(m.from))
          else san += sqToAlg(m.from)
        }

        if (capture) san += 'x'
        san += sqToAlg(m.to)
      }
    }

    this.makeMove(m)
    if (this.inCheck(this.turn)) san += this.legalMoves().length === 0 ? '#' : '+'
    this.undoMove()

    return san
  }
}
