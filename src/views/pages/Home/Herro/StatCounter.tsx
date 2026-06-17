'use client'

import { useRef, useState, useEffect } from 'react'

import { motion, AnimatePresence } from 'framer-motion'

import { useTimeBasedRandom } from '@/hooks/useTimeBasedRandom'

import UsersGroup from '@/assets/icons/UsersGroup'
import Earth from '@/assets/icons/Earth'
import Swords from '@assets/icons/Swords'

interface DigitProps {
  digit: number
  direction: 'up' | 'down'
}

const variants = {
  initial: (dir: 'up' | 'down') => ({
    y: dir === 'up' ? 30 : -30,
    opacity: 0
  }),
  animate: { y: 0, opacity: 1 },
  exit: (dir: 'up' | 'down') => ({
    y: dir === 'up' ? -30 : 30,
    opacity: 0
  })
}

function Digit({ digit, direction }: DigitProps) {
  return (
    <div className='relative h-7 overflow-hidden flex justify-center items-center' style={{ width: '13px' }}>
      <AnimatePresence mode='popLayout' custom={direction}>
        <motion.span
          key={digit}
          custom={direction}
          variants={variants}
          initial='initial'
          animate='animate'
          exit='exit'
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className='absolute select-none'
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </div>
  )
}

export default function StatCounter() {
  const randomNumber = useTimeBasedRandom()

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const prevNumberRef = useRef(randomNumber)
  const directionRef = useRef<'up' | 'down'>('up')

  if (randomNumber !== prevNumberRef.current) {
    directionRef.current = randomNumber > prevNumberRef.current ? 'up' : 'down'
    prevNumberRef.current = randomNumber
  }

  const digits = String(randomNumber).split('').map(Number)

  return (
    <div className='grid grid-cols-3'>
      <div className='flex gap-3 p-3'>
        <div>
          <UsersGroup width={50} height={50} color='var(--mui-palette-primary-main)' />
        </div>

        <div>
          <div className='font-bold text-xl'>150K+</div>

          <div>Kỳ thủ</div>
        </div>
      </div>

      <div className='flex gap-3 p-3'>
        <div>
          <Earth width={50} height={50} color='var(--mui-palette-primary-main)' />
        </div>

        <div>
          {mounted && (
            <div className='flex font-bold text-xl'>
              {digits.map((d, idx) => (
                <Digit key={idx} digit={d} direction={directionRef.current} />
              ))}
            </div>
          )}

          <div>Trực tuyến</div>
        </div>
      </div>

      <div className='flex gap-3 p-3'>
        <div>
          <Swords width={50} height={50} color='var(--mui-palette-primary-main)' />
        </div>

        <div>
          <div className='font-bold text-xl'>5M+</div>

          <div>Số ván đã chơi</div>
        </div>
      </div>
    </div>
  )
}
