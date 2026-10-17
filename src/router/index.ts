import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { title: 'Ana sayfa' } },
    {
      path: '/kategoriler',
      name: 'categories',
      component: () => import('@/views/CategoriesView.vue'),
      meta: { title: 'Kategori seç' },
    },
    {
      path: '/quiz/:sessionId',
      name: 'quiz',
      component: () => import('@/views/QuizView.vue'),
      meta: { title: 'Quiz' },
    },
    {
      path: '/sonuc/:sessionId',
      name: 'result',
      component: () => import('@/views/ResultView.vue'),
      meta: { title: 'Sonuç' },
    },
    {
      path: '/skor-tablosu',
      name: 'leaderboard',
      component: () => import('@/views/LeaderboardView.vue'),
      meta: { title: 'Skor tablosu' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { title: 'Sayfa bulunamadı' },
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.afterEach((to) => {
  const title = typeof to.meta.title === 'string' ? to.meta.title : ''
  document.title = title ? `${title} · Fast Quiz` : 'Fast Quiz'
})

export default router
