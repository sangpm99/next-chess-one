'use client'

import { useState } from 'react'

import Image from 'next/image'

import StatCounter from '@views/pages/Home/Herro/StatCounter'

interface Service {
  title: string
  name: string
  image: string
}

const services: Service[] = [
  {
    title: 'Cờ vua',
    name: 'chess',
    image: 'https://cdn.vietnamexploration.com/vnexploration/2026/06/15093807.co-vua.webp'
  },
  {
    title: 'Cờ tướng',
    name: 'xiangqi',
    image: 'https://cdn.vietnamexploration.com/vnexploration/2026/06/15093826.co-tuong.webp'
  },
  {
    title: 'Cờ úp',
    name: 'jieqi',
    image: 'https://cdn.vietnamexploration.com/vnexploration/2026/06/15093856.co-up.webp'
  },
  {
    title: 'Cờ vây',
    name: 'gomuku',
    image: 'https://cdn.vietnamexploration.com/vnexploration/2026/06/15093911.gomuku.webp'
  }
]

export default function Herro() {
  const [selected, setSelected] = useState<Service>(services[0])

  const onSelectService = (service: Service) => {
    setSelected(service)
  }

  return (
    <section>
      <div className='grid grid-cols-2'>
        <div className='relative h-[700px] rounded-4xl overflow-hidden cursor-pointer'>
          {selected && <Image src={selected.image} alt={selected.name} fill priority style={{ objectFit: 'cover' }} />}
        </div>

        <div className='flex flex-col'>
          <div className='p-15'>
            <p className='heading-subtitle mb-3'>Contemporary Living</p>

            <h2 className='heading-title'>
              Experience the Epitome of Refinement and Grandeur in Every Detail Of Beauty
            </h2>

            <p>
              Vulputate sapien nec sagittis aliquam malesuada bibendum arcu vitae elementum. Turpis egestas pretium
              aenean pharetra magna ac. Blandit massa enim nec dui nunc. Magnis dis parturient montes nascetur ridiculus
              mus mauris. Nunc scelerisque viverra mauris in aliquam sem.
            </p>

            <div className='mt-5'>
              <StatCounter />
            </div>
          </div>

          <div
            className='grid grid-cols-4 gap-8 p-8 bg-(--bg-default) rounded-5xl'
            style={{ marginLeft: '-90px', zIndex: 2 }}
          >
            {services.map((service, index) => (
              <div
                className='relative aspect-square rounded-4xl overflow-hidden cursor-pointer'
                key={index}
                onClick={() => onSelectService(service)}
              >
                <Image src={service.image} alt={service.name} fill priority style={{ objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
