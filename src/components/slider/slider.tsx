import type { CSSProperties } from 'react'
import { useId } from 'react'

import { useControllableState } from '@/hooks/use-controllable-state'
import { cx } from '@/lib/cx'

import styles from './slider.module.scss'

type SliderBaseProps = {
  label: string
  min?: number
  max?: number
  step?: number
  hint?: string
  isDisabled?: boolean
  isValueShown?: boolean
  formatValue?: (value: number) => string
  name?: string
  className?: string
}

export type SliderProps = SliderBaseProps & {
  value?: number
  defaultValue?: number
  onChange?: (value: number) => void
}

export type RangeSliderProps = SliderBaseProps & {
  value?: [number, number]
  defaultValue?: [number, number]
  onChange?: (value: [number, number]) => void
  thumbLabels?: [string, string]
}

function percent(value: number, min: number, max: number) {
  return ((value - min) / (max - min)) * 100
}

type TrackStyle = CSSProperties & {
  '--slider-start': string
  '--slider-end': string
}

export function Slider({
  label,
  min = 0,
  max = 100,
  step = 1,
  hint,
  isDisabled = false,
  isValueShown = true,
  formatValue = String,
  name,
  value: valueProp,
  defaultValue = min,
  onChange,
  className,
}: SliderProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange,
  })
  const style: TrackStyle = {
    '--slider-start': '0%',
    '--slider-end': `${percent(value, min, max)}%`,
  }

  return (
    <div className={cx(styles.root, isDisabled && styles.disabled, className)}>
      <div className={styles.header}>
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
        {isValueShown && (
          <output className={styles.value} htmlFor={id}>
            {formatValue(value)}
          </output>
        )}
      </div>
      <div className={styles.track} style={style}>
        <input
          id={id}
          className={styles.input}
          type="range"
          name={name}
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={isDisabled}
          aria-valuetext={formatValue(value)}
          aria-describedby={hint ? hintId : undefined}
          onChange={(event) => setValue(Number(event.target.value))}
        />
      </div>
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
    </div>
  )
}

export function RangeSlider({
  label,
  min = 0,
  max = 100,
  step = 1,
  hint,
  isDisabled = false,
  isValueShown = true,
  formatValue = String,
  name,
  value: valueProp,
  defaultValue = [min, max],
  onChange,
  thumbLabels,
  className,
}: RangeSliderProps) {
  const id = useId()
  const labelId = `${id}-label`
  const hintId = `${id}-hint`
  const [value, setValue] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange,
  })
  const [start, end] = value
  const style: TrackStyle = {
    '--slider-start': `${percent(start, min, max)}%`,
    '--slider-end': `${percent(end, min, max)}%`,
  }
  const display = `${formatValue(start)} – ${formatValue(end)}`

  return (
    <div
      className={cx(styles.root, isDisabled && styles.disabled, className)}
      role="group"
      aria-labelledby={labelId}
      aria-describedby={hint ? hintId : undefined}
    >
      <div className={styles.header}>
        <span id={labelId} className={styles.label}>
          {label}
        </span>
        {isValueShown && <output className={styles.value}>{display}</output>}
      </div>
      <div className={cx(styles.track, styles.range)} style={style}>
        {([0, 1] as const).map((thumb) => (
          <input
            key={thumb}
            className={styles.input}
            type="range"
            name={name ? `${name}-${thumb === 0 ? 'min' : 'max'}` : undefined}
            min={min}
            max={max}
            step={step}
            value={value[thumb]}
            disabled={isDisabled}
            aria-label={
              thumbLabels?.[thumb] ?? `${label} ${thumb === 0 ? 'min' : 'max'}`
            }
            aria-valuetext={formatValue(value[thumb])}
            onChange={(event) => {
              const next = Number(event.target.value)
              setValue(
                thumb === 0
                  ? [Math.min(next, end), end]
                  : [start, Math.max(next, start)],
              )
            }}
          />
        ))}
      </div>
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
    </div>
  )
}
