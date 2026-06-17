'use client'

import { useState } from 'react'

import Image from 'next/image'

import StatCounter from '@views/pages/Home/Herro/StatCounter'
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
      <div className='grid grid-cols-2'>
        <div key={selected?.image} className='relative h-[700px] rounded-4xl overflow-hidden flash'>
          <Image src={selected?.image ?? ''} alt={selected?.name ?? ''} fill priority style={{ objectFit: 'cover' }} />

          <div className='absolute bottom-[50px] left-1/2 -translate-x-1/2 fade-up'>
            <BtnPrimary>Chơi {selected.title}</BtnPrimary>
          </div>
        </div>

        <div className='flex flex-col'>
          <div className='p-15'>
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

          <div
            className='grid grid-cols-4 gap-8 p-8 bg-(--bg-default) rounded-5xl'
            style={{ marginLeft: '-110px', zIndex: 2 }}
          >
            {services.map((service, index) => (
              <div
                className='relative aspect-square rounded-4xl overflow-hidden cursor-pointer'
                style={{
                  ...(selected?.name === service.name
                    ? {
                        border: '5px solid transparent',
                        outline: '1px dashed var(--mui-palette-primary-main)'
                      }
                    : {
                        border: '5px solid transparent',
                        outline: '1px solid transparent'
                      })
                }}
                key={index}
                onClick={() => onSelectService(service)}
              >
                <Image src={service.image} alt={service.name} fill priority style={{ objectFit: 'cover' }} />

                {selected?.name === service.name ? (
                  <div className='absolute top-0 bottom-0 left-0 bg-black/50 expand-width-full'></div>
                ) : previous?.name === service.name ? (
                  <div className='absolute top-0 bottom-0 left-0 bg-black/50 expand-width-collapse'></div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
