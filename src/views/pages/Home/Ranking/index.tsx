import type { ComponentPropsWithoutRef } from 'react'

import Image from 'next/image'

import RankCard from './RankCard'

type Props = ComponentPropsWithoutRef<'div'>

interface RankingItem {
  name: string
  score: number
}

interface Ranking {
  title: string
  items: RankingItem[]
}

const rankings: Ranking[] = [
  {
    title: 'Cờ Vua',
    items: [
      { name: 'Laolao', score: 3456 },
      { name: 'Xinka', score: 3415 },
      { name: 'Cao Thuong Danh', score: 3410 },
      { name: 'Hoang Duoc Su', score: 3150 },
      { name: 'Nguyễn Quốc Trung', score: 3010 }
    ]
  },
  {
    title: 'Cờ Tướng',
    items: [
      { name: 'Nguyễn Đức Nam', score: 3310 },
      { name: 'Đào Hải Yến', score: 3300 },
      { name: 'Muline', score: 3220 },
      { name: 'Khắc Trần', score: 3110 },
      { name: 'Lý Nguyên', score: 2980 }
    ]
  },
  {
    title: 'Cờ Úp',
    items: [
      { name: 'Lê Tổng', score: 3100 },
      { name: 'Hà Tần', score: 2890 },
      { name: 'Pikachu', score: 2870 },
      { name: 'Mộ Dung', score: 2660 },
      { name: 'Hà Nhân', score: 2550 }
    ]
  },
  {
    title: 'Cờ Caro',
    items: [
      { name: 'Nguyễn Dực', score: 4280 },
      { name: 'Hải', score: 4270 },
      { name: 'Như Yên', score: 4120 },
      { name: 'Trọng Sinh', score: 4040 },
      { name: 'Ngọc', score: 4010 }
    ]
  }
]

export default function Ranking({ className, ...rest }: Props) {
  return (
    <div className={`${className}`} {...rest}>
      <h2 className='heading-title text-4xl text-primary font-ink text-center mb-5'>Bảng Xếp Hạng</h2>

      <p className='text-center mb-10 text-lg'>Theo dõi thứ hạng, điểm số và thành tích của các kỳ thủ</p>

      <div className='flex justify-center mb-15'>
        <Image
          src='https://cdn.vietnamexploration.com/vnexploration/2026/06/27174643-47a88227-divider.webp'
          alt='divider'
          priority
          width={259}
          height={8}
          style={{ objectFit: 'cover' }}
        />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10'>
        {rankings.map((r, i) => (
          <RankCard key={i} item={r} className='floating-hover' style={{ border: '1px solid var(--border)' }} />
        ))}
      </div>

      <div className='flex items-center gap-3 justify-center mt-15'>
        <div className='h-0.5 w-[50px] bg-primary opacity-50'></div>
        <div className='text-primary font-bold text-lg'>Tư duy tạo nên kết nối</div>
        <div className='h-0.5 w-[50px] bg-primary opacity-50'></div>
      </div>
    </div>
  )
}
