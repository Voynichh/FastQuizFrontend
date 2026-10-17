import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { getCategories, getLeaderboard } from '@/api/endpoints'
import { ApiRequestError } from '@/api/errors'
import LeaderboardView from '@/views/LeaderboardView.vue'

import { categories } from '../fixtures'
import { makeEntries, seedSession } from '../helpers'

vi.mock('@/api/endpoints', () => ({ getCategories: vi.fn(), getLeaderboard: vi.fn() }))

const board = (slug: string | null, entries = makeEntries(3)) => ({ category: slug, entries })

async function openBoard(path = '/skor-tablosu') {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/kategoriler', name: 'categories', component: { template: '<div />' } },
      { path: '/skor-tablosu', name: 'leaderboard', component: LeaderboardView },
    ],
  })
  await router.push(path)
  const wrapper = mount(LeaderboardView, { global: { plugins: [pinia, router] } })
  await flushPromises()
  return { wrapper, router }
}

const tabs = (wrapper: ReturnType<typeof mount>) => wrapper.findAll('[role="tab"]')

beforeEach(() => {
  window.sessionStorage.clear()
  vi.mocked(getCategories).mockResolvedValue(categories)
  vi.mocked(getLeaderboard).mockImplementation(async (slug) => board(slug ?? null))
})

describe('LeaderboardView', () => {
  it('genel tabloyu ve Genel + kategori sekmelerini gösterir', async () => {
    const { wrapper } = await openBoard()
    expect(getLeaderboard).toHaveBeenCalledWith(undefined)
    expect(tabs(wrapper).map((t) => t.text())).toEqual(['Genel', 'Yazılım', 'Yapay Zeka'])
    expect(tabs(wrapper)[0]!.attributes('aria-selected')).toBe('true')
    expect(wrapper.findAll('tbody tr')).toHaveLength(3)
    expect(wrapper.text()).toContain('Ece')
  })

  it('URL’deki ?kategori= sekmesini açar', async () => {
    const { wrapper } = await openBoard('/skor-tablosu?kategori=yapay-zeka')
    expect(getLeaderboard).toHaveBeenCalledWith('yapay-zeka')
    expect(tabs(wrapper)[2]!.attributes('aria-selected')).toBe('true')
    expect(tabs(wrapper)[0]!.attributes('aria-selected')).toBe('false')
  })

  it('sekme değişince URL güncellenir ve o kategorinin tablosu yüklenir', async () => {
    const { wrapper, router } = await openBoard()
    await tabs(wrapper)[1]!.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/skor-tablosu?kategori=yazilim')
    expect(getLeaderboard).toHaveBeenLastCalledWith('yazilim')
    await tabs(wrapper)[0]!.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/skor-tablosu')
    expect(getLeaderboard).toHaveBeenLastCalledWith(undefined)
  })

  it('boş tabloda davet metni ve başlangıç butonu gösterir', async () => {
    vi.mocked(getLeaderboard).mockResolvedValue(board(null, []))
    const { wrapper } = await openBoard()
    expect(wrapper.text()).toContain('Henüz skor yok')
    expect(wrapper.find('table').exists()).toBe(false)
    expect(wrapper.find('a[href="/kategoriler"]').exists()).toBe(true)
  })

  it('hata olursa mesaj ve Tekrar dene gösterir', async () => {
    vi.mocked(getLeaderboard)
      .mockRejectedValueOnce(new ApiRequestError('network_error', 'Bağlantı sorunu.'))
      .mockResolvedValueOnce(board(null))
    const { wrapper } = await openBoard()
    expect(wrapper.find('[role="alert"]').text()).toContain('Bağlantı sorunu.')
    await wrapper.find('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.findAll('tbody tr')).toHaveLength(3)
  })

  it('kategoriler yüklenemese de genel tablo gösterilir', async () => {
    vi.mocked(getCategories).mockRejectedValue(new ApiRequestError('network_error', 'x'))
    const { wrapper } = await openBoard()
    expect(tabs(wrapper).map((t) => t.text())).toEqual(['Genel'])
    expect(wrapper.findAll('tbody tr')).toHaveLength(3)
  })

  it('hızlı sekme değişiminde eski isteğin geç gelen yanıtı yok sayılır', async () => {
    let releaseSlow: (value: ReturnType<typeof board>) => void = () => {}
    vi.mocked(getLeaderboard)
      .mockResolvedValueOnce(board(null))
      .mockImplementationOnce(() => new Promise((resolve) => (releaseSlow = resolve)))
      .mockResolvedValueOnce(board('yapay-zeka', makeEntries(1)))
    const { wrapper } = await openBoard()
    await tabs(wrapper)[1]!.trigger('click') // yavaş istek
    await flushPromises() // rota güncellenir, istek havada kalır
    await tabs(wrapper)[2]!.trigger('click') // hızlı istek
    await flushPromises()
    releaseSlow(board('yazilim', makeEntries(5))) // eski yanıt sonradan gelir
    await flushPromises()
    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
  })
})

describe('LeaderboardView: kullanıcının skoru', () => {
  const saved = {
    playerName: 'Can',
    rank: 2,
    inTop10: true,
    score: 2900,
    categorySlug: 'yapay-zeka',
  }

  it('kategori sekmesinde kaydedilen skoru vurgular', async () => {
    seedSession({ saved })
    const { wrapper } = await openBoard('/skor-tablosu?kategori=yapay-zeka')
    const highlighted = wrapper.findAll('tr[data-highlight="true"]')
    expect(highlighted).toHaveLength(1)
    expect(highlighted[0]!.text()).toContain('Can')
  })

  it('genel sekmede de isim ve puanla vurgular', async () => {
    seedSession({ saved })
    const { wrapper } = await openBoard()
    expect(wrapper.findAll('tr[data-highlight="true"]')).toHaveLength(1)
  })

  it('başka kategorinin sekmesinde vurgu yapmaz', async () => {
    seedSession({ saved })
    const { wrapper } = await openBoard('/skor-tablosu?kategori=yazilim')
    expect(wrapper.findAll('tr[data-highlight="true"]')).toHaveLength(0)
  })

  it('kayıtlı skor yoksa vurgu yoktur', async () => {
    const { wrapper } = await openBoard()
    expect(wrapper.findAll('tr[data-highlight="true"]')).toHaveLength(0)
  })
})
