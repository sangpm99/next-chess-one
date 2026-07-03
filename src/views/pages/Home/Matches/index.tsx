'use client'

import { useState } from 'react'

import Button from '@mui/material/Button'

import MatchSidebar from './MatchSidebar'
import Match from './Match'

import type { Game } from '@/types'
import { statuses, games } from '@/enums'

export default function Matches() {
  const [status, setStatus] = useState<string>('in-progress')
  const [game, setGame] = useState<Game>(games[0])

  const onStatusChange = (val: string) => {
    setStatus(val)
  }

  const onGameChange = (g: Game) => {
    setGame(g)
  }

  return (
    <div>
      <h2 className='heading-title text-4xl text-primary font-ink text-center mb-5'>Trận Đấu</h2>
      <p className='text-center text-lg mb-10'>Bước vào bàn cờ, đối đầu người chơi khác và theo dõi kết quả</p>

      <div className='flex justify-center gap-3'>
        {statuses.map((item, index) => (
          <Button
            variant={item.value === status ? 'contained' : 'outlined'}
            key={index}
            onClick={() => onStatusChange(item.value)}
          >
            {item.title}
          </Button>
        ))}
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-3 mt-10 xl:gap-x-4 gap-y-4'>
        <MatchSidebar games={games} game={game} onGameChange={onGameChange} />

        <Match game={game} status={status} />
      </div>
    </div>
  )
}
