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
      <path d='m15 18-6-6 6-6' />
    </svg>
  )
}
