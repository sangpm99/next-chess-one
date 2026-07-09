'use client'

// Bảng điều khiển: chọn màu quân + cấp độ máy + bắt đầu ván mới,
// lật bàn cờ, bật/tắt âm thanh, xin thua.

import { useState } from 'react'

import { useChessStore } from '@/stores/chess'

import { LEVEL_LABELS } from '@/lib/chess/user-stats'

type SideChoice = 'white' | 'black' | 'two-player'

export default function GameControls() {
  const newGame = useChessStore(s => s.newGame)
  const resign = useChessStore(s => s.resign)
  const toggleFlipped = useChessStore(s => s.toggleFlipped)
  const toggleSound = useChessStore(s => s.toggleSound)
  const soundEnabled = useChessStore(s => s.soundEnabled)
  const gameOver = useChessStore(s => s.gameOver)
  const vsEngine = useChessStore(s => s.vsEngine)
  const moveLog = useChessStore(s => s.moveLog)
  const currentLevel = useChessStore(s => s.level)
  const engineError = useChessStore(s => s.engineError)

  const [side, setSide] = useState<SideChoice>('white')
  const [level, setLevel] = useState(currentLevel)

  return (
    <div className='flex flex-col gap-3 w-full max-w-[560px]'>
      <div className='bg-[#fdf6ec] rounded-lg border border-[#e3d5bd] p-3 flex flex-col gap-2'>
        <p className='text-sm font-semibold text-[#5b3a29]'>Ván mới</p>
        <div className='flex gap-2'>
          <SideButton label='Cầm Trắng' active={side === 'white'} onClick={() => setSide('white')} />
          <SideButton label='Cầm Đen' active={side === 'black'} onClick={() => setSide('black')} />
          <SideButton label='2 người' active={side === 'two-player'} onClick={() => setSide('two-player')} />
        </div>

        {side !== 'two-player' && (
          <label className='flex flex-col gap-1 text-xs text-[#5b3a29]'>
            Cấp độ máy:{' '}
            <span className='font-semibold'>
              Lv {level} - {LEVEL_LABELS[level]}
            </span>
            <input
              type='range'
              min={1}
              max={10}
              step={1}
              value={level}
              onChange={e => setLevel(Number(e.target.value))}
              className='accent-[#5b3a29]'
            />
          </label>
        )}

        <button
          type='button'
          onClick={() => newGame({ side, vsEngine: side !== 'two-player', level })}
          className='mt-1 px-3 py-2 rounded-md bg-[#5b3a29] text-white text-sm font-semibold hover:bg-[#4a2f21] transition-colors'
        >
          Bắt đầu
        </button>

        {engineError && <p className='text-xs text-red-700'>{engineError}</p>}
      </div>

      <div className='flex gap-2'>
        {/*<button*/}
        {/*  type='button'*/}
        {/*  onClick={() => toggleFlipped()}*/}
        {/*  className='flex-1 px-3 py-2 rounded-md bg-white border border-[#e3d5bd] text-sm font-medium text-[#5b3a29] hover:bg-[#f5ead7] transition-colors'*/}
        {/*>*/}
        {/*  Lật bàn cờ*/}
        {/*</button>*/}
        <button
          type='button'
          onClick={() => toggleSound()}
          className='flex-1 px-3 py-2 rounded-md bg-white border border-[#e3d5bd] text-sm font-medium text-[#5b3a29] hover:bg-[#f5ead7] transition-colors'
        >
          Âm thanh: {soundEnabled ? 'Bật' : 'Tắt'}
        </button>
      </div>

      <button
        type='button'
        disabled={gameOver || !vsEngine || moveLog.length === 0}
        onClick={() => resign()}
        className='w-full px-3 py-2 rounded-md bg-white border border-[#e3d5bd] text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
      >
        Xin thua
      </button>
    </div>
  )
}

function SideButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium border transition-colors text-nowrap ${
        active
          ? 'bg-[#5b3a29] text-white border-[#5b3a29]'
          : 'bg-white text-[#5b3a29] border-[#e3d5bd] hover:bg-[#f5ead7]'
      }`}
    >
      {label}
    </button>
  )
}
