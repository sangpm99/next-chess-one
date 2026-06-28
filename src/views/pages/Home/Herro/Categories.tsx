'use client'

import Image from 'next/image'

interface Service {
  title: string
  value: string
  image: string
}

interface Props {
  services: Service[]
  selected: Service
  previous: Service | null
  onSelectService: (service: Service) => void
}

export default function Categories({ services, selected, previous, onSelectService }: Props) {
  return (
    <>
      {services.map((service, index) => (
        <div
          className='relative aspect-square rounded-3xl sm:rounded-4xl overflow-hidden cursor-pointer'
          style={{
            ...(selected?.value === service.value
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
          <Image src={service.image} alt={service.value} fill priority style={{ objectFit: 'cover' }} />

          {selected?.value === service.value ? (
            <div className='absolute top-0 bottom-0 left-0 bg-black/50 expand-width-full'></div>
          ) : previous?.value === service.value ? (
            <div className='absolute top-0 bottom-0 left-0 bg-black/50 expand-width-collapse'></div>
          ) : null}
        </div>
      ))}
    </>
  )
}
