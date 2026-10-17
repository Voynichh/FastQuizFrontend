<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(defineProps<{ from?: number; stepMs?: number }>(), {
  from: 3,
  stepMs: 700,
})
const emit = defineEmits<{ done: [] }>()

const current = ref(props.from)
let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  timer = setInterval(() => {
    if (current.value > 1) {
      current.value -= 1
      return
    }
    clearInterval(timer)
    emit('done')
  }, props.stepMs)
})

onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div
    class="flex flex-1 flex-col items-center justify-center gap-4"
    role="status"
    aria-live="assertive"
  >
    <p class="text-lg text-text-muted">Hazır ol!</p>
    <Transition name="count" mode="out-in">
      <span
        :key="current"
        class="font-heading text-9xl font-bold text-(--accent,var(--color-primary)) tabular-nums"
      >
        {{ current }}
      </span>
    </Transition>
  </div>
</template>

<style scoped>
.count-enter-active,
.count-leave-active {
  transition:
    opacity 0.15s ease-out,
    transform 0.15s ease-out;
}
.count-enter-from {
  opacity: 0;
  transform: scale(1.4);
}
.count-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>
