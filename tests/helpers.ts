import type { AnswerResult, CurrentQuestion } from '@/types'

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
