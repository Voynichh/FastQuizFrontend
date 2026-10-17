import { describe, expect, it } from 'vitest'

import { validatePlayerName } from '@/lib/playerName'

describe('validatePlayerName', () => {
  it.each(['Ece', '  Ece  ', 'Çağrı Şen', 'ali_veli-99.x', 'Ab', 'a'.repeat(20)])(
    '%j geçerlidir',
    (name) => expect(validatePlayerName(name)).toBeNull(),
  )

  it.each(['', ' ', 'a', '  a  '])('%j çok kısadır', (name) =>
    expect(validatePlayerName(name)).toContain('en az 2'),
  )

  it('20 karakterden uzun isimleri reddeder', () => {
    expect(validatePlayerName('a'.repeat(21))).toContain('en fazla 20')
  })

  it.each(['Ece!', '<b>x</b>', 'ece@x', 'ece😀', 'a\nb'])(
    '%j izin verilmeyen karakter içerir',
    (name) => expect(validatePlayerName(name)).toContain('Yalnızca'),
  )
})
