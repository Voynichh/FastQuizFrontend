<script setup lang="ts">
import { useRoute } from 'vue-router'

import AppButton from '@/components/AppButton.vue'

const route = useRoute()
</script>

<template>
  <main class="flex flex-1 flex-col items-center justify-center gap-6 text-center">
    <h1 class="text-4xl">{{ route.meta.title }}</h1>
    <p class="text-text-muted">{{ route.meta.placeholder }}</p>
    <AppButton to="/" variant="ghost">Ana sayfa</AppButton>
  </main>
</template>
