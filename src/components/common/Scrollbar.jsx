'use client'

import { forwardRef } from 'react'

const Scrollbar = forwardRef(function Scrollbar(
  { children, className = '', style, options = {}, onScroll, onScrollY, ...rest },
  ref
) {
  const handleScroll = event => {
    onScroll?.(event)

    if (onScrollY) {
      onScrollY(event.currentTarget)
    }
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        overflowY: options.suppressScrollY ? 'hidden' : 'auto',
        overflowX: options.suppressScrollX ? 'hidden' : 'auto',
        WebkitOverflowScrolling: 'touch',
        ...style
      }}
      onScroll={handleScroll}
      {...rest}
    >
      {children}
    </div>
  )
})

export default Scrollbar
