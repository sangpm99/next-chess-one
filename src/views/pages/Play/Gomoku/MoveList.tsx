'use client'

// Danh sách nước đi cờ caro ("1. H8 ●") và nút điều hướng xem lại ván đấu
// (chỉ hoạt động sau khi ván kết thúc, giống các bàn cờ khác).

import { useGomokuStore, BLACK } from '@/stores/gomoku'

export default function MoveList() {
  const moveLog = useGomokuStore(s => s.moveLog)
  const viewIndex = useGomokuStore(s => s.viewIndex)
  const gameOver = useGomokuStore(s => s.gameOver)
  const goToMove = useGomokuStore(s => s.goToMove)
  const step = useGomokuStore(s => s.step)

  return (
    <div className='flex flex-col w-full max-w-xs bg-[#fdf6ec] rounded-lg border border-[#e3d5bd] overflow-hidden'>
      <div className='flex-1 overflow-y-auto max-h-80 p-2'>
        {moveLog.length === 0 && <p className='text-sm text-[#a08b6f] text-center py-4'>Chưa có nước đi nào</p>}
        {moveLog.map((m, i) => (
          <button
            key={i}
            type='button'
            disabled={!gameOver}
            onClick={() => goToMove(i)}
            className={`w-full flex items-center gap-2 text-sm text-left px-1.5 py-0.5 rounded disabled:cursor-default ${
              i === viewIndex ? 'bg-amber-200' : 'hover:bg-[#f0e4d0] disabled:hover:bg-transparent'
            }`}
          >
            <span className='w-8 text-[#a08b6f]'>{i + 1}.</span>
            <span className='flex-1'>{m.label}</span>
            <span>{m.color === BLACK ? '●' : '○'}</span>
          </button>
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
