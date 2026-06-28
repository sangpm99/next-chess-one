import Image from 'next/image'

import styles from './RankCardItem.module.css'

interface RankingItem {
  name: string
  score: number
}

const images = [
  'https://cdn.vietnamexploration.com/vnexploration/2026/06/18103801.rank-1.webp',
  'https://cdn.vietnamexploration.com/vnexploration/2026/06/18103810.rank-2.webp',
  'https://cdn.vietnamexploration.com/vnexploration/2026/06/18103818.rank-3.webp'
]

export default function RankCardItem({ rankingItem, index }: { rankingItem: RankingItem; index: number }) {
  return (
    <div
      key={index}
      className={`flex items-center gap-2 p-2 border rounded min-h-[55px] ${index < 3 && styles.shine} ${index === 1 ? styles['shine-2'] : index === 2 ? styles['shine-3'] : ''}`}
      style={{
        background:
          index === 0
            ? 'linear-gradient(to bottom, #fdeed0 0%, #fdeed0 50%, #f3deb4 75%, #f3deb4 100%)'
            : index === 1
              ? 'linear-gradient(to bottom, #eff0ee 0%, #eff0ee 50%, #e0e1df 75%, #e0e1df 100%)'
              : index === 2
                ? 'linear-gradient(to bottom, #f9e0ca 0%, #f9e0ca 50%, #f3d2b4 75%, #f3d2b4 100%)'
                : '#ecded1'
      }}
    >
      <div className='shrink-0'>
        {index < 3 && <Image src={images[index]} alt='Ranking image' priority width={20} height={25} />}

        {index >= 3 && (
          <div className='flex relative justify-center items-center'>
            <Image
              src='https://cdn.vietnamexploration.com/vnexploration/2026/06/18102927.rank.webp'
              alt='Ranking image'
              priority
              width={20}
              height={20}
            />

            <span className='absolute text-[70%] text-primary font-bold'>{index + 1}</span>
          </div>
        )}
      </div>

      <div className='flex-1 border-s px-2 font-bold'>{rankingItem.name}</div>

      <div className='shrink-0 text-end'>{rankingItem.score}</div>
    </div>
  )
}
