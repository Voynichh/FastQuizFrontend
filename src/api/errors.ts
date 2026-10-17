import { isAxiosError } from 'axios'

export class ApiRequestError extends Error {
  readonly code: string
  readonly status: number | null
  readonly details: Record<string, unknown>

  constructor(code: string, message: string, status: number | null = null, details = {}) {
    super(message)
    this.name = 'ApiRequestError'
    this.code = code
    this.status = status
    this.details = details
  }

  get isNetworkError(): boolean {
    return this.code === 'network_error'
  }
}

const NETWORK_MESSAGE = 'Bağlantı sorunu. İnternetini kontrol edip tekrar dene.'

/** Backend'in tek hata formatını ({error: {code, message, details}}) tek tipe çevirir. */
export function toApiError(error: unknown): ApiRequestError {
  if (error instanceof ApiRequestError) return error
  if (!isAxiosError(error)) {
    return new ApiRequestError('unknown_error', 'Beklenmeyen bir hata oluştu.')
  }
  if (!error.response) {
    return new ApiRequestError('network_error', NETWORK_MESSAGE)
  }
  const body = error.response.data?.error
  if (body && typeof body.code === 'string') {
    return new ApiRequestError(body.code, body.message, error.response.status, body.details ?? {})
  }
  return new ApiRequestError('unknown_error', 'Beklenmeyen bir hata oluştu.', error.response.status)
}
