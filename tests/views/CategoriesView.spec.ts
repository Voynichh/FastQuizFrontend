import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { createSession, getCategories } from '@/api/endpoints'
import { ApiRequestError } from '@/api/errors'
import CategoriesView from '@/views/CategoriesView.vue'

import { categories } from '../fixtures'

vi.mock('@/api/endpoints', () => ({ getCategories: vi.fn(), createSession: vi.fn() }))

const created = {
  session_id: 'sess-1',
  session_token: 'tok',
  category: { slug: 'yazilim', name: 'Yazılım', icon: 'code', color: 'cat-software' },
  total_questions: 20,
  time_limit_ms: 5000,
}

function setup() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/kategoriler', name: 'categories', component: CategoriesView },
      { path: '/quiz/:sessionId', name: 'quiz', component: { template: '<div>quiz</div>' } },
    ],
  })
  return { pinia, router }
}

async function mountView() {
  const { pinia, router } = setup()
  await router.push('/kategoriler')
  await router.isReady()
  const wrapper = mount(CategoriesView, { global: { plugins: [pinia, router] } })
  await flushPromises()
  return { wrapper, router }
}

beforeEach(() => window.sessionStorage.clear())

describe('CategoriesView', () => {
  it('yüklenirken iskelet, sonra kategori kartlarını gösterir', async () => {
    vi.mocked(getCategories).mockResolvedValue(categories)
    const { pinia, router } = setup()
    await router.push('/kategoriler')
    const wrapper = mount(CategoriesView, { global: { plugins: [pinia, router] } })
    expect(wrapper.find('[aria-label="Kategoriler yükleniyor"]').exists()).toBe(true)
    await flushPromises()
    expect(wrapper.findAll('button')).toHaveLength(2)
    expect(wrapper.text()).toContain('Yazılım')
    expect(wrapper.text()).toContain('Yapay Zeka')
  })

  it('kategori seçilince oturum açar ve quiz ekranına geçer', async () => {
    vi.mocked(getCategories).mockResolvedValue(categories)
    vi.mocked(createSession).mockResolvedValue(created)
    const { wrapper, router } = await mountView()
    await wrapper.findAll('button')[0]!.trigger('click')
    await flushPromises()
    expect(createSession).toHaveBeenCalledWith('yazilim')
    expect(router.currentRoute.value.fullPath).toBe('/quiz/sess-1')
  })

  it('çift tıklamada yalnızca bir oturum açılır', async () => {
    vi.mocked(getCategories).mockResolvedValue(categories)
    vi.mocked(createSession).mockImplementation(() => new Promise(() => {}))
    const { wrapper } = await mountView()
    const [first, second] = wrapper.findAll('button')
    await first!.trigger('click')
    await first!.trigger('click')
    await second!.trigger('click')
    expect(createSession).toHaveBeenCalledTimes(1)
  })

  it('kategori yüklenemezse hata ve tekrar dene butonu gösterir', async () => {
    vi.mocked(getCategories)
      .mockRejectedValueOnce(new ApiRequestError('network_error', 'Bağlantı sorunu.'))
      .mockResolvedValueOnce(categories)
    const { wrapper } = await mountView()
    expect(wrapper.find('[role="alert"]').text()).toContain('Bağlantı sorunu.')
    await wrapper.find('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.findAll('button')).toHaveLength(2)
  })

  it('oturum açılamazsa hatayı gösterir ve yeniden seçmeye izin verir', async () => {
    vi.mocked(getCategories).mockResolvedValue(categories)
    vi.mocked(createSession).mockRejectedValue(
      new ApiRequestError('rate_limited', 'Çok fazla istek.', 429),
    )
    const { wrapper, router } = await mountView()
    await wrapper.findAll('button')[0]!.trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').text()).toContain('Çok fazla istek.')
    expect(router.currentRoute.value.fullPath).toBe('/kategoriler')
    expect(wrapper.findAll('button[disabled]')).toHaveLength(0)
  })
})
