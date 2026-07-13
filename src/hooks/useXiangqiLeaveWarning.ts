'use client'

// Cảnh báo người chơi trước khi rời trang giữa lúc ván CỜ TƯỚNG đang diễn ra.
// Bản sao của hooks/useLeaveGameWarning.ts nhưng gắn với store cờ tướng.
// Gọi hook này 1 LẦN DUY NHẤT ở component cha (XiangqiGame).

import { useEffect, useRef } from 'react'

import { useXiangqiStore } from '@/stores/xiangqi'

const WARNING_MESSAGE = 'Ván cờ đang diễn ra. Nếu rời đi, bạn sẽ bị xử thua. Bạn có chắc chắn muốn rời đi không?'

export function useXiangqiLeaveWarning() {
  const moveLog = useXiangqiStore(s => s.moveLog)
  const gameOver = useXiangqiStore(s => s.gameOver)
  const vsEngine = useXiangqiStore(s => s.vsEngine)
  const resign = useXiangqiStore(s => s.resign)

  const isGameActive = moveLog.length > 0 && !gameOver

  // Cờ đánh dấu "lần popstate tiếp theo là do CHÍNH mình gọi history.back() sau
  // khi người chơi đã xác nhận rời đi" - để không hỏi lại lần 2.
  const allowNextPopRef = useRef(false)

  // ----- 1. Đóng tab / tải lại trang / gõ URL khác -----
  useEffect(() => {
    if (!isGameActive) return

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
      e.returnValue = '' // bắt buộc phải set để dialog cảnh báo của trình duyệt xuất hiện

      return ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isGameActive])

  // ----- 2. Bấm nút Back / Forward của trình duyệt -----
  useEffect(() => {
    if (!isGameActive) return

    // Chèn thêm 1 mốc lịch sử trùng URL hiện tại, để lần bấm Back đầu tiên chỉ
    // "tiêu thụ" mốc giả này thay vì rời trang ngay lập tức.
    window.history.pushState(null, '', window.location.href)

    function handlePopState() {
      if (allowNextPopRef.current) {
        allowNextPopRef.current = false

        return
      }

      const confirmed = window.confirm(WARNING_MESSAGE)

      if (confirmed) {
        if (vsEngine) resign()
        allowNextPopRef.current = true
        window.history.back() // lùi thêm 1 bước nữa để thực sự rời trang
      } else {
        // Đổi ý - chèn lại đúng mốc lịch sử giả để ở nguyên trang hiện tại
        window.history.pushState(null, '', window.location.href)
      }
    }

    window.addEventListener('popstate', handlePopState)

    return () => window.removeEventListener('popstate', handlePopState)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGameActive])
}
