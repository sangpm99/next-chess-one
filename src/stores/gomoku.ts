// Store quản lý trạng thái một ván CỜ CARO đang chơi, dùng Zustand.
// Kiến trúc cùng họ với stores/chess.ts / xiangqi.ts / jieqi.ts nhưng đơn giản
// hơn nhiều: quân chỉ ĐẶT vào giao điểm trống, không di chuyển, không bị ăn,
// nên không cần animation trượt - danh sách quân chỉ được nối thêm.

import { create } from 'zustand'

import { GomokuBoard, SIZE, ruleId, coordLabel } from '@/lib/gomoku/board'
import type { GmColor, GmRule, GmGameStatus, GmMove } from '@/types/gomoku'
import { requestGmEngineMove } from '@/lib/gomoku/engine-client'
import { saveGame, createGameId, type GmStoredGame } from '@/lib/gomoku/history'
import { addGameResult, type GmGameResultForStats } from '@/lib/gomoku/user-stats'

export const BLACK: GmColor = 1
export const WHITE: GmColor = 2

/** Một quân đã đặt trên bàn - id ổn định (quân caro không bao giờ di chuyển hay biến mất) */
export interface GmStoneInstance {
  id: string
  x: number
  y: number
  color: GmColor
}

/** Một nước đi đã ghi vào sổ */
export interface GmMoveLogEntry {
  /** Dạng "x,y" - đúng định dạng gửi engine API và lưu lịch sử */
  xy: string

  /** Nhãn hiển thị, ví dụ "H8" */
  label: string
  color: GmColor
}

export interface GmNewGameOptions {
  /** Người chơi cầm Đen (đi trước), Trắng, hay 2 người chơi chung 1 máy */
  side: 'black' | 'white' | 'two-player'

  /** Có chơi với máy không. Bỏ qua nếu side = 'two-player'. Mặc định: true */
  vsEngine?: boolean

  /** Cấp độ máy 1-10. Không truyền thì giữ nguyên cấp độ trước đó. */
  level?: number

  /** Luật thắng. Không truyền thì giữ nguyên luật trước đó. */
  rule?: GmRule
}

interface GomokuState {
  // ================= DỮ LIỆU VÁN CỜ =================

  /** Bàn cờ "sống" - bị mutate trực tiếp mỗi khi đặt quân */
  board: GomokuBoard

  /** Danh sách quân đã đặt (chỉ nối thêm, không xóa/di chuyển) */
  stones: GmStoneInstance[]

  /** Bộ đếm tăng dần mỗi khi board thay đổi - component select giá trị này để re-render */
  boardVersion: number

  /** Bên sắp được đặt quân */
  turn: GmColor

  /** Nước đi cuối - dùng đánh dấu trên bàn */
  lastMove: GmMove | null

  /** Toàn bộ nước đi trong ván hiện tại */
  moveLog: GmMoveLogEntry[]

  /** Đang xem thế cờ tại nước thứ mấy (-1 = bàn trống). Chỉ dùng sau khi ván kết thúc. */
  viewIndex: number

  /** Trạng thái ván cờ hiện tại */
  status: GmGameStatus | null

  /** 5 ô tạo thành hàng thắng - tô sáng khi ván kết thúc */
  winningLine: GmMove[]

  /** Bên đã xin thua (null nếu chưa) */
  resignedBy: GmColor | null

  /** Ván đã kết thúc chưa */
  gameOver: boolean

  /** Màu quân người chơi cầm */
  userColor: GmColor

  /** Có đang chơi với máy không */
  vsEngine: boolean

  /** Cấp độ máy 1-10 */
  level: number

  /** Luật thắng đang chơi */
  rule: GmRule

  /** Có đang bật âm thanh không */
  soundEnabled: boolean

  /** Đang bận (chờ máy...) */
  busy: boolean

  /** Lỗi gần nhất khi gọi máy */
  engineError: string | null

  /** id ván đấu hiện tại */
  gameId: string

  /** Thời điểm bắt đầu ván */
  startedAt: number

  // ================= HÀNH ĐỘNG (ACTIONS) =================

  /** Bắt đầu một ván mới */
  newGame: (opts: GmNewGameOptions) => void

  /** Người chơi click vào giao điểm (x, y) */
  clickCell: (x: number, y: number) => void

  /** Đặt quân tại (x, y) - dùng nội bộ cho cả người và máy */
  placeMove: (x: number, y: number) => void

  /** Xin thua (chỉ khi chơi với máy) */
  resign: () => void

  /** Nhảy tới xem thế cờ tại nước thứ "index" (-1 = bàn trống). Chỉ khi ván đã kết thúc. */
  goToMove: (index: number) => void

  /** Điều hướng nhanh khi xem lại ván đấu */
  step: (action: 'first' | 'prev' | 'next' | 'last') => void

  /** Bật / tắt âm thanh */
  toggleSound: () => void

  /** Bật/tắt trạng thái "đang bận" (dùng nội bộ) */
  setBusy: (busy: boolean) => void
}

/** Dựng danh sách quân TỪ ĐẦU theo lịch sử của 1 bàn cờ (dùng khi xem lại ván) */
function stonesFromBoard(board: GomokuBoard): GmStoneInstance[] {
  return board.moves.map((m, i) => ({ id: 'gm' + i, x: m.x, y: m.y, color: m.color }))
}

export const useGomokuStore = create<GomokuState>()((set, get) => {
  /** Nếu đang chơi với máy và tới lượt máy, gọi API lấy nước đi rồi đặt quân */
  async function triggerEngineMoveIfNeeded(): Promise<void> {
    const s = get()

    if (!s.vsEngine || s.gameOver || s.board.colorToMove() === s.userColor || s.busy) return

    set({ busy: true, engineError: null })

    try {
      const moves = s.board.movesAsStrings()
      const result = await requestGmEngineMove(moves, { level: s.level, rule: s.rule, boardSize: s.board.size })
      const current = get()

      // Người chơi có thể đã bắt đầu ván khác trong lúc chờ máy trả lời
      if (current.board.moves.length !== moves.length || current.gameId !== s.gameId) return

      const parts = result.move.split(',')
      const x = parseInt(parts[0], 10)
      const y = parseInt(parts[1], 10)

      if (Number.isNaN(x) || Number.isNaN(y) || !current.board.isEmpty(x, y)) {
        set({ engineError: 'Máy trả về nước đi không hợp lệ.' })

        return
      }

      get().placeMove(x, y)
    } catch (e) {
      console.warn('[gm-engine] lỗi khi lấy nước đi:', e)
      set({ engineError: 'Không lấy được nước đi từ máy. Vui lòng thử lại.' })
    } finally {
      set({ busy: false })
    }
  }

  /** Lưu ván vào lịch sử + cập nhật Elo nếu đấu với máy */
  function persistFinishedGame(): void {
    const s = get()

    let resultForHistory: GmStoredGame['result'] = 'abandoned'
    let resultForStats: GmGameResultForStats | null = null

    if (s.resignedBy !== null) {
      resultForHistory = s.resignedBy === s.userColor ? 'loss' : 'win'
      resultForStats = resultForHistory
    } else if (s.status?.result === 'draw') {
      resultForHistory = 'draw'
      resultForStats = 'draw'
    } else if (s.status?.result) {
      const userColorStr = s.userColor === BLACK ? 'black' : 'white'

      resultForHistory = s.status.result === userColorStr ? 'win' : 'loss'
      resultForStats = resultForHistory
    }

    const game: GmStoredGame = {
      id: s.gameId,
      gameKey: 'gomoku',
      moves: s.moveLog.map(m => m.xy),
      result: resultForHistory,
      userColor: s.userColor === BLACK ? 'black' : 'white',
      rule: s.rule,
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

  const initialBoard = new GomokuBoard(SIZE)

  return {
    // ----- state khởi tạo -----
    board: initialBoard,
    stones: [],
    boardVersion: 0,
    turn: BLACK,
    lastMove: null,
    moveLog: [],
    viewIndex: -1,
    status: { over: false },
    winningLine: [],
    resignedBy: null,
    gameOver: false,
    userColor: BLACK,
    vsEngine: true,
    level: 5,
    rule: 'freestyle',
    soundEnabled: true,
    busy: false,
    engineError: null,
    gameId: '',
    startedAt: 0,

    // ----- actions -----

    newGame: opts => {
      const vsEngine = opts.side === 'two-player' ? false : (opts.vsEngine ?? true)
      const userColor: GmColor = opts.side === 'white' ? WHITE : BLACK
      const level = opts.level ?? get().level
      const rule = opts.rule ?? get().rule
      const board = new GomokuBoard(SIZE)

      set({
        board,
        stones: [],
        boardVersion: get().boardVersion + 1,
        turn: BLACK,
        lastMove: null,
        moveLog: [],
        viewIndex: -1,
        status: { over: false },
        winningLine: [],
        resignedBy: null,
        gameOver: false,
        userColor,
        vsEngine,
        level,
        rule,
        busy: false,
        engineError: null,
        gameId: createGameId(),
        startedAt: Date.now()
      })

      // Người chơi cầm Trắng -> máy (Đen) đi trước
      void triggerEngineMoveIfNeeded()
    },

    clickCell: (x, y) => {
      const s = get()

      if (s.busy || s.gameOver) return
      if (s.viewIndex !== s.moveLog.length - 1 && s.viewIndex !== -1) return
      if (s.vsEngine && s.board.colorToMove() !== s.userColor) return
      if (!s.board.isEmpty(x, y)) return
      get().placeMove(x, y)
    },

    placeMove: (x, y) => {
      const { board, moveLog, stones, rule } = get()
      const color = board.place(x, y)

      if (!color) return

      const st = board.checkAfter(x, y, color, ruleId(rule))

      set({
        stones: [...stones, { id: 'gm' + stones.length, x, y, color }],
        boardVersion: get().boardVersion + 1,
        turn: board.colorToMove(),
        lastMove: { x, y },
        moveLog: [...moveLog, { xy: x + ',' + y, label: coordLabel(x, y, board.size), color }],
        viewIndex: moveLog.length,
        status: st,
        winningLine: st.over ? board.winningLine(ruleId(rule)) : [],
        gameOver: st.over
      })

      if (st.over) {
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

      if (!state.gameOver) return

      const clamped = Math.max(-1, Math.min(index, state.moveLog.length - 1))
      const board = new GomokuBoard(state.board.size)
      let lastMove: GmMove | null = null

      for (let i = 0; i <= clamped; i++) {
        const [xs, ys] = state.moveLog[i].xy.split(',')
        const x = parseInt(xs, 10)
        const y = parseInt(ys, 10)

        board.place(x, y)
        lastMove = { x, y }
      }

      set({
        board,
        stones: stonesFromBoard(board),
        boardVersion: state.boardVersion + 1,
        turn: board.colorToMove(),
        lastMove,
        viewIndex: clamped,

        // Chỉ tô hàng thắng khi đang xem đúng nước cuối cùng
        winningLine: clamped === state.moveLog.length - 1 ? board.winningLine(ruleId(state.rule)) : []
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

    toggleSound: () => set(s => ({ soundEnabled: !s.soundEnabled })),

    setBusy: busy => set({ busy })
  }
})
