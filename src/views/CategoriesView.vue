<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { toApiError } from '@/api/errors'
import { getCategories } from '@/api/endpoints'
import CategoryCard from '@/components/CategoryCard.vue'
import ErrorNotice from '@/components/ErrorNotice.vue'
import { useQuizStore } from '@/stores/quiz'
import type { Category } from '@/types'

const router = useRouter()
const quiz = useQuizStore()

const categories = ref<Category[]>([])
const loading = ref(true)
const loadError = ref<string | null>(null)
const startingSlug = ref<string | null>(null)
const startError = ref<string | null>(null)

async function load() {
  loading.value = true
  loadError.value = null
  try {
    categories.value = await getCategories()
  } catch (error) {
    loadError.value = toApiError(error).message
  } finally {
    loading.value = false
  }
}

async function select(category: Category) {
  if (startingSlug.value) return // çift tıklamayı engelle
  startingSlug.value = category.slug
  startError.value = null
  try {
    const sessionId = await quiz.startSession(category.slug)
    await router.push({ name: 'quiz', params: { sessionId } })
  } catch (error) {
    startError.value = toApiError(error).message
  } finally {
    startingSlug.value = null
  }
}

onMounted(load)
</script>

<template>
  <main class="flex flex-1 flex-col gap-6 py-4">
    <header class="flex items-center gap-3">
      <RouterLink
        to="/"
        class="inline-flex size-11 items-center justify-center rounded-(--radius-control) border border-border text-text-muted hover:bg-surface-raised hover:text-text"
        aria-label="Ana sayfaya dön"
      >
        <span aria-hidden="true">←</span>
      </RouterLink>
      <div>
        <h1 class="text-3xl">Kategori seç</h1>
        <p class="text-[13px] text-text-muted">Seçtiğin an quiz başlar.</p>
      </div>
    </header>

    <ErrorNotice v-if="loadError" :message="loadError" @retry="load" />

    <ul v-else-if="loading" class="flex flex-col gap-3" aria-label="Kategoriler yükleniyor">
      <li
        v-for="n in 5"
        :key="n"
        class="h-24 animate-pulse rounded-(--radius-card) border border-border bg-surface"
      />
    </ul>

    <template v-else>
      <ErrorNotice
        v-if="startError"
        :message="startError"
        retry-label="Tamam"
        @retry="startError = null"
      />
      <ul class="flex flex-col gap-3">
        <li v-for="category in categories" :key="category.slug">
          <CategoryCard
            :category="category"
            :loading="startingSlug === category.slug"
            :disabled="startingSlug !== null"
            @select="select"
          />
        </li>
      </ul>
    </template>
  </main>
</template>
