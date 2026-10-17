import { defineStore } from 'pinia'
import { ref } from 'vue'

import { createSession } from '@/api/endpoints'
import { storage } from '@/lib/storage'
import type { CategoryBrief } from '@/types'

const STORAGE_KEY = 'fastquiz.session'

export type QuizStatus = 'idle' | 'starting' | 'active'

interface PersistedSession {
  sessionId: string
  sessionToken: string
  category: CategoryBrief
  totalQuestions: number
  timeLimitMs: number
}

/**
 * Quiz oturumu durumu. Bu fazda yalnızca oturum açma ve yenilemeye dayanıklılık var;
 * soru/cevap/skor durumu ve aksiyonları (loadCurrent, submitAnswer, saveScore) Faz 5–6'da eklenir.
 */
export const useQuizStore = defineStore('quiz', () => {
  const sessionId = ref<string | null>(null)
  const sessionToken = ref<string | null>(null)
  const category = ref<CategoryBrief | null>(null)
  const totalQuestions = ref(0)
  const timeLimitMs = ref(0)
  const status = ref<QuizStatus>('idle')

  function apply(session: PersistedSession) {
    sessionId.value = session.sessionId
    sessionToken.value = session.sessionToken
    category.value = session.category
    totalQuestions.value = session.totalQuestions
    timeLimitMs.value = session.timeLimitMs
    status.value = 'active'
  }

  /** Kategori için sunucuda yeni oturum açar. Hata olursa fırlatır, durum `idle` kalır. */
  async function startSession(slug: string): Promise<string> {
    status.value = 'starting'
    try {
      const created = await createSession(slug)
      const session: PersistedSession = {
        sessionId: created.session_id,
        sessionToken: created.session_token,
        category: created.category,
        totalQuestions: created.total_questions,
        timeLimitMs: created.time_limit_ms,
      }
      apply(session)
      await storage.setItem(STORAGE_KEY, JSON.stringify(session))
      return session.sessionId
    } catch (error) {
      status.value = 'idle'
      throw error
    }
  }

  /** Sayfa yenilenince kayıtlı oturumu geri yükler; yoksa false döner. */
  async function restore(): Promise<boolean> {
    if (status.value === 'active') return true
    const raw = await storage.getItem(STORAGE_KEY)
    if (!raw) return false
    try {
      apply(JSON.parse(raw) as PersistedSession)
      return true
    } catch {
      await storage.removeItem(STORAGE_KEY)
      return false
    }
  }

  async function reset() {
    sessionId.value = null
    sessionToken.value = null
    category.value = null
    totalQuestions.value = 0
    timeLimitMs.value = 0
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
    startSession,
    restore,
    reset,
  }
})
