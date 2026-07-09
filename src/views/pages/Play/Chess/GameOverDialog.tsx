'use client'

// Popup hiện ra khi ván cờ kết thúc (chiếu bí / hòa / xin thua), hiển thị kết
// quả và lý do, kèm nút bắt đầu ván mới cùng thiết lập cũ.

import { useChessStore } from '@/stores/chess'
import { WHITE } from '@/lib/chess/constants'
import type { GameOverReason } from '@/types/chess'

const REASON_LABEL: Record<GameOverReason, string> = {
  checkmate: 'Chiếu bí',
  stalemate: 'Hết nước đi hợp lệ (Hòa)',
  fifty: 'Hòa theo luật 50 nước',
  material: 'Hòa do không đủ quân để chiếu bí',
  repetition: 'Hòa do lặp lại cùng một thế cờ 3 lần'
}

export default function GameOverDialog() {
  const status = useChessStore(s => s.status)
  const resignedBy = useChessStore(s => s.resignedBy)
  const gameOver = useChessStore(s => s.gameOver)
  const userColor = useChessStore(s => s.userColor)
  const vsEngine = useChessStore(s => s.vsEngine)
  const newGame = useChessStore(s => s.newGame)

  if (!gameOver) return null

  const userColorStr = userColor === WHITE ? 'white' : 'black'

  let title = 'Ván cờ kết thúc'
  let detail = ''

  if (resignedBy !== null) {
    const resignedIsUser = resignedBy === userColor

    title = resignedIsUser ? 'Bạn đã xin thua' : 'Đối thủ đã xin thua'
    detail = resignedIsUser ? 'Bạn thua ván này' : 'Bạn thắng ván này!'
  } else if (status?.result === 'draw') {
    title = 'Hòa cờ'
    detail = status.reason ? REASON_LABEL[status.reason] : ''
  } else if (status?.result) {
    if (vsEngine) {
      title = status.result === userColorStr ? 'Bạn thắng!' : 'Bạn thua'
    } else {
      title = status.result === 'white' ? 'Trắng thắng' : 'Đen thắng'
    }

    detail = status.reason ? REASON_LABEL[status.reason] : ''
  }

  return (
    <div className='absolute inset-0 z-30 flex items-center justify-center bg-black/50 rounded-sm'>
      <div className='bg-[#fdf6ec] rounded-xl shadow-2xl p-6 w-72 flex flex-col items-center gap-2 text-center'>
        <h2 className='text-lg font-bold text-[#5b3a29]'>{title}</h2>
        {detail && <p className='text-sm text-[#8a6b52]'>{detail}</p>}
        <button
          type='button'
          onClick={() => newGame({ side: userColor === WHITE ? 'white' : 'black', vsEngine })}
          className='mt-3 px-4 py-2 rounded-md bg-[#5b3a29] text-white text-sm font-semibold hover:bg-[#4a2f21] transition-colors'
        >
          Ván mới
        </button>
      </div>
    </div>
  )
}
