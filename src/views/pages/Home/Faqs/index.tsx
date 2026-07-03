import Image from 'next/image'

import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'

export default function Faqs() {
  return (
    <div className='flex flex-col xl:flex-row min-h-[520px]'>
      <div className='flex-1 relative flex gap-2 mb-2'>
        <Image
          src='https://cdn.vietnamexploration.com/vnexploration/2026/07/01083402-00bcde8a-faqs-3.webp'
          alt='faqs'
          width={407}
          height={390}
          className='shadow relative z-2 rounded w-full md:w-[407px] h-auto md:h-[390px]'
        />

        <Image
          src='https://cdn.vietnamexploration.com/vnexploration/2026/07/01083345-0640bdbf-fqas-2.webp'
          alt='faqs'
          width={407}
          height={390}
          className='shadow relative rounded xl:absolute xl:top-[50px] xl:left-[300px] z-3 hidden md:block'
          style={{
            objectFit: 'cover'
          }}
        />

        <Image
          src='https://cdn.vietnamexploration.com/vnexploration/2026/06/29162451-c213be32-fqas.webp'
          alt='faqs'
          width={407}
          height={390}
          className='shadow relative rounded xl:absolute xl:top-[150px] xl:left-[150px] z-1 hidden xl:block'
          style={{
            objectFit: 'cover'
          }}
        />
      </div>

      <div className='flex-1'>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />} aria-controls='panel1a-content'>
            <p className='mb-0 text-lg'>
              <b>ChessONE</b> là gì?
            </p>
          </AccordionSummary>
          <AccordionDetails>
            <p className='mb-0'>
              <b>ChessONE</b> là website chơi cờ vua, cờ tướng, cờ úp, cờ caro online cho người chơi Việt. Bạn có thể
              vào bàn cờ chơi với bạn hoặc chơi cờ với máy khi muốn luyện nhanh. Website hỗ trợ xếp hạng, ghép bàn theo
              điểm số, xem trận đấu trực tiếp, lưu ván đã kết thúc và danh sách cờ thế để luyện các thế cờ khó.
            </p>
          </AccordionDetails>
        </Accordion>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />} aria-controls='panel1a-content'>
            <p className='mb-0 text-lg'>
              Chơi cờ online trên <b>ChessONE</b> như thế nào?
            </p>
          </AccordionSummary>
          <AccordionDetails>
            <p className='mb-0'>
              Chọn cờ muốn chơi, bấm nút chơi và hệ thống sẽ đưa bạn vào bàn phù hợp. Người mới có thể chơi với bạn qua
              bàn riêng hoặc mở trang chơi với máy để luyện vài nước trước khi đấu online.
            </p>
          </AccordionDetails>
        </Accordion>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />} aria-controls='panel1a-content'>
            <p className='mb-0 text-lg'>Có thể xem trận đấu và bảng xếp hạng không?</p>
          </AccordionSummary>
          <AccordionDetails>
            <p className='mb-0'>
              Có. Trang chủ hiển thị bàn đang chơi, bàn đang chờ, gần đây, bảng xếp hạng và cờ thế trong ngày để người
              chơi theo dõi hoạt động trước khi vào bàn.
            </p>
          </AccordionDetails>
        </Accordion>
      </div>
    </div>
  )
}
