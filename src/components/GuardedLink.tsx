'use client'

// Giống hệt <Link> của Next.js, nhưng nếu đang có ván cờ dở dang thì hỏi xác
// nhận trước khi điều hướng đi. Dùng THAY CHO <Link> ở những chỗ có thể dẫn
// người chơi rời khỏi trang chơi cờ (menu, logo, nút "Về trang chủ", v.v...).
//
// Cách dùng: giống hệt <Link>, chỉ đổi tên component:
//   import GuardedLink from '@/components/chess/GuardedLink';
//   <GuardedLink href="/">Trang chủ</GuardedLink>

import { type MouseEvent, type PropsWithChildren } from 'react'

import Link, { type LinkProps } from 'next/link'

import { useChessStore } from '@/stores/chess'

const WARNING_MESSAGE = 'Ván cờ đang diễn ra. Nếu rời đi, bạn sẽ bị xử thua. Bạn có chắc chắn muốn rời đi không?'

type GuardedLinkProps = PropsWithChildren<LinkProps> & {
  className?: string
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void
}

export default function GuardedLink({ children, onClick, ...linkProps }: GuardedLinkProps) {
  const moveLog = useChessStore(s => s.moveLog)
  const gameOver = useChessStore(s => s.gameOver)
  const vsEngine = useChessStore(s => s.vsEngine)
  const resign = useChessStore(s => s.resign)

  const isGameActive = moveLog.length > 0 && !gameOver

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    if (isGameActive) {
      const confirmed = window.confirm(WARNING_MESSAGE)

      if (!confirmed) {
        e.preventDefault()

        return
      }

      if (vsEngine) resign()
    }

    onClick?.(e)
  }

  return (
    <Link {...linkProps} onClick={handleClick}>
      {children}
    </Link>
  )
}
