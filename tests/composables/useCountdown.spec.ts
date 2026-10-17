import { effectScope } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useCountdown } from '@/composables/useCountdown'

const iso = (ms: number) => new Date(ms).toISOString()

function setup() {
  const onExpire = vi.fn()
  const scope = effectScope()
  const countdown = scope.run(() => useCountdown({ onExpire }))!
  return { onExpire, scope, countdown }
}

beforeEach(() => {
  vi.useFakeTimers({
    toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'setTimeout', 'Date'],
  })
})

afterEach(() => vi.useRealTimers())

describe('useCountdown', () => {
  it('kalan süreyi akıcı biçimde azaltır ve bitince bir kez onExpire çağırır', () => {
    const { onExpire, countdown } = setup()
    const now = Date.now()
    countdown.start(iso(now + 5000), iso(now), 5000)
    expect(countdown.remainingMs.value).toBe(5000)
    expect(countdown.running.value).toBe(true)

    vi.advanceTimersByTime(2500)
    // kare aralığı (~16 ms) kadar sapma olabilir
    expect(countdown.remainingMs.value).toBeGreaterThan(2400)
    expect(countdown.remainingMs.value).toBeLessThanOrEqual(2520)
    expect(onExpire).not.toHaveBeenCalled()

    vi.advanceTimersByTime(2600)
    expect(countdown.remainingMs.value).toBe(0)
    expect(countdown.running.value).toBe(false)
    expect(onExpire).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(5000)
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('cihaz saati sunucudan farklı olsa da deadline − server_time farkını kullanır', () => {
    const { countdown } = setup()
    const serverNow = Date.now() + 3 * 60 * 60 * 1000 // sunucu 3 saat ileride
    countdown.start(iso(serverNow + 5000), iso(serverNow), 5000)
    expect(countdown.remainingMs.value).toBe(5000)
    vi.advanceTimersByTime(1000)
    expect(countdown.remainingMs.value).toBeGreaterThan(3900)
    expect(countdown.remainingMs.value).toBeLessThanOrEqual(4020)
  })

  it('süre zaten dolmuşsa ilk karede onExpire çağrılır', () => {
    const { onExpire, countdown } = setup()
    const now = Date.now()
    countdown.start(iso(now - 100), iso(now), 5000)
    vi.advanceTimersByTime(50)
    expect(onExpire).toHaveBeenCalledTimes(1)
    expect(countdown.remainingMs.value).toBe(0)
  })

  it('stop() sayacı durdurur ve onExpire çağrılmaz', () => {
    const { onExpire, countdown } = setup()
    const now = Date.now()
    countdown.start(iso(now + 1000), iso(now), 5000)
    vi.advanceTimersByTime(300)
    countdown.stop()
    vi.advanceTimersByTime(5000)
    expect(onExpire).not.toHaveBeenCalled()
    expect(countdown.running.value).toBe(false)
  })

  it('yeniden start() eski sayacı iptal eder', () => {
    const { onExpire, countdown } = setup()
    const now = Date.now()
    countdown.start(iso(now + 1000), iso(now), 5000)
    vi.advanceTimersByTime(500)
    countdown.start(iso(Date.now() + 5000), iso(Date.now()), 5000)
    vi.advanceTimersByTime(1500)
    expect(onExpire).not.toHaveBeenCalled()
    vi.advanceTimersByTime(4000)
    expect(onExpire).toHaveBeenCalledTimes(1)
  })

  it('kapsam kapanınca sayaç durur', () => {
    const { onExpire, scope, countdown } = setup()
    const now = Date.now()
    countdown.start(iso(now + 1000), iso(now), 5000)
    scope.stop()
    vi.advanceTimersByTime(3000)
    expect(onExpire).not.toHaveBeenCalled()
  })
})
