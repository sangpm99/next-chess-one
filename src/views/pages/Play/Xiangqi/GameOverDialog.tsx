'use client'

// Popup hiện ra khi ván cờ tướng kết thúc, hiển thị kết quả và lý do,
// kèm nút bắt đầu ván mới cùng thiết lập cũ. Có thể đóng popup để xem lại
// bàn cờ / danh sách nước đi (popup sẽ hiện lại ở ván kết thúc kế tiếp).

import { useEffect, useState } from 'react'

import Button from '@mui/material/Button'

import { useXiangqiStore } from '@/stores/xiangqi'
import { RED } from '@/lib/xiangqi/constants'
import type { XqGameOverReason } from '@/types/xiangqi'

const REASON_LABEL: Record<XqGameOverReason, string> = {
  checkmate: 'Chiếu bí / hết nước đi',
  material: 'Hòa do cả hai bên hết quân tấn công',
  longgame: 'Hòa do quá lâu không ăn quân',
  repetition: 'Hòa do lặp lại thế cờ',
  perpetual: 'Xử thua do chiếu dai (luật cấm)'
}

export default function GameOverDialog() {
  const status = useXiangqiStore(s => s.status)
  const resignedBy = useXiangqiStore(s => s.resignedBy)
  const gameOver = useXiangqiStore(s => s.gameOver)
  const userColor = useXiangqiStore(s => s.userColor)
  const vsEngine = useXiangqiStore(s => s.vsEngine)
  const handicap = useXiangqiStore(s => s.handicap)
  const gameId = useXiangqiStore(s => s.gameId)
  const newGame = useXiangqiStore(s => s.newGame)

  // "Đã đóng" chỉ là trạng thái hiển thị cục bộ, không nằm trong store
  const [dismissed, setDismissed] = useState(false)

  // Sang ván mới (gameId đổi) -> mở lại popup cho lần kết thúc kế tiếp
  useEffect(() => {
    setDismissed(false)
  }, [gameId])

  if (!gameOver || dismissed) return null

  const userColorStr = userColor === RED ? 'red' : 'black'

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
      title = status.result === 'red' ? 'Đỏ thắng' : 'Đen thắng'
    }

    detail = status.reason ? REASON_LABEL[status.reason] : ''
  }

  return (
    <div className='absolute inset-0 z-30 flex items-center justify-center bg-black/50 rounded-sm'>
      <div className='bg-[#fdf6ec] rounded-xl shadow-2xl p-6 w-72 flex flex-col items-center gap-2 text-center'>
        <h2 className='text-lg font-bold text-[#5b3a29]'>{title}</h2>
        {detail && <p className='text-sm text-[#8a6b52]'>{detail}</p>}
        <div className='flex gap-2 mt-3'>
          <Button
            variant='contained'
            onClick={() => newGame({ side: userColor === RED ? 'red' : 'black', vsEngine, handicap })}
          >
            Ván mới
          </Button>

          <Button variant='contained' color='secondary' onClick={() => setDismissed(true)}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  )
}
