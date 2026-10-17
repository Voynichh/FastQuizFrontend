import { onScopeDispose, ref } from 'vue'

interface CountdownOptions {
  /** Süre dolunca bir kez çağrılır (stop() ile durdurulursa çağrılmaz) */
  onExpire: () => void
}

/**
 * Sunucu `deadline`'ına göre akıcı (requestAnimationFrame) geri sayım. Sayaç yalnızca
 * görseldir; süreyi ve puanı sunucu belirler.
 *
 * Saat farkı düzeltmesi: yerel_bitiş = şimdi + (deadline − server_time). Böylece cihaz
 * saati yanlış olsa bile sayaç sunucuyla aynı süreyi gösterir. Monoton `performance.now()`
 * kullanıldığı için kullanıcı saati değiştirse de sayaç şaşmaz.
 */
export function useCountdown({ onExpire }: CountdownOptions) {
  const remainingMs = ref(0)
  const totalMs = ref(0)
  const running = ref(false)

  let frame = 0
  let endsAt = 0

  function tick() {
    const left = Math.max(0, endsAt - performance.now())
    remainingMs.value = left
    if (left > 0) {
      frame = requestAnimationFrame(tick)
      return
    }
    frame = 0
    running.value = false
    onExpire()
  }

  function stop() {
    if (frame) cancelAnimationFrame(frame)
    frame = 0
    running.value = false
  }

  function start(deadline: string, serverTime: string, limitMs: number) {
    stop()
    const left = Math.max(0, Date.parse(deadline) - Date.parse(serverTime))
    endsAt = performance.now() + left
    totalMs.value = limitMs
    remainingMs.value = left
    running.value = true
    frame = requestAnimationFrame(tick)
  }

  onScopeDispose(stop)

  return { remainingMs, totalMs, running, start, stop }
}
