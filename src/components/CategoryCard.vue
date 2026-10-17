<script setup lang="ts">
import { computed } from 'vue'

import type { Category } from '@/types'

import CategoryIcon from './CategoryIcon.vue'

const props = defineProps<{
  category: Category
  loading?: boolean
  disabled?: boolean
}>()

defineEmits<{ select: [category: Category] }>()

// API `color` alanı tema token adını döner (ör. "cat-ai" → --color-cat-ai)
const accent = computed(() => ({ '--accent': `var(--color-${props.category.color})` }))
</script>

<template>
  <button
    type="button"
    class="motion-lift group relative flex min-h-24 w-full cursor-pointer items-center gap-4 rounded-(--radius-card) border border-[color-mix(in_oklab,var(--accent)_35%,var(--color-border))] bg-surface p-4 text-left transition duration-200 ease-out hover:scale-[1.02] hover:shadow-[0_0_0_1px_var(--accent),0_8px_24px_color-mix(in_oklab,var(--accent)_15%,transparent)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
    :style="accent"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    @click="$emit('select', category)"
  >
    <span
      class="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[color-mix(in_oklab,var(--accent)_16%,transparent)] text-(--accent)"
    >
      <span
        v-if="loading"
        class="size-6 animate-spin rounded-full border-2 border-current border-t-transparent"
        aria-hidden="true"
      />
      <CategoryIcon v-else :name="category.icon" class="size-7" />
    </span>
    <span class="min-w-0 flex-1">
      <span class="block font-heading text-xl font-semibold">{{ category.name }}</span>
      <span class="mt-0.5 block text-[13px] leading-snug text-text-muted">
        {{ category.description }}
      </span>
    </span>
    <span class="shrink-0 text-[13px] text-text-muted">{{ category.question_count }} soru</span>
  </button>
</template>
