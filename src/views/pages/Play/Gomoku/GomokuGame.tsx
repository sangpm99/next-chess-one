'use client'

// Component "nhạc trưởng" của ván cờ caro - gộp toàn bộ các mảnh lại thành 1
// màn hình chơi cờ hoàn chỉnh, giống ChessGame của bản cờ vua. Đây là component
// duy nhất cần đặt vào trang, mọi thứ còn lại nó tự lo.

import { useEffect } from 'react'

import GomokuBoard from './GomokuBoard'
import GameControls from './GameControls'
import MoveList from './MoveList'
import GameOverDialog from './GameOverDialog'
import { useGomokuSounds } from '@/hooks/useGomokuSounds'
import { useGomokuStore } from '@/stores/gomoku'
import { useGomokuLeaveWarning } from '@/hooks/useGomokuLeaveWarning'

export default function GomokuGame() {
  // Bật âm thanh nước đi - chỉ cần gọi 1 lần ở đây
  useGomokuSounds()

  // Cảnh báo trước khi rời trang giữa ván đấu - chỉ cần gọi 1 lần ở đây
  useGomokuLeaveWarning()

  const newGame = useGomokuStore(s => s.newGame)
  const moveLog = useGomokuStore(s => s.moveLog)

  // Tự bắt đầu 1 ván đấu với máy (người chơi cầm Đỏ) khi vào trang lần đầu.
  // Người dùng có thể bấm "Chơi lại" ở GameControls để đổi thiết lập bất cứ lúc nào.
  useEffect(() => {
    if (moveLog.length === 0) {
      newGame({ side: 'black' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className='flex flex-wrap items-start justify-center gap-6 p-6'>
      <div className='flex flex-col w-full lg:w-auto gap-4 items-center'>
        <GameControls />
        {/*<MoveList />*/}
      </div>

      {/* "relative inline-block" để GameOverDialog (absolute inset-0) phủ khít đúng bàn cờ */}
      <div className='relative inline-block'>
        <GomokuBoard />
        <GameOverDialog />
      </div>
    </div>
  )
}
