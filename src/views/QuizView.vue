<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'

import ChoiceButton from '@/components/ChoiceButton.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import CountdownOverlay from '@/components/CountdownOverlay.vue'
import ErrorNotice from '@/components/ErrorNotice.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import TimerRing from '@/components/TimerRing.vue'
import { useQuizSession } from '@/composables/useQuizSession'
import { useQuizStore } from '@/stores/quiz'

const LABELS = ['A', 'B', 'C', 'D']

const route = useRoute()
const quiz = useQuizStore()
const session = useQuizSession(() => String(route.params.sessionId))

const showExit = ref(false)

// Kategori rengi quiz boyunca ilerleme çubuğu, sayaç halkası ve vurgularda tekrar edilir
const accent = computed(() => ({
  '--accent': `var(--color-${quiz.category?.color ?? 'primary'})`,
}))

const feedbackText = computed(() => {
  const result = session.feedback.value
  if (!result) return ''
  if (result.result === 'correct') return `Doğru! +${result.points} puan`
  if (result.result === 'wrong') return 'Yanlış'
  return 'Süre doldu'
})

const feedbackTone = computed(() => {
  const result = session.feedback.value?.result
  if (result === 'correct') return 'text-success'
  if (result === 'wrong') return 'text-danger'
  return 'text-warning'
})

// Klavye: 1–4 veya A–D ile şık seçimi
function onKeydown(event: KeyboardEvent) {
  if (event.metaKey || event.ctrlKey || event.altKey || showExit.value) return
  const index = LABELS.findIndex(
    (label, i) => event.key === String(i + 1) || event.key.toUpperCase() === label,
  )
  const choice = quiz.currentQuestion?.choices[index]
  if (index >= 0 && choice) void session.answer(choice.id)
}

// Geri tuşu/rota değişimi: quizden çıkış onayı iste
onBeforeRouteLeave(() => {
  if (session.allowLeave.value) return true
  showExit.value = true
  return false
})

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  void session.init()
})

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <main :style="accent" class="flex flex-1 flex-col gap-4 py-2">
    <header class="flex items-center gap-3">
      <button
        type="button"
        class="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-(--radius-control) border border-border text-text-muted hover:bg-surface-raised hover:text-text"
        aria-label="Quizden çık"
        @click="showExit = true"
      >
        <span aria-hidden="true">✕</span>
      </button>
      <div class="min-w-0 flex-1">
        <p class="truncate text-[13px] font-medium text-(--accent)">{{ quiz.category?.name }}</p>
        <p class="text-[13px] text-text-muted">
          Soru
          <span class="font-semibold text-text tabular-nums">
            {{ Math.min(quiz.position + 1, quiz.totalQuestions) }}/{{ quiz.totalQuestions }}
          </span>
        </p>
      </div>
      <p class="text-right">
        <span class="block text-[13px] text-text-muted">Puan</span>
        <span class="font-heading text-2xl font-bold tabular-nums" data-testid="score">
          {{ quiz.totalScore }}
        </span>
      </p>
    </header>

    <ProgressBar
      v-if="quiz.totalQuestions > 0"
      :total="quiz.totalQuestions"
      :position="quiz.position"
      :results="quiz.results"
    />

    <CountdownOverlay v-if="session.phase.value === 'countdown'" @done="session.showQuestion" />

    <div
      v-else-if="session.phase.value === 'loading'"
      class="flex flex-1 items-center justify-center"
      role="status"
      aria-label="Yükleniyor"
    >
      <span class="size-10 animate-spin rounded-full border-4 border-border border-t-(--accent)" />
    </div>

    <div
      v-else-if="session.phase.value === 'error' && session.error.value"
      class="flex flex-col gap-4"
    >
      <ErrorNotice
        :message="session.error.value.message"
        :retry-label="session.error.value.fatal ? 'Ana sayfaya dön' : 'Tekrar dene'"
        @retry="session.error.value.retry ? session.error.value.retry() : session.exit()"
      />
    </div>

    <template v-else>
      <div class="flex justify-center">
        <TimerRing :remaining-ms="session.remainingMs.value" :total-ms="session.totalMs.value" />
      </div>

      <Transition name="question" mode="out-in">
        <section
          v-if="quiz.currentQuestion"
          :key="quiz.currentQuestion.id"
          class="flex flex-col gap-4"
        >
          <h1
            class="rounded-(--radius-card) border border-border bg-surface p-5 text-xl leading-snug font-semibold sm:text-2xl"
          >
            {{ quiz.currentQuestion.text }}
          </h1>
          <ul class="flex flex-col gap-3">
            <li v-for="(choice, index) in quiz.currentQuestion.choices" :key="choice.id">
              <ChoiceButton
                :label="LABELS[index] ?? String(index + 1)"
                :text="choice.text"
                :state="session.choiceState(choice.id)"
                @choose="session.answer(choice.id)"
              />
            </li>
          </ul>
        </section>
      </Transition>

      <p class="min-h-7 text-center text-lg font-semibold" :class="feedbackTone" aria-live="polite">
        {{ feedbackText }}
      </p>
    </template>

    <ConfirmDialog
      v-if="showExit"
      title="Quizden çıkılsın mı?"
      message="Çıkarsan bu quiz biter ve ilerlemen kaybolur. Süre sunucuda işlemeye devam eder."
      confirm-label="Evet, çık"
      cancel-label="Devam et"
      @cancel="showExit = false"
      @confirm="session.exit()"
    />
  </main>
</template>
