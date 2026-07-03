'use client'

import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

import { useRouter } from 'next/navigation'

import Image from 'next/image'

import Box from '@mui/material/Box'
import Radio from '@mui/material/Radio'
import Button from '@mui/material/Button'
import RadioGroup from '@mui/material/RadioGroup'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import Typography from '@mui/material/Typography'

import { games, gameModes } from '@/enums'

import type { Game } from '@/types'

import styles from './Play.module.css'

export default function Play() {
  const [selectedGame, setSelectedGame] = useState<string>(games[0].value)
  const [selectedMode, setSelectedMode] = useState<string>(gameModes[0].value)
  const [isLogin, setIsLogin] = useState(false)

  const router = useRouter()

  const onChangeGame = (game: Game): void => {
    if (selectedGame !== game.value) {
      setSelectedMode(gameModes[0].value)
      setSelectedGame(game.value)
    }
  }

  const handleRadioChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedMode((event.target as HTMLInputElement).value)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    router.push(`/play/${selectedGame}/${selectedMode}`)
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 min-h-full`}>
      {games.map((item: Game, index: number) => (
        <div key={index} className='relative cursor-pointer' onClick={() => onChangeGame(item)}>
          <Image
            src={item.background}
            alt='Games'
            width={407}
            height={390}
            className='w-full h-full'
            priority
            style={{ objectFit: 'cover' }}
          />

          <div
            className={`absolute top-0 left-0 right-0 bottom-0 ${styles.overlay} ${selectedGame === item.value ? 'block' : 'hidden'}`}
          ></div>

          {selectedGame === item.value && (
            <>
              <div className='absolute top-0 left-0 right-0 bottom-0 flex flex-col justify-center p-5 sm:p-10 xl:p-20'>
                <Typography variant='h2' className='text-primary fall-down font-ink'>
                  {item.title}
                </Typography>
                <Typography className='my-3 fall-left'>{item.description}</Typography>

                <Box component='form' onSubmit={handleSubmit}>
                  <FormControl className='items-start'>
                    <RadioGroup aria-label='quiz' name='quiz' value={selectedMode} onChange={handleRadioChange}>
                      {gameModes.map(item => (
                        <FormControlLabel
                          className='fall-left'
                          key={item.value}
                          value={item.value}
                          control={<Radio />}
                          label={`${item.title} ${item.isAuth && !isLogin ? '(cần đăng nhập)' : ''}`}
                          disabled={item.isAuth && !isLogin}
                        />
                      ))}
                    </RadioGroup>
                    <Button type='submit' variant='contained' className='mbs-3 fall-up'>
                      Xác nhận
                    </Button>
                  </FormControl>
                </Box>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}
