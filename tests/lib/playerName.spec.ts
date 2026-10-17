import { describe, expect, it } from 'vitest'

import { validatePlayerName } from '@/lib/playerName'

describe('validatePlayerName', () => {
  it.each([
    'Ece',
    '  Ece  ',
    'Çağrı Şen',
    'İpek',
    'ısı',
    'José',
    'Zoë',
    'ali_veli-99.x',
    'Ab',
    'a'.repeat(20),
  ])('%j geçerlidir', (name) => expect(validatePlayerName(name)).toBeNull())

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

  it.each([
    ['Kiril с', 'fuсk'],
    ['Kiril ѕ', 'ѕhit'],
    ['Kiril А', 'Аda'],
    ['Yunan Ρ', 'Ρaul'],
    ['tam genişlik Ａ', 'Ａda'],
    ['Arapça-Hint rakamı', 'ece٣'],
    ['sağdan sola geçersiz kılma', 'ece‮'],
    ['sıfır genişlikli boşluk', 'ec​e'],
  ])('Latin görünümlü başka yazı sistemi karakterlerini reddeder: %s', (_label, name) =>
    expect(validatePlayerName(name)).toContain('Latin'),
  )

  it('ayrışık (NFD) yazılmış aksanlı harfleri kabul eder ve uzunluğu birleşik biçimle sayar', () => {
    expect(validatePlayerName('Çağri')).toBeNull()
    // 20 birleşik karakter, NFD'de 22+ kod noktası olsa da geçerlidir
    expect(validatePlayerName('ç'.normalize('NFD').repeat(20))).toBeNull()
  })

  it('başıboş birleştirici işaretleri reddeder', () => {
    expect(validatePlayerName('Ecé̵́')).toContain('Yalnızca')
  })
})
