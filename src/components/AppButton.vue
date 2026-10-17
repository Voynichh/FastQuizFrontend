<script setup lang="ts">
import { RouterLink } from 'vue-router'

withDefaults(
  defineProps<{
    to?: string
    variant?: 'primary' | 'ghost'
    loading?: boolean
    disabled?: boolean
    type?: 'button' | 'submit'
  }>(),
  { variant: 'primary', type: 'button', to: undefined },
)
</script>

<template>
  <component
    :is="to ? RouterLink : 'button'"
    :to="to"
    :type="to ? undefined : type"
    :disabled="to ? undefined : disabled || loading"
    :aria-busy="loading || undefined"
    class="inline-flex min-h-14 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-(--radius-control) px-8 text-lg font-semibold transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-60"
    :class="
      variant === 'primary'
        ? 'bg-primary text-bg hover:bg-primary-hover'
        : 'border border-border bg-transparent text-text hover:bg-surface-raised'
    "
  >
    <span
      v-if="loading"
      class="size-5 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
    <slot />
  </component>
</template>
