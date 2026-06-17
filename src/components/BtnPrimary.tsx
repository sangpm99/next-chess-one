'use client'

import type { ReactNode } from 'react'

export default function BtnPrimary({ children }: { children: ReactNode }) {
  return (
    <button className='py-3 px-5 text-2xl flex items-center gap-1 cursor-pointer shop-btn text-white'>
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width='24'
        height='24'
        viewBox='0 0 24 24'
        fill='white'
        stroke='white'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      >
        <path d='M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z' />
      </svg>
      {children}
    </button>
  )
}
