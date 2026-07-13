'use client'

// Component "nhạc trưởng" của ván cờ úp - gộp toàn bộ các mảnh lại thành 1
// màn hình chơi cờ hoàn chỉnh, giống ChessGame của bản cờ vua. Đây là component
// duy nhất cần đặt vào trang, mọi thứ còn lại nó tự lo.

import { useEffect } from 'react'

import JieqiBoard from './JieqiBoard'
import GameControls from './GameControls'
import MoveList from './MoveList'
import GameOverDialog from './GameOverDialog'
import { useJieqiSounds } from '@/hooks/useJieqiSounds'
import { useJieqiStore } from '@/stores/jieqi'
import { useJieqiLeaveWarning } from '@/hooks/useJieqiLeaveWarning'

export default function JieqiGame() {
  // Bật âm thanh nước đi - chỉ cần gọi 1 lần ở đây
  useJieqiSounds()

  // Cảnh báo trước khi rời trang giữa ván đấu - chỉ cần gọi 1 lần ở đây
  useJieqiLeaveWarning()

  const newGame = useJieqiStore(s => s.newGame)
  const moveLog = useJieqiStore(s => s.moveLog)

  // Tự bắt đầu 1 ván đấu với máy (người chơi cầm Đỏ) khi vào trang lần đầu.
  // Người dùng có thể bấm "Chơi lại" ở GameControls để đổi thiết lập bất cứ lúc nào.
  useEffect(() => {
    if (moveLog.length === 0) {
      newGame({ side: 'red' })
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
        <JieqiBoard />
        <GameOverDialog />
      </div>
    </div>
  )
}
