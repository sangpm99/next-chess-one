import { notFound } from 'next/navigation'

import SectionWrapper from '@/components/SectionWrapper'
import ChessAI from '@/views/pages/Play/Chess/AI'
import XiangqiAI from '@/views/pages/Play/Xiangqi/AI'
import JieqiAI from '@/views/pages/Play/Jieqi/AI'
import GomokuAI from '@/views/pages/Play/Gomoku/AI'

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
        <ChessAI gameValue={game} gameModeValue={mode}></ChessAI>
      )}

      {game?.toLowerCase() === 'xiangqi' && mode?.toLowerCase() === 'ai' && (
        <XiangqiAI gameValue={game} gameModeValue={mode}></XiangqiAI>
      )}

      {game?.toLowerCase() === 'jieqi' && mode?.toLowerCase() === 'ai' && (
        <JieqiAI gameValue={game} gameModeValue={mode}></JieqiAI>
      )}

      {game?.toLowerCase() === 'gomoku' && mode?.toLowerCase() === 'ai' && (
        <GomokuAI gameValue={game} gameModeValue={mode}></GomokuAI>
      )}
    </SectionWrapper>
  )
}
