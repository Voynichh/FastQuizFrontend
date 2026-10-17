import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { describe, expect, it } from 'vitest'

import { ApiRequestError, toApiError } from '@/api/errors'

function axiosError(status: number, data: unknown) {
  const config = {} as InternalAxiosRequestConfig
  const response = { status, data, statusText: '', headers: {}, config } as AxiosResponse
  return new AxiosError('failed', 'ERR_BAD_REQUEST', config, null, response)
}

describe('toApiError', () => {
  it('backend hata formatını çevirir', () => {
    const error = toApiError(
      axiosError(409, {
        error: { code: 'already_answered', message: 'Zaten cevaplandı.', details: { a: 1 } },
      }),
    )
    expect(error).toBeInstanceOf(ApiRequestError)
    expect(error.code).toBe('already_answered')
    expect(error.message).toBe('Zaten cevaplandı.')
    expect(error.status).toBe(409)
    expect(error.details).toEqual({ a: 1 })
    expect(error.isNetworkError).toBe(false)
  })

  it('yanıt yoksa network_error döner', () => {
    const error = toApiError(new AxiosError('Network Error', 'ERR_NETWORK'))
    expect(error.code).toBe('network_error')
    expect(error.isNetworkError).toBe(true)
    expect(error.message).toContain('Bağlantı sorunu')
  })

  it('beklenmeyen gövde için unknown_error döner', () => {
    const error = toApiError(axiosError(502, '<html>Bad gateway</html>'))
    expect(error.code).toBe('unknown_error')
    expect(error.status).toBe(502)
  })

  it('axios dışı hatayı unknown_error yapar, ApiRequestError olduğu gibi kalır', () => {
    expect(toApiError(new Error('x')).code).toBe('unknown_error')
    const own = new ApiRequestError('rate_limited', 'Yavaş', 429)
    expect(toApiError(own)).toBe(own)
  })
})
