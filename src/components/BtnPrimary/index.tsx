'use client'

import type { ReactNode } from 'react'

import styles from './BtnPrimary.module.css'

export default function BtnPrimary({ children }: { children: ReactNode }) {
  return (
    <button
      className={`py-3 px-5 text-xl sm:text-2xl inline-flex items-center gap-1 cursor-pointer play-btn text-white rounded-5xl relative overflow-hidden text-nowrap ${styles.container}`}
      style={{
        background: 'linear-gradient(180deg, #5cb85c 0%, #3a8a3a 50%, #2d6e2d 100%)',
        border: '2px solid #1e5c1e',
        boxShadow:
          'inset 0 2px 6px rgba(255,255,255,0.35), inset 0 -3px 6px rgba(0,0,0,0.3), 0 4px 10px rgba(0,0,0,0.35)',
        transition: 'transform 0.1s, box-shadow 0.1s'
      }}
    >
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
