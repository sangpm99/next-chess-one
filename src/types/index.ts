export interface Selection {
  title: string
  value: string
}

export interface Game extends Selection {
  image: string
  description: string
  background: string
}

export interface GameMode extends Selection {
  description: string
  isAuth: boolean
}
