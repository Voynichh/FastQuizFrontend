import type { Category } from '@/types'

export const categories: Category[] = [
  {
    slug: 'yazilim',
    name: 'Yazılım',
    description: 'Kod, diller ve yazılım geliştirme kültürü.',
    icon: 'code',
    color: 'cat-software',
    question_count: 40,
  },
  {
    slug: 'yapay-zeka',
    name: 'Yapay Zeka',
    description: 'Makine öğrenmesi, sinir ağları ve modern yapay zeka.',
    icon: 'brain',
    color: 'cat-ai',
    question_count: 40,
  },
]
