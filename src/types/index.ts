import type { components } from './api'

// OpenAPI şemasından (openapi/schema.yml → npm run gen:api) üretilen tiplerin kısa adları.
type Schemas = components['schemas']

export type Category = Schemas['Category']
export type CategoryBrief = Schemas['CategoryBrief']
export type SessionCreated = Schemas['SessionCreated']
export type CurrentQuestion = Schemas['CurrentQuestion']
export type AnswerRequest = Schemas['AnswerRequest']
export type AnswerResult = Schemas['AnswerResult']
export type SessionResult = Schemas['SessionResult']
export type ScoreSaved = Schemas['ScoreSaved']
export type Leaderboard = Schemas['Leaderboard']
export type LeaderboardEntry = Schemas['LeaderboardEntry']

export type ClientType = 'web' | 'ios' | 'android'
