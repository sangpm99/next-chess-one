import { useState, useEffect } from 'react'

const getRandomRange = (hour: number): { min: number; max: number } => {
  if (hour >= 10 && hour < 14) return { min: 110, max: 130 }
  if (hour >= 14 && hour < 18) return { min: 270, max: 290 }
  if (hour >= 18 && hour < 20) return { min: 500, max: 550 }
  if (hour >= 20 && hour < 23) return { min: 380, max: 400 }

  return { min: 100, max: 120 }
}

const generateRandomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export const useTimeBasedRandom = (intervalMs: number = 3000): number => {
  const [randomNumber, setRandomNumber] = useState<number>(() => {
    const currentHour = new Date().getHours()
    const { min, max } = getRandomRange(currentHour)

    return generateRandomNumber(min, max)
  })

  useEffect(() => {
    const updateNumber = () => {
      const currentHour = new Date().getHours()
      const { min, max } = getRandomRange(currentHour)
      const newRandom = generateRandomNumber(min, max)

      setRandomNumber(newRandom)
    }

    const intervalId = setInterval(updateNumber, intervalMs)

    return () => clearInterval(intervalId)
  }, [intervalMs])

  return randomNumber
}
