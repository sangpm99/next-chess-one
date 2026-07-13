// Store quản lý trạng thái một ván CỜ TƯỚNG đang chơi, dùng Zustand.
// Kiến trúc sao chép từ stores/chess.ts: Position "sống" bị mutate tại chỗ +
// boardVersion để ép re-render, danh sách PieceInstance có id ổn định phục vụ
// animation trượt mượt. Cờ tướng đơn giản hơn cờ vua ở chỗ KHÔNG có phong cấp,
// nhập thành hay bắt tốt qua đường, nhưng có thêm khái niệm "thế cờ chấp".

import { create } from 'zustand'

import { Position } from '@/lib/xiangqi/position'
import { RED, BLACK, STARTUP_FEN, pieceCodeToChar } from '@/lib/xiangqi/constants'
import type { XqColor, XqMove, XqGameStatus, XqPieceChar } from '@/types/xiangqi'
import { requestXqEngineMove } from '@/lib/xiangqi/engine-client'
import { saveGame, createGameId, type XqStoredGame } from '@/lib/xiangqi/history'
import { addGameResult, type XqGameResultForStats } from '@/lib/xiangqi/user-stats'

/**
 * Một quân cờ "sống" trên bàn, có id riêng KHÔNG đổi trong suốt ván đấu.
 * Nhờ id ổn định này mà khi quân di chuyển, React chỉ cập nhật vị trí CSS của
 * đúng 1 phần tử thay vì xóa-vẽ-lại, giúp trình duyệt chạy animation trượt mượt.
 */
export interface XqPieceInstance {
  id: string

  /** Ô hiện tại (chỉ số trong mảng 256 ô) */
  square: number
  piece: XqPieceChar
}

/** Một nước đi đã ghi vào sổ */
export interface XqMoveLogEntry {
  /** Ký hiệu UCI, ví dụ "h2e2" - dùng khi gọi API máy hoặc lưu lịch sử */
  uci: string

  /** Ký hiệu ICCS để hiển thị, ví dụ "H2-E2" */
  iccs: string

  /** Nước này có ăn quân không - dùng cho âm thanh */
  capture: boolean

  /** Sau nước này đối phương có bị chiếu không - dùng cho âm thanh */
  check: boolean
}

/** Một quân đã bị ăn - dùng cho khay quân bị ăn ở 2 thanh Player */
export interface XqCapturedEntry {
  /** Quân bị ăn ('R','n','p'... hoa = Đỏ, thường = Đen) */
  piece: XqPieceChar

  /** Quân này bị NGƯỜI CHƠI ăn (true) hay bị đối thủ/máy ăn (false) */
  byUser: boolean
}

export interface XqNewGameOptions {
  /** Người chơi cầm quân Đỏ (đi trước), Đen, hay chế độ 2 người chơi chung 1 máy */
  side: 'red' | 'black' | 'two-player'

  /** Có chơi với máy (AI) hay không. Bỏ qua nếu side = 'two-player'. Mặc định: true */
  vsEngine?: boolean

  /** Cấp độ máy 1 (yếu) - 10 (mạnh). Không truyền thì giữ nguyên cấp độ trước đó. */
  level?: number

  /** Chỉ số thế cờ chấp 0-3 (xem STARTUP_FEN). Không truyền thì chơi ván thường. */
  handicap?: number
}

interface XiangqiState {
  // ================= DỮ LIỆU VÁN CỜ =================

  /** Đối tượng Position "sống" - bị mutate trực tiếp mỗi khi có nước đi */
  position: Position

  /** Danh sách quân cờ đang sống trên bàn, id ổn định để animation mượt */
  pieces: XqPieceInstance[]

  /** Bộ đếm tăng dần mỗi khi position thay đổi - component select giá trị này để re-render đúng lúc */
  boardVersion: number

  /** Bên đang được đi (đồng bộ từ position.turn) */
  turn: XqColor

  /** Ô đang được người chơi chọn (-1 = chưa chọn ô nào) */
  selected: number

  /** Toàn bộ nước đi hợp lệ ở thế cờ hiện tại */
  legalMoves: XqMove[]

  /** Nước đi cuối cùng vừa thực hiện - dùng để tô sáng ô nguồn/đích */
  lastMove: { from: number; to: number } | null

  /** Toàn bộ nước đi đã đi trong ván hiện tại */
  moveLog: XqMoveLogEntry[]

  /** Quân cờ bị ăn (theo thứ tự thời gian) */
  capturedLog: XqCapturedEntry[]

  /** Đang xem thế cờ tại nước thứ mấy (-1 = thế cờ bắt đầu) */
  viewIndex: number

  /** Trạng thái ván cờ hiện tại */
  status: XqGameStatus | null

  /** Bên đã xin thua (null nếu chưa ai xin thua) */
  resignedBy: XqColor | null

  /** Ván đã kết thúc chưa */
  gameOver: boolean

  /** Màu quân người chơi đang cầm */
  userColor: XqColor

  /** Có đang chơi với máy (AI) hay không */
  vsEngine: boolean

  /** Cấp độ máy hiện tại, 1-10 */
  level: number

  /** Chỉ số thế cờ chấp của ván hiện tại (0 = ván thường) */
  handicap: number

  /** FEN khởi đầu của ván hiện tại - dùng khi xem lại nước cũ */
  startFen: string

  /** Bàn cờ có đang hiển thị lật ngược (góc nhìn quân Đen) hay không */
  flipped: boolean

  /** Có đang bật âm thanh hay không */
  soundEnabled: boolean

  /** Đang bận xử lý (vd: chờ máy tính nước đi) */
  busy: boolean

  /** Thông báo lỗi gần nhất khi gọi máy */
  engineError: string | null

  /** id của ván đấu hiện tại - dùng khi lưu vào lịch sử */
  gameId: string

  /** Thời điểm bắt đầu ván */
  startedAt: number

  // ================= HÀNH ĐỘNG (ACTIONS) =================

  /** Bắt đầu một ván cờ mới */
  newGame: (opts: XqNewGameOptions) => void

  /** Người chơi click vào 1 ô trên bàn cờ (xử lý cả chọn quân lẫn đi quân) */
  selectSquare: (sq: number) => void

  /** Thực hiện trực tiếp một nước đi hợp lệ */
  makeMove: (move: XqMove) => void

  /** Xin thua (chỉ áp dụng khi đang chơi với máy) */
  resign: () => void

  /** Nhảy tới xem thế cờ tại nước thứ "index" (-1 = thế cờ bắt đầu). Chỉ khi ván đã kết thúc. */
  goToMove: (index: number) => void

  /** Điều hướng nhanh khi xem lại ván đấu */
  step: (action: 'first' | 'prev' | 'next' | 'last') => void

  /** Lật / bỏ lật bàn cờ */
  toggleFlipped: () => void

  /** Bật / tắt âm thanh */
  toggleSound: () => void

  /** Bật/tắt trạng thái "đang bận" (dùng nội bộ) */
  setBusy: (busy: boolean) => void
}

/** Tạo một Position mới ở thế cờ chấp tương ứng */
function freshPosition(fen: string): Position {
  const p = new Position()

  p.setFen(fen)

  return p
}

/** Tính lại các giá trị "phái sinh" từ một Position - gọi sau mỗi lần thay đổi thế cờ */
function derive(position: Position) {
  return {
    turn: position.turn,
    legalMoves: position.legalMoves(),
    status: position.status()
  }
}

/** Dựng danh sách quân cờ TỪ ĐẦU dựa trên bàn cờ hiện tại (id mới hoàn toàn, không animation) */
function piecesFromBoard(position: Position): XqPieceInstance[] {
  const list: XqPieceInstance[] = []
  let counter = 0

  for (let sq = 0; sq < 256; sq++) {
    const pc = pieceCodeToChar(position.squares[sq])

    if (pc !== '') {
      list.push({ id: 'xq' + counter++, square: sq, piece: pc })
    }
  }

  return list
}

/**
 * Cập nhật danh sách quân cờ sau ĐÚNG 1 nước đi, GIỮ NGUYÊN id của quân không
 * liên quan - điểm mấu chốt để có animation mượt. Cờ tướng không có phong cấp,
 * nhập thành hay bắt tốt qua đường nên logic gọn hơn cờ vua nhiều.
 */
function advancePieces(prev: XqPieceInstance[], move: XqMove): XqPieceInstance[] {
  let next = prev.slice()

  // Quân bị ăn (nếu có) đứng ngay tại ô đích - loại khỏi bàn
  next = next.filter(p => p.square !== move.to)

  // Quân vừa di chuyển - chỉ đổi ô
  const movedIdx = next.findIndex(p => p.square === move.from)

  if (movedIdx >= 0) {
    next[movedIdx] = { ...next[movedIdx], square: move.to }
  }

  return next
}

export const useXiangqiStore = create<XiangqiState>()((set, get) => {
  const initialPosition = freshPosition(STARTUP_FEN[0])
  const initialDerived = derive(initialPosition)

  /**
   * Nếu đang chơi với máy và tới lượt máy đi, gọi API lấy nước đi rồi thực hiện.
   * Tự bỏ qua nếu chưa tới lượt máy, ván đã kết thúc, hoặc đang bận.
   */
  async function triggerEngineMoveIfNeeded(): Promise<void> {
    const s = get()

    if (!s.vsEngine || s.gameOver || s.position.turn === s.userColor || s.busy) return

    set({ busy: true, engineError: null })

    try {
      const fen = s.position.toFen()
      const result = await requestXqEngineMove(fen, { level: s.level })
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
      console.warn('[xq-engine] lỗi khi lấy nước đi:', e)
      set({ engineError: 'Không lấy được nước đi từ máy. Vui lòng thử lại.' })
    } finally {
      set({ busy: false })
    }
  }

  /** Lưu ván đấu vào lịch sử và cập nhật Elo nếu đang đấu với máy. Gọi khi ván vừa kết thúc. */
  function persistFinishedGame(): void {
    const s = get()

    let resultForHistory: XqStoredGame['result'] = 'abandoned'
    let resultForStats: XqGameResultForStats | null = null

    if (s.resignedBy !== null) {
      resultForHistory = s.resignedBy === s.userColor ? 'loss' : 'win'
      resultForStats = resultForHistory
    } else if (s.status?.result === 'draw') {
      resultForHistory = 'draw'
      resultForStats = 'draw'
    } else if (s.status?.result) {
      const userColorStr = s.userColor === RED ? 'red' : 'black'

      resultForHistory = s.status.result === userColorStr ? 'win' : 'loss'
      resultForStats = resultForHistory
    }

    const game: XqStoredGame = {
      id: s.gameId,
      gameKey: 'xiangqi',
      moves: s.moveLog.map(m => m.uci),
      result: resultForHistory,
      userColor: s.userColor === RED ? 'red' : 'black',
      vsEngine: s.vsEngine,
      level: s.vsEngine ? s.level : undefined,
      handicap: s.handicap,
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
    pieces: piecesFromBoard(initialPosition),
    boardVersion: 0,
    turn: initialDerived.turn,
    selected: -1,
    legalMoves: initialDerived.legalMoves,
    lastMove: null,
    moveLog: [],
    capturedLog: [],
    viewIndex: -1,
    status: initialDerived.status,
    resignedBy: null,
    gameOver: false,
    userColor: RED,
    vsEngine: true,
    level: 5,
    handicap: 0,
    startFen: STARTUP_FEN[0],
    flipped: false,
    soundEnabled: true,
    busy: false,
    engineError: null,
    gameId: '',
    startedAt: 0,

    // ----- actions -----

    newGame: opts => {
      const vsEngine = opts.side === 'two-player' ? false : (opts.vsEngine ?? true)
      const userColor: XqColor = opts.side === 'black' ? BLACK : RED
      const level = opts.level ?? get().level
      const handicap = Math.max(0, Math.min(opts.handicap ?? 0, STARTUP_FEN.length - 1))
      const startFen = STARTUP_FEN[handicap]
      const position = freshPosition(startFen)
      const d = derive(position)

      set({
        position,
        pieces: piecesFromBoard(position),
        boardVersion: get().boardVersion + 1,
        turn: d.turn,
        selected: -1,
        legalMoves: d.legalMoves,
        lastMove: null,
        moveLog: [],
        capturedLog: [],
        viewIndex: -1,
        status: d.status,
        resignedBy: null,
        gameOver: d.status.over,
        userColor,
        vsEngine,
        level,
        handicap,
        startFen,
        flipped: userColor === BLACK,
        busy: false,
        engineError: null,
        gameId: createGameId(),
        startedAt: Date.now()
      })

      // Nếu máy đi trước (người chơi cầm quân Đen), gọi máy ngay
      void triggerEngineMoveIfNeeded()
    },

    selectSquare: sq => {
      const state = get()

      if (state.busy || state.gameOver) return

      // Chỉ cho thao tác khi đang xem đúng thế cờ mới nhất
      if (state.viewIndex !== state.moveLog.length - 1 && state.viewIndex !== -1) return

      const { position, selected, legalMoves, vsEngine, userColor } = state

      // Đang chơi với máy và tới lượt máy đi -> không cho người chơi click
      if (vsEngine && position.turn !== userColor) return

      if (selected >= 0) {
        const match = legalMoves.find(m => m.from === selected && m.to === sq)

        if (match) {
          get().makeMove(match)

          return
        }
      }

      // Không phải đi quân -> coi như đang chọn (hoặc bỏ chọn) một ô mới
      const piece = position.pieceAt(sq)

      const isOwnPiece =
        piece !== '' &&
        (piece === piece.toUpperCase() ? RED : BLACK) === position.turn &&
        (!vsEngine || position.turn === userColor)

      set({ selected: isOwnPiece ? sq : -1 })
    },

    makeMove: move => {
      const { position, moveLog, pieces, capturedLog, vsEngine, userColor } = get()

      // Đọc thông tin cần thiết TRƯỚC KHI position bị mutate.
      // Cờ tướng không có bắt tốt qua đường nên quân bị ăn luôn đứng ở ô đích.
      const capturedPiece = position.pieceAt(move.to)
      const capture = capturedPiece !== ''
      const turnBeforeMove = position.turn
      const iccs = position.moveToIccs(move)
      const uci = position.moveToUci(move)

      if (!position.makeMove(move)) return

      const d = derive(position)
      const nextPieces = advancePieces(pieces, move)

      // Ghi khay quân bị ăn: byUser = quân này do NGƯỜI CHƠI ăn (2 người chơi thì tính hết là "mine")
      const nextCaptured = capture
        ? [...capturedLog, { piece: capturedPiece as XqPieceChar, byUser: !vsEngine || turnBeforeMove === userColor }]
        : capturedLog

      set({
        pieces: nextPieces,
        boardVersion: get().boardVersion + 1,
        turn: d.turn,
        legalMoves: d.legalMoves,
        lastMove: { from: move.from, to: move.to },
        selected: -1,
        moveLog: [...moveLog, { uci, iccs, capture, check: position.inCheck() }],
        capturedLog: nextCaptured,
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
      const position = freshPosition(state.startFen)
      let lastMove: { from: number; to: number } | null = null

      for (let i = 0; i <= clamped; i++) {
        const mv = position.uciToMove(state.moveLog[i].uci)

        if (!mv) break
        lastMove = { from: mv.from, to: mv.to }
        position.makeMove(mv)
      }

      set({
        position,
        pieces: piecesFromBoard(position),
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
