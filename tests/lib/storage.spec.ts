import { afterEach, describe, expect, it, vi } from 'vitest'

import { storage } from '@/lib/storage'

afterEach(() => window.sessionStorage.clear())

describe('storage', () => {
  it('değer yazar, okur ve siler', async () => {
    await storage.setItem('k', 'v')
    expect(await storage.getItem('k')).toBe('v')
    await storage.removeItem('k')
    expect(await storage.getItem('k')).toBeNull()
  })

  it('depolama erişimi hata verirse sessizce devam eder', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    expect(await storage.getItem('k')).toBeNull()
    await expect(storage.setItem('k', 'v')).resolves.toBeUndefined()
  })
})
