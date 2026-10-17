export const NAME_MIN = 2
export const NAME_MAX = 20

// Sunucuyla aynı kural: harf, rakam, boşluk ve _ - . (küfür denetimi yalnızca sunucuda)
const ALLOWED = /^[\p{L}\p{N}_ .-]+$/u

/** Anlık doğrulama için hata mesajı döner; geçerliyse null. Nihai karar sunucudadır. */
export function validatePlayerName(raw: string): string | null {
  const name = raw.trim()
  if (name.length < NAME_MIN) return `İsim en az ${NAME_MIN} karakter olmalı.`
  if (name.length > NAME_MAX) return `İsim en fazla ${NAME_MAX} karakter olabilir.`
  if (!ALLOWED.test(name)) return 'Yalnızca harf, rakam, boşluk ve _ - . kullanabilirsin.'
  return null
}
