import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import CategoryCard from '@/components/CategoryCard.vue'

import { categories } from '../fixtures'

const category = categories[1]!

describe('CategoryCard', () => {
  it('ad, açıklama ve soru sayısını gösterir', () => {
    const wrapper = mount(CategoryCard, { props: { category } })
    expect(wrapper.text()).toContain('Yapay Zeka')
    expect(wrapper.text()).toContain('Makine öğrenmesi')
    expect(wrapper.text()).toContain('40 soru')
  })

  it('kategori rengini tema token’ından alır', () => {
    const wrapper = mount(CategoryCard, { props: { category } })
    expect(wrapper.attributes('style')).toContain('--accent: var(--color-cat-ai)')
  })

  it('tıklanınca kategoriyle select olayı yayar', async () => {
    const wrapper = mount(CategoryCard, { props: { category } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('select')).toEqual([[category]])
  })

  it('yüklenirken ya da devre dışıyken tıklamayı engeller', async () => {
    const loading = mount(CategoryCard, { props: { category, loading: true } })
    expect(loading.attributes('disabled')).toBeDefined()
    expect(loading.attributes('aria-busy')).toBe('true')
    await loading.trigger('click')
    expect(loading.emitted('select')).toBeUndefined()

    const disabled = mount(CategoryCard, { props: { category, disabled: true } })
    expect(disabled.attributes('disabled')).toBeDefined()
  })
})
