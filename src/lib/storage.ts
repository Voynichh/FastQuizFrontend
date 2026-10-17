/**
 * Tek depolama soyutlaması. Web'de sessionStorage kullanır; mobilde (Faz 8) aynı arayüz
 * @capacitor/preferences ile karşılanır, bu yüzden API asenkrondur.
 * Depolama kullanılamazsa (gizli sekme, kota) sessizce çalışmaya devam eder.
 */
export const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return window.sessionStorage.getItem(key)
    } catch {
      return null
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      window.sessionStorage.setItem(key, value)
    } catch {
      /* depolama yok: oturum yenilemeyi atlar */
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      window.sessionStorage.removeItem(key)
    } catch {
      /* yoksay */
    }
  },
}
