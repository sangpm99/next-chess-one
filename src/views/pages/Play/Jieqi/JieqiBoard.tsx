'use client'

// Component vẽ bàn cờ úp 9x10 và xử lý click của người chơi.
// Cấu trúc 3 lớp giống XiangqiBoard (lưới SVG / nút click / quân cờ), thêm:
// - Quân ÚP vẽ dạng đĩa trơn có hoa văn kim cương màu phe (không lộ ký tự).
// - Khay quân bị ăn (CapturedTray) dưới bàn cờ - thông tin chiến thuật quan
//   trọng của cờ úp. Quân úp bị máy ăn hiển thị dạng úp (giống bản gốc).

import { useState, useEffect } from 'react'

import { useJieqiStore } from '@/stores/jieqi'
import { FILE_X, RANK_Y, COORD_XY } from '@/lib/jieqi/constants'
import { findPieceXiangqiImageSrc } from '@/utils'

import type { JqPieceChar } from '@/types/jieqi'
import type { CapturedLogItem } from '@/components/Player'

import Player from '@/components/Player'

const LINE_COLOR = '#5d2e0c'

/** Ảnh mặt lưng quân úp (dùng chung cho quân trên bàn và khay quân bị ăn) */
const DARK_IMAGE = 'https://cdn.vietnamexploration.com/vnexploration/2026/07/11170250-49008bea-co-up-empty.webp'

/** Kích thước 1 "ô" theo %: 9 cột x 10 hàng giao điểm */
const CELL_W = 100 / 9
const CELL_H = 100 / 10

/** 1 quân cờ 2 mặt: mặt úp + mặt thật, lật 3D quanh trục ngang khi dark chuyển true -> false */
function PieceDisc({ piece, dark }: { piece: JqPieceChar; dark: boolean }) {
  return (
    // Lớp ngoài tạo "độ sâu" phối cảnh cho hiệu ứng 3D
    <div className='w-[92%] h-[92%]' style={{ perspective: '300px' }}>
      <div
        className='relative w-full h-full'
        style={{
          transformStyle: 'preserve-3d',

          // Đang úp = 0 độ (thấy mặt lưng), đã lật = 180 độ (thấy mặt thật).
          // Khi store đổi dark true -> false, transform thay đổi -> CSS tự chạy animation lật.
          transform: dark ? 'rotateX(0deg)' : 'rotateX(180deg)',

          // delay 120ms để quân trượt tới ô mới xong mới bắt đầu lật
          transition: 'transform 450ms ease 120ms'
        }}
      >
        {/* Mặt LƯNG (úp) */}
        <img
          src={DARK_IMAGE}
          alt='úp'
          draggable={false}
          className='absolute inset-0 w-full h-full object-contain'
          style={{ backfaceVisibility: 'hidden', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.35))' }}
        />

        {/* Mặt THẬT - chỉ gắn vào DOM khi đã lật, xoay sẵn 180 độ để úp lưng vào mặt kia */}
        {!dark && (
          <img
            src={findPieceXiangqiImageSrc(piece)}
            alt={piece}
            draggable={false}
            className='absolute inset-0 w-full h-full object-contain'
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateX(180deg)',
              filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.35))'
            }}
          />
        )}
      </div>
    </div>
  )
}

export default function JieqiBoard() {
  // Luôn select boardVersion để component re-render đúng lúc mỗi khi có nước đi
  useJieqiStore(s => s.boardVersion)

  const position = useJieqiStore(s => s.position)
  const pieces = useJieqiStore(s => s.pieces)
  const selected = useJieqiStore(s => s.selected)
  const legalMoves = useJieqiStore(s => s.legalMoves)
  const lastMove = useJieqiStore(s => s.lastMove)
  const status = useJieqiStore(s => s.status)
  const flipped = useJieqiStore(s => s.flipped)
  const selectSquare = useJieqiStore(s => s.selectSquare)
  const currentLevel = useJieqiStore(s => s.level)
  const capturedLog = useJieqiStore(s => s.capturedLog)
  const darkViewMode = useJieqiStore(s => s.darkViewMode)

  const [capturedLogMine, setCapturedLogMine] = useState<CapturedLogItem[]>([])
  const [capturedLogCompetitor, setCapturedLogCompetitor] = useState<CapturedLogItem[]>([])

  const targets = selected >= 0 ? legalMoves.filter(m => m.from === selected).map(m => m.to) : []
  const isCheckNow = status ? status.check || (status.over && status.reason === 'checkmate') : false
  const checkedKingSq = isCheckNow ? position.kingSquare(position.turn) : -1

  const rows = Array.from({ length: 10 }, (_, i) => i)
  const cols = Array.from({ length: 9 }, (_, i) => i)

  /** Quy đổi 1 ô sang tọa độ % của GÓC TRÁI TRÊN vùng chứa quân, có tính lật bàn cờ */
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

  // ----- Vẽ lưới SVG: giao điểm (c, r) nằm tại (50 + 100c, 50 + 100r) trong viewBox 900x1000 -----
  const gridLines: React.ReactNode[] = []

  for (let r = 0; r < 10; r++) {
    gridLines.push(<line key={`h${r}`} x1={50} y1={50 + r * 100} x2={850} y2={50 + r * 100} />)
  }

  for (let c = 0; c < 9; c++) {
    if (c === 0 || c === 8) {
      gridLines.push(<line key={`v${c}`} x1={50 + c * 100} y1={50} x2={50 + c * 100} y2={950} />)
    } else {
      gridLines.push(<line key={`v${c}a`} x1={50 + c * 100} y1={50} x2={50 + c * 100} y2={450} />)
      gridLines.push(<line key={`v${c}b`} x1={50 + c * 100} y1={550} x2={50 + c * 100} y2={950} />)
    }
  }

  useEffect(() => {
    const mine: CapturedLogItem[] = []
    const competitor: CapturedLogItem[] = []

    for (const c of capturedLog) {
      const showReal = !c.wasDark || darkViewMode === 3 || (darkViewMode === 2 && c.byUser)
      const realChar = (c.color === 'red' ? c.realType.toUpperCase() : c.realType) as JqPieceChar

      // Quân úp được lộ danh tính -> vẽ mờ (dimmed) để phân biệt với quân vốn lộ mặt
      const item: CapturedLogItem =
        showReal && c.realType !== 'x' ? { src: findPieceXiangqiImageSrc(realChar), dimmed: c.wasDark } : DARK_IMAGE

      if (c.byUser) mine.push(item)
      else competitor.push(item)
    }

    setCapturedLogMine(mine)
    setCapturedLogCompetitor(competitor)
  }, [capturedLog, darkViewMode])

  return (
    <div className='relative inline-block select-none'>
      {/* ===== Thanh thông tin MÁY ===== */}
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
        {/* ----- LỚP 1: LƯỚI SVG ----- */}
        <svg viewBox='0 0 900 1000' className='absolute inset-0 w-full h-full pointer-events-none'>
          <g stroke={LINE_COLOR} strokeWidth={3}>
            {gridLines}

            {/* Cung Tướng */}
            <line x1={350} y1={50} x2={550} y2={250} />
            <line x1={550} y1={50} x2={350} y2={250} />
            <line x1={350} y1={750} x2={550} y2={950} />
            <line x1={550} y1={750} x2={350} y2={950} />

            <rect x={50} y={50} width={800} height={900} fill='none' strokeWidth={5} />
          </g>

          {/* Chữ ở "sông" */}
          <g fill={LINE_COLOR} fontSize={64} className='font-ink' opacity={0.75}>
            <text x={450} y={522} textAnchor='middle'>
              ChessONE
            </text>
          </g>
        </svg>

        {/* ----- LỚP 2: NÚT BẮT CLICK + HIGHLIGHT ----- */}
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
                    style={{ inset: '1%', backgroundColor: 'rgba(255, 215, 0, 0.4)' }}
                  />
                )}
                {isCheckedKing && (
                  <span
                    className='absolute rounded-full pointer-events-none'
                    style={{
                      inset: '-5%',
                      background: 'radial-gradient(circle, rgba(255,0,0,0.6) 30%, rgba(255,0,0,0) 75%)'
                    }}
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

        {/* ----- LỚP 3: QUÂN CỜ (úp / lật) ----- */}
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
                <PieceDisc piece={p.piece} dark={p.dark} />
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
