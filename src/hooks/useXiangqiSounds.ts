'use client'

// Hook phát âm thanh mỗi khi có nước đi mới trong ván CỜ TƯỚNG.
// Chỉ cần gọi 1 LẦN DUY NHẤT ở component cha (XiangqiGame).
//
// Dùng lại 3 file có sẵn trong public/sounds/ của bản cờ vua:
// move.wav, capture.wav, check.wav

import { useEffect, useRef } from 'react'

import { useXiangqiStore } from '@/stores/xiangqi'

export function useXiangqiSounds() {
  const moveLog = useXiangqiStore(s => s.moveLog)
  const soundEnabled = useXiangqiStore(s => s.soundEnabled)
  const prevLength = useRef(0)

  useEffect(() => {
    if (!soundEnabled) {
      // Vẫn cập nhật prevLength để khi bật lại âm thanh không bị phát dồn các nước đã bỏ lỡ
      prevLength.current = moveLog.length

      return
    }

    if (moveLog.length > prevLength.current) {
      const last = moveLog[moveLog.length - 1]
      let src = '/sounds/move.wav'

      if (last.capture) src = '/sounds/capture.wav'

      // Ưu tiên âm thanh "chiếu"
      if (last.check) src = '/sounds/check.wav'

      const audio = new Audio(src)

      audio.play().catch(() => {
        // Một số trình duyệt chặn tự phát âm thanh khi chưa có tương tác của
        // người dùng - bỏ qua lỗi này, không ảnh hưởng tới ván cờ.
      })
    }

    prevLength.current = moveLog.length
  }, [moveLog, soundEnabled])
}
