import type { GameMode, Game, Selection } from '@/types'

export const games: Game[] = [
  {
    title: 'Cờ Vua',
    value: 'chess',
    image: 'https://cdn.vietnamexploration.com/vnexploration/2026/06/15093807.co-vua.webp',
    description:
      'Môn cờ chiến thuật kinh điển nơi mỗi nước đi đều quyết định cục diện. Thử thách tư duy, rèn luyện khả năng tính toán và chinh phục đối thủ bằng chiến lược sắc bén.',
    background: 'https://cdn.vietnamexploration.com/vnexploration/2026/07/01160944-2664a18a-co-vua-3.webp'
  },
  {
    title: 'Cờ Tướng',
    value: 'xiangqi',
    image: 'https://cdn.vietnamexploration.com/vnexploration/2026/06/15093826.co-tuong.webp',
    description:
      'Đắm mình trong nghệ thuật điều binh khiển tướng của phương Đông. Vận dụng chiến thuật linh hoạt, kiểm soát thế trận và giành chiến thắng.',
    background: 'https://cdn.vietnamexploration.com/vnexploration/2026/07/01161103-f4912a75-co-tuong-3.webp'
  },
  {
    title: 'Cờ Úp',
    value: 'jieqi',
    image: 'https://cdn.vietnamexploration.com/vnexploration/2026/06/15093856.co-up.webp',
    description:
      'Biến thể đầy bất ngờ với các quân cờ được giấu kín khi bắt đầu ván đấu. Khả năng ứng biến, phán đoán và tận dụng thời cơ để chiến thắng.',
    background: 'https://cdn.vietnamexploration.com/vnexploration/2026/07/01161047-95f59dfc-co-up-3.webp'
  },
  {
    title: 'Cờ Caro',
    value: 'gomoku',
    image: 'https://cdn.vietnamexploration.com/vnexploration/2026/06/15093911.gomuku.webp',
    description:
      'Luật chơi đơn giản nhưng đầy tính cạnh tranh. Sắp xếp năm quân liên tiếp, dự đoán ý đồ đối thủ và tận hưởng những trận đấu nhanh và hấp dẫn.',
    background: 'https://cdn.vietnamexploration.com/vnexploration/2026/07/01161112-24f9f418-gomuku-3.webp'
  }
]

export const gameModes: GameMode[] = [
  {
    title: 'Đấu với máy',
    value: 'ai',
    description: 'Thử thách bản thân với máy tính ở nhiều mức độ khó khác nhau',
    isAuth: false
  },
  {
    title: 'Đấu thường',
    value: 'casual',
    description: 'Chơi giao hữu cùng bạn bè hoặc người chơi khác, không ảnh hưởng đến hạng',
    isAuth: true
  },
  {
    title: 'Đấu hạng',
    value: 'ranked',
    description: 'Thi đấu xếp hạng, thắng thua ảnh hưởng đến điểm hạng của bạn',
    isAuth: true
  },
  {
    title: 'Tùy chỉnh',
    value: 'custom',
    description: 'Tự thiết lập luật chơi, thời gian và các tùy chọn theo ý muốn',
    isAuth: true
  }
]

export const statuses: Selection[] = [
  { title: 'Gần đây', value: 'completed' },
  { title: 'Đang chơi', value: 'in-progress' },
  { title: 'Đang chờ', value: 'waiting' }
]

export const machineLevels = [
  'https://cdn.vietnamexploration.com/vnexploration/2026/07/11110149-89a538d5-ai-1.webp',
  'https://cdn.vietnamexploration.com/vnexploration/2026/07/11110200-cdcf276c-ai-2.webp',
  'https://cdn.vietnamexploration.com/vnexploration/2026/07/11110211-19dbad1c-ai-3.webp',
  'https://cdn.vietnamexploration.com/vnexploration/2026/07/11110225-19d639b2-ai-4.webp',
  'https://cdn.vietnamexploration.com/vnexploration/2026/07/11110238-87ac03d2-ai-5.webp',
  'https://cdn.vietnamexploration.com/vnexploration/2026/07/11110249-0220d5c2-ai-6.webp',
  'https://cdn.vietnamexploration.com/vnexploration/2026/07/11110259-e3102593-ai-7.webp',
  'https://cdn.vietnamexploration.com/vnexploration/2026/07/11110316-13f749b5-ai-8.webp',
  'https://cdn.vietnamexploration.com/vnexploration/2026/07/11110325-51d41ecd-ai-9.webp',
  'https://cdn.vietnamexploration.com/vnexploration/2026/07/11110337-845b6968-ai-10.webp'
]

export const chessPieces: string[] = [
  'https://cdn.vietnamexploration.com/vnexploration/2026/07/08142845-966515f7-wr.webp',
  'https://cdn.vietnamexploration.com/vnexploration/2026/07/08142948-71c5fd3f-wq.webp',
  'https://cdn.vietnamexploration.com/vnexploration/2026/07/08142956-4a3c9849-wp.webp',
  'https://cdn.vietnamexploration.com/vnexploration/2026/07/08143003-665c1977-wn.webp',
  'https://cdn.vietnamexploration.com/vnexploration/2026/07/08143016-57e61393-wk.webp',
  'https://cdn.vietnamexploration.com/vnexploration/2026/07/08143023-0d63d52d-wb.webp',
  'https://cdn.vietnamexploration.com/vnexploration/2026/07/08143031-76461741-br.webp',
  'https://cdn.vietnamexploration.com/vnexploration/2026/07/08143037-4996bf41-bq.webp',
  'https://cdn.vietnamexploration.com/vnexploration/2026/07/08143044-cfedda07-bp.webp',
  'https://cdn.vietnamexploration.com/vnexploration/2026/07/08143050-6ae5340d-bn.webp',
  'https://cdn.vietnamexploration.com/vnexploration/2026/07/08143059-ed9b886e-bk.webp',
  'https://cdn.vietnamexploration.com/vnexploration/2026/07/08143106-a59c1999-bb.webp'
]

export const xiangquiPieces: string[] = [
  'https://cdn.vietnamexploration.com/vnexploration/2026/07/11155308-3c781962-ba.webp',
  'https://cdn.vietnamexploration.com/vnexploration/2026/07/11155325-bd6f085f-bb.webp',
  'https://cdn.vietnamexploration.com/vnexploration/2026/07/11155340-edd10f77-bc.webp',
  'https://cdn.vietnamexploration.com/vnexploration/2026/07/11155353-1d36220f-bk.webp',
  'https://cdn.vietnamexploration.com/vnexploration/2026/07/11155404-d1bce525-bn.webp',
  'https://cdn.vietnamexploration.com/vnexploration/2026/07/11155416-8b1565b9-bp.webp',
  'https://cdn.vietnamexploration.com/vnexploration/2026/07/11155428-2f947d4e-br.webp',
  'https://cdn.vietnamexploration.com/vnexploration/2026/07/11155439-745dd4aa-ra.webp',
  'https://cdn.vietnamexploration.com/vnexploration/2026/07/11155451-f6ac5e2c-rb.webp',
  'https://cdn.vietnamexploration.com/vnexploration/2026/07/11155502-3aeb38ed-rc.webp',
  'https://cdn.vietnamexploration.com/vnexploration/2026/07/11155512-27fd9eb2-rk.webp',
  'https://cdn.vietnamexploration.com/vnexploration/2026/07/11155523-2575ef6d-rn.webp',
  'https://cdn.vietnamexploration.com/vnexploration/2026/07/11155532-491119ea-rp.webp',
  'https://cdn.vietnamexploration.com/vnexploration/2026/07/11155541-ef457e58-rr.webp'
]
