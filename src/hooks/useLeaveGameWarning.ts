'use client'

// Cảnh báo người chơi trước khi rời trang giữa lúc ván đấu đang diễn ra.
// Gọi hook này 1 LẦN DUY NHẤT ở component cha (ChessGame).
//
// Bao phủ 2 trường hợp:
//  1. Đóng tab / tải lại trang / gõ URL khác trên thanh địa chỉ
//     -> hiện dialog CẢNH BÁO GỐC của trình duyệt (không tùy chỉnh được nội
//        dung vì lý do bảo mật - các trình duyệt hiện đại chặn việc này).
//  2. Bấm nút Back / Forward của trình duyệt
//     -> hiện dialog xác nhận TỰ VIẾT nội dung, và nếu người chơi xác nhận rời
//        đi trong lúc đang đấu với máy, tự động xử thua trước khi cho rời trang.
//
// Với các link điều hướng NGAY TRONG app (menu, logo...), dùng component
// <GuardedLink> (components/chess/GuardedLink.tsx) thay cho <Link> của Next.js
// ở những chỗ có thể dẫn người chơi rời khỏi trang chơi cờ.

import { useEffect, useRef } from 'react'

import { useChessStore } from '@/stores/chess'

const WARNING_MESSAGE = 'Ván cờ đang diễn ra. Nếu rời đi, bạn sẽ bị xử thua. Bạn có chắc chắn muốn rời đi không?'

export function useLeaveGameWarning() {
  const moveLog = useChessStore(s => s.moveLog)
  const gameOver = useChessStore(s => s.gameOver)
  const vsEngine = useChessStore(s => s.vsEngine)
  const resign = useChessStore(s => s.resign)

  const isGameActive = moveLog.length > 0 && !gameOver

  // Cờ đánh dấu "lần popstate tiếp theo là do CHÍNH mình gọi history.back() sau
  // khi người chơi đã xác nhận rời đi" - để không hỏi lại lần 2 (tránh vòng lặp vô hạn).
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
    // "tiêu thụ" mốc giả này thay vì rời trang ngay lập tức - nhờ vậy mình có
    // cơ hội chặn lại và hỏi xác nhận trước.
    window.history.pushState(null, '', window.location.href)

    function handlePopState() {
      if (allowNextPopRef.current) {
        // Đây là lần back() do CHÍNH mình gọi sau khi người chơi đã xác nhận - bỏ qua, cho đi tiếp
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
