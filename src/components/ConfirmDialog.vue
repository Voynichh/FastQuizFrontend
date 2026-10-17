<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

import AppButton from './AppButton.vue'

defineProps<{
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
}>()

const emit = defineEmits<{ confirm: []; cancel: [] }>()

const cancelButton = ref<InstanceType<typeof AppButton> | null>(null)

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('cancel')
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  // Güvenli seçenek (devam et) odaklanır
  ;(cancelButton.value?.$el as HTMLElement | undefined)?.focus()
})

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-end justify-center bg-bg/80 p-4 backdrop-blur-sm sm:items-center"
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      class="w-full max-w-sm rounded-(--radius-card) border border-border bg-surface-raised p-6"
    >
      <h2 id="confirm-title" class="text-2xl">{{ title }}</h2>
      <p class="mt-2 text-text-muted">{{ message }}</p>
      <div class="mt-6 flex flex-col gap-3">
        <AppButton ref="cancelButton" @click="emit('cancel')">{{ cancelLabel }}</AppButton>
        <AppButton variant="ghost" @click="emit('confirm')">{{ confirmLabel }}</AppButton>
      </div>
    </div>
  </div>
</template>
