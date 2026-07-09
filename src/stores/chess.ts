// Store quản lý trạng thái một ván cờ vua đang chơi, dùng Zustand.
//
// File này chịu trách nhiệm cho MỌI THỨ liên quan tới "ván cờ hiện tại":
// chọn quân, đi quân, phong cấp, xin thua, xem lại nước đi, lật bàn cờ,
// gọi máy (AI) để lấy nước đi, và lưu kết quả vào lịch sử + cập nhật Elo
// khi ván kết thúc.
//
// Cài đặt (nếu dự án chưa có):  npm install zustand

import { create } from 'zustand'

import { Position } from '@/lib/chess/position'
import { START_FEN, WHITE, BLACK, EMPTY, colorOf } from '@/lib/chess/constants'
import type { Color, Move, GameStatus, Piece } from '@/types/chess'
import { requestEngineMove } from '@/lib/chess/engine-client'
import { saveGame, createGameId, type StoredGame } from '@/lib/chess/history'
import { addGameResult, type GameResultForStats } from '@/lib/chess/user-stats'

/**
 * Một quân cờ "sống" trên bàn, có id riêng KHÔNG đổi trong suốt ván đấu (kể cả
 * khi phong cấp - chỉ đổi "piece", "id" giữ nguyên). Nhờ id ổn định này mà khi
 * quân di chuyển, React chỉ cập nhật vị trí CSS của đúng 1 phần tử thay vì
 * xóa-vẽ-lại, giúp trình duyệt tự động chạy animation trượt mượt.
 */
export interface PieceInstance {
  id: string
  /** Ô hiện tại (hệ 0x88). -1 nếu đã bị ăn (thực ra bị loại khỏi mảng luôn, không giữ lại) */
  square: number
  piece: Piece
}

/** Một nước đi đã ghi vào sổ, lưu cả 2 định dạng để tiện dùng ở nơi khác nhau */
export interface MoveLogEntry {
  /** Ký hiệu UCI, ví dụ "e2e4" - dùng khi gọi API máy hoặc lưu lịch sử */
  uci: string
  /** Ký hiệu đại số ngắn gọn, ví dụ "Nf3" - dùng để hiển thị cho người chơi */
  san: string
}

/** Thông tin khi đang chờ người chơi chọn quân phong cấp */
export interface PendingPromotion {
  from: number
  to: number
  /** 4 lựa chọn phong cấp khả dĩ: thành Hậu / Xe / Tượng / Mã */
  choices: Move[]
}

export interface NewGameOptions {
  /** Người chơi cầm quân Trắng, Đen, hay chế độ 2 người chơi chung 1 máy */
  side: 'white' | 'black' | 'two-player'
  /** Có chơi với máy (AI) hay không. Bỏ qua nếu side = 'two-player'. Mặc định: true */
  vsEngine?: boolean
  /** Cấp độ máy 1 (yếu) - 10 (mạnh). Không truyền thì giữ nguyên cấp độ trước đó. */
  level?: number
}

interface ChessState {
  // ================= DỮ LIỆU VÁN CỜ =================

  /**
   * Đối tượng Position "sống" - bị thay đổi (mutate) trực tiếp mỗi khi có nước đi,
   * KHÔNG phải là dữ liệu bất biến (immutable) như state thông thường của React.
   * Component đọc board qua `position.board`, nhưng phải đăng ký lắng nghe cả
   * `boardVersion` (xem bên dưới) thì mới re-render đúng lúc.
   */
  position: Position

  /**
   * Danh sách quân cờ đang sống trên bàn, mỗi quân có "id" ổn định để phục vụ
   * animation trượt mượt (xem giải thích ở PieceInstance). Component ChessBoard
   * nên dùng mảng này để VẼ quân cờ, thay vì tự suy ra từ `position.board`.
   */
  pieces: PieceInstance[]

  /**
   * Bộ đếm tăng dần mỗi khi `position` thay đổi. Vì `position` bị mutate tại chỗ
   * (cùng 1 object, chỉ đổi nội dung bên trong) nên riêng bản thân nó không đủ để
   * React biết mà render lại. Component nên select `boardVersion` trong hook để
   * ép re-render mỗi khi giá trị này đổi.
   */
  boardVersion: number

  /** Bên đang được đi (đồng bộ từ position.turn, tiện dùng trực tiếp trong component) */
  turn: Color
  /** Ô đang được người chơi chọn (-1 = chưa chọn ô nào) */
  selected: number
  /** Toàn bộ nước đi hợp lệ ở thế cờ hiện tại (tính lại sau mỗi nước đi) */
  legalMoves: Move[]
  /** Nước đi cuối cùng vừa thực hiện - dùng để tô sáng ô nguồn/đích trên bàn cờ */
  lastMove: { from: number; to: number } | null
  /** Đang chờ người chơi chọn quân phong cấp (null nếu không có) */
  pendingPromotion: PendingPromotion | null

  /** Toàn bộ nước đi đã đi trong ván hiện tại */
  moveLog: MoveLogEntry[]
  /**
   * Đang xem thế cờ tại nước thứ mấy (dùng khi bấm xem lại ván đấu).
   * -1 = thế cờ bắt đầu, moveLog.length - 1 = thế cờ mới nhất.
   */
  viewIndex: number

  /** Trạng thái ván cờ hiện tại (chiếu bí / hòa / đang tiếp diễn...), null nếu chưa có ván nào */
  status: GameStatus | null
  /** Bên đã xin thua (null nếu chưa ai xin thua) */
  resignedBy: Color | null
  /** Ván đã kết thúc chưa - true nếu chiếu bí/hòa/xin thua */
  gameOver: boolean

  /** Màu quân người chơi đang cầm */
  userColor: Color
  /** Có đang chơi với máy (AI) hay không */
  vsEngine: boolean
  /** Cấp độ máy hiện tại, 1 (yếu) - 10 (mạnh) */
  level: number
  /** Bàn cờ có đang hiển thị lật ngược (từ góc nhìn quân Đen) hay không */
  flipped: boolean
  /** Có đang bật âm thanh đi/ăn quân/chiếu hay không (mặc định TẮT, giống bản gốc) */
  soundEnabled: boolean
  /** Đang bận xử lý (vd: chờ máy tính nước đi) - true thì khóa, không cho người chơi click */
  busy: boolean
  /** Thông báo lỗi gần nhất khi gọi máy (null nếu không có lỗi) - hiển thị cho người chơi nếu muốn */
  engineError: string | null

  /** id của ván đấu hiện tại - dùng khi lưu vào lịch sử */
  gameId: string
  /** Thời điểm bắt đầu ván (mili-giây, Date.now()) */
  startedAt: number

  // ================= HÀNH ĐỘNG (ACTIONS) =================

  /** Bắt đầu một ván cờ mới, xóa hết bàn cờ hiện tại */
  newGame: (opts: NewGameOptions) => void

  /** Người chơi click vào 1 ô trên bàn cờ (xử lý cả việc chọn quân lẫn đi quân) */
  selectSquare: (sq: number) => void

  /**
   * Thực hiện trực tiếp một nước đi hợp lệ (bỏ qua bước chọn ô).
   * Dùng khi: máy vừa trả về nước đi, hoặc khi đã biết chắc move hợp lệ.
   */
  makeMove: (move: Move) => void

  /** Người chơi chọn quân phong cấp (q/r/b/n) sau khi có pendingPromotion */
  choosePromotion: (piece: 'q' | 'r' | 'b' | 'n') => void

  /** Đóng popup phong cấp mà không đi nước nào */
  cancelPromotion: () => void

  /** Xin thua (chỉ áp dụng khi đang chơi với máy) */
  resign: () => void

  /** Nhảy tới xem thế cờ tại nước thứ "index" (-1 = thế cờ bắt đầu). Chỉ hoạt động khi ván đã kết thúc. */
  goToMove: (index: number) => void

  /** Điều hướng nhanh khi xem lại ván đấu */
  step: (action: 'first' | 'prev' | 'next' | 'last') => void

  /** Lật / bỏ lật bàn cờ */
  toggleFlipped: () => void

  /** Bật / tắt âm thanh đi quân */
  toggleSound: () => void

  /** Bật/tắt trạng thái "đang bận" (dùng nội bộ, ít khi cần gọi tay từ component) */
  setBusy: (busy: boolean) => void
}

/** Tạo một Position mới ở thế cờ bắt đầu chuẩn */
function freshPosition(): Position {
  const p = new Position()
  p.setFen(START_FEN)
  return p
}

/** Tính lại các giá trị "phái sinh" (derived) từ một Position - gọi sau mỗi lần thay đổi thế cờ */
function derive(position: Position) {
  return {
    turn: position.turn,
    legalMoves: position.legalMoves(),
    status: position.status()
  }
}

/** Dựng danh sách quân cờ TỪ ĐẦU dựa trên bàn cờ hiện tại - mỗi lần gọi sẽ tạo id mới hoàn toàn.
 *  Dùng khi "nhảy cóc" sang 1 thế cờ khác hẳn (newGame, goToMove) - không cần animation lúc này. */
function piecesFromBoard(board: Piece[]): PieceInstance[] {
  const list: PieceInstance[] = []
  let counter = 0
  for (let sq = 0; sq < 128; sq++) {
    if (sq & 0x88) {
      sq += 7
      continue
    }
    const pc = board[sq]
    if (pc !== EMPTY) {
      list.push({ id: 'p' + counter++, square: sq, piece: pc })
    }
  }
  return list
}

/**
 * Cập nhật danh sách quân cờ sau ĐÚNG 1 nước đi, GIỮ NGUYÊN id của quân không
 * liên quan - đây là điểm mấu chốt để có animation mượt: quân nào di chuyển thì
 * chỉ đổi "square" của đúng phần tử đó, quân bị ăn thì bị loại khỏi mảng, còn lại
 * đứng yên không đổi id.
 */
function advancePieces(
  prev: PieceInstance[],
  move: Move,
  movingPiece: Piece,
  capturedSquare: number,
  isCastleK: boolean,
  isCastleQ: boolean,
  turnBeforeMove: Color
): PieceInstance[] {
  let next = prev.slice()

  // Quân bị ăn (kể cả bắt tốt qua đường) - loại khỏi bàn
  if (capturedSquare >= 0) {
    next = next.filter(p => p.square !== capturedSquare)
  }

  // Quân vừa di chuyển - đổi ô, và đổi loại quân nếu có phong cấp
  const movedIdx = next.findIndex(p => p.square === move.from)
  if (movedIdx >= 0) {
    next[movedIdx] = {
      ...next[movedIdx],
      square: move.to,
      piece: move.promo ? (move.promo as Piece) : movingPiece
    }
  }

  // Nhập thành - Xe cũng phải di chuyển theo
  if (isCastleK || isCastleQ) {
    const rookFrom = turnBeforeMove === WHITE ? (isCastleK ? 7 : 0) : isCastleK ? 119 : 112
    const rookTo = turnBeforeMove === WHITE ? (isCastleK ? 5 : 3) : isCastleK ? 117 : 115
    const rookIdx = next.findIndex(p => p.square === rookFrom)
    if (rookIdx >= 0) next[rookIdx] = { ...next[rookIdx], square: rookTo }
  }

  return next
}

export const useChessStore = create<ChessState>()((set, get) => {
  const initialPosition = freshPosition()
  const initialDerived = derive(initialPosition)

  /**
   * Nếu đang chơi với máy và tới lượt máy đi, gọi API lấy nước đi rồi thực hiện.
   * Hàm này tự bỏ qua (không làm gì) nếu chưa tới lượt máy, ván đã kết thúc,
   * hoặc đang bận xử lý việc khác.
   */
  async function triggerEngineMoveIfNeeded(): Promise<void> {
    const s = get()
    if (!s.vsEngine || s.gameOver || s.position.turn === s.userColor || s.busy) return

    set({ busy: true, engineError: null })
    try {
      const fen = s.position.toFen()
      const result = await requestEngineMove(fen, { level: s.level })
      const current = get()
      // Phòng trường hợp người chơi đã bắt đầu ván khác trong lúc chờ máy trả lời
      if (current.position.toFen() !== fen) return
      const mv = current.position.uciToMove(result.move)
      if (!mv) {
        set({ engineError: 'Máy trả về nước đi không hợp lệ ở thế cờ hiện tại.' })
        return
      }
      get().makeMove(mv)
    } catch (e) {
      console.warn('[engine] lỗi khi lấy nước đi:', e)
      set({ engineError: 'Không lấy được nước đi từ máy. Vui lòng thử lại.' })
    } finally {
      set({ busy: false })
    }
  }

  /** Lưu ván đấu vào lịch sử (localStorage) và cập nhật Elo nếu đang đấu với máy. Gọi khi ván vừa kết thúc. */
  function persistFinishedGame(): void {
    const s = get()

    let resultForHistory: StoredGame['result'] = 'abandoned'
    let resultForStats: GameResultForStats | null = null

    if (s.resignedBy !== null) {
      resultForHistory = s.resignedBy === s.userColor ? 'loss' : 'win'
      resultForStats = resultForHistory
    } else if (s.status?.result === 'draw') {
      resultForHistory = 'draw'
      resultForStats = 'draw'
    } else if (s.status?.result) {
      const userColorStr = s.userColor === WHITE ? 'white' : 'black'
      resultForHistory = s.status.result === userColorStr ? 'win' : 'loss'
      resultForStats = resultForHistory
    }

    const game: StoredGame = {
      id: s.gameId,
      gameKey: 'chess',
      moves: s.moveLog.map(m => m.uci),
      result: resultForHistory,
      userColor: s.userColor === WHITE ? 'white' : 'black',
      vsEngine: s.vsEngine,
      level: s.vsEngine ? s.level : undefined,
      startedAt: s.startedAt,
      endedAt: Date.now(),
      moveCount: s.moveLog.length
    }
    saveGame(game)

    if (s.vsEngine && resultForStats) {
      addGameResult(s.level, resultForStats)
    }
  }

  return {
    // ----- state khởi tạo -----
    position: initialPosition,
    pieces: piecesFromBoard(initialPosition.board),
    boardVersion: 0,
    turn: initialDerived.turn,
    selected: -1,
    legalMoves: initialDerived.legalMoves,
    lastMove: null,
    pendingPromotion: null,
    moveLog: [],
    viewIndex: -1,
    status: initialDerived.status,
    resignedBy: null,
    gameOver: false,
    userColor: WHITE,
    vsEngine: true,
    level: 5,
    flipped: false,
    soundEnabled: true,
    busy: false,
    engineError: null,
    gameId: '',
    startedAt: 0,

    // ----- actions -----

    newGame: opts => {
      const vsEngine = opts.side === 'two-player' ? false : (opts.vsEngine ?? true)
      const userColor: Color = opts.side === 'black' ? BLACK : WHITE
      const level = opts.level ?? get().level
      const position = freshPosition()
      const d = derive(position)
      set({
        position,
        pieces: piecesFromBoard(position.board),
        boardVersion: get().boardVersion + 1,
        turn: d.turn,
        selected: -1,
        legalMoves: d.legalMoves,
        lastMove: null,
        pendingPromotion: null,
        moveLog: [],
        viewIndex: -1,
        status: d.status,
        resignedBy: null,
        gameOver: d.status.over,
        userColor,
        vsEngine,
        level,
        flipped: userColor === BLACK,
        busy: false,
        engineError: null,
        gameId: createGameId(),
        startedAt: Date.now()
      })

      // Nếu máy đi trước (vd người chơi chọn cầm quân Đen), gọi máy ngay
      void triggerEngineMoveIfNeeded()
    },

    selectSquare: sq => {
      const state = get()
      if (state.busy || state.gameOver) return
      // Chỉ cho thao tác khi đang xem đúng thế cờ mới nhất (không phải đang xem lại nước cũ)
      if (state.viewIndex !== state.moveLog.length - 1 && state.viewIndex !== -1) return

      const { position, selected, legalMoves, vsEngine, userColor } = state

      // Đang chơi với máy và tới lượt máy đi -> không cho người chơi click
      if (vsEngine && position.turn !== userColor) return

      if (selected >= 0) {
        const matches = legalMoves.filter(m => m.from === selected && m.to === sq)
        if (matches.length > 0) {
          if (matches.length > 1) {
            // Có nhiều hơn 1 lựa chọn (Q/R/B/N) => đây là nước phong cấp, cần hỏi người chơi trước
            set({ pendingPromotion: { from: selected, to: sq, choices: matches }, selected: -1 })
            return
          }
          get().makeMove(matches[0])
          return
        }
      }

      // Không phải đi quân -> coi như đang chọn (hoặc bỏ chọn) một ô mới
      const piece = position.board[sq]
      const isOwnPiece =
        piece !== EMPTY && colorOf(piece) === position.turn && (!vsEngine || colorOf(piece) === userColor)
      set({ selected: isOwnPiece ? sq : -1 })
    },

    makeMove: move => {
      const { position, moveLog, pieces } = get()

      // Đọc các thông tin cần thiết TRƯỚC KHI position bị mutate, vì board là
      // cùng 1 mảng bị đổi tại chỗ - đọc sau khi makeMove() sẽ ra dữ liệu MỚI, sai.
      const movingPiece = position.board[move.from]
      const turnBeforeMove = position.turn
      const isEnPassant = move.flags.indexOf('e') >= 0
      const wasCapture = position.board[move.to] !== EMPTY
      const capturedSquare = isEnPassant ? move.to + (turnBeforeMove === WHITE ? -16 : 16) : wasCapture ? move.to : -1
      const isCastleK = move.flags.indexOf('k') >= 0
      const isCastleQ = move.flags.indexOf('q') >= 0

      // moveToSan() phải gọi TRƯỚC makeMove() thật sự, vì nó cần đọc thế cờ lúc CHƯA đi
      // để biết cách viết ký hiệu (vd có cần ghi rõ quân nào nếu bị nhập nhằng hay không).
      const san = position.moveToSan(move)
      position.makeMove(move)
      const uci = position.moveToUci(move)
      const d = derive(position)
      const nextPieces = advancePieces(pieces, move, movingPiece, capturedSquare, isCastleK, isCastleQ, turnBeforeMove)

      set({
        pieces: nextPieces,
        boardVersion: get().boardVersion + 1,
        turn: d.turn,
        legalMoves: d.legalMoves,
        lastMove: { from: move.from, to: move.to },
        selected: -1,
        pendingPromotion: null,
        moveLog: [...moveLog, { uci, san }],
        viewIndex: moveLog.length, // = độ dài mảng mới - 1
        status: d.status,
        gameOver: d.status.over
      })

      if (d.status.over) {
        persistFinishedGame()
      } else {
        void triggerEngineMoveIfNeeded()
      }
    },

    choosePromotion: piece => {
      const { pendingPromotion } = get()
      if (!pendingPromotion) return
      const move = pendingPromotion.choices.find(m => m.promo.toLowerCase() === piece)
      if (!move) return
      get().makeMove(move)
    },

    cancelPromotion: () => set({ pendingPromotion: null, selected: -1 }),

    resign: () => {
      const { gameOver, vsEngine, moveLog, userColor } = get()
      if (gameOver || !vsEngine || moveLog.length === 0) return
      set({ resignedBy: userColor, gameOver: true })
      persistFinishedGame()
    },

    goToMove: index => {
      const state = get()
      // Chỉ cho xem lại nước cũ khi ván đã kết thúc (giống app gốc)
      if (!state.gameOver) return

      const clamped = Math.max(-1, Math.min(index, state.moveLog.length - 1))
      const position = freshPosition()
      let lastMove: { from: number; to: number } | null = null
      for (let i = 0; i <= clamped; i++) {
        const mv = position.uciToMove(state.moveLog[i].uci)
        if (!mv) break
        lastMove = { from: mv.from, to: mv.to }
        position.makeMove(mv)
      }

      set({
        position,
        pieces: piecesFromBoard(position.board),
        boardVersion: state.boardVersion + 1,
        turn: position.turn,
        legalMoves: position.legalMoves(),
        lastMove,
        selected: -1,
        viewIndex: clamped
      })
    },

    step: action => {
      const { moveLog, viewIndex } = get()
      const len = moveLog.length
      let idx = viewIndex
      if (action === 'first') idx = -1
      else if (action === 'prev') idx = Math.max(-1, idx - 1)
      else if (action === 'next') idx = Math.min(len - 1, idx + 1)
      else if (action === 'last') idx = len - 1
      get().goToMove(idx)
    },

    toggleFlipped: () => set(s => ({ flipped: !s.flipped })),

    toggleSound: () => set(s => ({ soundEnabled: !s.soundEnabled })),

    setBusy: busy => set({ busy })
  }
})
