import { notFound } from 'next/navigation'

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

  return <AI></AI>
}
