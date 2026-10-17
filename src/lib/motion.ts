/** Kullanıcı "hareketi azalt" tercih ettiyse true (matchMedia olmayan ortamlarda false). */
export function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false
}
