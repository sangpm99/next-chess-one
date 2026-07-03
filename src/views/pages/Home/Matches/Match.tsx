'use client'

import Image from 'next/image'
import Link from 'next/link'

import type { Game } from '@/types'

interface Props {
  game: Game
  status: string
}

export default function Match({ game, status }: Props) {
  return (
    <div className='col-span-2'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
        {Array.from({ length: 10 }).map((item, index) => (
          <Link href='https://chessone.net' target='_blank' key={index}>
            <div
              className='flex justify-between py-4 px-5 rounded shadow'
              style={{
                backgroundImage:
                  'url(https://cdn.vietnamexploration.com/vnexploration/2026/06/28120707-ed14efce-bg-13.webp)',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover'
              }}
            >
              <div className='flex gap-3 items-center w-[calc((100%-53px)/2)]'>
                <Image
                  src='https://cms.vietnamexploration.com/assets/avatar-blank-Be0MhOmB.jpg'
                  alt='avatar'
                  priority
                  width={50}
                  height={50}
                  className='rounded-full hidden md:block'
                  style={{ objectFit: 'cover', border: '2px solid #f1f1f1' }}
                />

                <div className='flex flex-col items-start gap-2 min-w-0'>
                  <div className='font-ink truncate w-full'>Nguyen Van A</div>
                  <div
                    className='flex gap-1 items-center bg-(--secondary) text-white py-1 px-2'
                    style={{ borderRadius: '5px' }}
                  >
                    <i className='ri-star-fill w-[18px] text-warning'></i>
                    <div>2000</div>
                  </div>
                </div>
              </div>

              <Image
                src='https://cdn.vietnamexploration.com/vnexploration/2026/06/28113727-8b124f45-vs-10.webp'
                alt='vs'
                priority
                width={40}
                height={53}
                style={{
                  objectFit: 'cover'
                }}
              />

              <div className='flex gap-3 items-center justify-end w-[calc((100%-53px)/2)]'>
                <div className='flex flex-col items-end gap-2 min-w-0'>
                  <div className='font-ink truncate text-end w-full'>Nguyen Van B</div>
                  <div
                    className='flex gap-1 items-center bg-(--secondary) text-white py-1 px-2'
                    style={{ borderRadius: '5px' }}
                  >
                    <i className='ri-star-fill w-[18px] text-warning'></i>
                    <div>2000</div>
                  </div>
                </div>

                <Image
                  src='https://cms.vietnamexploration.com/assets/avatar-blank-Be0MhOmB.jpg'
                  alt='avatar'
                  priority
                  width={50}
                  height={50}
                  className='rounded-full hidden md:block'
                  style={{ objectFit: 'cover', border: '3px solid #f1f1f1' }}
                />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
