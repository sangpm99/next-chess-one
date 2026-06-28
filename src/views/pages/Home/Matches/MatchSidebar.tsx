'use client'

interface Game {
  title: string
  description: string
  image: string
  value: string
}

interface Props {
  games: Game[]
  game: Game
  onGameChange: (game: Game) => void
}

export default function MatchSidebar({ games, game, onGameChange }: Props) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-4 xl:grid-cols-1 gap-4'>
      {games.map(item => {
        return (
          <div
            key={item.value}
            className={`border rounded p-5 cursor-pointer ${game.value === item.value ? 'border-primary bg-(--bg-dark)' : ''}`}
            onClick={() => onGameChange(item)}
          >
            <p className='font-ink text-2xl text-primary'>{item.title}</p>
            <p>{item.description}</p>
          </div>
        )
      })}
    </div>
  )
}
