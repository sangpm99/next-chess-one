'use client'

import { useState } from 'react'

import Image from 'next/image'

import StatCounter from '@views/pages/Home/Herro/StatCounter'
import Categories from '@views/pages/Home/Herro/Categories'
import BtnPrimary from '@components/BtnPrimary'

interface Service {
  title: string
  name: string
  image: string
}

const services: Service[] = [
  {
    title: 'Cờ Vua',
    name: 'chess',
    image: 'https://cdn.vietnamexploration.com/vnexploration/2026/06/15093807.co-vua.webp'
  },
  {
    title: 'Cờ Tướng',
    name: 'xiangqi',
    image: 'https://cdn.vietnamexploration.com/vnexploration/2026/06/15093826.co-tuong.webp'
  },
  {
    title: 'Cờ Úp',
    name: 'jieqi',
    image: 'https://cdn.vietnamexploration.com/vnexploration/2026/06/15093856.co-up.webp'
  },
  {
    title: 'Cờ Vây',
    name: 'gomuku',
    image: 'https://cdn.vietnamexploration.com/vnexploration/2026/06/15093911.gomuku.webp'
  }
]

export default function Herro() {
  const [selected, setSelected] = useState<Service>(services[0])
  const [previous, setPrevious] = useState<Service | null>(null)

  const onSelectService = (service: Service) => {
    setPrevious(selected)
    setSelected(service)
  }

  return (
    <section>
      <div className='grid grid-cols-1 md:grid-cols-2'>
        <div
          key={selected?.image}
          className='relative h-[300px] sm:h-[500px] lg:h-[700px] rounded-4xl overflow-hidden flash order-2 md:order-1'
        >
          <Image src={selected?.image ?? ''} alt={selected?.name ?? ''} fill priority style={{ objectFit: 'cover' }} />

          <div className='absolute bottom-[50px] left-1/2 -translate-x-1/2 fade-up'>
            <BtnPrimary>Chơi {selected.title}</BtnPrimary>
          </div>
        </div>

        <div className='flex flex-col order-1 md:order-2'>
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
            <Categories services={services} selected={selected} previous={previous} onSelectService={onSelectService} />
          </div>
        </div>

        <div className='grid lg:hidden grid-cols-4 gap-2 py-3 bg-(--bg-default) rounded-5xl z-2 order-3'>
          <Categories services={services} selected={selected} previous={previous} onSelectService={onSelectService} />
        </div>
      </div>
    </section>
  )
}
