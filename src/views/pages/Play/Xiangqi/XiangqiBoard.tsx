'use client'

// Component vẽ bàn cờ tướng 9x10 và xử lý click của người chơi.
//
// Khác cờ vua: quân cờ tướng đứng trên GIAO ĐIỂM của các đường kẻ chứ không
// nằm trong ô vuông, nên bàn cờ được dựng từ 3 lớp chồng lên nhau:
//  1. Lớp LƯỚI: 1 tấm SVG vẽ toàn bộ đường kẻ, cung Tướng, chữ "Sông" - thuần
//     trang trí, không bắt sự kiện (không cần ảnh board.jpg như bản vanilla).
//  2. Lớp CLICK + HIGHLIGHT: 90 nút vô hình đặt tại 90 giao điểm để bắt click,
//     kèm các hiệu ứng chọn quân / nước đi cuối / gợi ý ô đến / Tướng bị chiếu.
//  3. Lớp QUÂN CỜ: mỗi quân là 1 ảnh, có "id" ổn định
//     (xem stores/xiangqi.ts - XqPieceInstance) và dùng CSS transition để khi
//     đổi vị trí (left/top), trình duyệt tự chạy animation trượt mượt.

import { useEffect, useState } from 'react'

import { useXiangqiStore } from '@/stores/xiangqi'
import { FILE_X, RANK_Y, COORD_XY } from '@/lib/xiangqi/constants'
import { findPieceXiangqiImageSrc } from '@/utils'

import Player from '@/components/Player'

const LINE_COLOR = '#5d2e0c'

/** Kích thước 1 "ô" theo %: 9 cột x 10 hàng giao điểm */
const CELL_W = 100 / 9
const CELL_H = 100 / 10

export default function XiangqiBoard() {
  // Luôn select boardVersion để component re-render đúng lúc mỗi khi có nước đi
  useXiangqiStore(s => s.boardVersion)

  const position = useXiangqiStore(s => s.position)
  const pieces = useXiangqiStore(s => s.pieces)
  const selected = useXiangqiStore(s => s.selected)
  const legalMoves = useXiangqiStore(s => s.legalMoves)
  const lastMove = useXiangqiStore(s => s.lastMove)
  const status = useXiangqiStore(s => s.status)
  const flipped = useXiangqiStore(s => s.flipped)
  const selectSquare = useXiangqiStore(s => s.selectSquare)
  const currentLevel = useXiangqiStore(s => s.level)
  const capturedLog = useXiangqiStore(s => s.capturedLog)

  const [capturedLogMine, setCapturedLogMine] = useState<string[]>([])
  const [capturedLogCompetitor, setCapturedLogCompetitor] = useState<string[]>([])

  const targets = selected >= 0 ? legalMoves.filter(m => m.from === selected).map(m => m.to) : []
  const isCheckNow = status ? status.check || (status.over && status.reason === 'checkmate') : false
  const checkedKingSq = isCheckNow ? position.kingSquare(position.turn) : -1

  const rows = Array.from({ length: 10 }, (_, i) => i)
  const cols = Array.from({ length: 9 }, (_, i) => i)

  /** Quy đổi 1 ô (chỉ số 256) sang tọa độ % của GÓC TRÁI TRÊN vùng chứa quân, có tính lật bàn cờ */
  function squareToPercent(sq: number): { left: number; top: number } {
    const file = FILE_X(sq) - 3 // 0..8
    const rank = RANK_Y(sq) - 3 // 0..9 (0 = phía Đen)
    const col = flipped ? 8 - file : file
    const row = flipped ? 9 - rank : rank

    return { left: col * CELL_W, top: row * CELL_H }
  }

  /** Quy đổi ngược: (cột, hàng) hiển thị -> chỉ số ô để gửi vào store */
  function displayToSquare(col: number, row: number): number {
    const file = (flipped ? 8 - col : col) + 3
    const rank = (flipped ? 9 - row : row) + 3

    return COORD_XY(file, rank)
  }

  // Tách khay quân bị ăn thành 2 danh sách URL ảnh:
  // - capturedLogMine:       quân BẠN đã ăn được (quân của đối thủ)
  // - capturedLogCompetitor: quân ĐỐI THỦ đã ăn (quân của bạn)
  useEffect(() => {
    const mine: string[] = []
    const competitor: string[] = []

    for (const c of capturedLog) {
      const src = findPieceXiangqiImageSrc(c.piece)

      if (c.byUser) mine.push(src)
      else competitor.push(src)
    }

    setCapturedLogMine(mine)
    setCapturedLogCompetitor(competitor)
  }, [capturedLog])

  // ----- Vẽ lưới SVG: giao điểm (c, r) nằm tại (50 + 100c, 50 + 100r) trong viewBox 900x1000 -----
  const gridLines: React.ReactNode[] = []

  // Đường ngang: 10 đường kẻ hết chiều rộng
  for (let r = 0; r < 10; r++) {
    gridLines.push(<line key={`h${r}`} x1={50} y1={50 + r * 100} x2={850} y2={50 + r * 100} />)
  }

  // Đường dọc: 2 biên kẻ suốt, các cột giữa đứt quãng ở "sông"
  for (let c = 0; c < 9; c++) {
    if (c === 0 || c === 8) {
      gridLines.push(<line key={`v${c}`} x1={50 + c * 100} y1={50} x2={50 + c * 100} y2={950} />)
    } else {
      gridLines.push(<line key={`v${c}a`} x1={50 + c * 100} y1={50} x2={50 + c * 100} y2={450} />)
      gridLines.push(<line key={`v${c}b`} x1={50 + c * 100} y1={550} x2={50 + c * 100} y2={950} />)
    }
  }

  return (
    <div className='relative inline-block select-none'>
      {/* ===== Thanh thông tin MÁY (giữ đúng thiết kế của bản cờ vua) ===== */}
      <Player currentLevel={currentLevel} isCompetitor={true} score={2000} capturedLogs={capturedLogCompetitor} />

      {/* ===== BÀN CỜ (tỉ lệ 9:10) ===== */}
      <div
        className='relative border-4 border-primary rounded-sm overflow-hidden shadow-xl my-2'
        style={{
          width: 'min(90vw, 504px)',
          aspectRatio: '9 / 10',
          backgroundImage:
            'url("https://cdn.vietnamexploration.com/vnexploration/2026/07/11160945-d8fe89be-oak-wood-texture-design-background.webp")',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover'
        }}
      >
        {/* ----- LỚP 1: LƯỚI SVG - thuần trang trí ----- */}
        <svg viewBox='0 0 900 1000' className='absolute inset-0 w-full h-full pointer-events-none'>
          <g stroke={LINE_COLOR} strokeWidth={3}>
            {gridLines}

            {/* Cung Tướng: 2 đường chéo mỗi bên (không phụ thuộc lật bàn vì đối xứng) */}
            <line x1={350} y1={50} x2={550} y2={250} />
            <line x1={550} y1={50} x2={350} y2={250} />
            <line x1={350} y1={750} x2={550} y2={950} />
            <line x1={550} y1={750} x2={350} y2={950} />

            {/* Viền ngoài đậm hơn */}
            <rect x={50} y={50} width={800} height={900} fill='none' strokeWidth={5} />
          </g>

          {/* Chữ ở "sông" */}
          <g fill={LINE_COLOR} fontSize={64} className='font-ink' opacity={0.75}>
            <text x={450} y={522} textAnchor='middle'>
              ChessONE
            </text>
          </g>
        </svg>

        {/* ----- LỚP 2: NÚT BẮT CLICK + HIGHLIGHT tại 90 giao điểm ----- */}
        {rows.map(row =>
          cols.map(col => {
            const sq = displayToSquare(col, row)
            const isSelected = sq === selected
            const isTarget = targets.includes(sq)
            const targetHasPiece = isTarget && position.pieceAt(sq) !== ''
            const isLastMoveSquare = !!lastMove && (sq === lastMove.from || sq === lastMove.to)
            const isCheckedKing = sq === checkedKingSq

            return (
              <button
                key={sq}
                type='button'
                onClick={() => selectSquare(sq)}
                className='absolute flex items-center justify-center focus:outline-none cursor-pointer'
                style={{
                  width: `${CELL_W}%`,
                  height: `${CELL_H}%`,
                  left: `${col * CELL_W}%`,
                  top: `${row * CELL_H}%`,
                  background: 'transparent'
                }}
              >
                {isLastMoveSquare && (
                  <span
                    className='absolute rounded-full pointer-events-none'
                    style={{ inset: '4%', backgroundColor: 'rgba(255, 215, 0, 0.4)' }}
                  />
                )}
                {isCheckedKing && (
                  <span
                    className='absolute inset-0 rounded-full pointer-events-none'
                    style={{ background: 'radial-gradient(circle, rgba(255,0,0,0.65) 0%, rgba(255,0,0,0) 100%)' }}
                  />
                )}
                {isSelected && (
                  <span
                    className='absolute rounded-full pointer-events-none'
                    style={{ inset: '2%', border: '3px solid #f59e0b' }}
                  />
                )}
                {isTarget && !targetHasPiece && (
                  <span
                    className='absolute rounded-full pointer-events-none'
                    style={{ width: '30%', height: '30%', backgroundColor: 'rgba(0,0,0,0.3)' }}
                  />
                )}
                {targetHasPiece && (
                  <span
                    className='absolute rounded-full pointer-events-none'
                    style={{ inset: '4%', boxShadow: 'inset 0 0 0 4px rgba(198,40,40,0.55)' }}
                  />
                )}
              </button>
            )
          })
        )}

        {/* ----- LỚP 3: QUÂN CỜ - "pointer-events-none" để click xuyên qua tới
             nút bên dưới. Mỗi quân giữ nguyên "key" (id) khi di chuyển nên React
             chỉ cập nhật left/top -> có transition trượt mượt. ----- */}
        <div className='absolute inset-0 pointer-events-none z-10'>
          {pieces.map(p => {
            const { left, top } = squareToPercent(p.square)

            return (
              <div
                key={p.id}
                className='absolute flex items-center justify-center'
                style={{
                  width: `${CELL_W}%`,
                  height: `${CELL_H}%`,
                  left: `${left}%`,
                  top: `${top}%`,
                  transition: 'left 180ms ease, top 180ms ease'
                }}
              >
                <img
                  src={findPieceXiangqiImageSrc(p.piece)}
                  alt={p.piece}
                  draggable={false}
                  className='w-[92%] h-[92%] object-contain'
                  style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.35))' }}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* ===== Thanh thông tin NGƯỜI CHƠI ===== */}
      <Player currentLevel={currentLevel} isCompetitor={false} score={2000} capturedLogs={capturedLogMine} />
    </div>
  )
}
