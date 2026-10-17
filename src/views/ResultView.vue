<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { toApiError } from '@/api/errors'
import AppButton from '@/components/AppButton.vue'
import ConfettiBurst from '@/components/ConfettiBurst.vue'
import ErrorNotice from '@/components/ErrorNotice.vue'
import NameForm from '@/components/NameForm.vue'
import ScoreCounter from '@/components/ScoreCounter.vue'
import { formatSeconds } from '@/lib/format'
import { useQuizStore } from '@/stores/quiz'

const route = useRoute()
const router = useRouter()
const quiz = useQuizStore()

const loading = ref(true)
const loadError = ref<{ message: string; fatal: boolean } | null>(null)
const saving = ref(false)
const saveError = ref<string | null>(null)
const showConfetti = ref(false)

const result = computed(() => quiz.result)
const accent = computed(() => ({
  '--accent': `var(--color-${quiz.category?.color ?? 'primary'})`,
}))

async function load() {
  loading.value = true
  loadError.value = null
  await quiz.restore()
  if (!quiz.sessionId || quiz.sessionId !== String(route.params.sessionId)) {
    loadError.value = { message: 'Sonuç bulunamadı. Yeni bir quiz başlatabilirsin.', fatal: true }
    loading.value = false
    return
  }
  try {
    await quiz.loadResult()
  } catch (e) {
    const error = toApiError(e)
    if (error.code === 'session_not_completed') {
      await router.replace({ name: 'quiz', params: { sessionId: quiz.sessionId } })
      return
    }
    const fatal = ['invalid_session_token', 'not_found', 'session_abandoned'].includes(error.code)
    loadError.value = { message: error.message, fatal }
  } finally {
    loading.value = false
  }
}

async function submit(name: string) {
  if (saving.value) return // çift gönderimi engelle
  saving.value = true
  saveError.value = null
  try {
    const saved = await quiz.saveScore(name)
    showConfetti.value = saved.in_top_10
  } catch (e) {
    const error = toApiError(e)
    const fieldErrors = error.details.player_name
    if (error.code === 'score_already_saved') {
      await quiz.loadResult() // başka bir denemede kaydedilmiş: durumu sunucudan al
    } else if (Array.isArray(fieldErrors) && typeof fieldErrors[0] === 'string') {
      saveError.value = fieldErrors[0]
    } else {
      saveError.value = error.message
    }
  } finally {
    saving.value = false
  }
}

async function showLeaderboard() {
  const slug = quiz.category?.slug
  await router.push({ name: 'leaderboard', query: slug ? { kategori: slug } : {} })
}

/** Oturumu bırakıp başka bir yere geçer (skor kaydedilmediyse puan kaybolur). */
async function leave(to: string) {
  await quiz.reset()
  await router.push(to)
}

const stats = computed(() =>
  result.value
    ? [
        {
          key: 'correct',
          label: 'Doğru',
          icon: '✓',
          tone: 'text-success',
          value: result.value.correct_count,
        },
        {
          key: 'wrong',
          label: 'Yanlış',
          icon: '✕',
          tone: 'text-danger',
          value: result.value.wrong_count,
        },
        {
          key: 'empty',
          label: 'Boş',
          icon: '–',
          tone: 'text-text-muted',
          value: result.value.empty_count,
        },
      ]
    : [],
)

onMounted(load)
</script>

<template>
  <main :style="accent" class="flex flex-1 flex-col gap-6 py-4">
    <ConfettiBurst v-if="showConfetti" @done="showConfetti = false" />

    <div
      v-if="loading"
      class="flex flex-1 items-center justify-center"
      role="status"
      aria-label="Yükleniyor"
    >
      <span class="size-10 animate-spin rounded-full border-4 border-border border-t-(--accent)" />
    </div>

    <div v-else-if="loadError" class="flex flex-col gap-4">
      <ErrorNotice
        :message="loadError.message"
        :retry-label="loadError.fatal ? 'Ana sayfaya dön' : 'Tekrar dene'"
        @retry="loadError.fatal ? leave('/') : load()"
      />
    </div>

    <template v-else-if="result">
      <header class="text-center">
        <p class="text-[13px] font-medium text-(--accent)">{{ result.category.name }}</p>
        <h1 class="text-3xl">Quiz bitti!</h1>
      </header>

      <section
        class="flex flex-col items-center gap-1 rounded-(--radius-card) border border-[color-mix(in_oklab,var(--accent)_35%,var(--color-border))] bg-surface py-8"
        aria-label="Toplam puan"
      >
        <p class="text-[13px] text-text-muted">Toplam puan</p>
        <p class="font-heading text-7xl font-bold text-(--accent)">
          <ScoreCounter :value="result.total_score" />
        </p>
        <p class="mt-2 text-[13px] text-text-muted">
          Ortalama cevap süresi:
          <span class="font-semibold text-text tabular-nums">{{
            formatSeconds(result.avg_response_ms)
          }}</span>
        </p>
      </section>

      <ul class="grid grid-cols-3 gap-3">
        <li
          v-for="stat in stats"
          :key="stat.key"
          class="flex flex-col items-center gap-1 rounded-(--radius-card) border border-border bg-surface py-4"
          :data-stat="stat.key"
        >
          <span class="text-2xl font-bold" :class="stat.tone" aria-hidden="true">{{
            stat.icon
          }}</span>
          <span class="font-heading text-3xl font-bold tabular-nums">{{ stat.value }}</span>
          <span class="text-[13px] text-text-muted">{{ stat.label }}</span>
        </li>
      </ul>

      <section v-if="result.score_saved" class="flex flex-col gap-4" aria-live="polite">
        <div class="rounded-(--radius-card) border border-success/40 bg-surface p-5 text-center">
          <p class="text-lg font-semibold text-success">
            <span aria-hidden="true">✓ </span>Skorun kaydedildi<template v-if="quiz.saved"
              >, {{ quiz.saved.playerName }}</template
            >!
          </p>
          <p class="mt-1 text-text-muted" data-testid="rank-text">
            Sıran: <span class="font-semibold text-text">#{{ result.estimated_rank }}</span>
            <template v-if="result.in_top_10"> · ilk 10'dasın 🎉</template>
          </p>
        </div>
        <AppButton class="w-full" @click="showLeaderboard">Skor tablosunu gör</AppButton>
        <AppButton variant="ghost" class="w-full" @click="leave('/kategoriler')"
          >Tekrar oyna</AppButton
        >
      </section>

      <section v-else class="flex flex-col gap-4">
        <p class="text-center text-text-muted" data-testid="rank-text">
          Tahmini sıran: <span class="font-semibold text-text">#{{ result.estimated_rank }}</span>
          <template v-if="result.in_top_10"> — ilk 10'a girebilirsin!</template>
        </p>
        <NameForm :loading="saving" :server-error="saveError" @submit="submit" />
        <div class="flex flex-col gap-3">
          <AppButton variant="ghost" class="w-full" @click="leave('/kategoriler')"
            >Tekrar oyna</AppButton
          >
          <AppButton variant="ghost" class="w-full" @click="leave('/')">Kaydetmeden çık</AppButton>
        </div>
      </section>
    </template>
  </main>
</template>
