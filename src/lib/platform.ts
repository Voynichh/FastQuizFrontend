import type { ClientType } from '@/types'

/** `X-Client` header değeri. Faz 8'de Capacitor.getPlatform() ile ios/android döner. */
export function getClientType(): ClientType {
  return 'web'
}
