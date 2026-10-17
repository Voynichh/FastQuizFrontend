import axios from 'axios'

import { getClientType } from '@/lib/platform'

import { toApiError } from './errors'

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    /** Ağ hatasında yapılan tek otomatik yeniden denemeyi işaretler */
    __retried?: boolean
  }
}

/** Tüm API çağrıları bu tek istemci üzerinden geçer. */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 8000,
  headers: {
    'X-Client': getClientType(),
    'X-Client-Version': __APP_VERSION__,
  },
})

http.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const config = axios.isAxiosError(error) ? error.config : undefined
    // Ağ hatasında (yanıt yok) bir kez yeniden dene, sonra "Bağlantı sorunu" olarak bildir
    if (axios.isAxiosError(error) && !error.response && config && !config.__retried) {
      config.__retried = true
      return http.request(config)
    }
    throw toApiError(error)
  },
)
