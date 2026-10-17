import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ConfettiBurst from '@/components/ConfettiBurst.vue'
import LeaderboardTable from '@/components/LeaderboardTable.vue'
import NameForm from '@/components/NameForm.vue'
import ScoreCounter from '@/components/ScoreCounter.vue'
import { formatSeconds } from '@/lib/format'

import { makeEntries } from '../helpers'

function mockReducedMotion(reduce: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches: reduce,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  )
  window.matchMedia = globalThis.matchMedia
}

afterEach(() => {
  vi.unstubAllGlobals()
  // @ts-expect-error jsdom'da matchMedia yoktur; testlerin eklediğini temizle
  delete window.matchMedia
})

describe('formatSeconds', () => {
  it('Türkçe ondalık ayracıyla saniye gösterir', () => {
    expect(formatSeconds(1600)).toBe('1,6 sn')
    expect(formatSeconds(5000)).toBe('5,0 sn')
    expect(formatSeconds(0)).toBe('0,0 sn')
  })
})

describe('ScoreCounter', () => {
  beforeEach(() =>
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] }),
  )
  afterEach(() => vi.useRealTimers())

  it('0’dan hedef puana sayarak artar; ekran okuyucu her zaman son değeri okur', async () => {
    const wrapper = mount(ScoreCounter, { props: { value: 2310, durationMs: 1000 } })
    expect(wrapper.get('[data-testid="score-final"]').text()).toBe('2310')
    expect(wrapper.get('[data-testid="score-animated"]').attributes('aria-hidden')).toBe('true')

    await vi.advanceTimersByTimeAsync(300)
    const mid = Number(wrapper.get('[data-testid="score-animated"]').text())
    expect(mid).toBeGreaterThan(0)
    expect(mid).toBeLessThan(2310)

    await vi.advanceTimersByTimeAsync(1000)
    expect(wrapper.get('[data-testid="score-animated"]').text()).toBe('2310')
  })

  it('hareketi azalt tercihinde animasyonsuz son değeri gösterir', async () => {
    mockReducedMotion(true)
    const wrapper = mount(ScoreCounter, { props: { value: 800 } })
    await nextTick()
    expect(wrapper.get('[data-testid="score-animated"]').text()).toBe('800')
  })

  it('0 puanda animasyon başlatmaz', () => {
    const wrapper = mount(ScoreCounter, { props: { value: 0 } })
    expect(wrapper.get('[data-testid="score-animated"]').text()).toBe('0')
  })

  it('değer değişince yeniden sayar', async () => {
    const wrapper = mount(ScoreCounter, { props: { value: 100, durationMs: 500 } })
    await vi.advanceTimersByTimeAsync(600)
    await wrapper.setProps({ value: 400 })
    await vi.advanceTimersByTimeAsync(600)
    expect(wrapper.get('[data-testid="score-animated"]').text()).toBe('400')
  })
})

describe('NameForm', () => {
  it('geçerli ismi kırpılmış olarak gönderir', async () => {
    const wrapper = mount(NameForm)
    await wrapper.get('input').setValue('  Ece  ')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('submit')).toEqual([['Ece']])
  })

  it('boş ya da geçersiz isimde göndermez ve nedenini anında gösterir', async () => {
    const wrapper = mount(NameForm)
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.text()).toContain('en az 2 karakter')
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true')

    await wrapper.get('input').setValue('Ece!')
    expect(wrapper.text()).toContain('Yalnızca Latin harf, rakam')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeUndefined()

    await wrapper.get('input').setValue('Ece')
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('false')
    expect(wrapper.text()).not.toContain('✕')
  })

  it('sunucu hatasını gösterir, yüklenirken alanı ve butonu kilitler', async () => {
    const wrapper = mount(NameForm, { props: { serverError: 'Lütfen uygun bir isim seç.' } })
    expect(wrapper.text()).toContain('Lütfen uygun bir isim seç.')
    expect(wrapper.get('input').attributes('aria-invalid')).toBe('true')

    await wrapper.setProps({ loading: true, serverError: null })
    expect(wrapper.get('input').attributes('disabled')).toBeDefined()
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
  })
})

describe('ConfettiBurst', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('parçacıkları çizer ve süre sonunda done yayar', async () => {
    const wrapper = mount(ConfettiBurst, { props: { count: 10, durationMs: 1000 } })
    await nextTick()
    expect(wrapper.findAll('.confetti-piece')).toHaveLength(10)
    expect(wrapper.attributes('aria-hidden')).toBe('true')
    await vi.advanceTimersByTimeAsync(999)
    expect(wrapper.emitted('done')).toBeUndefined()
    await vi.advanceTimersByTimeAsync(2)
    expect(wrapper.emitted('done')).toHaveLength(1)
  })

  it('hareketi azalt tercihinde hiçbir şey çizmez', async () => {
    mockReducedMotion(true)
    const wrapper = mount(ConfettiBurst, { props: { count: 10 } })
    expect(wrapper.findAll('.confetti-piece')).toHaveLength(0)
    await vi.advanceTimersByTimeAsync(10)
    expect(wrapper.emitted('done')).toHaveLength(1)
  })
})

describe('LeaderboardTable', () => {
  const entries = makeEntries(5)

  it('her satırda sıra, isim, doğru sayısı ve puanı gösterir', () => {
    const wrapper = mount(LeaderboardTable, { props: { entries } })
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(5)
    expect(rows[0]!.text()).toContain('Ece')
    expect(rows[0]!.text()).toContain('18 doğru')
    expect(rows[0]!.text()).toContain('3000')
  })

  it('yalnızca ilk üç sıraya madalya rozeti verir', () => {
    const wrapper = mount(LeaderboardTable, { props: { entries } })
    expect(wrapper.findAll('[data-medal]').map((m) => m.attributes('data-medal'))).toEqual([
      'Altın',
      'Gümüş',
      'Bronz',
    ])
  })

  it('kategori sekmesinde isim, puan ve sıra eşleşen satırı vurgular', () => {
    const wrapper = mount(LeaderboardTable, {
      props: { entries, highlight: { playerName: 'Can', score: 2900, rank: 2 } },
    })
    const highlighted = wrapper.findAll('tr[data-highlight="true"]')
    expect(highlighted).toHaveLength(1)
    expect(highlighted[0]!.text()).toContain('Can')
    expect(highlighted[0]!.text()).toContain('Sen')
    expect(highlighted[0]!.attributes('aria-current')).toBe('true')
  })

  it('genel sekmede (rank: null) sıraya bakmadan isim ve puanla eşleştirir', () => {
    const wrapper = mount(LeaderboardTable, {
      props: { entries, highlight: { playerName: 'Can', score: 2900, rank: null } },
    })
    expect(wrapper.findAll('tr[data-highlight="true"]')).toHaveLength(1)
  })

  it('isim, puan ya da sıra uyuşmuyorsa vurgulamaz', () => {
    for (const highlight of [
      { playerName: 'Can', score: 1, rank: 2 },
      { playerName: 'Başka', score: 2900, rank: 2 },
      { playerName: 'Can', score: 2900, rank: 5 },
    ]) {
      const wrapper = mount(LeaderboardTable, { props: { entries, highlight } })
      expect(wrapper.findAll('tr[data-highlight="true"]')).toHaveLength(0)
    }
  })
})
