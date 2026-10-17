<script setup lang="ts">
import { computed } from 'vue'

export type ChoiceState = 'default' | 'selected' | 'correct' | 'wrong' | 'disabled'

const props = defineProps<{
  label: string
  text: string
  state?: ChoiceState
}>()

defineEmits<{ choose: [] }>()

const state = computed(() => props.state ?? 'default')

const STATE_CLASS: Record<ChoiceState, string> = {
  default: 'border-border bg-surface-raised hover:border-(--accent) active:scale-[0.99]',
  selected: 'border-(--accent) bg-surface-raised',
  correct:
    'border-success bg-success/15 shadow-[0_0_0_1px_var(--color-success),0_8px_24px_rgb(74_222_154/0.15)]',
  wrong: 'animate-shake border-danger bg-danger/15',
  disabled: 'border-border bg-surface-raised opacity-50',
}
</script>

<template>
  <button
    type="button"
    class="flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-(--radius-control) border px-3 py-2 text-left text-[17px] font-medium transition duration-150 ease-out disabled:cursor-default"
    :class="STATE_CLASS[state]"
    :disabled="state !== 'default'"
    :data-state="state"
    @click="$emit('choose')"
  >
    <span
      class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-bg/60 text-sm font-bold text-text-muted"
      aria-hidden="true"
    >
      {{ label }}
    </span>
    <span class="flex-1">{{ text }}</span>
    <!-- Doğru/yanlış yalnızca renkle değil simgeyle de belirtilir -->
    <span v-if="state === 'correct'" class="text-xl font-bold text-success" aria-label="Doğru cevap"
      >✓</span
    >
    <span
      v-else-if="state === 'wrong'"
      class="text-xl font-bold text-danger"
      aria-label="Yanlış cevap"
      >✕</span
    >
  </button>
</template>
