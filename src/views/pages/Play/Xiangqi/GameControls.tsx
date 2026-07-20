'use client'

// Bảng điều khiển ván cờ tướng: chọn màu quân + cấp độ máy + thế cờ chấp +
// bắt đầu ván mới, bật/tắt âm thanh, xin thua. Bố cục và style bám theo
// GameControls của bản cờ vua.

import { useState } from 'react'

import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'

import { useXiangqiStore } from '@/stores/xiangqi'

import { LEVEL_LABELS } from '@/lib/xiangqi/user-stats'
import { HANDICAP_LABELS } from '@/lib/xiangqi/constants'

import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'

type SideChoice = 'red' | 'black' | 'two-player'

function SideButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <Button onClick={onClick} variant={active ? 'contained' : 'outlined'} className='text-nowrap cursor-pointer'>
      {label}
    </Button>
  )
}

export default function GameControls() {
  const newGame = useXiangqiStore(s => s.newGame)
  const resign = useXiangqiStore(s => s.resign)
  const toggleSound = useXiangqiStore(s => s.toggleSound)
  const soundEnabled = useXiangqiStore(s => s.soundEnabled)
  const gameOver = useXiangqiStore(s => s.gameOver)
  const vsEngine = useXiangqiStore(s => s.vsEngine)
  const moveLog = useXiangqiStore(s => s.moveLog)
  const currentLevel = useXiangqiStore(s => s.level)
  const engineError = useXiangqiStore(s => s.engineError)

  const [side, setSide] = useState<SideChoice>('red')
  const [level, setLevel] = useState(currentLevel)
  const [handicap, setHandicap] = useState(0)
  const [isDialogVisible, setIsDialogVisible] = useState(false)

  const handleConfirmation = (confirm: boolean) => {
    if (confirm) {
      resign()
    }
  }

  return (
    <div className='flex flex-col gap-3 w-full max-w-[560px]'>
      <div className='bg-lighter border-lighter rounded-lg p-3 flex flex-col gap-2'>
        <p className='text-sm font-semibold text-primary'>CHỌN QUÂN CỜ</p>
        <div className='flex gap-2'>
          <SideButton label='Cầm Đỏ' active={side === 'red'} onClick={() => setSide('red')} />
          <SideButton label='Cầm Đen' active={side === 'black'} onClick={() => setSide('black')} />
          {/*<SideButton label='2 người' active={side === 'two-player'} onClick={() => setSide('two-player')} />*/}
        </div>

        {side !== 'two-player' && (
          <label className='flex flex-col gap-1 text-xs text-[#5b3a29]'>
            <span>
              Cấp độ máy:{' '}
              <span className='font-semibold'>
                Lv {level} - {LEVEL_LABELS[level]}
              </span>
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

        {/*<label className='flex flex-col gap-1 text-xs text-[#5b3a29]'>*/}
        {/*  <span>Thế cờ chấp (bên Đỏ bị bớt quân)</span>*/}
        {/*  <Select size='small' value={handicap} onChange={e => setHandicap(Number(e.target.value))}>*/}
        {/*    {HANDICAP_LABELS.map((label, idx) => (*/}
        {/*      <MenuItem key={idx} value={idx}>*/}
        {/*        {label}*/}
        {/*      </MenuItem>*/}
        {/*    ))}*/}
        {/*  </Select>*/}
        {/*</label>*/}

        <Button
          onClick={() => newGame({ side, vsEngine: side !== 'two-player', level, handicap })}
          variant='contained'
          className='mt-1'
        >
          Chơi lại
        </Button>

        {engineError && <p className='text-xs text-red-700'>{engineError}</p>}
      </div>

      <div className='flex gap-2'>
        <Button
          onClick={() => toggleSound()}
          className='flex-1 rounded-md bg-white border border-[#e3d5bd] text-sm font-medium text-[#5b3a29] hover:bg-[#f5ead7] transition-colors'
        >
          Âm thanh: {soundEnabled ? 'Bật' : 'Tắt'}
        </Button>
      </div>

      <Button
        disabled={gameOver || !vsEngine || moveLog.length === 0}
        onClick={() => setIsDialogVisible(true)}
        className='w-full rounded-md bg-white border border-[#e3d5bd] text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
      >
        Xin thua
      </Button>

      <ConfirmationDialog
        isDialogVisible={isDialogVisible}
        setDialogVisible={setIsDialogVisible}
        confirmationQuestion='Bạn có chắc chắn muốn đầu hàng?'
        confirm={handleConfirmation}
      />
    </div>
  )
}
