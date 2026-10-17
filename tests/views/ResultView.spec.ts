import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { getResult, saveScore } from '@/api/endpoints'
import { ApiRequestError } from '@/api/errors'
import { useQuizStore } from '@/stores/quiz'
import ResultView from '@/views/ResultView.vue'

import { makeResult, SESSION_ID, seedSession } from '../helpers'

vi.mock('@/api/endpoints', () => ({ getResult: vi.fn(), saveScore: vi.fn() }))

async function openResult(path = `/sonuc/${SESSION_ID}`) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/kategoriler', name: 'categories', component: { template: '<div />' } },
      { path: '/quiz/:sessionId', name: 'quiz', component: { template: '<div />' } },
      { path: '/sonuc/:sessionId', name: 'result', component: ResultView },
      { path: '/skor-tablosu', name: 'leaderboard', component: { template: '<div />' } },
    ],
  })
  await router.push(path)
  const wrapper = mount(ResultView, { global: { plugins: [pinia, router] } })
  await flushPromises()
  return { wrapper, router, quiz: useQuizStore() }
}

const buttonByText = (wrapper: ReturnType<typeof mount>, text: string) =>
  wrapper.findAll('button').find((b) => b.text().includes(text))!

beforeEach(() => {
  window.sessionStorage.clear()
  seedSession()
  vi.mocked(getResult).mockResolvedValue(makeResult())
})

describe('ResultView: özet', () => {
  it('puanı, doğru/yanlış/boş sayısını, ortalama süreyi ve tahmini sırayı gösterir', async () => {
    const { wrapper } = await openResult()
    expect(getResult).toHaveBeenCalledWith(SESSION_ID, 'tok')
    expect(wrapper.get('[data-testid="score-final"]').text()).toBe('2310')
    expect(wrapper.get('[data-stat="correct"]').text()).toContain('15')
    expect(wrapper.get('[data-stat="wrong"]').text()).toContain('3')
    expect(wrapper.get('[data-stat="empty"]').text()).toContain('2')
    expect(wrapper.text()).toContain('1,6 sn')
    expect(wrapper.get('[data-testid="rank-text"]').text()).toContain('#4')
    expect(wrapper.get('[data-testid="rank-text"]').text()).toContain("ilk 10'a girebilirsin")
    expect(wrapper.text()).toContain('Yapay Zeka')
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('ilk 10 dışında "girebilirsin" demez', async () => {
    vi.mocked(getResult).mockResolvedValue(makeResult({ estimated_rank: 57, in_top_10: false }))
    const { wrapper } = await openResult()
    expect(wrapper.get('[data-testid="rank-text"]').text()).toContain('#57')
    expect(wrapper.get('[data-testid="rank-text"]').text()).not.toContain('ilk 10')
  })

  it('oturum rotadakiyle eşleşmezse kurtarılamaz hata gösterir', async () => {
    const { wrapper } = await openResult('/sonuc/baska')
    expect(wrapper.find('[role="alert"]').text()).toContain('Sonuç bulunamadı')
    expect(getResult).not.toHaveBeenCalled()
  })

  it('quiz henüz bitmediyse quiz ekranına yönlendirir', async () => {
    vi.mocked(getResult).mockRejectedValue(
      new ApiRequestError('session_not_completed', 'Henüz bitmedi.', 409),
    )
    const { router } = await openResult()
    expect(router.currentRoute.value.fullPath).toBe(`/quiz/${SESSION_ID}`)
  })

  it('sonuç yüklenemezse hata ve Tekrar dene gösterir', async () => {
    vi.mocked(getResult)
      .mockRejectedValueOnce(new ApiRequestError('network_error', 'Bağlantı sorunu.'))
      .mockResolvedValueOnce(makeResult())
    const { wrapper } = await openResult()
    expect(wrapper.find('[role="alert"]').text()).toContain('Bağlantı sorunu.')
    await wrapper.find('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="score-final"]').text()).toBe('2310')
  })
})

describe('ResultView: skor kaydı', () => {
  async function fillAndSubmit(wrapper: ReturnType<typeof mount>, name: string) {
    await wrapper.get('input').setValue(name)
    await wrapper.get('form').trigger('submit')
    await flushPromises()
  }

  it('ismi gönderir; kaydedilince sırayı gösterir ve ilk 10’da konfeti çıkar', async () => {
    vi.mocked(saveScore).mockResolvedValue({ rank: 4, in_top_10: true, score: 2310 })
    const { wrapper, quiz } = await openResult()
    await fillAndSubmit(wrapper, '  Ece ')
    expect(saveScore).toHaveBeenCalledWith(SESSION_ID, 'tok', 'Ece')
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.text()).toContain('Skorun kaydedildi, Ece!')
    expect(wrapper.get('[data-testid="rank-text"]').text()).toContain('#4')
    expect(wrapper.find('.confetti-piece').exists()).toBe(true)
    expect(quiz.saved).toMatchObject({ playerName: 'Ece', rank: 4, categorySlug: 'yapay-zeka' })
    expect(JSON.parse(window.sessionStorage.getItem('fastquiz.session')!).saved.playerName).toBe(
      'Ece',
    )
  })

  it('ilk 10 dışında konfeti çıkmaz', async () => {
    vi.mocked(saveScore).mockResolvedValue({ rank: 31, in_top_10: false, score: 2310 })
    const { wrapper } = await openResult()
    await fillAndSubmit(wrapper, 'Ece')
    expect(wrapper.text()).toContain('Skorun kaydedildi')
    expect(wrapper.find('.confetti-piece').exists()).toBe(false)
  })

  it('geçersiz isimde istek atmaz', async () => {
    const { wrapper } = await openResult()
    await fillAndSubmit(wrapper, 'x')
    expect(saveScore).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('en az 2 karakter')
  })

  it('sunucu isim hatasını (ör. uygunsuz isim) alanın altında gösterir ve form açık kalır', async () => {
    vi.mocked(saveScore).mockRejectedValue(
      new ApiRequestError('validation_error', 'Geçersiz isim.', 400, {
        player_name: ['Lütfen uygun bir isim seç.'],
      }),
    )
    const { wrapper } = await openResult()
    await fillAndSubmit(wrapper, 'Birisi')
    expect(wrapper.text()).toContain('Lütfen uygun bir isim seç.')
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.get('input').attributes('disabled')).toBeUndefined()
  })

  it('hız denetimine takılan skoru (score_rejected) açıklayıcı mesajla gösterir', async () => {
    vi.mocked(saveScore).mockRejectedValue(
      new ApiRequestError(
        'score_rejected',
        'Cevap süren gerçekçi görünmediği için skor tabloya eklenemedi.',
        400,
      ),
    )
    const { wrapper } = await openResult()
    await fillAndSubmit(wrapper, 'Robot')
    expect(wrapper.text()).toContain('gerçekçi görünmediği için')
    expect(wrapper.get('input').attributes('disabled')).toBeUndefined()
  })

  it('çift gönderimde yalnızca bir istek atılır', async () => {
    vi.mocked(saveScore).mockImplementation(() => new Promise(() => {}))
    const { wrapper } = await openResult()
    await wrapper.get('input').setValue('Ece')
    await wrapper.get('form').trigger('submit')
    await wrapper.get('form').trigger('submit')
    expect(saveScore).toHaveBeenCalledTimes(1)
  })

  it('score_already_saved gelirse sunucudaki duruma göre kaydedilmiş görünür', async () => {
    vi.mocked(saveScore).mockRejectedValue(
      new ApiRequestError('score_already_saved', 'Zaten kaydedildi.', 409),
    )
    const { wrapper } = await openResult()
    vi.mocked(getResult).mockResolvedValue(makeResult({ score_saved: true, estimated_rank: 3 }))
    await fillAndSubmit(wrapper, 'Ece')
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.text()).toContain('Skorun kaydedildi')
    expect(wrapper.get('[data-testid="rank-text"]').text()).toContain('#3')
  })

  it('sayfa yenilense de kaydedilmiş skor adıyla birlikte görünür', async () => {
    seedSession({
      saved: { playerName: 'Ece', rank: 2, inTop10: true, score: 2310, categorySlug: 'yapay-zeka' },
    })
    vi.mocked(getResult).mockResolvedValue(makeResult({ score_saved: true, estimated_rank: 2 }))
    const { wrapper } = await openResult()
    expect(wrapper.text()).toContain('Skorun kaydedildi, Ece!')
    expect(wrapper.find('form').exists()).toBe(false)
  })
})

describe('ResultView: çıkışlar', () => {
  it('Skor tablosunu gör kategori sekmesi açık tabloya götürür', async () => {
    vi.mocked(getResult).mockResolvedValue(makeResult({ score_saved: true }))
    const { wrapper, router } = await openResult()
    await buttonByText(wrapper, 'Skor tablosunu gör').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/skor-tablosu?kategori=yapay-zeka')
  })

  it('Kaydetmeden çık oturumu siler ve ana sayfaya döner', async () => {
    const { wrapper, router, quiz } = await openResult()
    await buttonByText(wrapper, 'Kaydetmeden çık').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/')
    expect(quiz.sessionId).toBeNull()
    expect(window.sessionStorage.getItem('fastquiz.session')).toBeNull()
  })

  it('Tekrar oyna oturumu silip kategori seçimine götürür', async () => {
    const { wrapper, router, quiz } = await openResult()
    await buttonByText(wrapper, 'Tekrar oyna').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/kategoriler')
    expect(quiz.sessionId).toBeNull()
  })
})
