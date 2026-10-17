import { defineStore } from 'pinia'
import { ref } from 'vue'

import {
  createSession,
  getCurrentQuestion,
  submitAnswer as submitAnswerRequest,
} from '@/api/endpoints'
import { storage } from '@/lib/storage'
import type { AnswerResult, CategoryBrief, CurrentQuestion } from '@/types'

const STORAGE_KEY = 'fastquiz.session'

export type QuizStatus = 'idle' | 'starting' | 'active' | 'finished'
export type Outcome = AnswerResult['result']

export interface QuestionView {
  id: number
  text: string
  choices: { id: number; text: string }[]
}

interface PersistedSession {
  sessionId: string
  sessionToken: string
  category: CategoryBrief
  totalQuestions: number
  timeLimitMs: number
  totalScore: number
  results: (Outcome | null)[]
}

/**
 * Quiz oturumu durumu. Soru, süre ve puan sunucudan gelir; burada yalnızca gösterim için
 * saklanır. `sessionId`, `sessionToken`, skor ve sonuç şeridi sayfa yenilemeye dayanıklı olması
 * için depolamaya yazılır (aktif soru yenilemede `loadCurrent` ile sunucudan alınır).
 */
export const useQuizStore = defineStore('quiz', () => {
  const sessionId = ref<string | null>(null)
  const sessionToken = ref<string | null>(null)
  const category = ref<CategoryBrief | null>(null)
  const totalQuestions = ref(0)
  const timeLimitMs = ref(0)
  const status = ref<QuizStatus>('idle')

  const position = ref(0)
  const currentQuestion = ref<QuestionView | null>(null)
  const deadline = ref<string | null>(null)
  const serverTime = ref<string | null>(null)
  const totalScore = ref(0)
  /** Soru sırasına göre sonuçlar; henüz cevaplanmamış/bilinmeyenler null */
  const results = ref<(Outcome | null)[]>([])
  /** Yeni açılan oturumda quiz öncesi 3-2-1 gösterilir, yenilemede gösterilmez */
  const needsCountdown = ref(false)

  function apply(session: PersistedSession) {
    sessionId.value = session.sessionId
    sessionToken.value = session.sessionToken
    category.value = session.category
    totalQuestions.value = session.totalQuestions
    timeLimitMs.value = session.timeLimitMs
    totalScore.value = session.totalScore
    results.value = session.results
    position.value = session.results.findIndex((r) => r === null)
    if (position.value < 0) position.value = session.results.length
    status.value = 'active'
  }

  async function persist() {
    if (!sessionId.value || !sessionToken.value || !category.value) return
    const session: PersistedSession = {
      sessionId: sessionId.value,
      sessionToken: sessionToken.value,
      category: category.value,
      totalQuestions: totalQuestions.value,
      timeLimitMs: timeLimitMs.value,
      totalScore: totalScore.value,
      results: results.value,
    }
    await storage.setItem(STORAGE_KEY, JSON.stringify(session))
  }

  function requireSession() {
    if (!sessionId.value || !sessionToken.value) throw new Error('Aktif quiz oturumu yok.')
    return { id: sessionId.value, token: sessionToken.value }
  }

  /** Kategori için sunucuda yeni oturum açar. Hata olursa fırlatır, durum `idle` kalır. */
  async function startSession(slug: string): Promise<string> {
    status.value = 'starting'
    try {
      const created = await createSession(slug)
      apply({
        sessionId: created.session_id,
        sessionToken: created.session_token,
        category: created.category,
        totalQuestions: created.total_questions,
        timeLimitMs: created.time_limit_ms,
        totalScore: 0,
        results: Array.from({ length: created.total_questions }, () => null),
      })
      currentQuestion.value = null
      deadline.value = null
      serverTime.value = null
      needsCountdown.value = true
      await persist()
      return created.session_id
    } catch (error) {
      status.value = 'idle'
      throw error
    }
  }

  /** Sayfa yenilenince kayıtlı oturumu geri yükler; yoksa false döner. */
  async function restore(): Promise<boolean> {
    if (sessionId.value) return true
    const raw = await storage.getItem(STORAGE_KEY)
    if (!raw) return false
    try {
      const session = JSON.parse(raw) as PersistedSession
      if (!Array.isArray(session.results)) throw new Error('eski biçim')
      apply(session)
      needsCountdown.value = false
      return true
    } catch {
      await storage.removeItem(STORAGE_KEY)
      return false
    }
  }

  /** Sıradaki soruyu alır ve sunucuda süreyi başlatır (tekrar çağrıda aynı deadline döner). */
  async function loadCurrent(): Promise<CurrentQuestion> {
    const { id, token } = requireSession()
    const current = await getCurrentQuestion(id, token)
    position.value = current.position
    currentQuestion.value = current.question
    deadline.value = current.deadline
    serverTime.value = current.server_time
    timeLimitMs.value = current.time_limit_ms
    totalScore.value = current.total_score
    needsCountdown.value = false
    await persist()
    return current
  }

  /** Aktif soruya cevap gönderir; `null` süre dolduğunu bildirir. Puanı sunucu belirler. */
  async function submitAnswer(choiceId: number | null): Promise<AnswerResult> {
    const { id, token } = requireSession()
    const question = currentQuestion.value
    if (!question) throw new Error('Cevaplanacak aktif soru yok.')
    const result = await submitAnswerRequest(id, token, question.id, choiceId)
    results.value = results.value.map((r, i) => (i === position.value ? result.result : r))
    totalScore.value = result.total_score
    if (result.is_last) status.value = 'finished'
    await persist()
    return result
  }

  async function reset() {
    sessionId.value = null
    sessionToken.value = null
    category.value = null
    totalQuestions.value = 0
    timeLimitMs.value = 0
    position.value = 0
    currentQuestion.value = null
    deadline.value = null
    serverTime.value = null
    totalScore.value = 0
    results.value = []
    needsCountdown.value = false
    status.value = 'idle'
    await storage.removeItem(STORAGE_KEY)
  }

  return {
    sessionId,
    sessionToken,
    category,
    totalQuestions,
    timeLimitMs,
    status,
    position,
    currentQuestion,
    deadline,
    serverTime,
    totalScore,
    results,
    needsCountdown,
    startSession,
    restore,
    loadCurrent,
    submitAnswer,
    reset,
  }
})
