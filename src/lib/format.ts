/** Milisaniyeyi "1,6 sn" biçiminde (Türkçe ondalık ayracıyla) gösterir. */
export function formatSeconds(ms: number): string {
  const seconds = (ms / 1000).toLocaleString('tr-TR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
  return `${seconds} sn`
}
