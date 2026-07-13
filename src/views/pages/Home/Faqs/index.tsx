import Image from 'next/image'

import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'

export default function Faqs() {
  return (
    <div className='flex flex-col xl:flex-row min-h-[520px]'>
      <div className='flex-1 relative flex gap-2 mb-2 pe-0 sm:pe-10 xl:justify-end border-0 xl:border-r border-dashed border-primary'>
        <Image
          src='https://cdn.vietnamexploration.com/vnexploration/2026/07/12141344-3e068531-faqs.webp'
          alt='faqs'
          width={500}
          height={333}
          className='shadow rounded relative sm:absolute sm:left-10 xl:left-auto xl:right-40 sm:top-10 w-full sm:w-[500px]'
          style={{
            objectFit: 'cover'
          }}
        />

        <div className='bg-[#FFDA6B] p-10 pt-100 w-[450px] rounded hidden sm:block'>
          <p className='font-bold font-ink text-3xl mb-5'>Chiến thuật tạo nên khác biệt</p>
          <p>
            Từng nước cờ đều phản ánh tư duy và bản lĩnh của người chơi. Chinh phục thử thách, tích lũy kinh nghiệm và
            vươn lên vị trí dẫn đầu.
          </p>
        </div>
      </div>

      <div className='flex-1 xl:ps-10'>
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

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />} aria-controls='panel1a-content'>
            <p className='mb-0 text-lg'>Có cần đăng ký tài khoản để chơi không?</p>
          </AccordionSummary>
          <AccordionDetails>
            <p className='mb-0'>
              Có. Việc đăng ký tài khoản giúp bạn lưu lịch sử thi đấu, theo dõi thành tích, tích lũy điểm xếp hạng và
              tham gia đầy đủ các tính năng của <b>ChessONE</b>. Quá trình đăng ký diễn ra nhanh chóng và hoàn toàn miễn
              phí.
            </p>
          </AccordionDetails>
        </Accordion>
      </div>
    </div>
  )
}
