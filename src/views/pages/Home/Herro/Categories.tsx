'use client'

import Image from 'next/image'

import type { Game } from '@/types'

interface Props {
  games: Game[]
  game: Game
  previous: Game | null
  onSelectService: (service: Game) => void
}

export default function Categories({ games, game, previous, onSelectService }: Props) {
  return (
    <>
      {games.map((item, index) => (
        <div
          className='relative aspect-square rounded-3xl sm:rounded-4xl overflow-hidden cursor-pointer'
          style={{
            ...(game?.value === item.value
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
          onClick={() => onSelectService(item)}
        >
          <Image src={item.image} alt={item.value} fill style={{ objectFit: 'cover' }} />

          {game?.value === item.value ? (
            <div className='absolute top-0 bottom-0 left-0 bg-black/50 expand-width-full'></div>
          ) : previous?.value === item.value ? (
            <div className='absolute top-0 bottom-0 left-0 bg-black/50 expand-width-collapse'></div>
          ) : null}
        </div>
      ))}
    </>
  )
}
