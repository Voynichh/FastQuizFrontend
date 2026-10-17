<script setup lang="ts">
import AppButton from '@/components/AppButton.vue'
</script>

<template>
  <main class="flex flex-1 flex-col items-center justify-center gap-6 text-center">
    <p class="font-heading text-7xl font-bold text-primary" aria-hidden="true">404</p>
    <h1 class="text-3xl">Sayfa bulunamadı</h1>
    <p class="text-text-muted">Aradığın sayfa yok ya da taşınmış olabilir.</p>
    <AppButton to="/">Ana sayfaya dön</AppButton>
  </main>
</template>
