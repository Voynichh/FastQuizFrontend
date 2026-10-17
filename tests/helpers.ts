import type { AnswerResult, CurrentQuestion, LeaderboardEntry, SessionResult } from '@/types'

export const SESSION_ID = 'sess-1'

/** Sunucunun GET /current/ yanıtı: süre şimdi başlar, 5 sn sonra biter. */
export function makeCurrent(position: number, overrides: Partial<CurrentQuestion> = {}) {
  const now = Date.now()
  const questionId = 100 + position
  const current: CurrentQuestion = {
    position,
    total_questions: 20,
    question: {
      id: questionId,
      text: `Soru ${position + 1}?`,
      choices: [1, 2, 3, 4].map((n) => ({ id: questionId * 10 + n, text: `Şık ${n}` })),
    },
    time_limit_ms: 5000,
    server_time: new Date(now).toISOString(),
    deadline: new Date(now + 5000).toISOString(),
    total_score: 0,
    ...overrides,
  }
  return current
}

export function makeAnswer(overrides: Partial<AnswerResult> = {}) {
  const answer: AnswerResult = {
    result: 'correct',
    correct_choice_id: 1001,
    points: 168,
    response_ms: 1600,
    total_score: 168,
    is_last: false,
    ...overrides,
  }
  return answer
}

export const created = {
  session_id: SESSION_ID,
  session_token: 'tok',
  category: { slug: 'yapay-zeka', name: 'Yapay Zeka', icon: 'brain', color: 'cat-ai' },
  total_questions: 20,
  time_limit_ms: 5000,
}

export function makeResult(overrides: Partial<SessionResult> = {}) {
  const result: SessionResult = {
    category: created.category,
    total_questions: 20,
    total_score: 2310,
    correct_count: 15,
    wrong_count: 3,
    empty_count: 2,
    avg_response_ms: 1600,
    estimated_rank: 4,
    in_top_10: true,
    score_saved: false,
    ...overrides,
  }
  return result
}

export function makeEntries(count = 3): LeaderboardEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    rank: i + 1,
    player_name: ['Ece', 'Can', 'Deniz', 'Ada', 'Mert'][i % 5]!,
    score: 3000 - i * 100,
    correct_count: 18 - i,
    avg_response_ms: 1500 + i * 100,
    created_at: '2026-10-17T08:00:00.000Z',
  }))
}

/** Yenilenmiş sayfayı taklit eder: store'un okuyacağı kayıtlı oturumu sessionStorage'a yazar. */
export function seedSession(extra: Record<string, unknown> = {}) {
  window.sessionStorage.setItem(
    'fastquiz.session',
    JSON.stringify({
      sessionId: SESSION_ID,
      sessionToken: 'tok',
      category: created.category,
      totalQuestions: 20,
      timeLimitMs: 5000,
      totalScore: 2310,
      results: Array.from({ length: 20 }, () => 'correct'),
      ...extra,
    }),
  )
}
