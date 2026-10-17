import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ChoiceButton from '@/components/ChoiceButton.vue'
import CountdownOverlay from '@/components/CountdownOverlay.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import TimerRing from '@/components/TimerRing.vue'
import type { Outcome } from '@/stores/quiz'

describe('TimerRing', () => {
  it('kalan saniyeyi yukarı yuvarlayarak gösterir', () => {
    const wrapper = mount(TimerRing, { props: { remainingMs: 3200, totalMs: 5000 } })
    expect(wrapper.text()).toBe('4')
    expect(wrapper.attributes('aria-label')).toBe('Kalan süre: 4 saniye')
    expect(wrapper.attributes('data-urgent')).toBe('false')
  })

  it('son 2 saniyede uyarı rengine geçer ve nabız atar', () => {
    const wrapper = mount(TimerRing, { props: { remainingMs: 1900, totalMs: 5000 } })
    expect(wrapper.attributes('data-urgent')).toBe('true')
    expect(wrapper.classes()).toContain('animate-pulse')
    expect(wrapper.findAll('circle')[1]!.attributes('stroke')).toBe('var(--color-warning)')
  })

  it('tam süre varken halka dolu, süre bitince boştur', () => {
    const full = mount(TimerRing, { props: { remainingMs: 5000, totalMs: 5000 } })
    expect(Number(full.findAll('circle')[1]!.attributes('stroke-dashoffset'))).toBe(0)
    const empty = mount(TimerRing, { props: { remainingMs: 0, totalMs: 5000 } })
    const circumference = Number(empty.findAll('circle')[1]!.attributes('stroke-dasharray'))
    expect(Number(empty.findAll('circle')[1]!.attributes('stroke-dashoffset'))).toBeCloseTo(
      circumference,
    )
    expect(empty.attributes('data-urgent')).toBe('false')
  })
})

describe('ProgressBar', () => {
  const results: (Outcome | null)[] = ['correct', 'wrong', 'timeout', null, null]

  it('her soru için bir parça çizer ve durumları renkle/öznitelikle belirtir', () => {
    const wrapper = mount(ProgressBar, { props: { total: 5, position: 3, results } })
    const states = wrapper.findAll('[data-state]').map((s) => s.attributes('data-state'))
    expect(states).toEqual(['doğru', 'yanlış', 'boş', 'aktif', 'bekliyor'])
    expect(wrapper.findAll('span')[0]!.classes()).toContain('bg-success')
    expect(wrapper.findAll('span')[1]!.classes()).toContain('bg-danger')
    expect(wrapper.findAll('span')[2]!.classes()).toContain('bg-text-muted')
  })

  it('erişilebilir ilerleme bilgisi verir', () => {
    const wrapper = mount(ProgressBar, { props: { total: 20, position: 3, results: [] } })
    expect(wrapper.attributes('role')).toBe('progressbar')
    expect(wrapper.attributes('aria-valuenow')).toBe('4')
    expect(wrapper.attributes('aria-valuemax')).toBe('20')
  })
})

describe('ChoiceButton', () => {
  it('varsayılan durumda tıklanınca choose yayar', async () => {
    const wrapper = mount(ChoiceButton, { props: { label: 'A', text: 'Cevap' } })
    expect(wrapper.text()).toContain('A')
    expect(wrapper.text()).toContain('Cevap')
    await wrapper.trigger('click')
    expect(wrapper.emitted('choose')).toHaveLength(1)
  })

  it.each(['selected', 'correct', 'wrong', 'disabled'] as const)(
    '%s durumunda kilitlidir ve tıklanınca olay yaymaz',
    async (state) => {
      const wrapper = mount(ChoiceButton, { props: { label: 'B', text: 'x', state } })
      expect(wrapper.attributes('disabled')).toBeDefined()
      expect(wrapper.attributes('data-state')).toBe(state)
      await wrapper.trigger('click')
      expect(wrapper.emitted('choose')).toBeUndefined()
    },
  )

  it('doğru ve yanlış durumlarını renkle birlikte simgeyle de gösterir', () => {
    const correct = mount(ChoiceButton, { props: { label: 'A', text: 'x', state: 'correct' } })
    expect(correct.text()).toContain('✓')
    const wrong = mount(ChoiceButton, { props: { label: 'A', text: 'x', state: 'wrong' } })
    expect(wrong.text()).toContain('✕')
    expect(wrong.classes()).toContain('animate-shake')
    const plain = mount(ChoiceButton, { props: { label: 'A', text: 'x' } })
    expect(plain.text()).not.toMatch(/[✓✕]/)
  })
})

describe('CountdownOverlay', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('3-2-1 sayar ve bitince done yayar', async () => {
    const wrapper = mount(CountdownOverlay, { props: { stepMs: 100 } })
    expect(wrapper.text()).toContain('3')
    await vi.advanceTimersByTimeAsync(100)
    expect(wrapper.text()).toContain('2')
    await vi.advanceTimersByTimeAsync(100)
    expect(wrapper.text()).toContain('1')
    expect(wrapper.emitted('done')).toBeUndefined()
    await vi.advanceTimersByTimeAsync(100)
    expect(wrapper.emitted('done')).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(1000)
    expect(wrapper.emitted('done')).toHaveLength(1)
  })

  it('kaldırılırsa zamanlayıcıyı temizler', async () => {
    const wrapper = mount(CountdownOverlay, { props: { stepMs: 100 } })
    wrapper.unmount()
    await vi.advanceTimersByTimeAsync(1000)
    expect(wrapper.emitted('done')).toBeUndefined()
  })
})
