<script setup lang="ts">
import AppButton from './AppButton.vue'

defineProps<{ message: string; retryLabel?: string }>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <div
    role="alert"
    class="flex flex-col items-start gap-3 rounded-(--radius-card) border border-danger/40 bg-surface p-4"
  >
    <p class="flex items-start gap-2 text-text">
      <span aria-hidden="true" class="font-bold text-danger">✕</span>
      <span>{{ message }}</span>
    </p>
    <AppButton variant="ghost" class="min-h-11! px-5! text-base!" @click="$emit('retry')">
      {{ retryLabel ?? 'Tekrar dene' }}
    </AppButton>
  </div>
</template>
