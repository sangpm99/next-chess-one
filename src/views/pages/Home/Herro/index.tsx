import Image from 'next/image'

import StatCounter from '@views/pages/Home/Herro/StatCounter'

export default function Herro() {
  return (
    <section>
      <div className='grid grid-cols-2'>
        <div className='relative h-[700px] rounded-4xl overflow-hidden'>
          <Image
            src='https://dtthemes.wpenginepowered.com/veedoo/wp-content/uploads/sites/3/2024/02/thumb-slider-img-1.jpg'
            alt='Con mèo'
            fill
            priority
            style={{ objectFit: 'cover' }}
          />
        </div>
        <div className='flex flex-col'>
          <div className='p-15'>
            <p className='heading-subtitle mb-3'>Contemporary Living</p>

            <h2 className='heading-title'>
              Experience the Epitome of Refinement and Grandeur in Every Detail Of Beauty
            </h2>

            <p>
              Vulputate sapien nec sagittis aliquam malesuada bibendum arcu vitae elementum. Turpis egestas pretium
              aenean pharetra magna ac. Blandit massa enim nec dui nunc. Magnis dis parturient montes nascetur ridiculus
              mus mauris. Nunc scelerisque viverra mauris in aliquam sem.
            </p>

            <div className='mt-5'>
              <StatCounter />
            </div>
          </div>

          <div></div>
        </div>
      </div>
    </section>
  )
}
