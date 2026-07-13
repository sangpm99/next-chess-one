'use client'

import Link from 'next/link'

import { capitalizeText } from '@/utils/formatters'

import { findGame, findGameMode } from '@/utils'

import XiangqiGame from '@/views/pages/Play/Xiangqi/XiangqiGame'

import Back from '@/assets/icons/Back'

interface Props {
  gameValue: string
  gameModeValue: string
}

export default function AI({ gameValue, gameModeValue }: Props) {
  const game = findGame(gameValue)
  const gameMode = findGameMode(gameModeValue)

  if (!game || !gameMode) return null

  return (
    <div>
      <div className='flex items-center gap-2'>
        <Link href={`/play?game=${gameValue}`} className='flex'>
          <Back width={30} height={30} />
        </Link>

        <h3 className='border-s ps-3 border-black font-ink text-2xl text-primary'>
          {capitalizeText(game.title)} - {capitalizeText(gameMode.title)}
        </h3>
      </div>

      <div className='flex justify-center p-8'>
        <XiangqiGame />
      </div>
    </div>
  )
}
