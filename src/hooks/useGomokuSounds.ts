'use client'

// Hook phát âm thanh mỗi khi có quân mới được đặt trong ván CỜ CARO.
// Chỉ cần gọi 1 LẦN DUY NHẤT ở component cha (GomokuGame).
// Cờ caro không có ăn quân / chiếu nên chỉ dùng tiếng đặt quân (move.wav sẵn có).

import { useEffect, useRef } from 'react'

import { useGomokuStore } from '@/stores/gomoku'

export function useGomokuSounds() {
  const moveLog = useGomokuStore(s => s.moveLog)
  const soundEnabled = useGomokuStore(s => s.soundEnabled)
  const prevLength = useRef(0)

  useEffect(() => {
    if (!soundEnabled) {
      prevLength.current = moveLog.length

      return
    }

    if (moveLog.length > prevLength.current) {
      const audio = new Audio('/sounds/gomoku.wav')

      audio.play().catch(() => {
        // Trình duyệt có thể chặn tự phát âm thanh khi chưa có tương tác - bỏ qua
      })
    }

    prevLength.current = moveLog.length
  }, [moveLog, soundEnabled])
}
