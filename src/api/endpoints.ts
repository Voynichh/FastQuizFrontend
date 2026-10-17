import type {
  AnswerResult,
  Category,
  CurrentQuestion,
  Leaderboard,
  ScoreSaved,
  SessionCreated,
  SessionResult,
} from '@/types'

import { http } from './client'

const tokenHeader = (token: string) => ({ headers: { 'X-Session-Token': token } })

export async function getCategories(): Promise<Category[]> {
  const { data } = await http.get<{ categories: Category[] }>('/categories/')
  return data.categories
}

export async function createSession(categorySlug: string): Promise<SessionCreated> {
  const { data } = await http.post<SessionCreated>('/sessions/', { category: categorySlug })
  return data
}

export async function getCurrentQuestion(
  sessionId: string,
  token: string,
): Promise<CurrentQuestion> {
  const { data } = await http.get<CurrentQuestion>(
    `/sessions/${sessionId}/current/`,
    tokenHeader(token),
  )
  return data
}

export async function submitAnswer(
  sessionId: string,
  token: string,
  questionId: number,
  choiceId: number | null,
): Promise<AnswerResult> {
  const { data } = await http.post<AnswerResult>(
    `/sessions/${sessionId}/answers/`,
    { question_id: questionId, choice_id: choiceId },
    tokenHeader(token),
  )
  return data
}

export async function getResult(sessionId: string, token: string): Promise<SessionResult> {
  const { data } = await http.get<SessionResult>(
    `/sessions/${sessionId}/result/`,
    tokenHeader(token),
  )
  return data
}

export async function saveScore(
  sessionId: string,
  token: string,
  playerName: string,
): Promise<ScoreSaved> {
  const { data } = await http.post<ScoreSaved>(
    `/sessions/${sessionId}/score/`,
    { player_name: playerName },
    tokenHeader(token),
  )
  return data
}

export async function getLeaderboard(categorySlug?: string): Promise<Leaderboard> {
  const { data } = await http.get<Leaderboard>('/leaderboard/', {
    params: categorySlug ? { category: categorySlug } : undefined,
  })
  return data
}
