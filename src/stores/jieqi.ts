// Store quản lý trạng thái một ván CỜ ÚP đang chơi, dùng Zustand.
// Kiến trúc sao chép từ stores/xiangqi.ts. Điểm khác của cờ úp:
// - Mỗi quân trên bàn có thêm cờ "dark" (đang úp hay đã lật) để component vẽ.
// - moveLog lưu chuỗi UCI KÈM ký tự lật quân (position.lastMoveUci) để khi xem
//   lại ván đấu, các lần lật ngẫu nhiên được tái hiện chính xác.
// - Có "khay quân bị ăn" (capturedLog): trong cờ úp, việc biết đối thủ đã mất
//   quân gì là thông tin chiến thuật quan trọng.
// - Luật cấm chiếu nhây được CHẶN TRƯỚC khi người chơi đi (ruleWarning).

import { create } from 'zustand'

import { Position } from '@/lib/jieqi/position'
import { RED, BLACK, START_FEN, TYPE_TO_CHAR, pieceCodeToChar } from '@/lib/jieqi/constants'
import type { JqColor, JqMove, JqGameStatus, JqPieceChar } from '@/types/jieqi'
import { requestJqEngineMove } from '@/lib/jieqi/engine-client'
import { saveGame, createGameId, type JqStoredGame } from '@/lib/jieqi/history'
import { addGameResult, type JqGameResultForStats } from '@/lib/jieqi/user-stats'

/**
 * Một quân cờ "sống" trên bàn, có id riêng KHÔNG đổi trong suốt ván đấu để
 * React chỉ cập nhật vị trí CSS khi quân di chuyển (animation trượt mượt).
 */
export interface JqPieceInstance {
  id: string

  /** Ô hiện tại (chỉ số trong mảng 256 ô) */
  square: number

  /** Ký tự quân. Với quân đang úp, ĐỪNG hiển thị ký tự này ra màn hình (nó chỉ
   *  là loại quân "di chuyển" theo ô xuất phát, không phải danh tính thật). */
  piece: JqPieceChar

  /** Quân đang úp hay đã lật */
  dark: boolean
}

/** Một nước đi đã ghi vào sổ */
export interface JqMoveLogEntry {
  /** Chuỗi UCI KÈM ký tự lật quân (vd "a3a4Nc") - dùng lưu lịch sử / replay */
  uci: string

  /** Ký hiệu ICCS để hiển thị, ví dụ "H2-E2" */
  iccs: string

  /** Nước này có ăn quân không - dùng cho âm thanh */
  capture: boolean

  /** Sau nước này đối phương có bị chiếu không - dùng cho âm thanh */
  check: boolean
}

/** Một quân đã bị ăn - hiển thị ở "khay quân bị ăn" */
export interface JqCapturedEntry {
  /** Màu của quân bị ăn */
  color: 'red' | 'black'

  /** Quân bị ăn LÚC ĐÓ có đang úp không */
  wasDark: boolean

  /** Danh tính thật (ký tự thường 'k','a','b','n','r','c','p') - với quân úp là kết quả lật khi bị ăn */
  realType: string

  /** Quân này bị NGƯỜI CHƠI ăn (true) hay bị đối thủ/máy ăn (false) */
  byUser: boolean
}

export interface JqNewGameOptions {
  /** Người chơi cầm quân Đỏ (đi trước), Đen, hay chế độ 2 người chơi chung 1 máy */
  side: 'red' | 'black' | 'two-player'

  /** Có chơi với máy (AI) hay không. Bỏ qua nếu side = 'two-player'. Mặc định: true */
  vsEngine?: boolean

  /** Cấp độ máy 1 (yếu) - 10 (mạnh). Không truyền thì giữ nguyên cấp độ trước đó. */
  level?: number
}

interface JieqiState {
  // ================= DỮ LIỆU VÁN CỜ =================

  /** Đối tượng Position "sống" - bị mutate trực tiếp mỗi khi có nước đi */
  position: Position

  /** Danh sách quân cờ đang sống trên bàn (kèm cờ dark), id ổn định để animation mượt */
  pieces: JqPieceInstance[]

  /** Bộ đếm tăng dần mỗi khi position thay đổi - component select giá trị này để re-render */
  boardVersion: number

  /** Bên đang được đi */
  turn: JqColor

  /** Ô đang được người chơi chọn (-1 = chưa chọn) */
  selected: number

  /** Toàn bộ nước đi hợp lệ ở thế cờ hiện tại */
  legalMoves: JqMove[]

  /** Nước đi cuối cùng - dùng tô sáng ô nguồn/đích */
  lastMove: { from: number; to: number } | null

  /** Toàn bộ nước đi đã đi trong ván hiện tại */
  moveLog: JqMoveLogEntry[]

  /** Danh sách quân đã bị ăn (theo thứ tự thời gian) */
  capturedLog: JqCapturedEntry[]

  /** Hiện danh tính thật của quân úp mà NGƯỜI CHƠI đã ăn trong khay (mặc định tắt, giống bản gốc) */
  showCaptured: boolean

  /** Đang xem thế cờ tại nước thứ mấy (-1 = thế cờ bắt đầu) */
  viewIndex: number

  /** Trạng thái ván cờ hiện tại */
  status: JqGameStatus | null

  /** Bên đã xin thua (null nếu chưa) */
  resignedBy: JqColor | null

  /** Ván đã kết thúc chưa */
  gameOver: boolean

  /** Màu quân người chơi đang cầm */
  userColor: JqColor

  /** Có đang chơi với máy hay không */
  vsEngine: boolean

  /** Cấp độ máy hiện tại, 1-10 */
  level: number

  /** Bàn cờ có đang hiển thị lật ngược không */
  flipped: boolean

  /** Có đang bật âm thanh không */
  soundEnabled: boolean

  /** Đang bận xử lý (chờ máy...) */
  busy: boolean

  /** Lỗi gần nhất khi gọi máy */
  engineError: string | null

  /** Cảnh báo luật gần nhất (vd bị chặn vì chiếu nhây), tự xóa ở nước đi kế tiếp */
  ruleWarning: string | null

  /** id ván đấu hiện tại */
  gameId: string

  /** Thời điểm bắt đầu ván */
  startedAt: number

  // ================= HÀNH ĐỘNG (ACTIONS) =================

  /** Bắt đầu một ván cờ mới */
  newGame: (opts: JqNewGameOptions) => void

  /** Người chơi click vào 1 ô trên bàn cờ */
  selectSquare: (sq: number) => void

  /** Thực hiện trực tiếp một nước đi hợp lệ. byEngine = true nếu là nước của máy
   *  (bỏ qua bước chặn chiếu nhây - máy tự chịu trách nhiệm về luật). */
  makeMove: (move: JqMove, byEngine?: boolean) => void

  /** Xin thua (chỉ áp dụng khi đang chơi với máy) */
  resign: () => void

  /** Nhảy tới xem thế cờ tại nước thứ "index". Chỉ khi ván đã kết thúc. */
  goToMove: (index: number) => void

  /** Điều hướng nhanh khi xem lại ván đấu */
  step: (action: 'first' | 'prev' | 'next' | 'last') => void

  /** Lật / bỏ lật bàn cờ */
  toggleFlipped: () => void

  /** Bật / tắt âm thanh */
  toggleSound: () => void

  /** Bật / tắt hiện danh tính quân úp người chơi đã ăn trong khay */
  toggleShowCaptured: () => void

  /** Bật/tắt trạng thái "đang bận" (dùng nội bộ) */
  setBusy: (busy: boolean) => void
}

function freshPosition(): Position {
  const p = new Position()

  p.setFen(START_FEN)

  return p
}

/** Tính lại các giá trị "phái sinh" từ một Position */
function derive(position: Position) {
  return {
    turn: position.turn,
    legalMoves: position.legalMoves(),
    status: position.status()
  }
}

/** Dựng danh sách quân cờ TỪ ĐẦU dựa trên bàn cờ hiện tại (id mới, không animation) */
function piecesFromBoard(position: Position): JqPieceInstance[] {
  const list: JqPieceInstance[] = []
  let counter = 0

  for (let sq = 0; sq < 256; sq++) {
    const pc = pieceCodeToChar(position.squares[sq])

    if (pc !== '') {
      list.push({ id: 'jq' + counter++, square: sq, piece: pc, dark: position.dark[sq] })
    }
  }

  return list
}

/**
 * Cập nhật danh sách quân sau ĐÚNG 1 nước đi, GIỮ NGUYÊN id các quân khác.
 * Gọi SAU KHI position.makeMove thành công: quân đi chuyển tới ô mới và luôn
 * ở trạng thái ĐÃ LẬT, ký tự quân đọc lại từ position (danh tính thật sau lật).
 */
function advancePieces(prev: JqPieceInstance[], move: JqMove, position: Position): JqPieceInstance[] {
  let next = prev.filter(p => p.square !== move.to) // quân bị ăn (nếu có) rời bàn

  const movedIdx = next.findIndex(p => p.square === move.from)

  if (movedIdx >= 0) {
    next[movedIdx] = {
      ...next[movedIdx],
      square: move.to,
      piece: (position.pieceAt(move.to) || next[movedIdx].piece) as JqPieceChar,
      dark: false
    }
  }

  return next
}

export const useJieqiStore = create<JieqiState>()((set, get) => {
  const initialPosition = freshPosition()
  const initialDerived = derive(initialPosition)

  /** Nếu đang chơi với máy và tới lượt máy, gọi API lấy nước đi rồi thực hiện */
  async function triggerEngineMoveIfNeeded(): Promise<void> {
    const s = get()

    if (!s.vsEngine || s.gameOver || s.position.turn === s.userColor || s.busy) return

    set({ busy: true, engineError: null })

    try {
      const fen = s.position.toFen()
      const result = await requestJqEngineMove(fen, { level: s.level })
      const current = get()

      // Người chơi có thể đã bắt đầu ván khác trong lúc chờ máy trả lời
      if (current.position.toFen() !== fen) return

      // uciToMove tự đọc cả ký tự lật quân mà engine chỉ định (vd "a3a4Nc")
      const mv = current.position.uciToMove(result.move)

      if (!mv) {
        set({ engineError: 'Máy trả về nước đi không hợp lệ ở thế cờ hiện tại.' })

        return
      }

      get().makeMove(mv, true)
    } catch (e) {
      console.warn('[jq-engine] lỗi khi lấy nước đi:', e)
      set({ engineError: 'Không lấy được nước đi từ máy. Vui lòng thử lại.' })
    } finally {
      set({ busy: false })
    }
  }

  /** Lưu ván đấu vào lịch sử và cập nhật Elo nếu đấu với máy */
  function persistFinishedGame(): void {
    const s = get()

    let resultForHistory: JqStoredGame['result'] = 'abandoned'
    let resultForStats: JqGameResultForStats | null = null

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

    const game: JqStoredGame = {
      id: s.gameId,
      gameKey: 'jieqi',
      moves: s.moveLog.map(m => m.uci),
      result: resultForHistory,
      userColor: s.userColor === RED ? 'red' : 'black',
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
    pieces: piecesFromBoard(initialPosition),
    boardVersion: 0,
    turn: initialDerived.turn,
    selected: -1,
    legalMoves: initialDerived.legalMoves,
    lastMove: null,
    moveLog: [],
    capturedLog: [],
    showCaptured: false,
    viewIndex: -1,
    status: initialDerived.status,
    resignedBy: null,
    gameOver: false,
    userColor: RED,
    vsEngine: true,
    level: 5,
    flipped: false,
    soundEnabled: true,
    busy: false,
    engineError: null,
    ruleWarning: null,
    gameId: '',
    startedAt: 0,

    // ----- actions -----

    newGame: opts => {
      const vsEngine = opts.side === 'two-player' ? false : (opts.vsEngine ?? true)
      const userColor: JqColor = opts.side === 'black' ? BLACK : RED
      const level = opts.level ?? get().level
      const position = freshPosition()
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
        flipped: userColor === BLACK,
        busy: false,
        engineError: null,
        ruleWarning: null,
        gameId: createGameId(),
        startedAt: Date.now()
      })

      // Nếu máy đi trước (người chơi cầm Đen), gọi máy ngay
      void triggerEngineMoveIfNeeded()
    },

    selectSquare: sq => {
      const state = get()

      if (state.busy || state.gameOver) return
      if (state.viewIndex !== state.moveLog.length - 1 && state.viewIndex !== -1) return

      const { position, selected, legalMoves, vsEngine, userColor } = state

      if (vsEngine && position.turn !== userColor) return

      if (selected >= 0) {
        const match = legalMoves.find(m => m.from === selected && m.to === sq)

        if (match) {
          get().makeMove(match)

          return
        }
      }

      const isOwnPiece = position.sideAt(sq) === position.turn && (!vsEngine || position.turn === userColor)

      set({ selected: isOwnPiece ? sq : -1 })
    },

    makeMove: (move, byEngine = false) => {
      const { position, moveLog, capturedLog, pieces, userColor, vsEngine } = get()

      // Luật cấm chiếu nhây: CHẶN TRƯỚC nước đi của người chơi (giống bản vanilla).
      // Máy đi thì bỏ qua - engine tự tuân thủ luật.
      if (!byEngine && position.wouldBePerpetual(move)) {
        set({ ruleWarning: 'Không được chiếu nhây quá 3 lần - hãy đổi nước khác!', selected: -1 })

        return
      }

      // Đọc thông tin quân bị ăn TRƯỚC KHI position bị mutate
      const capSide = position.sideAt(move.to)
      const capWasDark = position.isDarkAt(move.to)
      const moverSide = position.turn
      const iccs = position.moveToIccs(move)

      if (!position.makeMove(move)) return

      // position.lastMoveUci đã kèm ký tự lật quân -> lưu chuỗi này để replay đúng
      const uci = position.lastMoveUci || position.moveToUci(move)

      // Ghi khay quân bị ăn: danh tính thật của quân úp bị ăn nằm ở ký tự lật
      // cuối chuỗi UCI (nếu có); quân lộ mặt thì lấy thẳng ký tự quân.
      let nextCaptured = capturedLog

      if (capSide !== null) {
        let realType: string

        if (capWasDark) {
          const lastChar = uci.charAt(uci.length - 1)

          realType = /[a-zA-Z]/.test(lastChar) && uci.length > 4 ? lastChar.toLowerCase() : 'x'
        } else {
          // Quân lộ mặt: ký tự loại quân đọc từ TYPE trong chuỗi iccs không có,
          // nên đã đọc từ position TRƯỚC move - nhưng position đã mutate. Dùng
          // pieces (danh sách trước move) để tra.
          const capPiece = pieces.find(p => p.square === move.to)

          realType = capPiece ? capPiece.piece.toLowerCase() : 'x'
        }

        const byUser = !vsEngine || moverSide === userColor

        nextCaptured = [
          ...capturedLog,
          { color: capSide === RED ? 'red' : 'black', wasDark: capWasDark, realType, byUser }
        ]
      }

      const d = derive(position)
      const nextPieces = advancePieces(pieces, move, position)

      set({
        pieces: nextPieces,
        boardVersion: get().boardVersion + 1,
        turn: d.turn,
        legalMoves: d.legalMoves,
        lastMove: { from: move.from, to: move.to },
        selected: -1,
        moveLog: [...moveLog, { uci, iccs, capture: capSide !== null, check: position.inCheck() }],
        capturedLog: nextCaptured,
        viewIndex: moveLog.length,
        status: d.status,
        gameOver: d.status.over,
        ruleWarning: null
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

      if (!state.gameOver) return

      const clamped = Math.max(-1, Math.min(index, state.moveLog.length - 1))
      const position = freshPosition()
      let lastMove: { from: number; to: number } | null = null

      // Replay bằng chuỗi UCI KÈM ký tự lật -> mọi lần lật ngẫu nhiên được tái hiện đúng
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

    toggleShowCaptured: () => set(s => ({ showCaptured: !s.showCaptured })),

    setBusy: busy => set({ busy })
  }
})

/** Ký tự loại quân -> tên loại quân (dùng cho tooltip khay quân bị ăn) */
export const JQ_TYPE_NAME: Record<string, string> = {
  k: 'Tướng',
  a: 'Sĩ',
  b: 'Tượng',
  n: 'Mã',
  r: 'Xe',
  c: 'Pháo',
  p: 'Tốt',
  x: 'Quân úp'
}

export { TYPE_TO_CHAR }
