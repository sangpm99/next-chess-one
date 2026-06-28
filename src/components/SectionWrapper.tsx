import type { ComponentPropsWithoutRef } from 'react'

import themeConfig from '@configs/themeConfig'

type Props = ComponentPropsWithoutRef<'section'>

export default function SectionWrapper({ children, className, style, ...rest }: Props) {
  return (
    <section
      className={className}
      style={{
        padding: themeConfig.layoutPadding,
        ...style
      }}
      {...rest}
    >
      <div style={{ maxInlineSize: `${themeConfig.compactContentWidth}px`, marginInline: 'auto' }}>{children}</div>
    </section>
  )
}
