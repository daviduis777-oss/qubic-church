'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { panOf, sound, type Press } from '@/lib/sound/engine'

/**
 * Sound for the whole site: the first press anywhere wakes the audio (browsers allow nothing earlier), and every
 * press gets a small sound of its own. What a press sounds like comes from the element: `data-sound` decides
 * when present ("primary", "open", "close", "tap", "link", "none"); otherwise the site's main buttons
 * charge up, a link chimes, a control that opens
 * something (aria-expanded) swooshes open or shut, a checkbox switches, and any other button clicks.
 */
export function SoundLayer() {
  useEffect(() => {
    const s = sound()
    const wake = () => s.unlock()
    const kindOf = (el: Element): Press | null => {
      const tagged = el.closest('[data-sound]')
      if (tagged) return tagged.getAttribute('data-sound') as Press
      const c = el.closest('a[href], button, summary, [role="button"], [role="tab"], [role="switch"], input[type="checkbox"], input[type="radio"], select')
      if (!c || (c as HTMLButtonElement).disabled || c.getAttribute('aria-disabled') === 'true') return null
      // the site's main buttons (BPP-9000's lit ones, Donate) charge up and land
      if (c.classList.contains('btn-main') || c.classList.contains('nv2-donate')) return 'primary'
      if (c.tagName === 'SUMMARY') return (c.parentElement as HTMLDetailsElement | null)?.open ? 'close' : 'open'
      const exp = c.getAttribute('aria-expanded')
      if (exp != null) return exp === 'true' ? 'close' : 'open'
      if (c.tagName === 'INPUT' || c.getAttribute('role') === 'switch') {
        const on = (c as HTMLInputElement).checked ?? c.getAttribute('aria-checked') === 'true'
        return on ? 'off' : 'on'
      }
      if (c.tagName === 'A') return 'link'
      return 'tap'
    }
    const onPress = (e: PointerEvent | KeyboardEvent) => {
      s.unlock()
      if (e instanceof KeyboardEvent && e.key !== 'Enter' && e.key !== ' ') return
      if (e instanceof PointerEvent && e.button !== 0) return
      const t = e.target as Element | null
      if (!t || !(t instanceof Element)) return
      const k = kindOf(t)
      if (k) s.press(k, e instanceof PointerEvent ? panOf(e.clientX) : 0)
    }
    window.addEventListener('pointerdown', onPress, true)
    window.addEventListener('keydown', onPress, true)
    window.addEventListener('touchend', wake, { capture: true, passive: true })
    return () => {
      window.removeEventListener('pointerdown', onPress, true)
      window.removeEventListener('keydown', onPress, true)
      window.removeEventListener('touchend', wake, true)
    }
  }, [])
  return null
}

/** Whether sound is on, for buttons that show it. */
export function useSoundOn() {
  return useSyncExternalStore(
    f => sound().subscribe(f),
    () => sound().get(),
    () => true,
  )
}

const Speaker = ({ on, size = 16 }: { on: boolean; size?: number }) => (
  <svg aria-hidden fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width={size}>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
    {on ? (
      <>
        <path d="M15.5 9.5a3.5 3.5 0 0 1 0 5" />
        <path d="M18 7a7 7 0 0 1 0 10" />
      </>
    ) : (
      <path d="M3 3l18 18" />
    )}
  </svg>
)

/** The speaker in the header: sound on or off for the whole site (remembered in this browser). */
export function SoundToggle({ className, label = false }: { className?: string; label?: boolean }) {
  const on = useSoundOn()
  return (
    <button
      aria-label={on ? 'Turn sound off' : 'Turn sound on'}
      aria-pressed={on}
      className={className}
      data-sound={on ? 'off' : 'none'}
      onClick={() => sound().setEnabled(!on)}
      title={on ? 'Sound on: press to turn it off' : 'Sound off: press to turn it on'}
      type="button"
    >
      <Speaker on={on} />
      {label && <span>{on ? 'Sound on' : 'Sound off'}</span>}
    </button>
  )
}
