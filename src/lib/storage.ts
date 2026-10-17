/**
 * Tek depolama soyutlaması (şimdilik sessionStorage). Depolama arkasında değiştirilebilsin
 * diye API asenkron tutuldu.
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
