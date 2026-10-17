import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { http } from '@/api/client'
import { getCategories, getCurrentQuestion, submitAnswer } from '@/api/endpoints'
import { ApiRequestError } from '@/api/errors'

const originalAdapter = http.defaults.adapter

function ok(config: InternalAxiosRequestConfig, data: unknown) {
  return { data, status: 200, statusText: 'OK', headers: {}, config }
}

function networkFailure(config: InternalAxiosRequestConfig) {
  return Promise.reject(new AxiosError('Network Error', 'ERR_NETWORK', config))
}

afterEach(() => {
  http.defaults.adapter = originalAdapter
})

describe('http istemcisi', () => {
  it('X-Client ve X-Client-Version header’larını gönderir', async () => {
    const adapter = vi.fn<AxiosAdapter>(async (config) => ok(config, { categories: [] }))
    http.defaults.adapter = adapter
    await getCategories()
    const headers = adapter.mock.calls[0]![0].headers
    expect(headers.get('X-Client')).toBe('web')
    expect(headers.get('X-Client-Version')).toBe(__APP_VERSION__)
  })

  it('ağ hatasında bir kez yeniden dener', async () => {
    const adapter = vi
      .fn<AxiosAdapter>()
      .mockImplementationOnce(networkFailure)
      .mockImplementationOnce(async (config) => ok(config, { categories: [{ slug: 'a' }] }))
    http.defaults.adapter = adapter
    expect(await getCategories()).toEqual([{ slug: 'a' }])
    expect(adapter).toHaveBeenCalledTimes(2)
  })

  it('ikinci ağ hatasında network_error fırlatır (üçüncü deneme yok)', async () => {
    const adapter = vi.fn<AxiosAdapter>(networkFailure)
    http.defaults.adapter = adapter
    const error = await getCategories().catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiRequestError)
    expect((error as ApiRequestError).code).toBe('network_error')
    expect(adapter).toHaveBeenCalledTimes(2)
  })

  it('sunucu hata yanıtını yeniden denemeden ApiRequestError yapar', async () => {
    const adapter = vi.fn<AxiosAdapter>(async (config) => {
      const response = {
        status: 401,
        data: { error: { code: 'invalid_session_token', message: 'Geçersiz.', details: {} } },
        statusText: '',
        headers: {},
        config,
      }
      throw new AxiosError('x', 'ERR_BAD_REQUEST', config, null, response)
    })
    http.defaults.adapter = adapter
    await expect(getCurrentQuestion('s1', 't1')).rejects.toMatchObject({
      code: 'invalid_session_token',
      status: 401,
    })
    expect(adapter).toHaveBeenCalledTimes(1)
  })

  it('oturum token’ını X-Session-Token header’ı ile ve doğru gövdeyle gönderir', async () => {
    const adapter = vi.fn<AxiosAdapter>(async (config) => ok(config, { result: 'correct' }))
    http.defaults.adapter = adapter
    await submitAnswer('abc', 'secret', 512, null)
    const config = adapter.mock.calls[0]![0]
    expect(config.url).toBe('/sessions/abc/answers/')
    expect(config.headers.get('X-Session-Token')).toBe('secret')
    expect(JSON.parse(config.data as string)).toEqual({ question_id: 512, choice_id: null })
  })
})
