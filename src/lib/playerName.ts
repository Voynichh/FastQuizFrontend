export const NAME_MIN = 2
export const NAME_MAX = 20

// Sunucuyla aynı kural: aksanlı Latin harfler (ç ğ ı ö ş ü é ...), ASCII rakamlar, boşluk ve _ - .
// Aksan atıldıktan sonraki temel karakter bu kümede olmalı; Kiril/Yunan gibi Latin'e benzeyen
// harfler (homoglif) reddedilir. Küfür denetimi yalnızca sunucudadır.
const ALLOWED_BASE = /^[A-Za-z0-9ıİ _.-]$/
const COMBINING_MARKS = /\p{M}/gu

function hasOnlyAllowedChars(name: string): boolean {
  return [...name].every((char) => {
    const base = char.normalize('NFD').replace(COMBINING_MARKS, '')
    return ALLOWED_BASE.test(base)
  })
}

/** Anlık doğrulama için hata mesajı döner; geçerliyse null. Nihai karar sunucudadır. */
export function validatePlayerName(raw: string): string | null {
  const name = raw.trim().normalize('NFC')
  if (name.length < NAME_MIN) return `İsim en az ${NAME_MIN} karakter olmalı.`
  if (name.length > NAME_MAX) return `İsim en fazla ${NAME_MAX} karakter olabilir.`
  if (!hasOnlyAllowedChars(name)) {
    return 'Yalnızca Latin harf, rakam, boşluk ve _ - . kullanabilirsin.'
  }
  return null
}
