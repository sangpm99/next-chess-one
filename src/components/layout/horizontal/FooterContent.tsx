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
      <div className='flex items-center gap-4'>
        <Link href='https://chessone.net' target='_blank' className='link'>
          License
        </Link>
        <Link href='https://chessone.net' target='_blank' className='link'>
          More Themes
        </Link>
        <Link href='https://chessone.net' target='_blank' className='link'>
          Documentation
        </Link>
        <Link href='https://chessone.net' target='_blank' className='link'>
          Support
        </Link>
      </div>

      <div>
        <span>{`© ${new Date().getFullYear()}, chessone.net `}</span>
      </div>
    </div>
  )
}

export default FooterContent
