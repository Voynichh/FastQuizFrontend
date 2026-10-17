<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

import { prefersReducedMotion } from '@/lib/motion'

const props = withDefaults(defineProps<{ count?: number; durationMs?: number }>(), {
  count: 36,
  durationMs: 2600,
})
const emit = defineEmits<{ done: [] }>()

const COLORS = [
  'var(--color-primary)',
  'var(--color-success)',
  'var(--color-warning)',
  'var(--color-cat-ai)',
  'var(--color-cat-countries)',
  'var(--color-cat-compeng)',
]

interface Piece {
  id: number
  style: Record<string, string>
}

const pieces = ref<Piece[]>([])
let timer: ReturnType<typeof setTimeout> | undefined

onMounted(() => {
  // Hareketi azalt tercihinde konfeti hiç çizilmez
  if (!prefersReducedMotion()) {
    pieces.value = Array.from({ length: props.count }, (_, id) => ({
      id,
      style: {
        left: `${Math.round(Math.random() * 100)}%`,
        backgroundColor: COLORS[id % COLORS.length]!,
        animationDelay: `${Math.round(Math.random() * 400)}ms`,
        animationDuration: `${1600 + Math.round(Math.random() * 900)}ms`,
        '--drift': `${Math.round(Math.random() * 120 - 60)}px`,
        '--spin': `${Math.round(Math.random() * 720 - 360)}deg`,
      },
    }))
  }
  timer = setTimeout(() => emit('done'), pieces.value.length ? props.durationMs : 0)
})

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden="true">
    <span v-for="piece in pieces" :key="piece.id" class="confetti-piece" :style="piece.style" />
  </div>
</template>

<style scoped>
.confetti-piece {
  position: absolute;
  top: -12px;
  width: 8px;
  height: 14px;
  border-radius: 2px;
  opacity: 0;
  animation-name: confetti-fall;
  animation-timing-function: ease-in;
  animation-fill-mode: forwards;
}

@keyframes confetti-fall {
  0% {
    opacity: 1;
    transform: translate3d(0, 0, 0) rotate(0deg);
  }
  100% {
    opacity: 0;
    transform: translate3d(var(--drift), 100vh, 0) rotate(var(--spin));
  }
}
</style>
