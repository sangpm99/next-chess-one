'use client'

import { useState } from 'react'

import Button from '@mui/material/Button'

import MatchSidebar from './MatchSidebar'
import Match from './Match'

interface Status {
  title: string
  value: string
}

const statuses: Status[] = [
  { title: 'Gần đây', value: 'completed' },
  { title: 'Đang chơi', value: 'in-progress' },
  { title: 'Đang chờ', value: 'waiting' }
]

interface Game {
  title: string
  description: string
  image: string
  value: string
}

const games: Game[] = [
  {
    title: 'Cờ Vua',
    description:
      'Môn cờ chiến thuật kinh điển nơi mỗi nước đi đều quyết định cục diện. Thử thách tư duy, rèn luyện khả năng tính toán và chinh phục đối thủ bằng chiến lược sắc bén.',
    image: '',
    value: 'chess'
  },
  {
    title: 'Cờ Tướng',
    description:
      'Đắm mình trong nghệ thuật điều binh khiển tướng của phương Đông. Vận dụng chiến thuật linh hoạt, kiểm soát thế trận và giành chiến thắng.',
    image: '',
    value: 'xiangqi'
  },
  {
    title: 'Cờ Úp',
    description:
      'Biến thể đầy bất ngờ với các quân cờ được giấu kín khi bắt đầu ván đấu. Khả năng ứng biến, phán đoán và tận dụng thời cơ để chiến thắng.',
    image: '',
    value: 'jieqi'
  },
  {
    title: 'Cờ Caro',
    description:
      'Luật chơi đơn giản nhưng đầy tính cạnh tranh. Sắp xếp năm quân liên tiếp, dự đoán ý đồ đối thủ và tận hưởng những trận đấu nhanh và hấp dẫn.',
    image: '',
    value: 'gomuku'
  }
]

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
