import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createSession, getCurrentQuestion, submitAnswer } from '@/api/endpoints'
import { useQuizStore } from '@/stores/quiz'

import { created, makeAnswer, makeCurrent, SESSION_ID } from '../helpers'

vi.mock('@/api/endpoints', () => ({
  createSession: vi.fn(),
  getCurrentQuestion: vi.fn(),
  submitAnswer: vi.fn(),
}))

const STORAGE_KEY = 'fastquiz.session'
const persisted = () => JSON.parse(window.sessionStorage.getItem(STORAGE_KEY)!)

beforeEach(() => {
  window.sessionStorage.clear()
  setActivePinia(createPinia())
})

describe('quiz store: oturum', () => {
  it('oturumu açar, durumu doldurur ve sessionStorage’a yazar', async () => {
    vi.mocked(createSession).mockResolvedValue(created)
    const quiz = useQuizStore()
    const id = await quiz.startSession('yapay-zeka')
    expect(id).toBe(SESSION_ID)
    expect(quiz.sessionToken).toBe('tok')
    expect(quiz.category?.slug).toBe('yapay-zeka')
    expect(quiz.totalQuestions).toBe(20)
    expect(quiz.timeLimitMs).toBe(5000)
    expect(quiz.status).toBe('active')
    expect(quiz.needsCountdown).toBe(true)
    expect(quiz.results).toHaveLength(20)
    expect(quiz.results.every((r) => r === null)).toBe(true)
    expect(persisted()).toMatchObject({ sessionId: SESSION_ID, sessionToken: 'tok', totalScore: 0 })
  })

  it('hata olursa durum idle kalır ve hata yukarı fırlatılır', async () => {
    vi.mocked(createSession).mockRejectedValue(new Error('boom'))
    const quiz = useQuizStore()
    await expect(quiz.startSession('x')).rejects.toThrow('boom')
    expect(quiz.status).toBe('idle')
    expect(quiz.sessionId).toBeNull()
    expect(window.sessionStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('kayıt yoksa ya da bozuksa restore false döner', async () => {
    const quiz = useQuizStore()
    expect(await quiz.restore()).toBe(false)
    window.sessionStorage.setItem(STORAGE_KEY, '{bozuk')
    expect(await quiz.restore()).toBe(false)
    expect(window.sessionStorage.getItem(STORAGE_KEY)).toBeNull()
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ sessionId: 'eski-biçim' }))
    expect(await quiz.restore()).toBe(false)
  })

  it('reset durumu ve depolamayı temizler', async () => {
    vi.mocked(createSession).mockResolvedValue(created)
    const quiz = useQuizStore()
    await quiz.startSession('yapay-zeka')
    await quiz.reset()
    expect(quiz.sessionId).toBeNull()
    expect(quiz.results).toEqual([])
    expect(quiz.status).toBe('idle')
    expect(window.sessionStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})

describe('quiz store: soru ve cevap', () => {
  async function started() {
    vi.mocked(createSession).mockResolvedValue(created)
    const quiz = useQuizStore()
    await quiz.startSession('yapay-zeka')
    return quiz
  }

  it('loadCurrent soruyu, deadline’ı ve sunucu puanını alır; geri sayımı kapatır', async () => {
    const quiz = await started()
    vi.mocked(getCurrentQuestion).mockResolvedValue(makeCurrent(2, { total_score: 300 }))
    await quiz.loadCurrent()
    expect(getCurrentQuestion).toHaveBeenCalledWith(SESSION_ID, 'tok')
    expect(quiz.position).toBe(2)
    expect(quiz.currentQuestion?.id).toBe(102)
    expect(quiz.deadline).not.toBeNull()
    expect(quiz.serverTime).not.toBeNull()
    expect(quiz.totalScore).toBe(300)
    expect(quiz.needsCountdown).toBe(false)
  })

  it('submitAnswer cevabı aktif soru için gönderir, sonucu ve puanı işler, kalıcılaştırır', async () => {
    const quiz = await started()
    vi.mocked(getCurrentQuestion).mockResolvedValue(makeCurrent(0))
    await quiz.loadCurrent()
    vi.mocked(submitAnswer).mockResolvedValue(makeAnswer({ total_score: 168 }))

    const result = await quiz.submitAnswer(1001)
    expect(submitAnswer).toHaveBeenCalledWith(SESSION_ID, 'tok', 100, 1001)
    expect(result.points).toBe(168)
    expect(quiz.totalScore).toBe(168)
    expect(quiz.results[0]).toBe('correct')
    expect(quiz.results[1]).toBeNull()
    expect(persisted().results[0]).toBe('correct')
    expect(persisted().totalScore).toBe(168)
  })

  it('süre dolunca null gönderir ve timeout kaydeder', async () => {
    const quiz = await started()
    vi.mocked(getCurrentQuestion).mockResolvedValue(makeCurrent(0))
    await quiz.loadCurrent()
    vi.mocked(submitAnswer).mockResolvedValue(makeAnswer({ result: 'timeout', points: 0 }))
    await quiz.submitAnswer(null)
    expect(submitAnswer).toHaveBeenCalledWith(SESSION_ID, 'tok', 100, null)
    expect(quiz.results[0]).toBe('timeout')
  })

  it('son cevapta durum finished olur', async () => {
    const quiz = await started()
    vi.mocked(getCurrentQuestion).mockResolvedValue(makeCurrent(19))
    await quiz.loadCurrent()
    vi.mocked(submitAnswer).mockResolvedValue(makeAnswer({ is_last: true }))
    await quiz.submitAnswer(1)
    expect(quiz.status).toBe('finished')
  })

  it('aktif soru yokken cevap göndermeyi reddeder', async () => {
    const quiz = await started()
    await expect(quiz.submitAnswer(1)).rejects.toThrow('aktif soru')
    expect(submitAnswer).not.toHaveBeenCalled()
  })

  it('sayfa yenilenince oturum, skor ve sonuç şeridi geri yüklenir; geri sayım atlanır', async () => {
    const quiz = await started()
    vi.mocked(getCurrentQuestion).mockResolvedValue(makeCurrent(0))
    await quiz.loadCurrent()
    vi.mocked(submitAnswer).mockResolvedValue(makeAnswer({ result: 'wrong', total_score: 0 }))
    await quiz.submitAnswer(2)

    setActivePinia(createPinia()) // yenileme: bellekteki store sıfırlanır
    const fresh = useQuizStore()
    expect(fresh.sessionId).toBeNull()
    expect(await fresh.restore()).toBe(true)
    expect(fresh.sessionId).toBe(SESSION_ID)
    expect(fresh.sessionToken).toBe('tok')
    expect(fresh.results[0]).toBe('wrong')
    expect(fresh.position).toBe(1)
    expect(fresh.needsCountdown).toBe(false)
    expect(fresh.status).toBe('active')
  })
})
