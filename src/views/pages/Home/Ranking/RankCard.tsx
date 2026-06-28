import type { ComponentPropsWithoutRef } from 'react'

import RankCardItem from './RankCardItem'

interface RankingItem {
  name: string
  score: number
}

interface Ranking {
  title: string
  items: RankingItem[]
}

interface Props extends ComponentPropsWithoutRef<'div'> {
  item: Ranking
}

export default function RankCard({ item, className, ...rest }: Props) {
  return (
    <div className={`border p-3 rounded shadow ${className}`} {...rest}>
      <div className='text-2xl font-ink mb-3 flex items-center justify-center gap-3'>{item.title}</div>

      <div className='flex flex-col gap-3'>
        {item.items.map((rankingItem, index) => (
          <RankCardItem rankingItem={rankingItem} index={index} key={index} />
        ))}
      </div>
    </div>
  )
}
