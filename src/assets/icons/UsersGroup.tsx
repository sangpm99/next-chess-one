export default function UsersGroup({ width, height, color }: { width: number; height: number; color?: string }) {
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
    >
      <path d='M18 21a8 8 0 0 0-16 0' />
      <circle cx='10' cy='8' r='5' />
      <path d='M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3' />
    </svg>
  )
}
