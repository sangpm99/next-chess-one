import type { ComponentPropsWithoutRef } from 'react'

interface Props extends ComponentPropsWithoutRef<'svg'> {
  width: number
  height: number
  color?: string
}

export default function UsersGroup({ width, height, color, ...rest }: Props) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={width}
      height={height}
      stroke={color || 'currentColor'}
      viewBox='0 0 24 24'
      fill='none'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      {...rest}
    >
      <path d='M5 20a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z' />
      <path d='m14.5 10 1.5 8' />
      <path d='M7 10h10' />
      <path d='m8 18 1.5-8' />
      <circle cx='12' cy='6' r='4' />
    </svg>
  )
}
