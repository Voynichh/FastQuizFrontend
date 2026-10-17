<script setup lang="ts">
import type { Outcome } from '@/stores/quiz'

defineProps<{
  total: number
  /** 0 tabanlı aktif soru sırası */
  position: number
  results: (Outcome | null)[]
}>()

const OUTCOME_CLASS: Record<Outcome, string> = {
  correct: 'bg-success',
  wrong: 'bg-danger',
  timeout: 'bg-text-muted',
}

const OUTCOME_LABEL: Record<Outcome, string> = {
  correct: 'doğru',
  wrong: 'yanlış',
  timeout: 'boş',
}
</script>

<template>
  <div
    class="flex gap-1"
    role="progressbar"
    aria-label="Quiz ilerlemesi"
    :aria-valuemin="1"
    :aria-valuemax="total"
    :aria-valuenow="Math.min(position + 1, total)"
    :aria-valuetext="`${Math.min(position + 1, total)}. soru, toplam ${total}`"
  >
    <span
      v-for="(_, index) in total"
      :key="index"
      class="h-2 flex-1 rounded-full transition-colors duration-200"
      :class="
        results[index]
          ? OUTCOME_CLASS[results[index]!]
          : index === position
            ? 'bg-(--accent)'
            : 'bg-surface-raised'
      "
      :data-state="
        results[index] ? OUTCOME_LABEL[results[index]!] : index === position ? 'aktif' : 'bekliyor'
      "
    />
  </div>
</template>
