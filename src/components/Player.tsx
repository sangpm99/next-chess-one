'use client'

import CustomAvatar from '@core/components/mui/Avatar'
import { machineLevels } from '@/enums'

interface Props {
  currentLevel: number
  isCompetitor: boolean
  score: number
  capturedLogs?: string[]
}

export default function Player({ currentLevel, isCompetitor, score, capturedLogs }: Props) {
  return (
    <div
      className={`flex gap-2 items-center bg-(--bg-lighter) rounded-lg border p-3 border-(--border-lighter) ${isCompetitor ? 'flex-row' : 'flex-row-reverse'}`}
      style={{
        width: 'min(90vw, 504px)',
        backgroundImage: 'url(https://cdn.vietnamexploration.com/vnexploration/2026/06/27183346-7bd34746-bg-11.webp)',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover'
      }}
    >
      <div></div>

      <div
        className={`flex-1 min-w-0 self-stretch flex flex-wrap content-end items-end ${isCompetitor ? 'justify-end' : ''}`}
      >
        {capturedLogs &&
          capturedLogs?.length > 0 &&
          capturedLogs.map((src, index) => (
            <img key={index} src={src} width={26} height={26} alt='' draggable={false} />
          ))}
      </div>

      <div className={`flex gap-2 ${isCompetitor ? 'flex-row' : 'flex-row-reverse'}`}>
        <div>
          <div className={`font-ink truncate w-full mb-1 text-xl ${isCompetitor ? 'text-end' : 'text-start'}`}>
            {isCompetitor ? 'Máy' : 'Tôi'}
          </div>
          <div className='flex gap-1 items-center bg-black/20 text-white py-1 px-2' style={{ borderRadius: '5px' }}>
            <i className='ri-star-fill w-[18px] text-warning'></i>
            <div>{score}</div>
          </div>
        </div>

        <CustomAvatar
          src={
            isCompetitor
              ? machineLevels[currentLevel - 1]
              : 'https://cdn.vietnamexploration.com/vnexploration/2026/07/11110359-e9ae623f-man-1.webp'
          }
          alt='Machine'
          size={60}
        />
      </div>
    </div>
  )
}
