'use client'

// Popup hiện ra khi Tốt đi tới hàng cuối, cho người chơi chọn phong cấp
// thành Hậu / Xe / Tượng / Mã. Component này tự ẩn (return null) khi không
// có nước phong cấp nào đang chờ, nên có thể đặt sẵn trong ChessBoard luôn.

import { useChessStore } from '@/stores/chess'

import { findPieceImageSrc } from '@/utils'

const CHOICES: { key: 'q' | 'r' | 'b' | 'n'; label: string }[] = [
  { key: 'q', label: 'Hậu' },
  { key: 'r', label: 'Xe' },
  { key: 'b', label: 'Tượng' },
  { key: 'n', label: 'Mã' }
]

/** Đường dẫn ảnh quân cờ. Cần đặt sẵn 12 file SVG trong thư mục public/pieces/
 *  theo tên: wK wQ wR wB wN wP (Trắng) và bK bQ bR bB bN bP (Đen). */

export default function PromotionPicker() {
  const pendingPromotion = useChessStore(s => s.pendingPromotion)
  const position = useChessStore(s => s.position)
  const choosePromotion = useChessStore(s => s.choosePromotion)
  const cancelPromotion = useChessStore(s => s.cancelPromotion)

  if (!pendingPromotion) return null

  // Trước khi nước đi thật sự được thực hiện, quân Tốt đang phong cấp vẫn còn
  // nằm ở ô "from" - dùng nó để biết đây là Tốt Trắng hay Tốt Đen.
  const movingPiece = position.board[pendingPromotion.from]
  const isWhite = movingPiece !== '' && movingPiece === movingPiece.toUpperCase()

  return (
    <div className='absolute inset-0 z-20 flex items-center justify-center bg-black/40'>
      <div className='bg-[#fdf6ec] rounded-lg shadow-2xl p-4 flex flex-col items-center gap-3'>
        <p className='text-sm font-semibold text-[#5b3a29]'>Chọn quân phong cấp</p>
        <div className='flex gap-2'>
          {CHOICES.map(c => (
            <button
              key={c.key}
              type='button'
              onClick={() => choosePromotion(c.key)}
              className='w-14 h-14 flex items-center justify-center rounded-md border-2 border-transparent hover:border-amber-400 bg-white transition-colors'
              title={c.label}
            >
              <img
                src={findPieceImageSrc(isWhite ? c.key.toUpperCase() : c.key)}
                alt={c.label}
                className='w-10 h-10'
                draggable={false}
              />
            </button>
          ))}
        </div>
        <button
          type='button'
          onClick={cancelPromotion}
          className='text-xs bg-transparent text-error underline mt-1 cursor-pointer'
        >
          Hủy
        </button>
      </div>
    </div>
  )
}
