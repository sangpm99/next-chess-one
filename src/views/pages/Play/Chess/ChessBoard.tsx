'use client'

// Component vẽ bàn cờ 8x8 và xử lý click của người chơi.
//
// Bàn cờ được tách làm 2 LỚP CHỒNG LÊN NHAU:
//  1. Lớp NỀN: 64 ô màu + highlight + tọa độ + bắt sự kiện click (không vẽ quân cờ).
//  2. Lớp QUÂN CỜ: các quân được vẽ đè lên trên, mỗi quân có "id" ổn định
//     (xem store/chess-store.ts - PieceInstance) và dùng CSS "transition" để
//     khi đổi vị trí (left/top), trình duyệt TỰ ĐỘNG chạy animation trượt mượt
//     thay vì bị "dịch chuyển ngay lập tức" như khi vẽ lại toàn bộ ô mỗi lần.

import { useEffect, useState } from 'react'

import { useChessStore } from '@/stores/chess'
import { sq0x88, fileOf, rankOf, EMPTY } from '@/lib/chess/constants'
import PromotionPicker from './PromotionPicker'
import { findPieceImageSrc } from '@/utils'

import Player from '@/components/Player'

export default function ChessBoard() {
  // Luôn select boardVersion để component re-render đúng lúc mỗi khi có nước đi
  useChessStore(s => s.boardVersion)

  const position = useChessStore(s => s.position)
  const pieces = useChessStore(s => s.pieces)
  const selected = useChessStore(s => s.selected)
  const legalMoves = useChessStore(s => s.legalMoves)
  const lastMove = useChessStore(s => s.lastMove)
  const status = useChessStore(s => s.status)
  const flipped = useChessStore(s => s.flipped)
  const pendingPromotion = useChessStore(s => s.pendingPromotion)
  const selectSquare = useChessStore(s => s.selectSquare)
  const currentLevel = useChessStore(s => s.level)
  const capturedLog = useChessStore(s => s.capturedLog)

  const targets = selected >= 0 ? legalMoves.filter(m => m.from === selected).map(m => m.to) : []
  const isCheckNow = status ? status.check || (status.over && status.reason === 'checkmate') : false
  const checkedKingSq = isCheckNow ? position.kings[position.turn] : -1

  const rows = [0, 1, 2, 3, 4, 5, 6, 7]
  const cols = [0, 1, 2, 3, 4, 5, 6, 7]

  const [capturedLogMine, setCapturedLogMine] = useState<string[]>([])
  const [capturedLogCompetitor, setCapturedLogCompetitor] = useState<string[]>([])

  /** Quy đổi 1 ô (hệ 0x88) sang tọa độ % trên bàn cờ hiển thị, có tính lật bàn cờ */
  function squareToPercent(sq: number): { left: number; top: number } {
    const file = fileOf(sq)
    const rank = rankOf(sq)
    const col = flipped ? 7 - file : file
    const row = flipped ? rank : 7 - rank

    return { left: col * 12.5, top: row * 12.5 }
  }

  // Tách khay quân bị ăn thành 2 danh sách URL ảnh:
  // - capturedLogMine:       quân BẠN đã ăn được (quân của đối thủ)
  // - capturedLogCompetitor: quân ĐỐI THỦ đã ăn (quân của bạn)
  useEffect(() => {
    const mine: string[] = []
    const competitor: string[] = []

    for (const c of capturedLog) {
      const src = findPieceImageSrc(c.piece)

      if (c.byUser) mine.push(src)
      else competitor.push(src)
    }

    setCapturedLogMine(mine)
    setCapturedLogCompetitor(competitor)
  }, [capturedLog])

  return (
    <div className='relative inline-block select-none'>
      <Player currentLevel={currentLevel} isCompetitor={true} score={2000} capturedLogs={capturedLogCompetitor} />

      <div
        className='relative grid grid-cols-8 border-4 border-primary rounded-sm overflow-hidden shadow-xl my-2'
        style={{
          width: 'min(90vw, 504px)',
          height: 'min(90vw, 504px)'
        }}
      >
        {/* ===== LỚP NỀN: màu ô + highlight + tọa độ + click - KHÔNG vẽ quân cờ ===== */}
        {rows.map(row =>
          cols.map(col => {
            const rank = flipped ? row : 7 - row
            const file = flipped ? 7 - col : col
            const sq = sq0x88(file, rank)

            const isLight = (file + rank) % 2 === 1
            const isSelected = sq === selected
            const isTarget = targets.includes(sq)
            const targetHasPiece = isTarget && position.board[sq] !== EMPTY
            const isLastMoveSquare = !!lastMove && (sq === lastMove.from || sq === lastMove.to)
            const isCheckedKing = sq === checkedKingSq

            return (
              <button
                key={sq}
                type='button'
                onClick={() => selectSquare(sq)}
                className='relative flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-inset cursor-pointer'
                style={{
                  background: isLight
                    ? 'url("https://cdn.vietnamexploration.com/vnexploration/2026/07/11095802-adee3b91-bg-white-3.webp")'
                    : 'url("https://cdn.vietnamexploration.com/vnexploration/2026/07/11095757-3b349685-bg-black-3.webp")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              >
                {isLastMoveSquare && (
                  <span className='absolute inset-0' style={{ backgroundColor: 'rgba(255, 215, 0, 0.35)' }} />
                )}
                {isCheckedKing && (
                  <span
                    className='absolute inset-0'
                    style={{ background: 'radial-gradient(circle, rgba(255,0,0,0.55) 0%, rgba(255,0,0,0) 70%)' }}
                  />
                )}
                {isSelected && <span className='absolute inset-0 ring-4 ring-amber-400 ring-inset' />}

                {isTarget && !targetHasPiece && (
                  <span
                    className='absolute rounded-full pointer-events-none'
                    style={{ width: '28%', height: '28%', backgroundColor: 'rgba(0,0,0,0.28)' }}
                  />
                )}
                {targetHasPiece && (
                  <span
                    className='absolute inset-[6%] rounded-full pointer-events-none'
                    style={{ boxShadow: 'inset 0 0 0 5px rgba(0,0,0,0.28)' }}
                  />
                )}
              </button>
            )
          })
        )}

        {/* ===== LỚP QUÂN CỜ: nổi trên lớp nền, "pointer-events-none" để click xuyên
             qua tới ô bên dưới. Mỗi quân giữ nguyên "key" (id) khi di chuyển, nên
             React chỉ cập nhật style left/top thay vì xóa-vẽ-lại -> có transition. ===== */}
        <div className='absolute inset-0 pointer-events-none z-10'>
          {pieces.map(p => {
            const { left, top } = squareToPercent(p.square)

            return (
              <div
                key={p.id}
                className='absolute flex items-center justify-center '
                style={{
                  width: '12.5%',
                  height: '12.5%',
                  left: `${left}%`,
                  top: `${top}%`,
                  transition: 'left 180ms ease, top 180ms ease'
                }}
              >
                <img src={findPieceImageSrc(p.piece)} alt={p.piece} draggable={false} className='w-[80%] h-[80%] ' />
              </div>
            )
          })}
        </div>
      </div>

      <Player currentLevel={currentLevel} isCompetitor={false} score={2000} capturedLogs={capturedLogMine} />

      {pendingPromotion && <PromotionPicker />}
    </div>
  )
}
