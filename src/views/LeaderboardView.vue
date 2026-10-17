<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { getCategories, getLeaderboard } from '@/api/endpoints'
import { toApiError } from '@/api/errors'
import AppButton from '@/components/AppButton.vue'
import ErrorNotice from '@/components/ErrorNotice.vue'
import LeaderboardTable, { type RowHighlight } from '@/components/LeaderboardTable.vue'
import { useQuizStore } from '@/stores/quiz'
import type { Category, LeaderboardEntry } from '@/types'

const route = useRoute()
const router = useRouter()
const quiz = useQuizStore()

const categories = ref<Category[]>([])
const entries = ref<LeaderboardEntry[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

// Seçili sekme URL'de tutulur (?kategori=slug); yoksa genel tablo
const selected = computed(() =>
  typeof route.query.kategori === 'string' && route.query.kategori ? route.query.kategori : null,
)

const tabs = computed(() => [
  { slug: null as string | null, label: 'Genel', color: 'primary' },
  ...categories.value.map((c) => ({
    slug: c.slug as string | null,
    label: c.name,
    color: c.color,
  })),
])

const accent = computed(() => {
  const color = tabs.value.find((t) => t.slug === selected.value)?.color ?? 'primary'
  return { '--accent': `var(--color-${color})` }
})

// Kullanıcının kaydettiği skor listedeyse satır vurgulanır
const highlight = computed<RowHighlight | null>(() => {
  const saved = quiz.saved
  if (!saved) return null
  if (selected.value && selected.value !== saved.categorySlug) return null
  return {
    playerName: saved.playerName,
    score: saved.score,
    rank: selected.value ? saved.rank : null,
  }
})

let requestId = 0

async function loadBoard() {
  const current = ++requestId
  loading.value = true
  error.value = null
  try {
    const board = await getLeaderboard(selected.value ?? undefined)
    if (current !== requestId) return // daha yeni bir istek var, bunu yok say
    entries.value = board.entries
  } catch (e) {
    if (current !== requestId) return
    error.value = toApiError(e).message
    entries.value = []
  } finally {
    if (current === requestId) loading.value = false
  }
}

async function loadCategories() {
  try {
    categories.value = await getCategories()
  } catch {
    // Sekmeler olmadan da genel tablo gösterilebilir; hata tablo isteğinde bildirilir
  }
}

function selectTab(slug: string | null) {
  if (slug === selected.value) return
  void router.replace({ query: slug ? { kategori: slug } : {} })
}

watch(selected, loadBoard)

onMounted(async () => {
  await quiz.restore() // vurgulama için kaydedilmiş skoru geri yükle
  void loadCategories()
  await loadBoard()
})
</script>

<template>
  <main :style="accent" class="flex flex-1 flex-col gap-5 py-4">
    <header class="flex items-center gap-3">
      <RouterLink
        to="/"
        class="inline-flex size-11 items-center justify-center rounded-(--radius-control) border border-border text-text-muted hover:bg-surface-raised hover:text-text"
        aria-label="Ana sayfaya dön"
      >
        <span aria-hidden="true">←</span>
      </RouterLink>
      <div>
        <h1 class="text-3xl">Skor tablosu</h1>
        <p class="text-[13px] text-text-muted">En yüksek 10 puan</p>
      </div>
    </header>

    <div
      class="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]"
      role="tablist"
      aria-label="Kategori seç"
    >
      <button
        v-for="tab in tabs"
        :key="tab.slug ?? 'genel'"
        type="button"
        role="tab"
        :aria-selected="tab.slug === selected"
        class="min-h-11 shrink-0 cursor-pointer rounded-full border px-4 text-[15px] font-medium whitespace-nowrap transition-colors duration-150"
        :class="
          tab.slug === selected
            ? 'border-(--accent) bg-[color-mix(in_oklab,var(--accent)_18%,transparent)] text-text'
            : 'border-border text-text-muted hover:bg-surface-raised hover:text-text'
        "
        @click="selectTab(tab.slug)"
      >
        {{ tab.label }}
      </button>
    </div>

    <ErrorNotice v-if="error" :message="error" @retry="loadBoard" />

    <ul v-else-if="loading" class="flex flex-col gap-2" aria-label="Skor tablosu yükleniyor">
      <li
        v-for="n in 5"
        :key="n"
        class="h-16 animate-pulse rounded-(--radius-control) border border-border bg-surface"
      />
    </ul>

    <div
      v-else-if="entries.length === 0"
      class="flex flex-col items-center gap-4 rounded-(--radius-card) border border-border bg-surface px-4 py-10 text-center"
    >
      <p class="text-lg font-semibold">Henüz skor yok</p>
      <p class="text-text-muted">İlk sen ol ve tabloya adını yazdır!</p>
      <AppButton to="/kategoriler">Quize başla</AppButton>
    </div>

    <LeaderboardTable v-else :entries="entries" :highlight="highlight" />
  </main>
</template>
