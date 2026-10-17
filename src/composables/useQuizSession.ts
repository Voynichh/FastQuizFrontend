import { onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'

import { toApiError } from '@/api/errors'
import type { ChoiceState } from '@/components/ChoiceButton.vue'
import { useQuizStore } from '@/stores/quiz'
import type { AnswerResult } from '@/types'

import { useCountdown } from './useCountdown'

/** Doğru/yanlış geri bildiriminin ekranda kalma süresi */
export const FEEDBACK_MS = 800

export type Phase = 'loading' | 'countdown' | 'question' | 'feedback' | 'error'

export interface SessionError {
  message: string
  /** Oturum kurtarılamaz: yeni quiz başlatmak gerekir */
  fatal: boolean
  retry: (() => Promise<void>) | null
}

const FATAL_CODES = new Set(['invalid_session_token', 'not_found', 'session_abandoned'])

/**
 * Store ve API çağrılarını quiz ekranına bağlar: geri sayım → soru → cevap → geri bildirim
 * döngüsünü yönetir, çift tıklamayı engeller ve hataları (tek tekrar denemeden sonra)
 * kullanıcıya bildirir. Süre ve puan kararı sunucudadır.
 */
export function useQuizSession(sessionId: () => string) {
  const quiz = useQuizStore()
  const router = useRouter()

  const phase = ref<Phase>('loading')
  const selectedChoiceId = ref<number | null>(null)
  const feedback = ref<AnswerResult | null>(null)
  const error = ref<SessionError | null>(null)
  /** Cevap gönderildi; yeni soru gelene kadar şıklar kilitli */
  const busy = ref(false)
  /** Rota koruması: bilinçli çıkış/bitişte true olur */
  const allowLeave = ref(false)

  let disposed = false
  let feedbackTimer: ReturnType<typeof setTimeout> | undefined
  let feedbackWait: (() => void) | undefined

  const countdown = useCountdown({ onExpire: () => void answer(null) })

  function wait(ms: number) {
    return new Promise<void>((resolve) => {
      feedbackWait = resolve
      feedbackTimer = setTimeout(resolve, ms)
    })
  }

  async function init() {
    phase.value = 'loading'
    await quiz.restore()
    if (!quiz.sessionId || quiz.sessionId !== sessionId()) {
      fail({
        message: 'Quiz oturumu bulunamadı. Yeni bir quiz başlatabilirsin.',
        fatal: true,
        retry: null,
      })
      return
    }
    if (quiz.needsCountdown) {
      phase.value = 'countdown'
      return
    }
    await showQuestion()
  }

  function fail(value: SessionError) {
    countdown.stop()
    error.value = value
    phase.value = 'error'
  }

  /** Sıradaki soruyu sunucudan alır; süre sunucuda bu istekle başlar. */
  async function showQuestion() {
    if (phase.value !== 'feedback') phase.value = 'loading'
    try {
      const current = await quiz.loadCurrent()
      if (disposed) return
      selectedChoiceId.value = null
      feedback.value = null
      error.value = null
      busy.value = false
      phase.value = 'question'
      countdown.start(current.deadline, current.server_time, current.time_limit_ms)
    } catch (e) {
      await handleError(e, showQuestion)
    }
  }

  /** Şık seçildiğinde (ya da süre dolunca `null`) cevabı gönderir. */
  async function answer(choiceId: number | null) {
    if (busy.value || phase.value !== 'question') return
    busy.value = true
    selectedChoiceId.value = choiceId
    countdown.stop()
    await send(choiceId)
  }

  async function send(choiceId: number | null) {
    try {
      const result = await quiz.submitAnswer(choiceId)
      if (disposed) return
      feedback.value = result
      error.value = null
      phase.value = 'feedback'
      await wait(FEEDBACK_MS)
      if (disposed) return
      if (result.is_last) await goToResult()
      else await showQuestion()
    } catch (e) {
      await handleError(e, () => send(choiceId))
    }
  }

  async function handleError(e: unknown, retry: () => Promise<void>) {
    if (disposed) return
    const apiError = toApiError(e)
    if (apiError.code === 'session_completed') return goToResult()
    // Cevap sunucuya ulaşmış ama yanıt kaybolmuş olabilir: sunucudaki duruma göre devam et
    if (apiError.code === 'already_answered' || apiError.code === 'question_mismatch') {
      return showQuestion()
    }
    fail({
      message: apiError.message,
      fatal: FATAL_CODES.has(apiError.code),
      retry: FATAL_CODES.has(apiError.code) ? null : retry,
    })
  }

  async function goToResult() {
    allowLeave.value = true
    await router.replace({ name: 'result', params: { sessionId: sessionId() } })
  }

  /** Quizi bırakır: oturum bilgisi silinir, ana sayfaya dönülür. */
  async function exit() {
    allowLeave.value = true
    countdown.stop()
    await quiz.reset()
    await router.replace('/')
  }

  function choiceState(choiceId: number): ChoiceState {
    if (phase.value === 'feedback' && feedback.value) {
      if (choiceId === feedback.value.correct_choice_id) return 'correct'
      if (choiceId === selectedChoiceId.value && feedback.value.result === 'wrong') return 'wrong'
      return 'disabled'
    }
    if (phase.value === 'question' && !busy.value) return 'default'
    return choiceId === selectedChoiceId.value ? 'selected' : 'disabled'
  }

  onBeforeUnmount(() => {
    disposed = true
    clearTimeout(feedbackTimer)
    feedbackWait?.()
  })

  return {
    phase,
    error,
    feedback,
    selectedChoiceId,
    allowLeave,
    remainingMs: countdown.remainingMs,
    totalMs: countdown.totalMs,
    init,
    showQuestion,
    answer,
    exit,
    choiceState,
  }
}
