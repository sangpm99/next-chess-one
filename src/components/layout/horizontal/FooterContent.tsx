'use client'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import classnames from 'classnames'

// Util Imports
import { horizontalLayoutClasses } from '@layouts/utils/layoutClasses'

const FooterContent = () => {
  return (
    <div
      className={classnames(
        horizontalLayoutClasses.footerContent,
        'flex flex-col items-center justify-center flex-wrap gap-4'
      )}
    >
      <div className='flex flex-col sm:flex-row items-center gap-4'>
        <Link href='https://chessone.net' target='_blank' className='link'>
          Liên hệ
        </Link>
        <Link href='https://chessone.net' target='_blank' className='link'>
          Điều khoản sử dụng
        </Link>
        <Link href='https://chessone.net' target='_blank' className='link'>
          Chính sách quyền riêng tư
        </Link>
      </div>

      <div>
        <span>{`© ${new Date().getFullYear()}, chessone.net `}</span>
      </div>
    </div>
  )
}

export default FooterContent
