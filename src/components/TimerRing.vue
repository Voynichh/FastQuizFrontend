<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  remainingMs: number
  totalMs: number
}>()

const RADIUS = 46
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const secondsLeft = computed(() => Math.ceil(props.remainingMs / 1000))
const fraction = computed(() =>
  props.totalMs > 0 ? Math.min(1, Math.max(0, props.remainingMs / props.totalMs)) : 0,
)
const offset = computed(() => CIRCUMFERENCE * (1 - fraction.value))
// Son 2 saniyede uyarı rengine geçer ve hafifçe nabız atar
const urgent = computed(() => props.remainingMs > 0 && props.remainingMs <= 2000)
</script>

<template>
  <div
    class="relative size-28 shrink-0"
    :class="{ 'animate-pulse': urgent }"
    role="img"
    :aria-label="`Kalan süre: ${secondsLeft} saniye`"
    :data-urgent="urgent"
  >
    <svg viewBox="0 0 100 100" class="size-full -rotate-90" aria-hidden="true">
      <circle
        cx="50"
        cy="50"
        :r="RADIUS"
        fill="none"
        stroke="var(--color-surface-raised)"
        stroke-width="7"
      />
      <circle
        cx="50"
        cy="50"
        :r="RADIUS"
        fill="none"
        :stroke="urgent ? 'var(--color-warning)' : 'var(--accent, var(--color-primary))'"
        stroke-width="7"
        stroke-linecap="round"
        :stroke-dasharray="CIRCUMFERENCE"
        :stroke-dashoffset="offset"
      />
    </svg>
    <span
      class="absolute inset-0 flex items-center justify-center font-heading text-4xl font-bold tabular-nums"
      :class="urgent ? 'text-warning' : 'text-text'"
      aria-hidden="true"
    >
      {{ secondsLeft }}
    </span>
  </div>
</template>
