'use client'

// Component "nhạc trưởng" - gộp toàn bộ các mảnh lại thành 1 màn hình chơi cờ
// hoàn chỉnh. Đây là component duy nhất bạn cần đặt vào trang (page.tsx) của
// mình, mọi thứ còn lại nó tự lo.

import { useEffect } from 'react'

import ChessBoard from './ChessBoard'
import GameControls from './GameControls'
import MoveList from './MoveList'
import GameOverDialog from './GameOverDialog'
import { useChessSounds } from '@/hooks/useChessSounds'
import { useChessStore } from '@/stores/chess'

export default function ChessGame() {
  // Bật âm thanh nước đi - chỉ cần gọi 1 lần ở đây
  useChessSounds()

  const newGame = useChessStore(s => s.newGame)
  const moveLog = useChessStore(s => s.moveLog)

  // Tự bắt đầu 1 ván "2 người chơi" khi vào trang lần đầu.
  // Người dùng có thể bấm "Bắt đầu" ở GameControls để đổi sang chế độ khác bất cứ lúc nào.
  useEffect(() => {
    if (moveLog.length === 0) {
      newGame({ side: 'white' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className='flex flex-wrap items-start justify-center gap-6 p-6'>
      {/* "relative inline-block" để GameOverDialog (absolute inset-0) phủ khít đúng bàn cờ */}
      <div className='relative inline-block'>
        <ChessBoard />
        <GameOverDialog />
      </div>

      <div className='flex flex-col w-full lg:w-auto gap-4 items-center'>
        <GameControls />
        {/*<MoveList />*/}
      </div>
    </div>
  )
}
