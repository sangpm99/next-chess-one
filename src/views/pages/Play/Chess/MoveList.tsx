'use client'

// Danh sách nước đi (hiển thị theo cặp Trắng-Đen, kiểu "1. e4 e5") và các nút
// điều hướng xem lại ván đấu (chỉ hoạt động sau khi ván đã kết thúc, giống
// hành vi của bản app cũ).

import { useChessStore } from '@/stores/chess'

interface MovePair {
  no: number
  white?: { san: string; index: number }
  black?: { san: string; index: number }
}

export default function MoveList() {
  const moveLog = useChessStore(s => s.moveLog)
  const viewIndex = useChessStore(s => s.viewIndex)
  const gameOver = useChessStore(s => s.gameOver)
  const goToMove = useChessStore(s => s.goToMove)
  const step = useChessStore(s => s.step)

  // Gom các nước đi thành từng cặp Trắng-Đen để hiển thị
  const pairs: MovePair[] = []

  moveLog.forEach((m, i) => {
    const pairIndex = Math.floor(i / 2)

    if (!pairs[pairIndex]) pairs[pairIndex] = { no: pairIndex + 1 }
    if (i % 2 === 0) pairs[pairIndex].white = { san: m.san, index: i }
    else pairs[pairIndex].black = { san: m.san, index: i }
  })

  return (
    <div className='flex flex-col w-full max-w-xs bg-[#fdf6ec] rounded-lg border border-[#e3d5bd] overflow-hidden'>
      <div className='flex-1 overflow-y-auto max-h-80 p-2'>
        {pairs.length === 0 && <p className='text-sm text-[#a08b6f] text-center py-4'>Chưa có nước đi nào</p>}
        {pairs.map(p => (
          <div key={p.no} className='flex items-center gap-2 text-sm py-0.5'>
            <span className='w-6 text-[#a08b6f]'>{p.no}.</span>
            <button
              type='button'
              disabled={!gameOver || !p.white}
              onClick={() => p.white && goToMove(p.white.index)}
              className={`flex-1 text-left px-1.5 py-0.5 rounded disabled:cursor-default ${
                p.white?.index === viewIndex ? 'bg-amber-200' : 'hover:bg-[#f0e4d0] disabled:hover:bg-transparent'
              }`}
            >
              {p.white?.san ?? ''}
            </button>
            <button
              type='button'
              disabled={!gameOver || !p.black}
              onClick={() => p.black && goToMove(p.black.index)}
              className={`flex-1 text-left px-1.5 py-0.5 rounded disabled:cursor-default ${
                p.black?.index === viewIndex ? 'bg-amber-200' : 'hover:bg-[#f0e4d0] disabled:hover:bg-transparent'
              }`}
            >
              {p.black?.san ?? ''}
            </button>
          </div>
        ))}
      </div>

      {gameOver && moveLog.length > 0 && (
        <div className='flex justify-center gap-1 border-t border-[#e3d5bd] p-2 bg-[#f5ead7]'>
          <NavButton label='⏮' title='Về đầu' onClick={() => step('first')} />
          <NavButton label='◀' title='Nước trước' onClick={() => step('prev')} />
          <NavButton label='▶' title='Nước sau' onClick={() => step('next')} />
          <NavButton label='⏭' title='Đến cuối' onClick={() => step('last')} />
        </div>
      )}
    </div>
  )
}

function NavButton({ label, title, onClick }: { label: string; title: string; onClick: () => void }) {
  return (
    <button
      type='button'
      title={title}
      onClick={onClick}
      className='w-9 h-9 flex items-center justify-center rounded-md bg-white border border-[#e3d5bd] hover:bg-amber-100 text-[#5b3a29]'
    >
      {label}
    </button>
  )
}
