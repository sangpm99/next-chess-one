import SectionWrapper from '@/components/SectionWrapper'
import Herro from './Herro'
import Ranking from './Ranking'
import Matches from './Matches'
import Faqs from './Faqs'

export default function Home() {
  return (
    <div>
      <SectionWrapper>
        <Herro />
      </SectionWrapper>

      <div className='h-20 hidden lg:block'></div>

      <SectionWrapper className='bg-(--bg-dark) py-15 relative'>
        <div
          className='absolute top-0 left-0 w-full h-full z-1'
          style={{
            backgroundImage:
              'url(https://cdn.vietnamexploration.com/vnexploration/2026/06/27183346-7bd34746-bg-11.webp)',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover'
          }}
        ></div>
        <Ranking className='relative z-2' />
      </SectionWrapper>

      <SectionWrapper>
        <Matches />
      </SectionWrapper>

      <SectionWrapper className='bg-(--bg-dark) py-15 relative -mb-[24px]'>
        <Faqs />
      </SectionWrapper>
    </div>
  )
}
