import { notFound } from 'next/navigation'

import SectionWrapper from '@/components/SectionWrapper'
import AI from '@/views/pages/Play/Chess/AI'

import { games, gameModes } from '@/enums'

interface Props {
  params: Promise<{ game: string; mode: string }>
}

export default async function AIPage({ params }: Props) {
  const { game, mode } = await params

  if (!games.some(item => item.value === game) || !gameModes.some(item => item.value === mode)) {
    notFound()
  }

  return (
    <SectionWrapper>
      {game?.toLowerCase() === 'chess' && mode?.toLowerCase() === 'ai' && (
        <AI gameValue={game} gameModeValue={mode}></AI>
      )}
    </SectionWrapper>
  )
}
