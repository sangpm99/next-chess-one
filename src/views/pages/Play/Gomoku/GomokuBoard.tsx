'use client'

// Component vẽ bàn cờ caro 15x15 và xử lý click của người chơi.
// Cấu trúc 3 lớp giống bàn cờ tướng/cờ úp: lưới SVG / nút bắt click / quân cờ.
// Quân caro đặt trên GIAO ĐIỂM, không di chuyển và không bị ăn nên phần quân
// đơn giản: chỉ nối thêm đĩa đen/trắng, kèm hiệu ứng "mọc" nhẹ khi xuất hiện.

import { useGomokuStore, BLACK } from '@/stores/gomoku'
import { SIZE, STAR_POINTS } from '@/lib/gomoku/board'

import Player from '@/components/Player'

const LINE_COLOR = '#5d2e0c'

/** Kích thước 1 "ô" theo %: bàn 15x15 giao điểm */
const CELL = 100 / SIZE

export default function GomokuBoard() {
  // Luôn select boardVersion để component re-render đúng lúc mỗi khi có nước đi
  useGomokuStore(s => s.boardVersion)

  const stones = useGomokuStore(s => s.stones)
  const lastMove = useGomokuStore(s => s.lastMove)
  const winningLine = useGomokuStore(s => s.winningLine)
  const clickCell = useGomokuStore(s => s.clickCell)
  const currentLevel = useGomokuStore(s => s.level)

  const cells = Array.from({ length: SIZE }, (_, i) => i)

  // ----- Lưới SVG: giao điểm (x, y) nằm tại (50 + 100x, 50 + 100y) trong viewBox 1500x1500 -----
  const gridLines: React.ReactNode[] = []

  for (let i = 0; i < SIZE; i++) {
    const p = 50 + i * 100

    gridLines.push(<line key={`h${i}`} x1={50} y1={p} x2={1450} y2={p} />)
    gridLines.push(<line key={`v${i}`} x1={p} y1={50} x2={p} y2={1450} />)
  }

  return (
    <div className='relative inline-block select-none'>
      {/* ===== Thanh thông tin MÁY (giữ đúng thiết kế các bàn cờ khác) ===== */}
      <Player currentLevel={currentLevel} isCompetitor={true} score={2000} />

      {/* ===== BÀN CỜ (vuông) ===== */}
      <div
        className='relative border-4 border-primary rounded-sm overflow-hidden shadow-xl my-2'
        style={{
          width: 'min(90vw, 504px)',
          aspectRatio: '1 / 1',
          backgroundImage:
            'url("https://cdn.vietnamexploration.com/vnexploration/2026/07/11160945-d8fe89be-oak-wood-texture-design-background.webp")',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover'
        }}
      >
        {/* ----- LỚP 1: LƯỚI SVG - thuần trang trí ----- */}
        <svg viewBox='0 0 1500 1500' className='absolute inset-0 w-full h-full pointer-events-none'>
          <g stroke={LINE_COLOR} strokeWidth={3}>
            {gridLines}
            <rect x={50} y={50} width={1400} height={1400} fill='none' strokeWidth={5} />
          </g>

          {/* 9 điểm sao */}
          <g fill={LINE_COLOR}>
            {STAR_POINTS.map(([sx, sy]) => (
              <circle key={`${sx}-${sy}`} cx={50 + sx * 100} cy={50 + sy * 100} r={11} />
            ))}
          </g>
        </svg>

        {/* ----- LỚP 2: NÚT BẮT CLICK + đánh dấu hàng thắng ----- */}
        {cells.map(y =>
          cells.map(x => {
            const isWinning = winningLine.some(w => w.x === x && w.y === y)
            const isLastMoveSquare = !!lastMove && lastMove.x === x && lastMove.y === y // ← thêm

            return (
              <button
                key={`${x}-${y}`}
                type='button'
                onClick={() => clickCell(x, y)}
                className='absolute flex items-center justify-center focus:outline-none cursor-pointer'
                style={{
                  width: `${CELL}%`,
                  height: `${CELL}%`,
                  left: `${x * CELL}%`,
                  top: `${y * CELL}%`,
                  background: 'transparent'
                }}
              >
                {isLastMoveSquare && (
                  <span
                    className='absolute rounded-full pointer-events-none'
                    style={{ inset: '-5%', backgroundColor: 'rgba(255, 215, 0, 0.4)' }}
                  />
                )}
                {isWinning && (
                  <span
                    className='absolute rounded-full pointer-events-none'
                    style={{ inset: '-8%', backgroundColor: 'rgba(255, 215, 0, 0.45)' }}
                  />
                )}
              </button>
            )
          })
        )}

        {/* ----- LỚP 3: QUÂN CỜ - đĩa đen/trắng, hiệu ứng "mọc" khi xuất hiện ----- */}
        <div className='absolute inset-0 pointer-events-none z-10'>
          {stones.map(s => {
            const isBlack = s.color === BLACK

            return (
              <div
                key={s.id}
                className='absolute flex items-center justify-center'
                style={{
                  width: `${CELL}%`,
                  height: `${CELL}%`,
                  left: `${s.x * CELL}%`,
                  top: `${s.y * CELL}%`
                }}
              >
                <div
                  className='relative rounded-full'
                  style={{
                    width: '84%',
                    height: '84%',
                    background: isBlack
                      ? 'radial-gradient(circle at 35% 30%, #555, #050505)'
                      : 'radial-gradient(circle at 35% 30%, #ffffff, #d8d8d8)',
                    border: isBlack ? '1px solid #000' : '1px solid #b9b9b9',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                    animation: 'gomoku-pop 160ms ease-out'
                  }}
                ></div>
              </div>
            )
          })}
        </div>

        {/* keyframes cho hiệu ứng quân "mọc" lên */}
        <style>{`
          @keyframes gomoku-pop {
            from { transform: scale(0.4); opacity: 0.4; }
            to { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>

      {/* ===== Thanh thông tin NGƯỜI CHƠI ===== */}
      <Player currentLevel={currentLevel} isCompetitor={false} score={2000} />
    </div>
  )
}
