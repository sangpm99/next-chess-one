'use client'

// Bảng điều khiển ván cờ úp: chọn màu quân + cấp độ máy + bắt đầu ván mới,
// bật/tắt âm thanh, hiện quân úp đã ăn, xin thua. Không có "thế cờ chấp" như
// cờ tướng (cờ úp chỉ có 1 thế khởi đầu).

import { useState } from 'react'

import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'

import { useJieqiStore } from '@/stores/jieqi'

import { LEVEL_LABELS } from '@/lib/jieqi/user-stats'

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
  const newGame = useJieqiStore(s => s.newGame)
  const resign = useJieqiStore(s => s.resign)
  const toggleSound = useJieqiStore(s => s.toggleSound)
  const soundEnabled = useJieqiStore(s => s.soundEnabled)
  const darkViewMode = useJieqiStore(s => s.darkViewMode)
  const setDarkViewMode = useJieqiStore(s => s.setDarkViewMode)
  const gameOver = useJieqiStore(s => s.gameOver)
  const vsEngine = useJieqiStore(s => s.vsEngine)
  const moveLog = useJieqiStore(s => s.moveLog)
  const currentLevel = useJieqiStore(s => s.level)
  const engineError = useJieqiStore(s => s.engineError)
  const ruleWarning = useJieqiStore(s => s.ruleWarning)

  const [side, setSide] = useState<SideChoice>('red')
  const [level, setLevel] = useState(currentLevel)
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

        <label className='flex-1 flex flex-col gap-1 text-xs text-[#5b3a29]'>
          <span>Quân úp đã bị ăn</span>
          <Select
            size='small'
            value={darkViewMode}
            onChange={e => setDarkViewMode(Number(e.target.value) as 1 | 2 | 3)}
          >
            <MenuItem value={1}>Ẩn tất cả</MenuItem>
            <MenuItem value={2}>Chỉ người ăn thấy</MenuItem>
            <MenuItem value={3}>Hiện tất cả</MenuItem>
          </Select>
        </label>

        <Button
          onClick={() => newGame({ side, vsEngine: side !== 'two-player', level })}
          variant='contained'
          className='mt-1'
        >
          Chơi lại
        </Button>

        {engineError && <p className='text-xs text-red-700'>{engineError}</p>}
        {ruleWarning && <p className='text-xs text-red-700'>{ruleWarning}</p>}
      </div>

      <Button
        onClick={() => toggleSound()}
        className='flex-1 rounded-md bg-white border border-[#e3d5bd] text-sm font-medium text-[#5b3a29] hover:bg-[#f5ead7] transition-colors'
      >
        Âm thanh: {soundEnabled ? 'Bật' : 'Tắt'}
      </Button>

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
