<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { prefersReducedMotion } from '@/lib/motion'

const props = withDefaults(defineProps<{ value: number; durationMs?: number }>(), {
  durationMs: 1200,
})

const shown = ref(0)
let frame = 0

function run() {
  cancelAnimationFrame(frame)
  if (prefersReducedMotion() || props.durationMs <= 0 || props.value <= 0) {
    shown.value = props.value
    return
  }
  const start = performance.now()
  const tick = () => {
    const t = Math.min(1, (performance.now() - start) / props.durationMs)
    shown.value = Math.round(props.value * (1 - (1 - t) ** 3)) // ease-out
    if (t < 1) frame = requestAnimationFrame(tick)
  }
  frame = requestAnimationFrame(tick)
}

onMounted(run)
watch(() => props.value, run)
onBeforeUnmount(() => cancelAnimationFrame(frame))
</script>

<template>
  <span class="tabular-nums">
    <span aria-hidden="true" data-testid="score-animated">{{ shown }}</span>
    <span class="sr-only" data-testid="score-final">{{ value }}</span>
  </span>
</template>
