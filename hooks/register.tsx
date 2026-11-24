import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

// The backdrop scene name. The theme names it; the Backdrop hook draws it.
const SCENE = 'context-tide'

// The live fill level, 0..100, held in session state so the Backdrop
// re-renders whenever session.measure writes a new value.
const pct = atom({ plugin: 'context-tide', key: 'pct' } as const, 0)

// Build the backdrop SVG for a given fill percent. Pure vector, translucent
// so the conversation stays readable, with a slow drifting waterline.
function scene(raw: number): string {
  const p = Math.max(0, Math.min(100, Math.round(raw)))
  const VBW = 1200
  const VBH = 800
  const waterY = Math.round(VBH * (1 - p / 100))

  // Calm blue below 60, amber to 85, red above: a quiet pressure signal.
  let fill = '#2f6f9f'
  let crest = '#5aa0cf'
  if (p >= 85) {
    fill = '#c0392b'
    crest = '#e06a5c'
  } else if (p >= 60) {
    fill = '#c88a2a'
    crest = '#e3b45f'
  }

  // A wave top spanning twice the viewBox so a -1200 drift loops seamlessly.
  const A = 14
  const W = 2400
  let top = `M 0 ${waterY}`
  let up = true
  for (let x = 0; x < W; x += 300) {
    const cx = x + 150
    const cy = waterY + (up ? -A : A)
    top += ` Q ${cx} ${cy} ${x + 300} ${waterY}`
    up = !up
  }
  const body = `${top} L ${W} ${VBH} L 0 ${VBH} Z`

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VBW} ${VBH}" preserveAspectRatio="xMidYMid slice">` +
    `<style>` +
    `.tide{animation:drift 16s linear infinite}` +
    `@keyframes drift{from{transform:translateX(0)}to{transform:translateX(-1200px)}}` +
    `@media (prefers-reduced-motion: reduce){.tide{animation:none}}` +
    `</style>` +
    `<g class="tide">` +
    `<path d="${body}" fill="${fill}" fill-opacity="0.15"/>` +
    `<path d="${top}" fill="none" stroke="${crest}" stroke-opacity="0.34" stroke-width="3"/>` +
    `</g>` +
    `</svg>`
  )
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    try {
      const set = await $.theme.set({ backdrop: { scene: SCENE } })
      if (!set.isDrawn) $.ui.status(set.reason)
    } catch (err) {
      $.ui.log(`context-tide: theme set failed: ${String(err)}`)
    }
    try {
      const u = await $.session.usage()
      await update($, pct, () => u?.context?.percent ?? 0)
    } catch (err) {
      $.ui.log(`context-tide: usage read failed: ${String(err)}`)
    }

    return next(e)
  })

  // Pushed after each turn (and when a rate-limit window moves): re-read the
  // window and write the new fill level, which redraws the Backdrop.
  on('session.measure', async ($, e, next) => {
    try {
      const u = await $.session.usage()
      await update($, pct, () => u?.context?.percent ?? 0)
    } catch (err) {
      $.ui.log(`context-tide: usage read failed: ${String(err)}`)
    }

    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') return next(e)
    if (e.props.scene !== SCENE) return next(e)

    const { Svg } = $.ui.resolve(e)
    const level = await read($, pct)

    return <Svg source={scene(level)} alt="Context window fill level" />
  })
}
