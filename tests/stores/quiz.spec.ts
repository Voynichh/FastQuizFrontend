import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createSession } from '@/api/endpoints'
import { useQuizStore } from '@/stores/quiz'

vi.mock('@/api/endpoints', () => ({ createSession: vi.fn() }))

const created = {
  session_id: '8f1c0000-0000-0000-0000-000000000000',
  session_token: 'q7Xk',
  category: { slug: 'yapay-zeka', name: 'Yapay Zeka', icon: 'brain', color: 'cat-ai' },
  total_questions: 20,
  time_limit_ms: 5000,
}

beforeEach(() => {
  window.sessionStorage.clear()
  setActivePinia(createPinia())
})

describe('quiz store', () => {
  it('oturumu açar, durumu doldurur ve sessionStorage’a yazar', async () => {
    vi.mocked(createSession).mockResolvedValue(created)
    const quiz = useQuizStore()
    const id = await quiz.startSession('yapay-zeka')
    expect(id).toBe(created.session_id)
    expect(quiz.sessionToken).toBe('q7Xk')
    expect(quiz.category?.slug).toBe('yapay-zeka')
    expect(quiz.totalQuestions).toBe(20)
    expect(quiz.timeLimitMs).toBe(5000)
    expect(quiz.status).toBe('active')
    expect(JSON.parse(window.sessionStorage.getItem('fastquiz.session')!)).toMatchObject({
      sessionId: created.session_id,
      sessionToken: 'q7Xk',
    })
  })

  it('hata olursa durum idle kalır ve hata yukarı fırlatılır', async () => {
    vi.mocked(createSession).mockRejectedValue(new Error('boom'))
    const quiz = useQuizStore()
    await expect(quiz.startSession('x')).rejects.toThrow('boom')
    expect(quiz.status).toBe('idle')
    expect(quiz.sessionId).toBeNull()
    expect(window.sessionStorage.getItem('fastquiz.session')).toBeNull()
  })

  it('sayfa yenilenince kayıtlı oturumu geri yükler', async () => {
    vi.mocked(createSession).mockResolvedValue(created)
    await useQuizStore().startSession('yapay-zeka')

    setActivePinia(createPinia()) // yenileme: store sıfırlanır
    const fresh = useQuizStore()
    expect(fresh.sessionId).toBeNull()
    expect(await fresh.restore()).toBe(true)
    expect(fresh.sessionId).toBe(created.session_id)
    expect(fresh.sessionToken).toBe('q7Xk')
    expect(fresh.status).toBe('active')
  })

  it('kayıt yoksa ya da bozuksa restore false döner', async () => {
    const quiz = useQuizStore()
    expect(await quiz.restore()).toBe(false)
    window.sessionStorage.setItem('fastquiz.session', '{bozuk')
    expect(await quiz.restore()).toBe(false)
    expect(window.sessionStorage.getItem('fastquiz.session')).toBeNull()
  })

  it('reset durumu ve depolamayı temizler', async () => {
    vi.mocked(createSession).mockResolvedValue(created)
    const quiz = useQuizStore()
    await quiz.startSession('yapay-zeka')
    await quiz.reset()
    expect(quiz.sessionId).toBeNull()
    expect(quiz.status).toBe('idle')
    expect(window.sessionStorage.getItem('fastquiz.session')).toBeNull()
  })
})
