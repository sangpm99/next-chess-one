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
    value: 'gomuku',
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
