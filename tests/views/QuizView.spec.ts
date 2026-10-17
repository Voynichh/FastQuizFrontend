import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'

import { createSession, getCurrentQuestion, submitAnswer } from '@/api/endpoints'
import { ApiRequestError } from '@/api/errors'
import { FEEDBACK_MS } from '@/composables/useQuizSession'
import { useQuizStore } from '@/stores/quiz'
import QuizView from '@/views/QuizView.vue'

import { created, makeAnswer, makeCurrent, SESSION_ID } from '../helpers'

vi.mock('@/api/endpoints', () => ({
  createSession: vi.fn(),
  getCurrentQuestion: vi.fn(),
  submitAnswer: vi.fn(),
}))

const COUNTDOWN_MS = 3 * 700

function buildApp() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div>home</div>' } },
      { path: '/quiz/:sessionId', name: 'quiz', component: QuizView },
      { path: '/sonuc/:sessionId', name: 'result', component: { template: '<div>sonuc</div>' } },
    ],
  })
  return { pinia, router }
}

/** Yeni açılmış oturumla quiz ekranını açar (geri sayım gösterilir). */
async function openQuiz() {
  vi.mocked(createSession).mockResolvedValue(created)
  const { pinia, router } = buildApp()
  const quiz = useQuizStore()
  await quiz.startSession('yapay-zeka')
  await router.push(`/quiz/${SESSION_ID}`)
  const wrapper = mount(QuizView, { global: { plugins: [pinia, router] }, attachTo: document.body })
  await flushPromises()
  return { wrapper, router, quiz }
}

async function passCountdown() {
  await vi.advanceTimersByTimeAsync(COUNTDOWN_MS)
}

const choices = (wrapper: ReturnType<typeof mount>) => wrapper.findAll('li button')
const states = (wrapper: ReturnType<typeof mount>) =>
  choices(wrapper).map((b) => b.attributes('data-state'))

beforeEach(() => {
  window.sessionStorage.clear()
  vi.useFakeTimers({
    toFake: [
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'performance',
      'setTimeout',
      'clearTimeout',
      'setInterval',
      'clearInterval',
      'Date',
    ],
  })
  vi.mocked(getCurrentQuestion).mockImplementation(async () => makeCurrent(0))
})

afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('QuizView: akış', () => {
  it('önce 3-2-1 gösterir; geri sayım bitince soruyu ister (süre o an başlar)', async () => {
    const { wrapper } = await openQuiz()
    expect(wrapper.text()).toContain('Hazır ol!')
    expect(getCurrentQuestion).not.toHaveBeenCalled()

    await passCountdown()
    expect(getCurrentQuestion).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Soru 1?')
    expect(wrapper.text()).toContain('1/20')
    expect(wrapper.text()).toContain('Yapay Zeka')
    expect(choices(wrapper).map((b) => b.text())).toEqual([
      expect.stringContaining('Şık 1'),
      expect.stringContaining('Şık 2'),
      expect.stringContaining('Şık 3'),
      expect.stringContaining('Şık 4'),
    ])
    expect(choices(wrapper)[0]!.text()).toContain('A')
    expect(choices(wrapper)[3]!.text()).toContain('D')
    expect(wrapper.find('[role="img"]').attributes('aria-label')).toContain('saniye')
  })

  it('doğru cevapta şıkları kilitler, yeşil geri bildirim ve puanı gösterir, sonra sonrakini yükler', async () => {
    const { wrapper } = await openQuiz()
    await passCountdown()
    vi.mocked(submitAnswer).mockResolvedValue(
      makeAnswer({ correct_choice_id: 1001, points: 168, total_score: 168 }),
    )

    await choices(wrapper)[0]!.trigger('click')
    await flushPromises()
    expect(submitAnswer).toHaveBeenCalledWith(SESSION_ID, 'tok', 100, 1001)
    expect(states(wrapper)).toEqual(['correct', 'disabled', 'disabled', 'disabled'])
    expect(wrapper.text()).toContain('Doğru! +168 puan')
    expect(wrapper.find('[data-testid="score"]').text()).toBe('168')

    vi.mocked(getCurrentQuestion).mockImplementation(async () =>
      makeCurrent(1, { total_score: 168 }),
    )
    await vi.advanceTimersByTimeAsync(FEEDBACK_MS)
    expect(getCurrentQuestion).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('Soru 2?')
    expect(wrapper.text()).toContain('2/20')
    expect(states(wrapper)).toEqual(['default', 'default', 'default', 'default'])
    expect(wrapper.text()).not.toContain('Doğru!')
  })

  it('yanlış cevapta seçileni kırmızı, doğruyu yeşil gösterir (simgeyle)', async () => {
    const { wrapper } = await openQuiz()
    await passCountdown()
    vi.mocked(submitAnswer).mockResolvedValue(
      makeAnswer({ result: 'wrong', correct_choice_id: 1003, points: 0, total_score: 0 }),
    )
    await choices(wrapper)[1]!.trigger('click')
    await flushPromises()
    expect(states(wrapper)).toEqual(['disabled', 'wrong', 'correct', 'disabled'])
    expect(choices(wrapper)[1]!.text()).toContain('✕')
    expect(choices(wrapper)[2]!.text()).toContain('✓')
    expect(wrapper.text()).toContain('Yanlış')
  })

  it('çift tıklamada ve kilitliyken diğer şıklara tıklanınca yalnızca bir cevap gider', async () => {
    const { wrapper } = await openQuiz()
    await passCountdown()
    vi.mocked(submitAnswer).mockImplementation(() => new Promise(() => {}))
    await choices(wrapper)[0]!.trigger('click')
    await choices(wrapper)[0]!.trigger('click')
    await choices(wrapper)[2]!.trigger('click')
    expect(submitAnswer).toHaveBeenCalledTimes(1)
    expect(states(wrapper)).toEqual(['selected', 'disabled', 'disabled', 'disabled'])
  })

  it('süre dolunca choice_id: null gönderir ve "Süre doldu" gösterir', async () => {
    const { wrapper } = await openQuiz()
    await passCountdown()
    vi.mocked(submitAnswer).mockResolvedValue(
      makeAnswer({ result: 'timeout', correct_choice_id: 1002, points: 0, total_score: 0 }),
    )
    await vi.advanceTimersByTimeAsync(5100)
    expect(submitAnswer).toHaveBeenCalledWith(SESSION_ID, 'tok', 100, null)
    expect(submitAnswer).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Süre doldu')
    expect(states(wrapper)).toEqual(['disabled', 'correct', 'disabled', 'disabled'])
  })

  it('klavyeden 1–4 ve A–D tuşlarıyla şık seçilir', async () => {
    const { wrapper } = await openQuiz()
    await passCountdown()
    vi.mocked(submitAnswer).mockResolvedValue(makeAnswer())
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '3' }))
    await flushPromises()
    expect(submitAnswer).toHaveBeenLastCalledWith(SESSION_ID, 'tok', 100, 1003)

    vi.mocked(getCurrentQuestion).mockImplementation(async () => makeCurrent(1))
    await vi.advanceTimersByTimeAsync(FEEDBACK_MS)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }))
    await flushPromises()
    expect(submitAnswer).toHaveBeenLastCalledWith(SESSION_ID, 'tok', 101, 1014)
    expect(wrapper.exists()).toBe(true)
  })

  it('geçersiz tuşlar ve değiştirici tuşlarla seçim yapılmaz', async () => {
    await openQuiz()
    await passCountdown()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '5' }))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '1', ctrlKey: true }))
    await flushPromises()
    expect(submitAnswer).not.toHaveBeenCalled()
  })

  it('son cevaptan sonra sonuç ekranına geçer', async () => {
    const { wrapper, router } = await openQuiz()
    await passCountdown()
    vi.mocked(submitAnswer).mockResolvedValue(makeAnswer({ is_last: true, total_score: 2500 }))
    await choices(wrapper)[0]!.trigger('click')
    await flushPromises()
    await vi.advanceTimersByTimeAsync(FEEDBACK_MS)
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe(`/sonuc/${SESSION_ID}`)
    expect(getCurrentQuestion).toHaveBeenCalledTimes(1)
  })
})

describe('QuizView: hata ve kurtarma', () => {
  it('ağ hatasında "Bağlantı sorunu" gösterir; Tekrar dene aynı cevabı yeniden gönderir', async () => {
    const { wrapper } = await openQuiz()
    await passCountdown()
    vi.mocked(submitAnswer).mockRejectedValueOnce(
      new ApiRequestError('network_error', 'Bağlantı sorunu. Tekrar dene.'),
    )
    await choices(wrapper)[0]!.trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').text()).toContain('Bağlantı sorunu')

    vi.mocked(submitAnswer).mockResolvedValue(makeAnswer())
    await wrapper.find('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(submitAnswer).toHaveBeenCalledTimes(2)
    expect(submitAnswer).toHaveBeenLastCalledWith(SESSION_ID, 'tok', 100, 1001)
    expect(wrapper.text()).toContain('Doğru!')
  })

  it('already_answered gelirse sunucudaki duruma göre sıradaki soruya geçer', async () => {
    const { wrapper } = await openQuiz()
    await passCountdown()
    vi.mocked(submitAnswer).mockRejectedValue(
      new ApiRequestError('already_answered', 'Zaten cevaplandı.', 409),
    )
    vi.mocked(getCurrentQuestion).mockImplementation(async () => makeCurrent(1))
    await choices(wrapper)[0]!.trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Soru 2?')
    expect(states(wrapper)).toEqual(['default', 'default', 'default', 'default'])
  })

  it('soru yüklenemezse hata gösterir ve tekrar denenebilir', async () => {
    vi.mocked(getCurrentQuestion).mockRejectedValueOnce(
      new ApiRequestError('rate_limited', 'Çok fazla istek.', 429),
    )
    const { wrapper } = await openQuiz()
    await passCountdown()
    expect(wrapper.find('[role="alert"]').text()).toContain('Çok fazla istek.')
    await wrapper.find('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Soru 1?')
  })

  it('oturum sona erdiyse (abandoned) tekrar dene yerine ana sayfaya dönüş sunar', async () => {
    vi.mocked(getCurrentQuestion).mockRejectedValue(
      new ApiRequestError('session_abandoned', 'Oturum sona erdi.', 409),
    )
    const { wrapper, router, quiz } = await openQuiz()
    await passCountdown()
    const alert = wrapper.find('[role="alert"]')
    expect(alert.text()).toContain('Oturum sona erdi.')
    expect(alert.find('button').text()).toBe('Ana sayfaya dön')
    await alert.find('button').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/')
    expect(quiz.sessionId).toBeNull()
  })

  it('session_completed gelirse sonuç ekranına yönlendirir', async () => {
    vi.mocked(getCurrentQuestion).mockRejectedValue(
      new ApiRequestError('session_completed', 'Tamamlandı.', 409),
    )
    const { router } = await openQuiz()
    await passCountdown()
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe(`/sonuc/${SESSION_ID}`)
  })
})

describe('QuizView: yenileme ve çıkış', () => {
  it('sayfa yenilenince geri sayım olmadan kalınan yerden devam eder', async () => {
    vi.mocked(createSession).mockResolvedValue(created)
    const first = buildApp()
    await useQuizStore().startSession('yapay-zeka')
    vi.mocked(getCurrentQuestion).mockImplementation(async () => makeCurrent(4))
    await useQuizStore().loadCurrent()
    first.pinia._s.clear()

    // yenileme: yeni pinia, yeni router, aynı sessionStorage
    const { pinia, router } = buildApp()
    await router.push(`/quiz/${SESSION_ID}`)
    const wrapper = mount(QuizView, {
      global: { plugins: [pinia, router] },
      attachTo: document.body,
    })
    await flushPromises()
    expect(wrapper.text()).not.toContain('Hazır ol!')
    expect(wrapper.text()).toContain('Soru 5?')
    expect(wrapper.text()).toContain('5/20')
  })

  it('kayıtlı oturum rotadakiyle eşleşmezse kurtarılamaz hata gösterir', async () => {
    const { pinia, router } = buildApp()
    await router.push('/quiz/baska-oturum')
    const wrapper = mount(QuizView, {
      global: { plugins: [pinia, router] },
      attachTo: document.body,
    })
    await flushPromises()
    expect(wrapper.find('[role="alert"]').text()).toContain('Quiz oturumu bulunamadı')
    expect(getCurrentQuestion).not.toHaveBeenCalled()
  })

  it('çıkış tuşu onay ister; vazgeçilirse quiz sürer, onaylanırsa oturum silinir', async () => {
    const { wrapper, router, quiz } = await openQuiz()
    await passCountdown()
    await wrapper.find('[aria-label="Quizden çık"]').trigger('click')
    expect(wrapper.find('[role="dialog"]').text()).toContain('Quizden çıkılsın mı?')

    await wrapper.findAll('[role="dialog"] button')[0]!.trigger('click') // Devam et
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(router.currentRoute.value.fullPath).toBe(`/quiz/${SESSION_ID}`)

    await wrapper.find('[aria-label="Quizden çık"]').trigger('click')
    await wrapper.findAll('[role="dialog"] button')[1]!.trigger('click') // Evet, çık
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/')
    expect(quiz.sessionId).toBeNull()
  })

  it('tarayıcı geri tuşu rotayı engeller ve çıkış onayı açar', async () => {
    // Rota koruması yalnızca RouterView içinde çalışır: uygulamayı olduğu gibi bağla
    vi.mocked(createSession).mockResolvedValue(created)
    const { pinia, router } = buildApp()
    await useQuizStore().startSession('yapay-zeka')
    await router.push(`/quiz/${SESSION_ID}`)
    const wrapper = mount(
      { components: { RouterView }, template: '<RouterView />' },
      { global: { plugins: [pinia, router] }, attachTo: document.body },
    )
    await flushPromises()
    await passCountdown()
    await router.push('/').catch(() => {})
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe(`/quiz/${SESSION_ID}`)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
  })

  it('Escape çıkış onayını kapatır', async () => {
    const { wrapper } = await openQuiz()
    await passCountdown()
    await wrapper.find('[aria-label="Quizden çık"]').trigger('click')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })
})
