'use client'

import { useState } from 'react'

import Image from 'next/image'

import StatCounter from '@views/pages/Home/Herro/StatCounter'
import Categories from '@views/pages/Home/Herro/Categories'
import BtnPrimary from '@components/BtnPrimary'

import type { Game } from '@/types'

import { games } from '@/enums'

export default function Herro() {
  const [selectedGame, setSelectedGame] = useState<Game>(games[0])
  const [previous, setPrevious] = useState<Game | null>(null)

  const onSelectService = (game: Game) => {
    setPrevious(selectedGame)
    setSelectedGame(game)
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-2'>
      <div
        key={selectedGame?.image}
        className='relative h-[300px] sm:h-[500px] lg:h-[900px] rounded-4xl overflow-hidden flash order-2 md:order-1'
      >
        <Image
          src={selectedGame?.image ?? ''}
          alt={selectedGame?.value ?? ''}
          fill
          priority
          style={{ objectFit: 'cover' }}
        />

        <div className='absolute bottom-[50px] left-1/2 -translate-x-1/2 fade-up'>
          <BtnPrimary href={`/play?game=${selectedGame.value}`}>Chơi {selectedGame.title}</BtnPrimary>
        </div>
      </div>

      <div className='flex flex-col order-1 md:order-2 xl:mt-30'>
        <div className='md:p-5 lg:p-15'>
          <p className='heading-subtitle mb-3'>NGHỆ THUẬT KỲ PHÒNG</p>

          <h2 className='heading-title font-ink'>Kỳ Như Nhân Sinh – Bản Lĩnh Trong Từng Nước Đi</h2>

          <p>
            Mỗi ván cờ là một cuộc đời thu nhỏ, nơi mưu lược giao thoa cùng nghệ thuật. Trải nghiệm không gian thi đấu
            đỉnh cao với giao diện mang đậm dấu ấn thư pháp thủy mặc, nơi bạn tự do điều binh khiển tướng, bày binh bố
            trận và khẳng định tư duy kiệt xuất của một bậc vĩ nhân.
          </p>

          <div className='mt-5'>
            <StatCounter />
          </div>
        </div>

        <div className='hidden lg:grid grid-cols-4 gap-8 p-8 bg-(--bg-default) rounded-5xl z-2 ml-[-110px]'>
          <Categories games={games} game={selectedGame} previous={previous} onSelectService={onSelectService} />
        </div>
      </div>

      <div className='grid lg:hidden grid-cols-4 gap-2 py-3 bg-(--bg-default) rounded-5xl z-2 order-3'>
        <Categories games={games} game={selectedGame} previous={previous} onSelectService={onSelectService} />
      </div>
    </div>
  )
}
