import type { ClientType } from '@/types'

/** `X-Client` header değeri. İstemci yalnızca web olduğu için sabittir. */
export function getClientType(): ClientType {
  return 'web'
}
