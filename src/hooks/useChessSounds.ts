'use client'

// Hook phát âm thanh mỗi khi có nước đi mới trong ván cờ.
// Chỉ cần gọi 1 LẦN DUY NHẤT ở component cha (ChessGame), không gọi lặp lại
// ở nhiều nơi vì mỗi lần gọi sẽ tạo thêm 1 "trình lắng nghe" độc lập.
//
// Cần đặt sẵn 3 file trong public/sounds/: move.wav, capture.wav, check.wav
// (lấy nguyên từ thư mục sounds/ trong bản app cũ).

import { useEffect, useRef } from 'react'

import { useChessStore } from '@/stores/chess'

export function useChessSounds() {
  const moveLog = useChessStore(s => s.moveLog)
  const status = useChessStore(s => s.status)
  const soundEnabled = useChessStore(s => s.soundEnabled)
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

      // SAN có ký tự 'x' nghĩa là nước ăn quân, ví dụ "exd5" hoặc "Nxf3"
      if (last.san.includes('x')) src = '/sounds/capture.wav'

      // Ưu tiên âm thanh "chiếu" nếu ván đang ở trạng thái chiếu / chiếu bí
      if (status?.check || last.san.includes('+') || last.san.includes('#')) {
        src = '/sounds/check.wav'
      }

      const audio = new Audio(src)

      audio.play().catch(() => {
        // Một số trình duyệt chặn tự phát âm thanh khi chưa có tương tác của
        // người dùng - bỏ qua lỗi này, không ảnh hưởng tới ván cờ.
      })
    }

    prevLength.current = moveLog.length
  }, [moveLog, status, soundEnabled])
}
