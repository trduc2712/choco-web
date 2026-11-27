import type { ComponentProps } from 'react'
import { useState } from 'react'

import { Icon } from '@/components/icon/icon'
import { cx } from '@/lib/cx'

export type ImageFit = 'cover' | 'contain'

export type ImageProps = Omit<ComponentProps<'img'>, 'alt'> & {
  alt: string
  ratio?: number
  fit?: ImageFit
  isRounded?: boolean
}

export function Image({
  src,
  alt,
  ratio,
  fit = 'cover',
  isRounded = false,
  loading = 'lazy',
  decoding = 'async',
  className,
  style,
  onLoad,
  onError,
  ...props
}: ImageProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'failed'>(
    'loading',
  )
  const [currentSrc, setCurrentSrc] = useState(src)

  if (src !== currentSrc) {
    setCurrentSrc(src)
    setStatus('loading')
  }

  return (
    <span
      className={cx(
        'image-root',
        isRounded && 'image-rounded',
        status === 'loading' && 'image-loading',
        className,
      )}
      style={{ ...style, aspectRatio: ratio }}
    >
      {status === 'failed' ? (
        <span className="image-fallback" role="img" aria-label={alt}>
          <Icon name="image" size="lg" />
        </span>
      ) : (
        <img
          {...props}
          className={cx('image-image', `image-${fit}`)}
          src={src}
          alt={alt}
          loading={loading}
          decoding={decoding}
          onLoad={(event) => {
            setStatus('loaded')
            onLoad?.(event)
          }}
          onError={(event) => {
            setStatus('failed')
            onError?.(event)
          }}
        />
      )}
    </span>
  )
}
