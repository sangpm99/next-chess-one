import type { Game, GameMode } from '@/types'

import { games, gameModes, chessPieces, xiangquiPieces } from '@/enums'

export const findGame = (value: any): Game | undefined => {
  if (typeof value !== 'string' || !value) return undefined

  return games.find(item => item.value === value.toLowerCase())
}

export const findGameMode = (value: any): GameMode | undefined => {
  if (typeof value !== 'string' || !value) return undefined

  return gameModes.find(item => item.value === value.toLowerCase())
}

export const findPieceImageSrc = (pc: string): string => {
  const color = pc === pc.toUpperCase() ? 'w' : 'b'

  const chessPieceNames = chessPieces.map(item => `${item.at(-7)}${item.at(-6)}`)

  const findChessPieceIndex = chessPieceNames.findIndex(item => item === `${color}${pc.toLowerCase()}`)

  return chessPieces[findChessPieceIndex]
}

export const findPieceXiangqiImageSrc = (pc: string): string => {
  const color = pc === pc.toUpperCase() ? 'r' : 'b'

  const chessPieceNames = xiangquiPieces.map(item => `${item.at(-7)}${item.at(-6)}`)

  const findChessPieceIndex = chessPieceNames.findIndex(item => item === `${color}${pc.toLowerCase()}`)

  return xiangquiPieces[findChessPieceIndex]
}
